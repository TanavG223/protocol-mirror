import type { AuditState, TrialPair } from "./contracts";

export function createReviewReceipt(pair: TrialPair, audit: AuditState) {
  const reviewedMappings = audit.mappings.filter((mapping) => mapping.status !== "staged");
  const reviewedIds = new Set(reviewedMappings.map((mapping) => mapping.id));
  const evidenceIds = new Set(reviewedMappings.flatMap((mapping) => mapping.evidenceIds));

  return {
    schemaVersion: "protocol-mirror.receipt.v1",
    pairId: pair.id,
    generatedFrom: "deterministic_demo",
    reviewedMappings,
    evidence: pair.evidence.filter((span) => evidenceIds.has(span.id)),
    events: audit.history.filter((event) => !event.subjectId || reviewedIds.has(event.subjectId)),
    disclaimer: "Research transparency aid only. Not a clinical or misconduct determination.",
  };
}
