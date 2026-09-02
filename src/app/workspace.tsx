"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { DEMO_PAIR, INITIAL_AUDIT } from "@/lib/demo-data";
import type { AuditEvent, AuditState, DiscrepancyKind, Mapping, Outcome, TrialPair } from "@/lib/contracts";
import { createReviewReceipt } from "@/lib/review-receipt";
import { findLatestReviewedMappingId, hasReviewedWork, prepareCaseSwitch, transitionHumanDecision } from "@/lib/audit-state";
import { useWorkspaceMotion } from "@/lib/use-workspace-motion";
import { createLiveSourceReaders, createLiveSourceTools, isValidNctId, isValidPmid, type LiveClinicalTrialRecord, type LivePubMedRecord } from "@/lib/webmcp-tools";
import { createCaseReadTools, createPairBoundTools, type CaseToolDeps } from "@/lib/case-tools";
import { LIVE_PUBLICATION_LIMITATION, buildLiveTrialPair, isLivePair } from "@/lib/live-pair";

const LABELS: Record<DiscrepancyKind, string> = {
  matched: "Matched", omitted: "Omitted", downgraded: "Downgraded",
  upgraded: "Upgraded", introduced: "Introduced", uncertain: "Needs review",
};

/** Real, public trial/publication pairs a reviewer can load with one click, with or without an agent. */
const CURATED_PAIRS = [
  { label: "ACTT-1 · remdesivir", nctId: "NCT04280705", pmid: "32445440" },
  { label: "Pfizer BNT162b2 vaccine", nctId: "NCT04368728", pmid: "33301246" },
  { label: "RECOVERY · dexamethasone", nctId: "NCT04381936", pmid: "32678530" },
];

function Icon({ name }: { name: "spark" | "check" | "arrow" | "quote" | "undo" | "download" }) {
  const paths = {
    spark: <path d="M12 2l1.25 5.2L18 9l-4.75 1.8L12 16l-1.25-5.2L6 9l4.75-1.8L12 2ZM6 13l.75 3L10 17l-3.25 1L6 21l-.75-3L2 17l3.25-1L6 13Z" />,
    check: <path d="m5 12 4 4L19 6" />, arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    quote: <path d="M7 8h4v4H7v4H3v-4a4 4 0 0 1 4-4Zm10 0h4v4h-4v4h-4v-4a4 4 0 0 1 4-4Z" />,
    undo: <path d="M9 7 4 12l5 5M5 12h8a6 6 0 1 1 0 12" />,
    download: <path d="M12 3v12m-4-4 4 4 4-4M5 20h14" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
}

const outcomeById = (id: string | null, outcomes: Outcome[]) => outcomes.find((item) => item.id === id);

// The specification exposes WebMCP on document.modelContext; browsers that implemented the
// earlier draft expose the same interface on navigator.modelContext. Prefer the current
// location and fall back so a judge on an older WebMCP-capable Chrome still sees the tools.
const getModelContext = () => document.modelContext ?? navigator.modelContext;

type LiveSourceStatus = "idle" | "loading" | "success" | "error";

export default function Workspace() {
  const [activePair, setActivePair] = useState<TrialPair>(DEMO_PAIR);
  const [audit, setAudit] = useState<AuditState>(INITIAL_AUDIT);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null);
  const [decisionNotice, setDecisionNotice] = useState("No human decisions recorded yet.");
  const [webMcp, setWebMcp] = useState<"connected" | "preview">("preview");
  const [liveTrial, setLiveTrial] = useState<LiveClinicalTrialRecord | null>(null);
  const [liveArticle, setLiveArticle] = useState<LivePubMedRecord | null>(null);
  const [liveTrialStatus, setLiveTrialStatus] = useState<LiveSourceStatus>("idle");
  const [liveArticleStatus, setLiveArticleStatus] = useState<LiveSourceStatus>("idle");
  const [liveTrialError, setLiveTrialError] = useState<string | null>(null);
  const [liveArticleError, setLiveArticleError] = useState<string | null>(null);
  const [showAllRegistryOutcomes, setShowAllRegistryOutcomes] = useState(false);
  const [loaderNct, setLoaderNct] = useState("");
  const [loaderPmid, setLoaderPmid] = useState("");
  const [loaderBusy, setLoaderBusy] = useState(false);
  const [loaderError, setLoaderError] = useState<string | null>(null);
  const counter = useRef(10);
  const auditRef = useRef(audit);
  const pairRef = useRef(activePair);
  const intakeRef = useRef<{ trial: LiveClinicalTrialRecord | null; article: LivePubMedRecord | null }>({ trial: null, article: null });
  const reviewRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => { auditRef.current = audit; }, [audit]);
  useEffect(() => { pairRef.current = activePair; }, [activePair]);

  const live = isLivePair(activePair);
  const staged = audit.mappings.filter((item) => item.status === "staged");
  const reviewed = audit.mappings.filter((item) => item.status !== "staged");
  const accepted = audit.mappings.filter((item) => item.status === "accepted");
  const reviewedWorkAvailable = hasReviewedWork(audit);
  const receiptDownloadHref = useMemo(() => reviewedWorkAvailable ? `data:application/json;charset=utf-8,${encodeURIComponent(`${JSON.stringify(createReviewReceipt(activePair, audit), null, 2)}\n`)}` : null, [activePair, audit, reviewedWorkAvailable]);
  const active = audit.mappings.find((item) => item.id === activeId);
  const selectedOutcome = [...activePair.registryOutcomes, ...activePair.publicationOutcomes].find((item) => item.id === selectedOutcomeId);
  const activeEvidenceIds = active?.evidenceIds ?? selectedOutcome?.evidenceIds ?? [];
  const evidence = activeEvidenceIds.map((id) => activePair.evidence.find((item) => item.id === id)).filter(Boolean);
  const primaryRegistryOutcomes = activePair.registryOutcomes.filter((item) => item.role === "primary");
  const collapseRegistry = live && !showAllRegistryOutcomes && activePair.registryOutcomes.length > 6 && primaryRegistryOutcomes.length > 0;
  const visibleRegistryOutcomes = collapseRegistry ? primaryRegistryOutcomes : activePair.registryOutcomes;
  const liveIntakeReady = Boolean(liveTrial && liveArticle);
  const liveIntakeIsActive = liveIntakeReady && activePair.id === `live-${liveTrial!.nctId}-${liveArticle!.pmid}`;
  useWorkspaceMotion(shellRef, staged.length, activeId, reviewed.length);

  const event = useCallback((action: string, detail: string, actor: AuditEvent["actor"], subjectId?: string): AuditEvent => ({
    id: `event-${++counter.current}`, action, detail, actor, subjectId,
  }), []);

  const stage = useCallback((proposal: Omit<Mapping, "id" | "status" | "origin">) => {
    const mapping: Mapping = { ...proposal, id: `map-${++counter.current}`, status: "staged", origin: "agent" };
    flushSync(() => {
      setAudit((current) => {
        const next = {
          mappings: [...current.mappings, mapping],
          history: [...current.history, event("mapping_staged", `${LABELS[mapping.discrepancy]} proposal staged for human review.`, "agent", mapping.id)],
        };
        auditRef.current = next;
        return next;
      });
      setActiveId(mapping.id);
      setSelectedOutcomeId(null);
    });
    return mapping;
  }, [event]);

  const decide = useCallback((id: string, status: "accepted" | "rejected") => {
    let nextActiveId: string | null = null;
    let notice = "";
    flushSync(() => {
      setAudit((current) => {
        const transition = transitionHumanDecision(current, activeId, id, status);
        if (!transition) return current;
        nextActiveId = transition.nextActiveId;
        notice = `${LABELS[transition.target.discrepancy]} proposal ${status}. ${nextActiveId ? "The next proposal is ready for inspection." : "The human review queue is clear."}`;
        const next: AuditState = {
          mappings: transition.mappings,
          history: [...current.history, event(`mapping_${status}`, `${LABELS[transition.target.discrepancy]} proposal ${status} by reviewer.`, "reviewer", transition.target.id)],
        };
        auditRef.current = next;
        return next;
      });
    });
    setActiveId(nextActiveId);
    setSelectedOutcomeId(null);
    if (notice) setDecisionNotice(notice);
    requestAnimationFrame(() => reviewRef.current?.focus());
  }, [activeId, event]);

  const undo = useCallback(() => {
    let restoredId: string | null = null;
    flushSync(() => {
      setAudit((current) => {
        const targetId = findLatestReviewedMappingId(current);
        if (!targetId) return current;
        restoredId = targetId;
        const next: AuditState = {
          mappings: current.mappings.map((item) => item.id === targetId ? { ...item, status: "staged" } : item),
          history: [...current.history, event("review_undone", "Latest decision returned to staging.", "reviewer", targetId)],
        };
        auditRef.current = next;
        return next;
      });
    });
    if (restoredId) {
      setActiveId(restoredId);
      setSelectedOutcomeId(null);
      setDecisionNotice("The latest human decision was undone and returned to review.");
    }
  }, [event]);

  /** Makes `pair` the reviewable case. Refused while reviewed decisions exist; staged proposals are dropped with a notice. */
  const switchPair = useCallback((pair: TrialPair, detail: string) => {
    const prepared = prepareCaseSwitch(auditRef.current, event("pair_loaded", detail, "system"));
    if (!prepared) {
      setDecisionNotice("Reviewed decisions are never discarded silently. Undo them before loading a different case.");
      return false;
    }
    flushSync(() => {
      auditRef.current = prepared.audit;
      pairRef.current = pair;
      setAudit(prepared.audit);
      setActivePair(pair);
      setActiveId(null);
      setSelectedOutcomeId(null);
      setShowAllRegistryOutcomes(false);
    });
    setDecisionNotice(prepared.discardedStaged
      ? `${prepared.discardedStaged} staged ${prepared.discardedStaged === 1 ? "proposal was" : "proposals were"} discarded because ${prepared.discardedStaged === 1 ? "it" : "they"} cited the previous case.`
      : isLivePair(pair) ? "Live pair loaded. No proposals yet: ask the agent to inspect it, or stage one yourself." : "Demonstration case restored.");
    return true;
  }, [event]);

  const promoteLivePair = useCallback(() => {
    const trial = intakeRef.current.trial;
    const article = intakeRef.current.article;
    if (!trial || !article) return false;
    const switched = switchPair(buildLiveTrialPair(trial, article), `Live pair loaded: ${trial.nctId} (ClinicalTrials.gov) and PMID ${article.pmid} (PubMed), retrieved ${article.retrievedAt}.`);
    if (switched) requestAnimationFrame(() => document.getElementById("workspace-title")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
    return switched;
  }, [switchPair]);

  const returnToDemo = useCallback(() => {
    switchPair(DEMO_PAIR, "Deterministic demonstration pair loaded.");
  }, [switchPair]);

  const liveCallbacks = useMemo(() => ({
    onClinicalTrialStart: () => { intakeRef.current.trial = null; setLiveTrial(null); setLiveTrialError(null); setLiveTrialStatus("loading"); },
    onClinicalTrial: (record: LiveClinicalTrialRecord) => { intakeRef.current.trial = record; setLiveTrial(record); setLiveTrialStatus("success"); },
    onClinicalTrialError: (message: string) => { setLiveTrialError(message); setLiveTrialStatus("error"); },
    onPubMedArticleStart: () => { intakeRef.current.article = null; setLiveArticle(null); setLiveArticleError(null); setLiveArticleStatus("loading"); },
    onPubMedArticle: (record: LivePubMedRecord) => { intakeRef.current.article = record; setLiveArticle(record); setLiveArticleStatus("success"); },
    onPubMedArticleError: (message: string) => { setLiveArticleError(message); setLiveArticleStatus("error"); },
  }), []);

  /** The human-side path: the same bounded readers the agent tools use, then the same promotion step. */
  const loadPairFromHuman = useCallback(async (nctId: string, pmid: string) => {
    const trimmedNct = nctId.trim().toUpperCase();
    const trimmedPmid = pmid.trim();
    if (!isValidNctId(trimmedNct)) { setLoaderError("Enter a ClinicalTrials.gov identifier such as NCT04280705."); return; }
    if (!isValidPmid(trimmedPmid)) { setLoaderError("Enter a numeric PubMed identifier such as 32445440."); return; }
    if (hasReviewedWork(auditRef.current)) { setLoaderError("Undo the reviewed decisions before loading a different case."); return; }
    setLoaderError(null);
    setLoaderBusy(true);
    setLoaderNct(trimmedNct);
    setLoaderPmid(trimmedPmid);
    const readers = createLiveSourceReaders(fetch, liveCallbacks);
    try {
      await Promise.all([readers.clinicalTrial(trimmedNct), readers.pubMedArticle(trimmedPmid)]);
      promoteLivePair();
    } catch (error) {
      setLoaderError(error instanceof Error ? error.message : "The records could not be retrieved.");
    } finally {
      setLoaderBusy(false);
    }
  }, [liveCallbacks, promoteLivePair]);

  const loadDemo = useCallback(() => {
    if (isLivePair(pairRef.current)) return;
    const proposals: Mapping[] = [
      { id: "map-primary-demo", registryOutcomeId: "reg-sbp-24", publicationOutcomeId: "pub-sbp-12", discrepancy: "uncertain", rationale: "Both measure systolic pressure, but the measurement method and primary time point differ. A reviewer must decide whether this is a changed outcome or a non-match.", evidenceIds: ["ev-reg-sbp", "ev-pub-sbp"], confidence: .74, status: "staged", origin: "demo" },
      { id: "map-qol-demo", registryOutcomeId: "reg-qol-24", publicationOutcomeId: null, discrepancy: "omitted", rationale: "No reported outcome describes the prespecified quality-of-life instrument.", evidenceIds: ["ev-reg-qol"], confidence: .91, status: "staged", origin: "demo" },
      { id: "map-introduced-demo", registryOutcomeId: null, publicationOutcomeId: "pub-response-24", discrepancy: "introduced", rationale: "The threshold response rate is reported as post-hoc and has no corresponding registered outcome.", evidenceIds: ["ev-pub-response"], confidence: .93, status: "staged", origin: "demo" },
      { id: "map-ae-demo", registryOutcomeId: "reg-ae-24", publicationOutcomeId: "pub-ae-24", discrepancy: "matched", rationale: "Both records describe serious adverse events through week 24 with consistent scope.", evidenceIds: ["ev-reg-ae", "ev-pub-ae"], confidence: .97, status: "staged", origin: "demo" },
    ];
    setAudit((current) => {
      const existing = new Set(current.mappings.map((item) => item.id));
      const additions = proposals.filter((item) => !existing.has(item.id));
      if (additions.length === 0) return current;
      const next: AuditState = {
        mappings: [...current.mappings, ...additions],
        history: [...current.history, event("demo_staged", `${additions.length === 4 ? "Four" : additions.length} evidence-linked proposals staged for review.`, "system")],
      };
      auditRef.current = next;
      return next;
    });
    setActiveId("map-primary-demo");
    setSelectedOutcomeId(null);
    setDecisionNotice("Four evidence-linked proposals are staged. Inspect the active proposal before deciding.");
    requestAnimationFrame(() => {
      const reviewDock = reviewRef.current;
      reviewDock?.focus();
      reviewDock?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    });
  }, [event]);

  const selectMapping = useCallback((mappingId: string) => {
    setSelectedOutcomeId(null);
    setActiveId(mappingId);
  }, []);

  const inspectOutcome = useCallback((outcomeId: string, mappingId?: string) => {
    if (mappingId) {
      selectMapping(mappingId);
      return;
    }
    setActiveId(null);
    setSelectedOutcomeId(outcomeId);
  }, [selectMapping]);

  const focusReview = useCallback((mapping: Mapping) => {
    flushSync(() => { setSelectedOutcomeId(null); setActiveId(mapping.id); });
    const reviewDock = reviewRef.current;
    reviewDock?.focus();
    reviewDock?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }, []);

  const caseDeps = useMemo<CaseToolDeps>(() => ({
    getPair: () => pairRef.current,
    getAudit: () => auditRef.current,
    getIntakeHint: () => {
      const { trial, article } = intakeRef.current;
      if (!trial || !article) return null;
      const liveId = `live-${trial.nctId}-${article.pmid}`;
      return pairRef.current.id === liveId ? null : `Both live records are loaded but the active case is still "${pairRef.current.title}". Ask the reviewer to click "Review this pair" to make ${trial.nctId} / PMID ${article.pmid} the reviewable case.`;
    },
    stage,
    focusReview,
  }), [stage, focusReview]);

  // Effect A: tools whose schemas never change. Live readers, audit state, and review focus.
  useEffect(() => {
    const context = getModelContext();
    if (!context) return;
    const controller = new AbortController();
    Promise.all([...createLiveSourceTools(fetch, liveCallbacks), ...createCaseReadTools(caseDeps)].map((tool) => context.registerTool(tool, { signal: controller.signal })))
      .then(() => setWebMcp("connected"))
      .catch((error: unknown) => {
        console.error("WebMCP tool registration failed; the page stays in preview mode.", error);
        setWebMcp("preview");
      });
    return () => controller.abort();
  }, [caseDeps, liveCallbacks]);

  // Effect B: tools bound to the active pair's identifiers. Re-registered whenever the case changes.
  useEffect(() => {
    const context = getModelContext();
    if (!context) return;
    const controller = new AbortController();
    Promise.all(createPairBoundTools(activePair, caseDeps).map((tool) => context.registerTool(tool, { signal: controller.signal })))
      .catch((error: unknown) => console.error("WebMCP pair-bound tool registration failed.", error));
    return () => controller.abort();
  }, [activePair, caseDeps]);

  // Effect C: the receipt tool exists only while a human decision exists.
  useEffect(() => {
    const context = getModelContext();
    if (!context || !reviewedWorkAvailable) return;
    const controller = new AbortController();
    context.registerTool({
      name: "export_review_receipt", title: "Export reviewed audit receipt",
      description: "Export human-reviewed decisions with evidence locators and audit trail. Staged proposals are excluded.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => createReviewReceipt(pairRef.current, auditRef.current),
    }, { signal: controller.signal }).catch((error: unknown) => {
      console.error("WebMCP receipt tool registration failed after the human decision.", error);
    });
    return () => controller.abort();
  }, [reviewedWorkAvailable]);

  const registryMapped = useMemo(() => new Set(audit.mappings.map((item) => item.registryOutcomeId)), [audit.mappings]);
  const publicationMapped = useMemo(() => new Set(audit.mappings.map((item) => item.publicationOutcomeId)), [audit.mappings]);
  const onLoaderSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    void loadPairFromHuman(loaderNct, loaderPmid);
  };

  return <div className="app-shell" ref={shellRef}>
    <a className="skip-link" href="#workspace-title" onClick={(clickEvent) => {
      clickEvent.preventDefault();
      const workspaceTitle = document.getElementById("workspace-title");
      workspaceTitle?.focus({ preventScroll: true });
      workspaceTitle?.scrollIntoView({ block: "start" });
    }}>Skip to comparison workspace</a>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Protocol Mirror home"><span className="brand-mark" aria-hidden="true"><span>P</span><span>M</span></span><span>Protocol Mirror</span></a>
      <div className="header-meta"><span className={`connection-badge ${webMcp}`} role="status"><span aria-hidden="true" />{webMcp === "connected" ? `WebMCP connected · ${reviewedWorkAvailable ? 7 : 6} tools` : "WebMCP preview"}</span><span className="avatar" aria-hidden="true">TG</span></div>
    </header>
    <main id="top">
      <section className="case-header" aria-labelledby="case-title">
        <div className="eyebrow case-reveal"><span>Case 04</span><span aria-hidden="true">/</span><span>Outcome integrity review</span></div>
        <div className="case-heading-row case-reveal"><div><h1 id="case-title"><span>AI assembles evidence.</span><span>A human decides.</span></h1><p className="case-subtitle">A WebMCP collaboration loop where an agent retrieves, compares, cites, and stages evidence—then packages the reviewed result after a human adjudicates it.</p></div><div className="hero-action-stack"><button className="primary-action" type="button" onClick={loadDemo} disabled={live} title={live ? "Return to the demonstration case to stage the example proposals" : undefined}><Icon name="spark" /> Stage guided review</button><p>{webMcp === "connected"
          ? <><strong>{reviewedWorkAvailable ? "7 tools" : "6 tools"}</strong><span aria-hidden="true">→</span>{reviewedWorkAvailable ? "Agent export unlocked" : "Human decision unlocks export"}</>
          : <><strong>WebMCP preview</strong><span aria-hidden="true">→</span>Tools appear when an agent connects</>}</p></div></div>
        <ol className="agent-rail case-reveal" aria-label="Accountable WebMCP workflow">
          <li><span>01</span><strong>Inspect exact spans</strong><small>Source text stays untrusted</small></li>
          <li><span>02</span><strong>Stage a proposal</strong><small>Schema-bound and evidence-linked</small></li>
          <li><span>03</span><strong>Human adjudicates</strong><small>The consequential decision stays human</small></li>
          <li><span>04</span><strong>Agent packages proof</strong><small>Only reviewed work enters the receipt</small></li>
        </ol>
        <div className={`case-passport case-reveal ${live ? "live" : ""}`}><span>{live ? "Live public record · active case" : "Active demonstration case"}</span><h2>{activePair.title}</h2><p>{live ? "Real ClinicalTrials.gov and PubMed records · research transparency aid, not a finding" : "Deterministic fictional record · no clinical claim"}</p></div>
        <div className="source-strip" role="group" aria-label="Study sources">
          <div><span>Registration</span><strong>{live ? <a href={activePair.registryUrl} target="_blank" rel="noreferrer">{activePair.nctId}</a> : activePair.nctId}</strong><small>{live ? `Retrieved ${activePair.registryUpdated}` : `Updated ${activePair.registryUpdated}`}</small></div>
          <div><span>Publication</span><strong>{live ? <a href={activePair.publicationUrl} target="_blank" rel="noreferrer">PMID {activePair.pmid}</a> : activePair.pmid}</strong><small>{live ? `Retrieved ${activePair.publicationDate}` : `Published ${activePair.publicationDate}`}</small></div>
          <div><span>Sponsor</span><strong>{activePair.sponsor}</strong><small>{activePair.phase}</small></div>
          <div className="review-score"><span>Review progress</span><strong>{reviewed.length}<em> / {audit.mappings.length || (live ? 0 : 4)}</em></strong><small>{staged.length} awaiting a human decision</small></div>
        </div>
        <section className="case-loader case-reveal" aria-labelledby="case-loader-title">
          <div className="case-loader-heading"><div><p className="section-kicker">Load a real trial</p><h2 id="case-loader-title">Review a real registry-to-publication pair.</h2></div><p>The same bounded ClinicalTrials.gov and PubMed readers the agent uses. Publication text arrives as abstract sections, not extracted outcomes; every proposal still waits for your decision.</p></div>
          <div className="pair-chips" role="group" aria-label="Curated real pairs">
            {CURATED_PAIRS.map((pair) => <button key={pair.nctId} type="button" className="pair-chip" disabled={loaderBusy} onClick={() => void loadPairFromHuman(pair.nctId, pair.pmid)}><strong>{pair.label}</strong><small>{pair.nctId} · PMID {pair.pmid}</small></button>)}
          </div>
          <form className="pair-form" onSubmit={onLoaderSubmit}>
            <label><span>NCT identifier</span><input name="nctId" value={loaderNct} onChange={(changeEvent) => setLoaderNct(changeEvent.target.value)} placeholder="NCT04280705" autoComplete="off" spellCheck={false} /></label>
            <label><span>PubMed identifier</span><input name="pmid" value={loaderPmid} onChange={(changeEvent) => setLoaderPmid(changeEvent.target.value)} placeholder="32445440" inputMode="numeric" autoComplete="off" /></label>
            <button type="submit" className="text-button" disabled={loaderBusy}>{loaderBusy ? "Retrieving…" : "Fetch and review"} <Icon name="arrow" /></button>
            {live && <button type="button" className="text-button" onClick={returnToDemo}><Icon name="undo" /> Return to demonstration case</button>}
          </form>
          {loaderError && <p className="loader-error" role="alert">{loaderError}</p>}
        </section>
        {(liveTrialStatus !== "idle" || liveArticleStatus !== "idle") && <section className="live-intake" aria-labelledby="live-intake-title">
          <div className="live-intake-heading"><div><p className="section-kicker">Agent source intake</p><h2 id="live-intake-title">Real records, visible to the reviewer.</h2></div><p role="status">Live source text is read-only, untrusted evidence. Nothing here becomes a reviewed finding automatically.</p></div>
          <div className="live-intake-grid">
            <LiveTrialCard record={liveTrial} status={liveTrialStatus} error={liveTrialError} />
            <LiveArticleCard record={liveArticle} status={liveArticleStatus} error={liveArticleError} />
          </div>
          {liveIntakeReady && <div className="intake-actions">
            {liveIntakeIsActive
              ? <p role="status"><strong>This pair is the active case.</strong> Evidence and proposal tools are bound to its identifiers; only you can accept or reject.</p>
              : <><p>Make these two records the reviewable case. Staged proposals from the previous case are discarded; reviewed decisions block the switch until undone.</p><button type="button" className="primary-action" onClick={promoteLivePair}><Icon name="check" /> Review this pair</button></>}
          </div>}
        </section>}
      </section>
      <section className="reality-check" aria-labelledby="reality-check-title">
        <div className="reality-check-heading">
          <div><p className="section-kicker">Real-world stress test</p><h2 id="reality-check-title">The same evidence produced opposite model bias.</h2></div>
          <p>Two local models were blinded to 24 published labels and restricted to exact registry and abstract evidence. Their disagreement is the product argument: an agent may investigate, but its consequential conclusion must stay inspectable and human-decided.</p>
        </div>
        <div className="reality-metrics" aria-label="Real-world evaluation summary">
          <article><strong>24</strong><span>real NCT/PMID pairs</span><small>12 labeled change · 12 labeled no change</small></article>
          <article><strong>48 / 48</strong><span>live WebMCP reads</span><small>172 outcomes · 106 abstract sections</small></article>
          <article><strong>4B</strong><span>change-biased run</span><small>qwen3:4b · 100% false positives among decided no-change cases</small></article>
          <article><strong>9B</strong><span>no-change-biased run</span><small>ornith-1.5:9b · 90.9% false negatives among decided change cases</small></article>
        </div>
        <div className="reality-footnote"><strong>Strict grounding result</strong><span>qwen3 17.9% · ornith 69.0% unsupported claims</span><span>0 authority attempts · 0 misconduct claims</span><small>Run-specific evidence—not a universal hallucination or clinical-accuracy claim.</small></div>
      </section>
      <section className="workspace" id="workspace" aria-labelledby="workspace-title">
        <div className="workspace-heading"><div><p className="section-kicker">Evidence table</p><h2 id="workspace-title" tabIndex={-1}>Registered intent <span aria-hidden="true">↔</span> reported record</h2></div><div className="legend"><span><i className="dot matched" />Matched</span><span><i className="dot flagged" />Flagged</span><span><i className="dot unreviewed" />Unreviewed</span></div></div>
        {audit.mappings.length > 0 && <div className="mobile-mapping-summary" aria-label="Proposed outcome relationships">{audit.mappings.map((mapping) => <button type="button" key={mapping.id} className={mapping.id === activeId ? "active" : ""} onClick={() => selectMapping(mapping.id)}><span className={`classification ${mapping.discrepancy}`}>{LABELS[mapping.discrepancy]}</span><strong>{mapping.registryOutcomeId ? outcomeById(mapping.registryOutcomeId, activePair.registryOutcomes)?.title : "No registered counterpart"}</strong><Icon name="arrow" /><strong>{mapping.publicationOutcomeId ? outcomeById(mapping.publicationOutcomeId, activePair.publicationOutcomes)?.title : "Not reported"}</strong></button>)}</div>}
        <div className="comparison-grid">
          <section className="outcome-column" aria-labelledby="registered-title"><ColumnTitle index="01" title="Registered outcomes" subtitle={live ? `ClinicalTrials.gov registry record · ${activePair.registryOutcomes.length} outcomes` : "ClinicalTrials.gov protocol record"} id="registered-title" /><div className="outcome-list">{visibleRegistryOutcomes.map((outcome) => <OutcomeCard key={outcome.id} outcome={outcome} side="registry" isMapped={registryMapped.has(outcome.id)} mappings={audit.mappings} activeId={activeId} selectedOutcomeId={selectedOutcomeId} onSelect={inspectOutcome} />)}</div>{live && activePair.registryOutcomes.length > primaryRegistryOutcomes.length && primaryRegistryOutcomes.length > 0 && <button type="button" className="text-button outcome-toggle" onClick={() => setShowAllRegistryOutcomes((value) => !value)}>{collapseRegistry ? `Show ${activePair.registryOutcomes.length - primaryRegistryOutcomes.length} secondary and other outcomes` : "Show primary outcomes only"}</button>}</section>
          <div className="evidence-spine" role="note" aria-label={`${audit.mappings.length} proposed relationships`}><strong>{audit.mappings.length}</strong><span>proposed relationships</span><div className="relationship-dots" aria-hidden="true">{audit.mappings.map((mapping) => <i className={mapping.status} key={mapping.id} />)}</div></div>
          <section className="outcome-column" aria-labelledby="reported-title"><ColumnTitle index="02" title={live ? "Reported evidence" : "Reported outcomes"} subtitle={live ? "PubMed abstract sections · not an extracted outcome list" : "Journal publication record"} id="reported-title" /><div className="outcome-list">{activePair.publicationOutcomes.map((outcome) => <OutcomeCard key={outcome.id} outcome={outcome} side="publication" isMapped={publicationMapped.has(outcome.id)} mappings={audit.mappings} activeId={activeId} selectedOutcomeId={selectedOutcomeId} onSelect={inspectOutcome} />)}</div>{live && <p className="column-note">{LIVE_PUBLICATION_LIMITATION}</p>}</section>
        </div>
      </section>
      <section className="review-dock" aria-labelledby="review-title" ref={reviewRef} tabIndex={-1}>
        <div className="review-dock-heading"><div><p className="section-kicker">Human checkpoint</p><h2 id="review-title">Review queue <span>{staged.length}</span></h2><p className="decision-notice" role="status" aria-live="polite">{decisionNotice}</p></div><div className="review-dock-actions">{receiptDownloadHref && <a className="text-button" href={receiptDownloadHref} download={`${activePair.id}-review-receipt.json`}><Icon name="download" /> Download reviewed receipt JSON</a>}<button className="text-button" type="button" onClick={undo} disabled={!audit.mappings.some((item) => item.status !== "staged")}><Icon name="undo" /> Undo last decision</button></div></div>
        {staged.length === 0 ? <div className="empty-review"><Icon name="spark" /><div><strong>The queue is clear.</strong><p>{live ? "Ask an agent to inspect this real pair with WebMCP and stage a proposal, or return to the demonstration case." : "Ask an agent to inspect the case with WebMCP, or stage the guided demonstration."}</p></div></div> : <div className="review-cards">{staged.map((mapping) => { const isActive = mapping.id === activeId; const registryTitle = mapping.registryOutcomeId ? outcomeById(mapping.registryOutcomeId, activePair.registryOutcomes)?.title : "No registered counterpart"; const publicationTitle = mapping.publicationOutcomeId ? outcomeById(mapping.publicationOutcomeId, activePair.publicationOutcomes)?.title : "Not reported"; const mappingName = `${LABELS[mapping.discrepancy]} proposal from ${registryTitle} to ${publicationTitle}`; return <article className={`review-card ${isActive ? "active" : ""}`} key={mapping.id}><button className="review-card-main" type="button" aria-pressed={isActive} aria-controls="evidence-drawer" onClick={() => selectMapping(mapping.id)}><span className={`classification ${mapping.discrepancy}`}>{LABELS[mapping.discrepancy]}</span><strong>{registryTitle}</strong><span className="mapping-arrow"><Icon name="arrow" /></span><strong>{publicationTitle}</strong><small>{Math.round(mapping.confidence * 100)}% agent confidence · {mapping.evidenceIds.length} source {mapping.evidenceIds.length === 1 ? "span" : "spans"}{!isActive && " · inspect before deciding"}</small></button><div className="review-actions"><button type="button" className="reject" disabled={!isActive} aria-label={`Reject ${mappingName}`} onClick={() => decide(mapping.id, "rejected")}>Reject</button><button type="button" className="accept" disabled={!isActive} aria-label={`Accept ${mappingName}`} onClick={() => decide(mapping.id, "accepted")}><Icon name="check" />Accept</button></div></article>; })}</div>}
      </section>
      <section className="evidence-panel" id="evidence-drawer" aria-labelledby="evidence-title" aria-live="polite">
        <div className="evidence-heading"><div><p className="section-kicker">Inspectable reasoning</p><h2 id="evidence-title">{active ? "Proposal evidence" : selectedOutcome ? "Source evidence" : "Evidence drawer"}</h2></div>{active && <span className={`classification ${active.discrepancy}`}>{LABELS[active.discrepancy]}</span>}</div>
        {active || selectedOutcome ? <div className="evidence-content"><div className="rationale"><span>{active ? "Agent rationale" : "Selected outcome"}</span>{active && <div className="evidence-mapping-identity"><strong>{active.registryOutcomeId ? outcomeById(active.registryOutcomeId, activePair.registryOutcomes)?.title : "No registered counterpart"}</strong><Icon name="arrow" /><strong>{active.publicationOutcomeId ? outcomeById(active.publicationOutcomeId, activePair.publicationOutcomes)?.title : "Not reported"}</strong></div>}<p>{active ? active.rationale : selectedOutcome?.title}</p><small>{active ? "Proposal only · source text is treated as untrusted data" : "Direct source inspection · no mapping or inference required"}</small></div><div className="quotes">{evidence.map((item) => item && <blockquote key={item.id}><Icon name="quote" /><p>“{item.quote}”</p><cite><span className={`evidence-origin ${live ? "live" : ""}`}>{live ? "Live source span" : "Fictional demonstration span"}</span>{item.sourceLabel}<span>{item.locator}</span></cite><a href={item.url} target="_blank" rel="noreferrer" aria-label={live ? `Open the exact ${item.source} record for this span` : `Visit the ${item.source} database; this fictional demonstration span has no public record page`}>{live ? "Open exact record" : "Visit source database"} <Icon name="arrow" /></a></blockquote>)}</div></div> : <p className="muted">Select any outcome to inspect its exact source span, or select a staged proposal to inspect the agent rationale.</p>}
      </section>
    </main>
    <footer><p>Protocol Mirror is a research transparency aid—not medical advice or a finding of misconduct.</p><div className="footer-meta"><p>{accepted.length} accepted · {audit.history.length} auditable {audit.history.length === 1 ? "event" : "events"} · {live ? "live public records" : "deterministic demo data"}</p><a href="https://github.com/TanavG223/protocol-mirror" target="_blank" rel="noreferrer">Public source · MIT <Icon name="arrow" /></a></div></footer>
  </div>;
}

function LiveTrialCard({ record, status, error }: { record: LiveClinicalTrialRecord | null; status: LiveSourceStatus; error: string | null }) {
  if (status === "error") return <article className="live-source-card error" role="alert"><span>ClinicalTrials.gov · read unavailable</span><strong>The trial record was not added.</strong><p>{error}</p><small>The current review case remains available.</small></article>;
  if (!record) return <article className="live-source-card pending" aria-busy={status === "loading"}><span>ClinicalTrials.gov</span><strong>{status === "loading" ? "Retrieving the bounded trial record…" : "Awaiting a trial read"}</strong><p>{status === "loading" ? "Waiting for the fixed-host adapter." : "Ask the agent to fetch a bounded NCT record, or load one above."}</p></article>;
  return <article className="live-source-card"><span>ClinicalTrials.gov · retrieved</span><h3>{record.title}</h3><p><strong>{record.nctId}</strong> · {record.outcomes.length} normalized outcomes · {record.sponsor}</p><ul>{record.outcomes.slice(0, 3).map((outcome) => <li key={outcome.id}><span>{outcome.role}</span>{outcome.title}</li>)}</ul><a href={record.sourceUrl} target="_blank" rel="noreferrer">Open exact trial record <Icon name="arrow" /></a></article>;
}

function LiveArticleCard({ record, status, error }: { record: LivePubMedRecord | null; status: LiveSourceStatus; error: string | null }) {
  if (status === "error") return <article className="live-source-card error" role="alert"><span>PubMed · read unavailable</span><strong>The article record was not added.</strong><p>{error}</p><small>The current review case remains available.</small></article>;
  if (!record) return <article className="live-source-card pending" aria-busy={status === "loading"}><span>PubMed</span><strong>{status === "loading" ? "Retrieving the bounded article record…" : "Awaiting an article read"}</strong><p>{status === "loading" ? "Waiting for the fixed-host adapter." : "Ask the agent to fetch a bounded PMID record, or load one above."}</p></article>;
  return <article className="live-source-card"><span>PubMed · retrieved</span><h3>{record.title}</h3><p><strong>PMID {record.pmid}</strong> · {record.abstractSections.length} abstract sections · {record.journal}</p><ul>{record.abstractSections.slice(0, 3).map((section) => <li key={section.id}><span>section</span>{section.label}</li>)}</ul><small>{record.limitation}</small><a href={record.sourceUrl} target="_blank" rel="noreferrer">Open exact article record <Icon name="arrow" /></a></article>;
}

function ColumnTitle({ index, title, subtitle, id }: { index: string; title: string; subtitle: string; id: string }) {
  return <div className="column-heading"><span className="source-index">{index}</span><div><h3 id={id}>{title}</h3><p>{subtitle}</p></div></div>;
}

function OutcomeCard({ outcome, side, isMapped, mappings, activeId, selectedOutcomeId, onSelect }: { outcome: Outcome; side: "registry" | "publication"; isMapped: boolean; mappings: Mapping[]; activeId: string | null; selectedOutcomeId: string | null; onSelect: (outcomeId: string, mappingId?: string) => void }) {
  const mapping = [...mappings].reverse().find((item) => side === "registry" ? item.registryOutcomeId === outcome.id : item.publicationOutcomeId === outcome.id);
  const isActive = mapping ? mapping.id === activeId : selectedOutcomeId === outcome.id;
  return <article className={`outcome-card ${isActive ? "active" : ""}`}><button type="button" onClick={() => onSelect(outcome.id, mapping?.id)} aria-pressed={isActive} aria-controls="evidence-drawer" aria-label={`Inspect source evidence for ${outcome.title}${mapping ? `, ${LABELS[mapping.discrepancy]}` : ", not yet mapped"}`}><div className="outcome-meta"><span className={`role ${outcome.role}`}>{outcome.role}</span><span>{outcome.timeFrame}</span></div><h4>{outcome.title}</h4><p>{outcome.description}</p><div className="outcome-status"><span className={`status-line ${mapping?.status ?? "unreviewed"}`} /><span>{mapping ? `${LABELS[mapping.discrepancy]} · ${mapping.status}` : isMapped ? "Mapped" : "Inspect source span"}</span>{mapping && <span className="confidence">{Math.round(mapping.confidence * 100)}%</span>}</div></button></article>;
}
