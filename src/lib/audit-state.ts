import type { AuditEvent, AuditState, Mapping } from "./contracts";

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

export function hasReviewedWork(audit: AuditState) {
  return audit.mappings.some((mapping) => mapping.status !== "staged");
}

export function transitionHumanDecision(
  audit: AuditState,
  activeId: string | null,
  requestedId: string,
  status: "accepted" | "rejected",
): { mappings: Mapping[]; target: Mapping; nextActiveId: string | null } | null {
  if (requestedId !== activeId) return null;
  const target = audit.mappings.find((mapping) => mapping.id === requestedId);
  if (!target || target.status !== "staged") return null;

  return {
    mappings: audit.mappings.map((mapping) => mapping.id === requestedId ? { ...mapping, status } : mapping),
    target,
    nextActiveId: audit.mappings.find((mapping) => mapping.status === "staged" && mapping.id !== requestedId)?.id ?? null,
  };
}

/**
 * Switching the active trial pair starts a fresh audit. Reviewed decisions are never discarded
 * silently: while any accepted or rejected mapping exists the switch is refused and the reviewer
 * must undo first. Staged proposals cite the previous pair's identifiers, so they are dropped and
 * the count is reported for the notice.
 */
export function prepareCaseSwitch(
  audit: AuditState,
  loadedEvent: AuditEvent,
): { audit: AuditState; discardedStaged: number } | null {
  if (hasReviewedWork(audit)) return null;
  return {
    audit: { mappings: [], history: [loadedEvent] },
    discardedStaged: audit.mappings.filter((mapping) => mapping.status === "staged").length,
  };
}
