import type { AuditState } from "./contracts";

export function createReviewReceipt(pairId: string, audit: AuditState) {
  const reviewedMappings = audit.mappings.filter((mapping) => mapping.status !== "staged");
  const reviewedIds = new Set(reviewedMappings.map((mapping) => mapping.id));

  return {
    schemaVersion: "protocol-mirror.receipt.v1",
    pairId,
    generatedFrom: "deterministic_demo",
    reviewedMappings,
    events: audit.history.filter((event) => !event.subjectId || reviewedIds.has(event.subjectId)),
    disclaimer: "Research transparency aid only. Not a clinical or misconduct determination.",
  };
}
