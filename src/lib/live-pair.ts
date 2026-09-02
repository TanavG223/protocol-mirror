import type { EvidenceSpan, Outcome, TrialPair } from "./contracts";
import type { LiveClinicalTrialRecord, LivePubMedRecord, LiveRegistryHistory } from "./webmcp-tools";

export const LIVE_PUBLICATION_LIMITATION =
  "PubMed abstract sections are reported statements, not an extracted outcome list. A human decides what each section reports.";

const OUTCOME_ROLES = new Set<Outcome["role"]>(["primary", "secondary", "other"]);

const day = (iso: string) => (/^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : iso);
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A short, readable list of measures; long primary-outcome sets (some trials register 60+) are cut after a few. */
export const listMeasures = (measures: string[], limit = 3) =>
  measures.length <= limit ? measures.join("; ") : `${measures.slice(0, limit).join("; ")}; and ${measures.length - limit} more`;

/** One sentence per registry change, honest about whether the date is exact. */
export const describeRegistryChange = (change: { version: number; date: string; to: string[]; exact?: boolean; after?: { version: number; date: string } }) =>
  `${change.exact === false && change.after ? `Changed between version ${change.after.version} (${change.after.date}) and version ${change.version} (${change.date})` : `Changed in version ${change.version} (${change.date})`} to: ${listMeasures(change.to)}.`;

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

  const originalPrimaries = history?.original.primaryOutcomes ?? [];
  const historyChanges = history?.changes ?? [];
  // A registration that listed no primary outcome at first has nothing to pair; the note says so instead.
  const changed = Boolean(history?.primaryOutcomeChanged && history.firstPrimaryChange && originalPrimaries.length > 0);
  const originalOutcomes: Outcome[] = changed && history
    ? originalPrimaries.map((outcome, index) => ({
      id: `registry-original-primary-${index + 1}`,
      title: outcome.measure,
      description: `Primary outcome as first registered (version ${history.original.version}, ${history.original.date}). ${historyChanges.map(describeRegistryChange).join(" ")}${outcome.description && outcome.description !== "No description supplied by the registry." ? ` Registry description: ${outcome.description}` : ""}`,
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
    ...(changed && history ? originalPrimaries.map((outcome, index) => ({
      id: `ev-registry-original-primary-${index + 1}`,
      source: "registry" as const,
      sourceLabel: `ClinicalTrials.gov · original primary outcome · version ${history.original.version}, ${history.original.date} · ${outcome.timeFrame}`,
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

  const publishedOn = article.publishedOn ?? null;
  // A change is certainly before the paper when its (latest possible) date precedes it; an inexact
  // change whose window straddles the publication date is counted separately, never as certain.
  const fullDate = publishedOn && FULL_DATE.test(publishedOn) ? publishedOn : null;
  const changesBeforePublication = fullDate ? historyChanges.filter((change) => change.date < fullDate).length : null;
  const changesPossiblyBeforePublication = fullDate ? historyChanges.filter((change) => change.date >= fullDate && !change.exact && change.after.date < fullDate).length : 0;

  return {
    id: `live-${trial.nctId}-${article.pmid}`,
    provenance: "live",
    retrievedAt: article.retrievedAt,
    publishedOn,
    ...(history ? {
      registryHistory: {
        totalVersions: history.totalVersions,
        originalDate: history.original.date,
        latest: history.latestVersion,
        primaryOutcomeChanged: history.primaryOutcomeChanged,
        firstPrimaryChange: history.firstPrimaryChange,
        changes: historyChanges.map((change) => ({ version: change.version, date: change.date, to: change.to, exact: change.exact, ...(change.exact ? {} : { after: change.after }) })),
        complete: history.complete,
        comparedVersions: history.comparedVersions,
        unreadVersions: history.unreadVersions.map((item) => item.version),
        outcomeModuleVersionCount: history.outcomeModuleVersions.length,
        comparedOutcomeModuleVersions: history.outcomeModuleVersions.filter((item) => history.comparedVersions.includes(item.version)).length,
        changesBeforePublication,
        changesPossiblyBeforePublication,
        timeFrameEdits: history.timeFrameEdits ?? [],
        publishedOn,
        limitation: history.limitation,
        sourceUrl: history.sourceUrl,
      },
    } : {}),
    nctId: trial.nctId,
    pmid: article.pmid,
    title: trial.title,
    sponsor: trial.sponsor,
    phase: `Live public record · ${article.journal}`,
    registryUpdated: day(trial.retrievedAt),
    publicationDate: publishedOn ?? day(article.retrievedAt),
    registryUrl: trial.sourceUrl,
    publicationUrl: article.sourceUrl,
    registryOutcomes: [...originalOutcomes, ...currentOutcomes],
    publicationOutcomes,
    evidence,
  };
}

export const isLivePair = (pair: TrialPair) => pair.provenance === "live";
