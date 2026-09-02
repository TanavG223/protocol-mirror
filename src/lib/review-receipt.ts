import type { AuditState, TrialPair } from "./contracts";

export function createReviewReceipt(pair: TrialPair, audit: AuditState) {
  const reviewedMappings = audit.mappings.filter((mapping) => mapping.status !== "staged");
  const reviewedIds = new Set(reviewedMappings.map((mapping) => mapping.id));
  const evidenceIds = new Set(reviewedMappings.flatMap((mapping) => mapping.evidenceIds));
  const live = pair.provenance === "live";

  return {
    schemaVersion: "protocol-mirror.receipt.v1",
    pairId: pair.id,
    generatedFrom: live ? "live_sources" : "deterministic_demo",
    sources: {
      registry: { id: pair.nctId, url: pair.registryUrl },
      publication: { id: pair.pmid, url: pair.publicationUrl },
      ...(pair.retrievedAt ? { retrievedAt: pair.retrievedAt } : {}),
    },
    reviewedMappings,
    evidence: pair.evidence.filter((span) => evidenceIds.has(span.id)),
    events: audit.history.filter((event) => !event.subjectId || reviewedIds.has(event.subjectId)),
    disclaimer: live
      ? "Research transparency aid only. Publication entries are abstract sections, not extracted outcomes. Not a clinical or misconduct determination."
      : "Research transparency aid only. Not a clinical or misconduct determination.",
  };
}
