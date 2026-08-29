import { describe, expect, it } from "vitest";
import type { AuditState } from "./contracts";
import { createReviewReceipt } from "./review-receipt";

describe("review receipt", () => {
  it("excludes staged mappings and their mapping-specific events", () => {
    const audit: AuditState = {
      mappings: [
        { id: "reviewed", registryOutcomeId: "r1", publicationOutcomeId: "p1", discrepancy: "matched", rationale: "Reviewed rationale long enough.", evidenceIds: ["e1", "e2"], confidence: 0.9, status: "accepted", origin: "agent" },
        { id: "pending", registryOutcomeId: "r2", publicationOutcomeId: null, discrepancy: "omitted", rationale: "Pending rationale long enough.", evidenceIds: ["e3"], confidence: 0.8, status: "staged", origin: "agent" },
      ],
      history: [
        { id: "event-0", action: "pair_loaded", detail: "Pair loaded.", actor: "system" },
        { id: "event-1", action: "mapping_accepted", detail: "Accepted.", actor: "reviewer", subjectId: "reviewed" },
        { id: "event-2", action: "mapping_staged", detail: "Staged.", actor: "agent", subjectId: "pending" },
      ],
    };

    const receipt = createReviewReceipt("pair-1", audit);
    expect(receipt.reviewedMappings.map((mapping) => mapping.id)).toEqual(["reviewed"]);
    expect(receipt.events.map((event) => event.id)).toEqual(["event-0", "event-1"]);
  });
});
