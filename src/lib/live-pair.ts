import type { EvidenceSpan, Outcome, TrialPair } from "./contracts";
import type { LiveClinicalTrialRecord, LivePubMedRecord, LiveRegistryHistory } from "./webmcp-tools";

export const LIVE_PUBLICATION_LIMITATION =
  "PubMed abstract sections are reported statements, not an extracted outcome list. A human decides what each section reports.";

const OUTCOME_ROLES = new Set<Outcome["role"]>(["primary", "secondary", "other"]);

const day = (iso: string) => (/^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : iso);

/**
 * Turns the records an agent (or a person) fetched through the bounded adapters into a reviewable
 * TrialPair. Identifiers, quotes and locators are carried over verbatim so a proposal can cite
 * exactly what the source returned. Publication entries are abstract sections and are labelled as
 * such; they are never presented as extracted outcomes. When the registration history shows that
 * the primary outcome set changed, the ORIGINAL primary outcomes are added as registry entries so
 * the agent can pair what was first promised against what was reported.
 */
export function buildLiveTrialPair(trial: LiveClinicalTrialRecord, article: LivePubMedRecord, history?: LiveRegistryHistory | null): TrialPair {
  const currentOutcomes: Outcome[] = trial.outcomes.map((outcome) => ({
    id: outcome.id,
    title: outcome.title,
    description: outcome.description,
    timeFrame: outcome.timeFrame,
    role: OUTCOME_ROLES.has(outcome.role as Outcome["role"]) ? (outcome.role as Outcome["role"]) : "other",
    evidenceIds: [`ev-${outcome.id}`],
  }));

  const changed = Boolean(history?.primaryOutcomeChanged && history.firstPrimaryChange);
  const originalOutcomes: Outcome[] = changed && history
    ? history.original.primaryOutcomes.map((outcome, index) => ({
      id: `registry-original-primary-${index + 1}`,
      title: outcome.measure,
      description: `Primary outcome as first registered (version 0, ${history.original.date}). ${history.timeline.slice(1).map((snapshot) => `Changed in version ${snapshot.version} (${snapshot.date}) to: ${snapshot.primaryOutcomes.map((item) => item.measure).join("; ")}.`).join(" ")}${outcome.description && outcome.description !== "No description supplied by the registry." ? ` Registry description: ${outcome.description}` : ""}`,
      timeFrame: `${outcome.timeFrame} · original registration`,
      role: "primary",
      evidenceIds: [`ev-registry-original-primary-${index + 1}`],
    }))
    : [];

  const publicationOutcomes: Outcome[] = article.abstractSections.map((section) => ({
    id: section.id,
    title: `${section.label} · abstract section`,
    description: section.text,
    timeFrame: "Abstract section · not an extracted outcome",
    role: "other",
    evidenceIds: [`ev-${section.id}`],
  }));

  const evidence: EvidenceSpan[] = [
    ...(changed && history ? history.original.primaryOutcomes.map((outcome, index) => ({
      id: `ev-registry-original-primary-${index + 1}`,
      source: "registry" as const,
      sourceLabel: `ClinicalTrials.gov · original primary outcome · version 0, ${history.original.date} · ${outcome.timeFrame}`,
      quote: outcome.measure,
      locator: `${outcome.locator}.measure`,
      url: history.sourceUrl,
    })) : []),
    ...trial.outcomes.map((outcome) => ({
      id: `ev-${outcome.id}`,
      source: "registry" as const,
      sourceLabel: `ClinicalTrials.gov · ${outcome.role} outcome · ${outcome.timeFrame}`,
      quote: outcome.title,
      locator: `${outcome.locator}.measure`,
      url: trial.sourceUrl,
    })),
    ...article.abstractSections.map((section) => ({
      id: `ev-${section.id}`,
      source: "publication" as const,
      sourceLabel: `PubMed · ${section.label}`,
      quote: section.text,
      locator: section.locator,
      url: article.sourceUrl,
    })),
  ];

  return {
    id: `live-${trial.nctId}-${article.pmid}`,
    provenance: "live",
    retrievedAt: article.retrievedAt,
    ...(history ? {
      registryHistory: {
        totalVersions: history.totalVersions,
        originalDate: history.original.date,
        latest: history.latestVersion,
        primaryOutcomeChanged: history.primaryOutcomeChanged,
        firstPrimaryChange: history.firstPrimaryChange,
        changes: history.timeline.slice(1).map((snapshot) => ({ version: snapshot.version, date: snapshot.date, to: snapshot.primaryOutcomes.map((outcome) => outcome.measure) })),
        sourceUrl: history.sourceUrl,
      },
    } : {}),
    nctId: trial.nctId,
    pmid: article.pmid,
    title: trial.title,
    sponsor: trial.sponsor,
    phase: `Live public record · ${article.journal}`,
    registryUpdated: day(trial.retrievedAt),
    publicationDate: day(article.retrievedAt),
    registryUrl: trial.sourceUrl,
    publicationUrl: article.sourceUrl,
    registryOutcomes: [...originalOutcomes, ...currentOutcomes],
    publicationOutcomes,
    evidence,
  };
}

export const isLivePair = (pair: TrialPair) => pair.provenance === "live";
