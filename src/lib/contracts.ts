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
