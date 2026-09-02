export type DiscrepancyKind =
  | "matched"
  | "omitted"
  | "downgraded"
  | "upgraded"
  | "introduced"
  | "uncertain";

export type ReviewStatus = "staged" | "accepted" | "rejected";

export interface EvidenceSpan {
  id: string;
  source: "registry" | "publication";
  sourceLabel: string;
  quote: string;
  locator: string;
  url: string;
}

export interface Outcome {
  id: string;
  title: string;
  description: string;
  timeFrame: string;
  role: "primary" | "secondary" | "other";
  evidenceIds: string[];
}

export interface TrialPair {
  id: string;
  /** "demo" for the bundled fictional case; "live" when built from records fetched through the adapters. */
  provenance?: "demo" | "live";
  /** ISO timestamp of the live retrieval; absent for the fictional case. */
  retrievedAt?: string;
  /** Earliest publication date PubMed states for a live pair; absent for the fictional case or when PubMed gives none. */
  publishedOn?: string | null;
  /** Summary of the registration history when it was retrieved for a live pair. */
  registryHistory?: {
    totalVersions: number;
    originalDate: string;
    latest: { version: number; date: string };
    primaryOutcomeChanged: boolean;
    firstPrimaryChange: { version: number; date: string; from: string[]; to: string[]; exact?: boolean; after?: { version: number; date: string } } | null;
    /** Every compared version in which the primary outcome set differed from the previous compared one. `exact: false` means versions in between were not compared. */
    changes: Array<{ version: number; date: string; to: string[]; exact?: boolean; after?: { version: number; date: string } }>;
    /** True when every outcome-module version was compared. */
    complete?: boolean;
    comparedVersions?: number[];
    unreadVersions?: number[];
    /** How many of `changes` are dated before the publication; null when PubMed gives no full date. */
    changesBeforePublication?: number | null;
    publishedOn?: string | null;
    limitation?: string;
    sourceUrl: string;
  };
  nctId: string;
  pmid: string;
  title: string;
  sponsor: string;
  phase: string;
  registryUpdated: string;
  publicationDate: string;
  registryUrl: string;
  publicationUrl: string;
  registryOutcomes: Outcome[];
  publicationOutcomes: Outcome[];
  evidence: EvidenceSpan[];
}

export interface Mapping {
  id: string;
  registryOutcomeId: string | null;
  publicationOutcomeId: string | null;
  discrepancy: DiscrepancyKind;
  rationale: string;
  evidenceIds: string[];
  confidence: number;
  status: ReviewStatus;
  origin: "demo" | "agent" | "human";
  /** Optional reason the reviewer gave when rejecting; readable by the agent through get_audit_state. */
  reviewNote?: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  detail: string;
  actor: "agent" | "reviewer" | "system";
  subjectId?: string;
}

export interface AuditState {
  mappings: Mapping[];
  history: AuditEvent[];
}
