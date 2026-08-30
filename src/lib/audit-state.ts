import type { AuditState } from "./contracts";

const DECISION_ACTIONS = new Set(["mapping_accepted", "mapping_rejected"]);

export function findLatestReviewedMappingId(audit: AuditState) {
  const reviewedIds = new Set(
    audit.mappings.filter((mapping) => mapping.status !== "staged").map((mapping) => mapping.id),
  );

  return [...audit.history]
    .reverse()
    .find((event) => event.subjectId && reviewedIds.has(event.subjectId) && DECISION_ACTIONS.has(event.action))
    ?.subjectId ?? null;
}
