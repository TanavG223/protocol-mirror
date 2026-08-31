import { describe, expect, it } from "vitest";
import type { AuditState } from "./contracts";
import { findLatestReviewedMappingId, hasReviewedWork, transitionHumanDecision } from "./audit-state";

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

describe("human decision authority", () => {
  const audit: AuditState = {
    mappings: [mapping("active", "staged"), mapping("next", "staged"), mapping("reviewed", "accepted")],
    history: [],
  };

  it("refuses a decision for a proposal that is not the inspected active proposal", () => {
    expect(transitionHumanDecision(audit, "active", "next", "accepted")).toBeNull();
  });

  it("refuses to re-decide a proposal that has already been reviewed", () => {
    expect(transitionHumanDecision(audit, "reviewed", "reviewed", "rejected")).toBeNull();
  });

  it("records only the active staged proposal and selects the next staged proposal", () => {
    const result = transitionHumanDecision(audit, "active", "active", "accepted");
    expect(result?.mappings.find((item) => item.id === "active")?.status).toBe("accepted");
    expect(result?.mappings.find((item) => item.id === "next")?.status).toBe("staged");
    expect(result?.nextActiveId).toBe("next");
  });

  it("exposes reviewed work only after an accepted or rejected decision exists", () => {
    expect(hasReviewedWork({ mappings: [mapping("staged", "staged")], history: [] })).toBe(false);
    expect(hasReviewedWork({ mappings: [mapping("accepted", "accepted")], history: [] })).toBe(true);
    expect(hasReviewedWork({ mappings: [mapping("rejected", "rejected")], history: [] })).toBe(true);
  });
});
