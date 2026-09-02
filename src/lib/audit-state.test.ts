import { describe, expect, it } from "vitest";
import type { AuditState } from "./contracts";
import { findLatestReviewedMappingId, hasReviewedWork, prepareCaseSwitch, reviewerFeedback, transitionHumanDecision } from "./audit-state";

describe("prepareCaseSwitch", () => {
  const loaded = { id: "e9", action: "pair_loaded", detail: "Live pair loaded.", actor: "system" as const };

  it("refuses to switch while accepted or rejected work exists", () => {
    expect(prepareCaseSwitch({ mappings: [mapping("done", "accepted")], history: [] }, loaded)).toBeNull();
    expect(prepareCaseSwitch({ mappings: [mapping("done", "rejected")], history: [] }, loaded)).toBeNull();
  });

  it("starts a fresh audit and reports how many staged proposals were discarded", () => {
    const result = prepareCaseSwitch({ mappings: [mapping("a", "staged"), mapping("b", "staged")], history: [loaded] }, loaded);
    expect(result?.discardedStaged).toBe(2);
    expect(result?.audit).toEqual({ mappings: [], history: [loaded] });
  });
});

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

  it("records the reviewer's reason on a rejection and exposes it as feedback for the agent", () => {
    const result = transitionHumanDecision(audit, "active", "active", "rejected", "  The abstract sentence describes methods, not a reported result.  ");
    const rejected = result?.mappings.find((item) => item.id === "active");
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.reviewNote).toBe("The abstract sentence describes methods, not a reported result.");
    expect(reviewerFeedback({ mappings: result!.mappings, history: [] })).toEqual([
      expect.objectContaining({ mappingId: "active", discrepancy: "matched", reviewerNote: "The abstract sentence describes methods, not a reported result." }),
    ]);
    expect(reviewerFeedback({ mappings: [mapping("silent", "rejected")], history: [] })[0].reviewerNote).toMatch(/without a stated reason/);
  });

  it("exposes reviewed work only after an accepted or rejected decision exists", () => {
    expect(hasReviewedWork({ mappings: [mapping("staged", "staged")], history: [] })).toBe(false);
    expect(hasReviewedWork({ mappings: [mapping("accepted", "accepted")], history: [] })).toBe(true);
    expect(hasReviewedWork({ mappings: [mapping("rejected", "rejected")], history: [] })).toBe(true);
  });
});

describe("decision notes", () => {
  it("drops the previous decision's reason when a mapping is decided again", () => {
    const audit = {
      mappings: [{ id: "m1", registryOutcomeId: null, publicationOutcomeId: "p1", discrepancy: "introduced" as const, rationale: "r", evidenceIds: ["e1"], confidence: 0.6, status: "staged" as const, origin: "agent" as const, reviewNote: "Wrong pairing: stale reason" }],
      history: [],
    };
    const accepted = transitionHumanDecision(audit, "m1", "m1", "accepted");
    expect(accepted?.mappings[0].status).toBe("accepted");
    expect(accepted?.mappings[0].reviewNote).toBeUndefined();
    const rejected = transitionHumanDecision(audit, "m1", "m1", "rejected", "Not a real discrepancy");
    expect(rejected?.mappings[0].reviewNote).toBe("Not a real discrepancy");
  });
});
