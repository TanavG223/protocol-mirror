import { describe, expect, it } from "vitest";
import type { AuditState } from "./contracts";
import { findLatestReviewedMappingId } from "./audit-state";

const mapping = (id: string, status: "staged" | "accepted" | "rejected") => ({
  id,
  registryOutcomeId: `${id}-registry`,
  publicationOutcomeId: `${id}-publication`,
  discrepancy: "matched" as const,
  rationale: "A sufficiently detailed evidence-backed rationale.",
  evidenceIds: [`${id}-evidence`],
  confidence: 0.9,
  status,
  origin: "agent" as const,
});

describe("findLatestReviewedMappingId", () => {
  it("uses decision-event order rather than mapping array order", () => {
    const audit: AuditState = {
      mappings: [mapping("newer-in-array", "accepted"), mapping("latest-decision", "rejected")],
      history: [
        { id: "e1", action: "mapping_accepted", detail: "Accepted.", actor: "reviewer", subjectId: "newer-in-array" },
        { id: "e2", action: "mapping_rejected", detail: "Rejected.", actor: "reviewer", subjectId: "latest-decision" },
      ],
    };

    expect(findLatestReviewedMappingId(audit)).toBe("latest-decision");
  });

  it("skips a decision that has already been undone", () => {
    const audit: AuditState = {
      mappings: [mapping("still-reviewed", "accepted"), mapping("already-undone", "staged")],
      history: [
        { id: "e1", action: "mapping_accepted", detail: "Accepted.", actor: "reviewer", subjectId: "still-reviewed" },
        { id: "e2", action: "mapping_rejected", detail: "Rejected.", actor: "reviewer", subjectId: "already-undone" },
        { id: "e3", action: "review_undone", detail: "Undone.", actor: "reviewer", subjectId: "already-undone" },
      ],
    };

    expect(findLatestReviewedMappingId(audit)).toBe("still-reviewed");
  });
});
