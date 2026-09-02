"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { DEMO_PAIR, INITIAL_AUDIT } from "@/lib/demo-data";
import type { AuditEvent, AuditState, DiscrepancyKind, Mapping, Outcome, TrialPair } from "@/lib/contracts";
import { createReviewReceipt } from "@/lib/review-receipt";
import { findLatestReviewedMappingId, hasReviewedWork, prepareCaseSwitch, transitionHumanDecision } from "@/lib/audit-state";
import { useWorkspaceMotion } from "@/lib/use-workspace-motion";
import { createLiveSourceReaders, createLiveSourceTools, isValidNctId, isValidPmid, type LiveClinicalTrialRecord, type LivePubMedRecord, type LiveRegistryHistory } from "@/lib/webmcp-tools";
import { createCaseReadTools, createPairBoundTools, type CaseToolDeps } from "@/lib/case-tools";
import { LIVE_PUBLICATION_LIMITATION, buildLiveTrialPair, isLivePair, listMeasures } from "@/lib/live-pair";
import { WEBMCP_ORIGIN_TRIAL_ORIGIN, WEBMCP_ORIGIN_TRIAL_TOKEN } from "@/lib/origin-trial";

// A build-time constant, identical on the server and the client, so the hint never causes a hydration mismatch.
const ORIGIN_TRIAL_ACTIVE = WEBMCP_ORIGIN_TRIAL_TOKEN.length > 0;
import { diffIsReadable, wordDiff } from "@/lib/word-diff";

const LABELS: Record<DiscrepancyKind, string> = {
  matched: "Matched", omitted: "Omitted", downgraded: "Downgraded",
  upgraded: "Upgraded", introduced: "Introduced", uncertain: "Uncertain",
};

/** Real, public trial/publication pairs a reviewer can load with one click, with or without an agent. */
const CURATED_PAIRS = [
  { label: "ACTT-1 · remdesivir", nctId: "NCT04280705", pmid: "32445440" },
  { label: "Pfizer BNT162b2 vaccine", nctId: "NCT04368728", pmid: "33301246" },
  { label: "RECOVERY · dexamethasone", nctId: "NCT04381936", pmid: "32678530" },
];

function Icon({ name }: { name: "spark" | "check" | "arrow" | "quote" | "undo" | "download" | "lock" }) {
  const paths = {
    spark: <path d="M12 2l1.25 5.2L18 9l-4.75 1.8L12 16l-1.25-5.2L6 9l4.75-1.8L12 2ZM6 13l.75 3L10 17l-3.25 1L6 21l-.75-3L2 17l3.25-1L6 13Z" />,
    check: <path d="m5 12 4 4L19 6" />, arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    quote: <path d="M7 8h4v4H7v4H3v-4a4 4 0 0 1 4-4Zm10 0h4v4h-4v4h-4v-4a4 4 0 0 1 4-4Z" />,
    undo: <path d="M9 7 4 12l5 5M5 12h8a6 6 0 1 1 0 12" />,
    download: <path d="M12 3v12m-4-4 4 4 4-4M5 20h14" />,
    lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
}

const outcomeById = (id: string | null, outcomes: Outcome[]) => outcomes.find((item) => item.id === id);

/** Renders a number; when it changes, replays a short roll (transform/opacity only, skipped under reduced motion). */
function Rolling({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  useEffect(() => {
    const node = ref.current;
    if (!node || previous.current === value) return;
    previous.current = value;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    node.removeAttribute("data-roll");
    void node.offsetWidth;
    node.setAttribute("data-roll", "");
  }, [value]);
  return <span className="num-roll" ref={ref}>{value}</span>;
}

// The specification exposes WebMCP on document.modelContext; browsers that implemented the
// earlier draft expose the same interface on navigator.modelContext. Prefer the current
// location and fall back so a judge on an older WebMCP-capable Chrome still sees the tools.
const getModelContext = () => document.modelContext ?? navigator.modelContext;

type LiveSourceStatus = "idle" | "loading" | "success" | "error";

/** One row in the session's visible tool-call log. Kept out of the audit trail so receipts and get_audit_state stay unchanged. */
interface ActivityEntry {
  id: string;
  at: string;
  actor: "agent" | "reviewer" | "system";
  tool?: string;
  summary: string;
  ok: boolean;
}

const TOOL_ROSTER: Array<{ name: string; readOnly: boolean; gated?: boolean }> = [
  { name: "get_live_clinical_trial", readOnly: true },
  { name: "get_live_pubmed_article", readOnly: true },
  { name: "get_registry_history", readOnly: true },
  { name: "get_audit_state", readOnly: true },
  { name: "get_evidence_spans", readOnly: true },
  { name: "propose_outcome_mapping", readOnly: false },
  { name: "request_human_review", readOnly: false },
  { name: "export_review_receipt", readOnly: true, gated: true },
];

/** A saved session is only restored when every part the page dereferences has the expected shape. */
function isSavedSession(value: unknown): value is SavedSession {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const audit = record.audit as Record<string, unknown> | null | undefined;
  if (audit != null && !(typeof audit === "object" && Array.isArray(audit.mappings) && Array.isArray(audit.history))) return false;
  const pair = record.pair as Record<string, unknown> | null | undefined;
  if (pair != null && !(typeof pair === "object" && Array.isArray(pair.registryOutcomes) && Array.isArray(pair.publicationOutcomes) && Array.isArray(pair.evidence))) return false;
  if (record.activity != null && !Array.isArray(record.activity)) return false;
  return true;
}

type HistoryChange = { version: number; date: string; to: string[]; exact?: boolean; after?: { version: number; date: string } };
const changeText = (change: HistoryChange) => `${change.exact === false && change.after ? `between v${change.after.version} (${change.after.date}) and v${change.version} (${change.date})` : `v${change.version} (${change.date})`} → “${listMeasures(change.to)}”`;
const timeFrameText = (edits?: Array<{ version: number; date: string }>) => edits && edits.length > 0 ? ` Time frames were edited without changing the measures in ${edits.map((edit) => `v${edit.version} (${edit.date})`).join(", ")}.` : "";
const predateText = (total: number, before: number, possible: number, publishedOn: string) => possible > 0
  ? ` At least ${before} of ${total} changes predate the publication (${publishedOn}); ${possible} more ${possible === 1 ? "falls" : "fall"} in a window that straddles it.`
  : before === 0
    ? ` None of the ${total === 1 ? "change predates" : `${total} changes predate`} the publication (${publishedOn}); the registered set changed only afterwards, so the paper cannot have been affected by ${total === 1 ? "it" : "them"}.`
    : ` ${before} of ${total} ${total === 1 ? "change" : "changes"} ${before === 1 ? "predates" : "predate"} the publication (${publishedOn}).`;
/** Changes that could have affected the paper: dated before it, or in a window that straddles it. */
const relevantChanges = (history: { changes: unknown[]; changesBeforePublication?: number | null; changesPossiblyBeforePublication?: number; publishedOn?: string | null }) =>
  typeof history.changesBeforePublication === "number" && history.publishedOn ? history.changesBeforePublication + (history.changesPossiblyBeforePublication ?? 0) : history.changes.length;
const countText = (count: number, complete: boolean) => `${count === 1 ? "once" : `${count} times`}${complete ? "" : " or more"}`;

function summarizeArgs(name: string, input: Record<string, unknown>) {
  switch (name) {
    case "get_live_clinical_trial": return String(input.nctId ?? "");
    case "get_live_pubmed_article": return `PMID ${String(input.pmid ?? "")}`;
    case "get_registry_history": return `${String(input.nctId ?? "")} · registration versions`;
    case "get_evidence_spans": return Array.isArray(input.evidenceIds) ? `${input.evidenceIds.length} span${input.evidenceIds.length === 1 ? "" : "s"} · ${String(input.evidenceIds[0] ?? "")}` : "";
    case "propose_outcome_mapping": return `${String(input.discrepancy ?? "")} · ${String(input.registryOutcomeId ?? "∅")} → ${String(input.publicationOutcomeId ?? "∅")}${typeof input.confidence === "number" ? ` · ${Math.round(input.confidence * 100)}%` : ""}`;
    case "request_human_review": return String(input.mappingId ?? "");
    default: return "";
  }
}

const REJECT_REASONS = [
  "Wrong pairing",
  "Evidence does not support this category",
  "Not a real discrepancy",
  "Section defines the outcome; it does not report a result",
  "Other",
];

const SESSION_KEY = "protocol-mirror.session.v2";
interface SavedSession {
  pair: TrialPair | null;
  audit: AuditState;
  activity: ActivityEntry[];
  activeId: string | null;
  liveTrial: LiveClinicalTrialRecord | null;
  liveArticle: LivePubMedRecord | null;
  liveHistory?: LiveRegistryHistory | null;
  counter: number;
}

const parseToolInput = (input: unknown): Record<string, unknown> => {
  if (typeof input === "string") { try { const parsed: unknown = JSON.parse(input); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {}; } catch { return {}; } }
  return input && typeof input === "object" ? input as Record<string, unknown> : {};
};

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
  const [liveHistory, setLiveHistory] = useState<LiveRegistryHistory | null>(null);
  const [liveHistoryStatus, setLiveHistoryStatus] = useState<LiveSourceStatus>("idle");
  const [liveHistoryError, setLiveHistoryError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [showAllRegistryOutcomes, setShowAllRegistryOutcomes] = useState(false);
  const [loaderNct, setLoaderNct] = useState("");
  const [loaderPmid, setLoaderPmid] = useState("");
  const [loaderBusy, setLoaderBusy] = useState(false);
  const [loaderError, setLoaderError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [intakeNotice, setIntakeNotice] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string; text: string } | null>(null);
  const skipSaveRef = useRef(true);
  const counter = useRef(10);
  const rejectingRef = useRef<{ id: string; reason: string; text: string } | null>(null);
  useEffect(() => { rejectingRef.current = rejecting; }, [rejecting]);
  const auditRef = useRef(audit);
  const pairRef = useRef(activePair);
  const intakeRef = useRef<{ trial: LiveClinicalTrialRecord | null; article: LivePubMedRecord | null; history: LiveRegistryHistory | null }>({ trial: null, article: null, history: null });
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
  const originalEntryCount = activePair.registryOutcomes.filter((outcome) => outcome.id.startsWith("registry-original-")).length;
  const primaryRegistryOutcomes = activePair.registryOutcomes.filter((item) => item.role === "primary");
  const collapseRegistry = live && !showAllRegistryOutcomes && activePair.registryOutcomes.length > 6 && primaryRegistryOutcomes.length > 0;
  const visibleRegistryOutcomes = collapseRegistry ? primaryRegistryOutcomes : activePair.registryOutcomes;
  const spanDiff = useMemo(() => {
    if (!active) return null;
    const left = evidence.find((item) => item?.source === "registry");
    const right = evidence.find((item) => item?.source === "publication");
    if (!left || !right) return null;
    return diffIsReadable(left.quote, right.quote)
      ? { parts: wordDiff(left.quote, right.quote), note: "" }
      : { parts: null, note: "One quotation is long; compare the two spans side by side." };
  }, [active, evidence]);
  const liveIntakeReady = Boolean(liveTrial && liveArticle);
  const liveIntakeIsActive = liveIntakeReady && activePair.id === `live-${liveTrial!.nctId}-${liveArticle!.pmid}`;
  useWorkspaceMotion(shellRef, staged.length, activeId, reviewed.length);

  const event = useCallback((action: string, detail: string, actor: AuditEvent["actor"], subjectId?: string): AuditEvent => ({
    id: `event-${++counter.current}`, action, detail, actor, subjectId,
  }), []);

  const logActivity = useCallback((entry: Omit<ActivityEntry, "id" | "at">) => {
    setActivity((current) => [...current, { ...entry, id: `act-${++counter.current}`, at: new Date().toISOString() }]);
  }, []);

  /** Wraps a tool so every agent call, successful or not, shows up in the session log. */
  const withActivity = useCallback((tool: WebMCP.ModelContextTool): WebMCP.ModelContextTool => ({
    ...tool,
    execute: async (input: unknown, options: unknown) => {
      const summary = summarizeArgs(tool.name, parseToolInput(input));
      try {
        const result = await (tool.execute as (input: unknown, options: unknown) => unknown)(input, options);
        logActivity({ actor: "agent", tool: tool.name, summary, ok: true });
        return result;
      } catch (error) {
        logActivity({ actor: "agent", tool: tool.name, summary: `${summary ? `${summary} · ` : ""}${error instanceof Error ? error.message : "failed"}`, ok: false });
        throw error;
      }
    },
  }), [logActivity]);

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
      // A new proposal takes focus unless the reviewer is mid-rejection; then it waits in the queue.
      if (!rejectingRef.current) { setActiveId(mapping.id); setSelectedOutcomeId(null); }
    });
    setDecisionNotice(`${LABELS[mapping.discrepancy]} proposal staged for human review. ${rejectingRef.current ? "It is waiting in the queue while you finish the current rejection." : "It is ready for inspection."}`);
    return mapping;
  }, [event]);

  const decide = useCallback((id: string, status: "accepted" | "rejected", reviewNote?: string) => {
    let nextActiveId: string | null = null;
    let notice = "";
    const note = reviewNote?.trim();
    flushSync(() => {
      setAudit((current) => {
        const transition = transitionHumanDecision(current, activeId, id, status, note);
        if (!transition) return current;
        nextActiveId = transition.nextActiveId;
        notice = `${LABELS[transition.target.discrepancy]} proposal ${status}.${note ? " Your reason is readable by the agent through get_audit_state." : ""} ${nextActiveId ? "The next proposal is ready for inspection." : "The human review queue is clear."}`;
        const next: AuditState = {
          mappings: transition.mappings,
          history: [...current.history, event(`mapping_${status}`, `${LABELS[transition.target.discrepancy]} proposal ${status} by reviewer${note ? `: ${note}` : "."}`, "reviewer", transition.target.id)],
        };
        auditRef.current = next;
        return next;
      });
    });
    if (!notice) return;
    setRejecting(null);
    setActiveId(nextActiveId);
    setSelectedOutcomeId(null);
    setDecisionNotice(notice);
    logActivity({ actor: "reviewer", summary: `${status === "accepted" ? "Accepted" : "Rejected"} ${id}${note ? ` · ${note}` : ""}`, ok: true });
    requestAnimationFrame(() => reviewRef.current?.focus());
  }, [activeId, event, logActivity]);

  const undo = useCallback(() => {
    let restoredId: string | null = null;
    flushSync(() => {
      setAudit((current) => {
        const targetId = findLatestReviewedMappingId(current);
        if (!targetId) return current;
        restoredId = targetId;
        const next: AuditState = {
          mappings: current.mappings.map((item) => {
            if (item.id !== targetId) return item;
            const restaged: Mapping = { ...item, status: "staged" };
            delete restaged.reviewNote;
            return restaged;
          }),
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
      logActivity({ actor: "reviewer", summary: `Undid the decision on ${restoredId}`, ok: true });
    }
  }, [event, logActivity]);

  /** Makes `pair` the reviewable case. Refused while reviewed decisions exist; staged proposals are dropped with a notice. */
  const switchPair = useCallback((pair: TrialPair, detail: string, options: { quiet?: boolean } = {}) => {
    const prepared = prepareCaseSwitch(auditRef.current, event("pair_loaded", detail, "system"));
    if (!prepared) {
      const reason = "Reviewed decisions are never discarded silently. Undo them in the review queue before loading a different case.";
      setIntakeNotice(reason);
      // An automatic load (the opening case) never paints an alert the reviewer did not trigger.
      if (!options.quiet) { setDecisionNotice(reason); setLoaderError(reason); }
      return false;
    }
    setIntakeNotice(null);
    setLoaderError(null);
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
    logActivity({ actor: "reviewer", summary: isLivePair(pair) ? `Made ${pair.nctId} / PMID ${pair.pmid} the active case` : "Returned to the demonstration case", ok: true });
    return true;
  }, [event, logActivity]);

  /** Promotes the given records, or the ones currently shown in the intake cards, to the active case. */
  const promoteLivePair = useCallback((records?: { trial: LiveClinicalTrialRecord; article: LivePubMedRecord; history?: LiveRegistryHistory | null }, options: { quiet?: boolean } = {}) => {
    const trial = records?.trial ?? intakeRef.current.trial;
    const article = records?.article ?? intakeRef.current.article;
    if (!trial || !article) return false;
    const knownHistory = records && "history" in records ? records.history ?? null : intakeRef.current.history;
    const history = knownHistory && knownHistory.nctId === trial.nctId ? knownHistory : null;
    if (article.abstractSections.length === 0) {
      const reason = `PMID ${article.pmid} has no abstract text to review. Choose a publication whose PubMed record includes an abstract.`;
      setIntakeNotice(reason);
      setLoaderError(reason);
      return false;
    }
    const switched = switchPair(buildLiveTrialPair(trial, article, history), `Live pair loaded: ${trial.nctId} (ClinicalTrials.gov) and PMID ${article.pmid} (PubMed), retrieved ${article.retrievedAt}.${history ? ` Registration history: ${history.totalVersions} versions${history.primaryOutcomeChanged && history.firstPrimaryChange ? `, primary outcome ${history.firstPrimaryChange.exact ? `changed in version ${history.firstPrimaryChange.version} on ${history.firstPrimaryChange.date}` : `changed by version ${history.firstPrimaryChange.version} (${history.firstPrimaryChange.date})`}` : ", primary outcome unchanged in the compared versions"}.` : ""}`, options);
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
    onRegistryHistoryStart: () => { intakeRef.current.history = null; setLiveHistory(null); setLiveHistoryError(null); setLiveHistoryStatus("loading"); },
    onRegistryHistory: (record: LiveRegistryHistory) => { intakeRef.current.history = record; setLiveHistory(record); setLiveHistoryStatus("success"); },
    onRegistryHistoryError: (message: string) => { setLiveHistoryError(message); setLiveHistoryStatus("error"); },
  }), []);

  /** The human-side path: the same bounded readers the agent tools use, then the same promotion step. */
  const loadPairFromHuman = useCallback(async (nctId: string, pmid: string, options: { quiet?: boolean } = {}) => {
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
      // Promote exactly the records this request resolved, never whatever the intake cards happen to
      // hold, so a concurrent agent fetch can never be fused into this pair. Registration history is
      // best effort: the pair still loads if the history endpoint is unavailable.
      const [trialResult, articleResult, historyResult] = await Promise.all([
        readers.clinicalTrial(trimmedNct),
        readers.pubMedArticle(trimmedPmid),
        readers.registryHistory(trimmedNct).catch(() => null),
      ]);
      if (!trialResult.data || !articleResult.data) throw new Error("The source adapters returned no records.");
      promoteLivePair({ trial: trialResult.data, article: articleResult.data, history: historyResult?.data ?? null }, { quiet: options.quiet });
    } catch (error) {
      if (!options.quiet) setLoaderError(error instanceof Error ? error.message : "The records could not be retrieved.");
      else console.warn("Protocol Mirror kept the demonstration case because the default real trial could not be loaded.", error);
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
    logActivity({ actor: "system", summary: "Loaded the four example proposals for the demonstration case", ok: true });
    requestAnimationFrame(() => {
      const reviewDock = reviewRef.current;
      reviewDock?.focus();
      reviewDock?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    });
  }, [event, logActivity]);

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

  /** Forget everything kept in this tab and return to the empty demonstration case. */
  const clearSession = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    flushSync(() => {
      auditRef.current = INITIAL_AUDIT;
      pairRef.current = DEMO_PAIR;
      intakeRef.current = { trial: null, article: null, history: null };
      setActivePair(DEMO_PAIR);
      setAudit(INITIAL_AUDIT);
      setActivity([]);
      setActiveId(null);
      setSelectedOutcomeId(null);
      setRejecting(null);
      setNoteDraft("");
      setLiveTrial(null); setLiveArticle(null); setLiveHistory(null);
      setLiveTrialStatus("idle"); setLiveArticleStatus("idle"); setLiveHistoryStatus("idle");
      setLiveTrialError(null); setLiveArticleError(null); setLiveHistoryError(null);
      setIntakeNotice(null); setLoaderError(null);
      setShowAllRegistryOutcomes(false);
    });
    setDecisionNotice("Session cleared. The demonstration case is loaded with no proposals.");
  }, []);

  // Restore this tab's session once, honour ?nct=&pmid= deep links, and otherwise open on a real trial
  // (ACTT-1) so the first thing a visitor sees is public data rather than the fictional teaching case.
  useEffect(() => {
    let saved: SavedSession | null = null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isSavedSession(parsed)) saved = parsed;
        else sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.warn("Protocol Mirror could not read the previous session in this tab.", error);
    }
    const params = new URLSearchParams(window.location.search);
    const nct = params.get("nct")?.trim().toUpperCase();
    const pmid = params.get("pmid")?.trim();
    const restoredPairId = saved?.pair?.provenance === "live" ? saved.pair.id : null;
    queueMicrotask(() => {
      if (saved) {
        counter.current = Math.max(counter.current, Number(saved.counter) || 10);
        if (saved.pair && saved.pair.provenance === "live") { pairRef.current = saved.pair; setActivePair(saved.pair); }
        if (saved.audit && Array.isArray(saved.audit.mappings)) { auditRef.current = saved.audit; setAudit(saved.audit); }
        setActivity(Array.isArray(saved.activity) ? saved.activity : []);
        setActiveId(saved.activeId ?? null);
        if (saved.liveTrial) { intakeRef.current.trial = saved.liveTrial; setLiveTrial(saved.liveTrial); setLiveTrialStatus("success"); }
        if (saved.liveArticle) { intakeRef.current.article = saved.liveArticle; setLiveArticle(saved.liveArticle); setLiveArticleStatus("success"); }
        if (saved.liveHistory) { intakeRef.current.history = saved.liveHistory; setLiveHistory(saved.liveHistory); setLiveHistoryStatus("success"); }
        if (restoredPairId || saved.audit?.mappings?.length) setDecisionNotice("Session restored in this tab. Use Clear session to start over.");
      }
      skipSaveRef.current = false;
      if (nct && pmid) {
        if (restoredPairId !== `live-${nct}-${pmid}`) void loadPairFromHuman(nct, pmid);
      } else if (nct) {
        setLoaderNct(nct);
        setLoaderError(`Add the PubMed identifier (PMID) of the report for ${nct} to load this pair.`);
      } else if (pmid) {
        setLoaderPmid(pmid);
        setLoaderError(`Add the ClinicalTrials.gov identifier (NCT) of the trial reported in PMID ${pmid} to load this pair.`);
      } else if (!saved && !params.has("demo")) {
        void loadPairFromHuman(CURATED_PAIRS[0].nctId, CURATED_PAIRS[0].pmid, { quiet: true });
      }
    });
  }, [loadPairFromHuman]);

  // Keep the session in this tab so a reload during a review does not lose the case.
  useEffect(() => {
    if (skipSaveRef.current) return;
    try {
      const isDefault = !isLivePair(activePair) && audit.mappings.length === 0 && activity.length === 0 && !liveTrial && !liveArticle;
      if (isDefault) { sessionStorage.removeItem(SESSION_KEY); return; }
      const saved: SavedSession = { pair: isLivePair(activePair) ? activePair : null, audit, activity, activeId, liveTrial, liveArticle, liveHistory, counter: counter.current };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved));
    } catch { /* private mode or quota: the session simply is not kept */ }
  }, [activePair, audit, activity, activeId, liveTrial, liveArticle, liveHistory]);

  /** A note for the agent: lands in the audit history and in get_audit_state.reviewerNotes. */
  const sendNoteToAgent = useCallback((text: string) => {
    const note = text.trim().slice(0, 240);
    if (!note) return;
    const subjectId = activeId ?? undefined;
    setAudit((current) => {
      const next: AuditState = { mappings: current.mappings, history: [...current.history, event("reviewer_note", note, "reviewer", subjectId)] };
      auditRef.current = next;
      return next;
    });
    setNoteDraft("");
    setDecisionNotice("Your note is now readable by the agent through get_audit_state (reviewerNotes).");
    logActivity({ actor: "reviewer", summary: `Note to the agent${subjectId ? ` about ${subjectId}` : ""}: ${note}`, ok: true });
  }, [activeId, event, logActivity]);

  /** From a live case, one click returns to the demonstration case with its four example proposals. */
  const showExamples = useCallback(() => {
    const stagedBefore = auditRef.current.mappings.filter((item) => item.status === "staged").length;
    if (isLivePair(pairRef.current)) {
      if (!switchPair(DEMO_PAIR, "Deterministic demonstration pair loaded.")) return;
      loadDemo();
      if (stagedBefore > 0) setDecisionNotice(`${stagedBefore} staged ${stagedBefore === 1 ? "proposal" : "proposals"} from the previous case ${stagedBefore === 1 ? "was" : "were"} discarded because ${stagedBefore === 1 ? "it" : "they"} cited that case. Four evidence-linked proposals are staged for the demonstration case.`);
      return;
    }
    loadDemo();
  }, [switchPair, loadDemo]);

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
    Promise.all([...createLiveSourceTools(fetch, liveCallbacks), ...createCaseReadTools(caseDeps)].map((tool) => context.registerTool(withActivity(tool), { signal: controller.signal })))
      .then(() => { if (!controller.signal.aborted) setWebMcp("connected"); })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return; // React StrictMode replays effects; the aborted first pass is not a failure.
        console.error("WebMCP tool registration failed; the page stays in preview mode.", error);
        setWebMcp("preview");
      });
    return () => controller.abort();
  }, [caseDeps, liveCallbacks, withActivity]);

  // Effect B: tools bound to the active pair's identifiers. Re-registered whenever the case changes.
  useEffect(() => {
    const context = getModelContext();
    if (!context) return;
    const controller = new AbortController();
    Promise.all(createPairBoundTools(activePair, caseDeps).map((tool) => context.registerTool(withActivity(tool), { signal: controller.signal })))
      .catch((error: unknown) => { if (!controller.signal.aborted) console.error("WebMCP pair-bound tool registration failed.", error); });
    return () => controller.abort();
  }, [activePair, caseDeps, withActivity]);

  // Effect C: the receipt tool exists only while a human decision exists.
  useEffect(() => {
    const context = getModelContext();
    if (!context || !reviewedWorkAvailable) return;
    const controller = new AbortController();
    context.registerTool(withActivity({
      name: "export_review_receipt", title: "Export reviewed audit receipt",
      description: "Export human-reviewed decisions with evidence locators and audit trail. Staged proposals are excluded.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => createReviewReceipt(pairRef.current, auditRef.current),
    }), { signal: controller.signal }).catch((error: unknown) => {
      if (!controller.signal.aborted) console.error("WebMCP receipt tool registration failed after the human decision.", error);
    });
    return () => controller.abort();
  }, [reviewedWorkAvailable, withActivity]);

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
      <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"><span>P</span><span>M</span></span><span>Protocol Mirror</span></a>
      <div className="header-meta"><span className={`connection-badge ${webMcp}`} role="status"><span aria-hidden="true" /><span className="badge-label">{webMcp === "connected" ? <>WebMCP connected · <Rolling value={reviewedWorkAvailable ? 8 : 7} /> tools</> : "WebMCP preview"}</span></span></div>
    </header>
    <main id="top">
      <section className="case-header" aria-labelledby="case-title">
        <div className="eyebrow case-reveal"><span>Clinical-trial outcome check</span><span aria-hidden="true">/</span><span>ClinicalTrials.gov registry vs PubMed publication</span></div>
        <div className="case-heading-row case-reveal"><div><h1 id="case-title"><span>Did the trial publish</span><span>what it registered?</span></h1><p className="case-subtitle">Load a real ClinicalTrials.gov record and its PubMed report. Your agent quotes the exact registered and reported text through WebMCP and stages each match or discrepancy for you. AI assembles evidence. A human decides.</p></div><div className="hero-action-stack"><button className="primary-action" type="button" onClick={showExamples} disabled={(reviewedWorkAvailable && live) || loaderBusy} title={loaderBusy ? "Wait for the real trial to finish loading" : reviewedWorkAvailable && live ? "Undo the reviewed decisions before switching to the demonstration case" : undefined}><Icon name="spark" /> {live ? "See 4 example proposals (demo case)" : "Load 4 example proposals"}</button><p>{webMcp === "connected"
          ? <><strong><Rolling value={reviewedWorkAvailable ? 8 : 7} /> tools</strong><span aria-hidden="true">→</span>{reviewedWorkAvailable ? "Agent export unlocked" : "Your decision unlocks export"}</>
          : <><strong>WebMCP preview</strong><span aria-hidden="true">→</span>Tools appear when an agent connects</>}</p>{webMcp !== "connected" && <small className="preview-hint">No agent is connected. Open this page in ChatGPT&apos;s in-app browser{ORIGIN_TRIAL_ACTIVE ? <>, or in Chrome 149+ at {WEBMCP_ORIGIN_TRIAL_ORIGIN.replace("https://", "")} (that origin carries a WebMCP origin-trial token, so no flag is needed)</> : <>, or in Chrome 152+ with <code>chrome://flags/#enable-webmcp-testing</code></>}. Loading a real trial and reviewing by hand work without one.</small>}</div></div>
        <ol className="agent-rail case-reveal" aria-label="How a review runs">
          <li><span>01</span><strong>Agent reads both records</strong><small>Exact registry and abstract text, flagged as untrusted</small></li>
          <li><span>02</span><strong>Agent proposes with citations</strong><small>Matched, omitted, introduced, or uncertain, each with quoted spans</small></li>
          <li><span>03</span><strong>You decide</strong><small>Accept or reject in the page; no agent tool can</small></li>
          <li><span>04</span><strong>Exports only what you approved</strong><small>The receipt tool appears after your first decision</small></li>
        </ol>
        <div className={`case-passport case-reveal ${live ? "live" : ""}`}><span>{live ? "Live public record · active case" : "Active demonstration case"}</span><h2>{activePair.title}</h2><p>{live ? "Real ClinicalTrials.gov and PubMed records · research transparency aid, not a finding" : "Deterministic fictional record · no clinical claim"}</p></div>
        <div className="source-strip" role="group" aria-label="Study sources">
          <div><span>Registration</span><strong>{live ? <a href={activePair.registryUrl} target="_blank" rel="noreferrer">{activePair.nctId}</a> : activePair.nctId}</strong><small>{live ? `Retrieved ${activePair.registryUpdated}` : `Updated ${activePair.registryUpdated}`}</small></div>
          <div><span>Publication</span><strong>{live ? <a href={activePair.publicationUrl} target="_blank" rel="noreferrer">PMID {activePair.pmid}</a> : activePair.pmid}</strong><small>{live && !activePair.publishedOn ? `Retrieved ${activePair.publicationDate}` : `Published ${activePair.publicationDate}`}</small></div>
          <div><span>Sponsor</span><strong>{activePair.sponsor}</strong><small>{activePair.phase}</small></div>
          <div className="review-score"><span>Review progress</span><strong><Rolling value={reviewed.length} /><em> / {audit.mappings.length || (live ? 0 : 4)}</em></strong><small>{staged.length} awaiting a human decision</small></div>
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
          <RegistryHistoryStrip record={liveHistory} status={liveHistoryStatus} error={liveHistoryError} publishedOn={liveArticle?.publishedOn ?? null} />
          {liveIntakeReady && !liveHistory && liveHistoryStatus === "idle" && <p className="history-hint">Tip: ask the agent to call <code>get_registry_history</code> before reviewing so the original registered outcomes are included, or load the pair from the form above, which fetches the history automatically.</p>}
          {liveIntakeReady && <div className="intake-actions">
            {liveIntakeIsActive
              ? <p role="status"><strong>This pair is the active case.</strong> Evidence and proposal tools are bound to its identifiers; only you can accept or reject.</p>
              : <><p>Make these two records the reviewable case. Staged proposals from the previous case are discarded; reviewed decisions block the switch until undone.</p><button type="button" className="primary-action" onClick={() => promoteLivePair()}><Icon name="check" /> Review this pair</button></>}
            {intakeNotice && !liveIntakeIsActive && <p className="loader-error intake-notice" role="alert">{intakeNotice}</p>}
          </div>}
        </section>}
      </section>
      <section className="reality-check" aria-labelledby="reality-check-title">
        <div className="reality-check-heading">
          <div><p className="section-kicker">Real-world stress test</p><h2 id="reality-check-title">Two models, the same real evidence, opposite errors.</h2></div>
          <p>Two local models were blinded to 24 published labels and restricted to the exact registry and abstract text these tools return. One over-called changes, the other missed them. That is why every proposal shows its quotes and why the final call stays with you.</p>
        </div>
        <div className="reality-metrics" aria-label="Real-world evaluation summary">
          <article><strong>24</strong><span>real NCT/PMID pairs</span><small>12 labeled change · 12 labeled no change</small></article>
          <article><strong>48 / 48</strong><span>live WebMCP reads succeeded</span><small>172 registry outcomes · 106 abstract sections</small></article>
          <article><strong>Over-called</strong><span>qwen3:4b</span><small>Called every one of its 10 decided no-change cases a change</small></article>
          <article><strong>Under-called</strong><span>ornith-1.5:9b</span><small>Missed 10 of its 11 decided change cases</small></article>
        </div>
        <div className="reality-footnote"><strong>Strict grounding result</strong><span>qwen3 17.9% · ornith 69.0% unsupported claims</span><span>0 authority attempts · 0 misconduct claims</span><small>Run-specific evidence—not a universal hallucination or clinical-accuracy claim.</small></div>
      </section>
      <section className="workspace" id="workspace" aria-labelledby="workspace-title">
        <div className="workspace-heading"><div><p className="section-kicker">Evidence table</p><h2 id="workspace-title" tabIndex={-1}>Registered intent <span aria-hidden="true">↔</span> reported record</h2></div><div className="legend"><span><i className="dot matched" />Matched</span><span><i className="dot flagged" />Flagged</span><span><i className="dot unreviewed" />Unreviewed</span></div></div>
        {audit.mappings.length > 0 && <div className="mobile-mapping-summary" aria-label="Proposed outcome relationships">{audit.mappings.map((mapping) => <button type="button" key={mapping.id} className={mapping.id === activeId ? "active" : ""} onClick={() => selectMapping(mapping.id)}><span className={`classification ${mapping.discrepancy}`}>{LABELS[mapping.discrepancy]}</span><strong>{mapping.registryOutcomeId ? outcomeById(mapping.registryOutcomeId, activePair.registryOutcomes)?.title : "No registered counterpart"}</strong><Icon name="arrow" /><strong>{mapping.publicationOutcomeId ? outcomeById(mapping.publicationOutcomeId, activePair.publicationOutcomes)?.title : "Not reported"}</strong></button>)}</div>}
        <div className="comparison-grid">
          <section className="outcome-column" aria-labelledby="registered-title"><ColumnTitle index="01" title="Registered outcomes" subtitle={live ? `ClinicalTrials.gov registry record · ${activePair.registryOutcomes.length - originalEntryCount} outcomes${originalEntryCount ? ` + ${originalEntryCount} from the original registration` : ""}` : "ClinicalTrials.gov protocol record"} id="registered-title" />{activePair.registryHistory && <RegistryHistoryNote history={activePair.registryHistory} />}<div className="outcome-list">{visibleRegistryOutcomes.map((outcome) => <OutcomeCard key={outcome.id} outcome={outcome} side="registry" isMapped={registryMapped.has(outcome.id)} mappings={audit.mappings} activeId={activeId} selectedOutcomeId={selectedOutcomeId} onSelect={inspectOutcome} />)}</div>{live && activePair.registryOutcomes.length > primaryRegistryOutcomes.length && primaryRegistryOutcomes.length > 0 && <button type="button" className="text-button outcome-toggle" onClick={() => setShowAllRegistryOutcomes((value) => !value)}>{collapseRegistry ? `Show ${activePair.registryOutcomes.length - primaryRegistryOutcomes.length} secondary and other outcomes` : "Show primary outcomes only"}</button>}</section>
          <div className="evidence-spine" role="note" aria-label={`${audit.mappings.length} proposed relationships`}><strong>{audit.mappings.length}</strong><span>proposed relationships</span><div className="relationship-dots" aria-hidden="true">{audit.mappings.map((mapping) => <i className={mapping.status} key={mapping.id} />)}</div></div>
          <section className="outcome-column" aria-labelledby="reported-title"><ColumnTitle index="02" title={live ? "Reported evidence" : "Reported outcomes"} subtitle={live ? "PubMed abstract sections · not an extracted outcome list" : "Journal publication record"} id="reported-title" /><div className="outcome-list">{activePair.publicationOutcomes.map((outcome) => <OutcomeCard key={outcome.id} outcome={outcome} side="publication" isMapped={publicationMapped.has(outcome.id)} mappings={audit.mappings} activeId={activeId} selectedOutcomeId={selectedOutcomeId} onSelect={inspectOutcome} />)}</div>{live && <p className="column-note">{LIVE_PUBLICATION_LIMITATION}</p>}</section>
        </div>
      </section>
      <section className="review-dock" aria-labelledby="review-title" ref={reviewRef} tabIndex={-1}>
        <div className="review-dock-heading"><div><p className="section-kicker">Human checkpoint</p><h2 id="review-title">Review queue <span>{staged.length}</span></h2><p className="decision-notice" role="status" aria-live="polite">{decisionNotice}</p></div><div className="review-dock-actions">{receiptDownloadHref && <a className="text-button" href={receiptDownloadHref} download={`${activePair.id}-review-receipt.json`}><Icon name="download" /> Download reviewed receipt JSON</a>}<button className="text-button" type="button" onClick={undo} disabled={!audit.mappings.some((item) => item.status !== "staged")}><Icon name="undo" /> Undo last decision</button></div></div>
        <form className="agent-note-form" onSubmit={(submitEvent) => { submitEvent.preventDefault(); sendNoteToAgent(noteDraft); }}><label><span>Note to the agent{active ? ` about ${active.id}` : ""}</span><input value={noteDraft} maxLength={240} onChange={(changeEvent) => setNoteDraft(changeEvent.target.value)} placeholder="e.g. Compare the original primary outcome, not the current one, against the RESULTS section" /></label><button type="submit" className="text-button" disabled={!noteDraft.trim()}>Send to agent <Icon name="arrow" /></button></form>
        {staged.length === 0 ? <div className="empty-review"><Icon name="spark" /><div><strong>The queue is clear.</strong><p>{live ? "Ask an agent to inspect this real pair with WebMCP and stage a proposal, or return to the demonstration case." : "Ask an agent to inspect the case with WebMCP, or stage the guided demonstration."}</p></div></div> : <div className="review-cards">{staged.map((mapping) => { const isActive = mapping.id === activeId; const registryTitle = mapping.registryOutcomeId ? outcomeById(mapping.registryOutcomeId, activePair.registryOutcomes)?.title : "No registered counterpart"; const publicationTitle = mapping.publicationOutcomeId ? outcomeById(mapping.publicationOutcomeId, activePair.publicationOutcomes)?.title : "Not reported"; const mappingName = `${LABELS[mapping.discrepancy]} proposal from ${registryTitle} to ${publicationTitle}`; return <article className={`review-card ${isActive ? "active" : ""}`} key={mapping.id}><button className="review-card-main" type="button" aria-pressed={isActive} aria-controls="evidence-drawer" onClick={() => selectMapping(mapping.id)}><span className={`classification ${mapping.discrepancy}`}>{LABELS[mapping.discrepancy]}</span><strong>{registryTitle}</strong><span className="mapping-arrow"><Icon name="arrow" /></span><strong>{publicationTitle}</strong><small>{Math.round(mapping.confidence * 100)}% agent confidence · {mapping.evidenceIds.length} source {mapping.evidenceIds.length === 1 ? "span" : "spans"}{!isActive && " · inspect before deciding"}</small></button><div className="review-actions"><button type="button" className="reject" disabled={!isActive} aria-expanded={rejecting?.id === mapping.id} aria-label={`Reject ${mappingName}`} onClick={() => setRejecting((current) => current?.id === mapping.id ? null : { id: mapping.id, reason: REJECT_REASONS[0], text: "" })}>Reject</button><button type="button" className="accept" disabled={!isActive} aria-label={`Accept ${mappingName}`} onClick={() => decide(mapping.id, "accepted")}><Icon name="check" />Accept</button></div>{isActive && rejecting?.id === mapping.id && <form className="reject-form" onSubmit={(submitEvent) => { submitEvent.preventDefault(); decide(mapping.id, "rejected", rejecting.text.trim() ? `${rejecting.reason}: ${rejecting.text.trim()}` : rejecting.reason); }}><label><span>Why reject? The agent can read this and try again.</span><select value={rejecting.reason} onChange={(changeEvent) => setRejecting({ ...rejecting, reason: changeEvent.target.value })}>{REJECT_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label><label><span>Detail (optional)</span><input value={rejecting.text} maxLength={200} onChange={(changeEvent) => setRejecting({ ...rejecting, text: changeEvent.target.value })} placeholder="e.g. the METHODS sentence defines the outcome; it does not report a result" /></label><div className="reject-form-actions"><button type="submit" className="text-button danger">Confirm reject</button><button type="button" className="text-button" onClick={() => setRejecting(null)}>Cancel</button></div></form>}</article>; })}</div>}
      </section>
      <section className="activity-log" aria-labelledby="activity-title">
        <div className="activity-heading"><div><p className="section-kicker">This session</p><h2 id="activity-title">What the agent called, what you decided.</h2><p className="muted">Kept in this browser tab only, so a reload does not lose the case. The receipt tool stays locked until your first decision.</p></div><button type="button" className="text-button" onClick={clearSession}><Icon name="undo" /> Clear session</button></div>
        <ul className="tool-roster" aria-label="WebMCP tools on this page">
          {TOOL_ROSTER.map((tool) => { const locked = Boolean(tool.gated) && !reviewedWorkAvailable; return <li key={tool.name} data-tool={tool.name} className={`tool-chip ${locked ? "locked" : ""} ${tool.readOnly ? "read-only" : "mutating"}`}><code>{tool.name}</code><small>{locked ? <><Icon name="lock" />locked until you decide</> : tool.readOnly ? "read-only" : tool.name === "request_human_review" ? "focuses only" : "stages only"}</small></li>; })}
        </ul>
        {activity.length === 0
          ? <p className="activity-empty">No tool calls yet this session. Ask your agent to call <code>get_audit_state</code>, or load a real pair above.</p>
          : <div role="log" aria-label="Tool calls and human decisions, newest first"><ol className="activity-list">
            {[...activity].reverse().slice(0, 12).map((entry) => <li key={entry.id} className={entry.ok ? "" : "failed"}><span className={`actor ${entry.actor}`}>{entry.actor}</span>{entry.tool ? <code>{entry.tool}</code> : <strong>{entry.summary}</strong>}{entry.tool && <span className="activity-summary">{entry.summary}</span>}<time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></li>)}
            {activity.length > 12 && <li className="activity-more">+{activity.length - 12} earlier</li>}
          </ol></div>}
      </section>
      <section className="evidence-panel" id="evidence-drawer" aria-labelledby="evidence-title" aria-live="polite">
        <div className="evidence-heading"><div><p className="section-kicker">Inspectable reasoning</p><h2 id="evidence-title">{active ? "Proposal evidence" : selectedOutcome ? "Source evidence" : "Evidence drawer"}</h2></div>{active && <span className={`classification ${active.discrepancy}`}>{LABELS[active.discrepancy]}</span>}</div>
        {active || selectedOutcome ? <div className="evidence-content"><div className="rationale"><span>{active ? "Agent rationale" : "Selected outcome"}</span>{active && <div className="evidence-mapping-identity"><strong>{active.registryOutcomeId ? outcomeById(active.registryOutcomeId, activePair.registryOutcomes)?.title : "No registered counterpart"}</strong><Icon name="arrow" /><strong>{active.publicationOutcomeId ? outcomeById(active.publicationOutcomeId, activePair.publicationOutcomes)?.title : "Not reported"}</strong></div>}<p>{active ? active.rationale : selectedOutcome?.title}</p><small>{active ? "Proposal only · source text is treated as untrusted data" : "Direct source inspection · no mapping or inference required"}</small>{active?.reviewNote && <p className="review-note"><span>Your reason</span>{active.reviewNote}</p>}{spanDiff && <div className="span-diff"><span>Word-level difference</span>{spanDiff.parts ? <p>{spanDiff.parts.map((part, index) => <em key={index} className={`diff-${part.kind}`}>{part.text}</em>)}</p> : <p className="muted">{spanDiff.note}</p>}<small>Amber: only in the registry text. Blue: only in the publication text.</small></div>}</div><div className="quotes">{evidence.map((item) => item && <blockquote key={item.id}><Icon name="quote" /><p>“{item.quote}”</p><cite><span className={`evidence-origin ${live ? "live" : ""}`}>{live ? "Live source span" : "Fictional demonstration span"}</span>{item.sourceLabel}<span>{item.locator}</span></cite><a href={item.url} target="_blank" rel="noreferrer" aria-label={live ? `Open the exact ${item.source} record for this span` : `Visit the ${item.source} database; this fictional demonstration span has no public record page`}>{live ? "Open exact record" : "Visit source database"} <Icon name="arrow" /></a></blockquote>)}</div></div> : <p className="muted">Select any outcome to inspect its exact source span, or select a staged proposal to inspect the agent rationale.</p>}
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

function RegistryHistoryStrip({ record, status, error, publishedOn }: { record: LiveRegistryHistory | null; status: LiveSourceStatus; error: string | null; publishedOn?: string | null }) {
  if (status === "idle") return null;
  if (status === "error") return <p className="history-strip error" role="alert"><strong>Registration history unavailable.</strong> {error} The current registry record is still reviewable.</p>;
  if (!record) return <p className="history-strip pending" aria-busy="true">Reading the registration versions…</p>;
  const first = record.primaryOutcomeChanged ? record.firstPrimaryChange : null;
  const fullDate = publishedOn && /^\d{4}-\d{2}-\d{2}$/.test(publishedOn) ? publishedOn : null;
  const before = fullDate ? record.changes.filter((change) => change.date < fullDate).length : null;
  const possible = fullDate ? record.changes.filter((change) => change.date >= fullDate && !change.exact && change.after.date < fullDate).length : 0;
  const alarming = Boolean(first) && (before === null || before + possible > 0);
  return <div className={`history-strip ${alarming ? "changed" : first ? "settled" : ""}`}>
    <span>ClinicalTrials.gov · {record.nctId} · registration history · {record.totalVersions} versions{record.complete ? "" : ` · ${record.comparedVersions.length} compared`}</span>
    {first
      ? <p><strong>The registered primary outcome set changed {countText(record.changes.length, record.complete)}.</strong>{fullDate && before !== null ? predateText(record.changes.length, before, possible, fullDate) : ""} {first.from.length === 0 ? `No primary outcome was listed when first registered (${record.original.date}).` : `First registered ${record.original.date}: “${listMeasures(first.from)}”.`} {record.changes.map(changeText).join("; ")}.{timeFrameText(record.timeFrameEdits)}{first.from.length === 0 ? "" : " When this pair is reviewed, the original entry is included so the agent can pair it against the publication."}</p>
      : <p><strong>The primary outcome measures did not change</strong> across the {record.complete ? record.totalVersions : `${record.comparedVersions.length} compared`} versions (first registered {record.original.date}, latest {record.latestVersion.date}).{timeFrameText(record.timeFrameEdits)}</p>}
    <small>{record.limitation} <a href={record.sourceUrl} target="_blank" rel="noreferrer">Open the registry history <Icon name="arrow" /></a></small>
  </div>;
}

function RegistryHistoryNote({ history }: { history: NonNullable<TrialPair["registryHistory"]> }) {
  const first = history.primaryOutcomeChanged ? history.firstPrimaryChange : null;
  const complete = history.complete !== false;
  const compared = history.comparedVersions?.length ?? history.totalVersions;
  const before = history.changesBeforePublication;
  const alarming = Boolean(first) && relevantChanges(history) > 0;
  const outcomeVersions = history.outcomeModuleVersionCount ?? null;
  const comparedOutcomeVersions = history.comparedOutcomeModuleVersions ?? null;
  return <p className={`registry-history-note ${alarming ? "changed" : first ? "settled" : ""}`}>
    <strong>{first
      ? `The registered primary outcome set changed ${countText(history.changes.length, complete)} across ${history.totalVersions} registration versions.`
      : `Primary outcome measures unchanged across ${complete ? "" : `the ${compared} compared of `}${history.totalVersions} registration versions.`}</strong>
    {first && typeof before === "number" && history.publishedOn ? predateText(history.changes.length, before, history.changesPossiblyBeforePublication ?? 0, history.publishedOn) : ""}
    {" "}
    {first
      ? first.from.length === 0
        ? `No primary outcome was listed when first registered (${history.originalDate}); primary outcomes first appear in v${first.version} (${first.date}).`
        : `First registered ${history.originalDate}: “${listMeasures(first.from)}”. ${history.changes.map(changeText).join("; ")}.${timeFrameText(history.timeFrameEdits)} The original entry is listed first below so it can be paired against the publication.`
      : `First registered ${history.originalDate}; latest version ${history.latest.version} on ${history.latest.date}.${timeFrameText(history.timeFrameEdits)}`}
    {complete ? "" : ` ${outcomeVersions !== null && comparedOutcomeVersions !== null ? `${comparedOutcomeVersions} of the ${outcomeVersions} versions that edited the outcome measures were compared (${compared} of ${history.totalVersions} versions in all)` : `${compared} of ${history.totalVersions} versions compared`}${history.unreadVersions?.length ? `; version${history.unreadVersions.length === 1 ? "" : "s"} ${history.unreadVersions.join(", ")} could not be read` : ""}.`}
    {" "}<a href={history.sourceUrl} target="_blank" rel="noreferrer">Open registry history</a>
  </p>;
}

function ColumnTitle({ index, title, subtitle, id }: { index: string; title: string; subtitle: string; id: string }) {
  return <div className="column-heading"><span className="source-index">{index}</span><div><h3 id={id}>{title}</h3><p>{subtitle}</p></div></div>;
}

function OutcomeCard({ outcome, side, isMapped, mappings, activeId, selectedOutcomeId, onSelect }: { outcome: Outcome; side: "registry" | "publication"; isMapped: boolean; mappings: Mapping[]; activeId: string | null; selectedOutcomeId: string | null; onSelect: (outcomeId: string, mappingId?: string) => void }) {
  const mapping = [...mappings].reverse().find((item) => side === "registry" ? item.registryOutcomeId === outcome.id : item.publicationOutcomeId === outcome.id);
  const isActive = mapping ? mapping.id === activeId : selectedOutcomeId === outcome.id;
  return <article className={`outcome-card ${isActive ? "active" : ""}`}><button type="button" onClick={() => onSelect(outcome.id, mapping?.id)} aria-pressed={isActive} aria-controls="evidence-drawer"><span className="sr-only">Inspect source evidence for </span><div className="outcome-meta"><span className={`role ${outcome.role}`}>{outcome.role}</span><span>{outcome.timeFrame}</span></div><h4>{outcome.title}</h4><p>{outcome.description}</p><div className="outcome-status"><span className={`status-line ${mapping?.status ?? "unreviewed"}`} /><span>{mapping ? `${LABELS[mapping.discrepancy]} · ${mapping.status}` : isMapped ? "Mapped" : "Inspect source span"}</span>{mapping && <span className="confidence">{Math.round(mapping.confidence * 100)}%</span>}</div></button></article>;
}
