import { describe, expect, it } from "vitest";
import type { AuditState, TrialPair } from "./contracts";
import { createReviewReceipt } from "./review-receipt";

describe("review receipt", () => {
  it("excludes staged mappings and their mapping-specific events", () => {
    const pair = {
      id: "pair-1",
      evidence: [
        { id: "e1", source: "registry", sourceLabel: "Registry outcome", quote: "Registered text.", locator: "outcomes[0]", url: "https://clinicaltrials.gov/" },
        { id: "e2", source: "publication", sourceLabel: "Publication result", quote: "Published text.", locator: "results[2]", url: "https://pubmed.ncbi.nlm.nih.gov/" },
        { id: "e3", source: "registry", sourceLabel: "Pending outcome", quote: "Pending text.", locator: "outcomes[1]", url: "https://clinicaltrials.gov/" },
      ],
    } as TrialPair;
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

    const receipt = createReviewReceipt(pair, audit);
    expect(receipt.reviewedMappings.map((mapping) => mapping.id)).toEqual(["reviewed"]);
    expect(receipt.evidence.map((span) => ({ id: span.id, locator: span.locator }))).toEqual([
      { id: "e1", locator: "outcomes[0]" },
      { id: "e2", locator: "results[2]" },
    ]);
    expect(receipt.events.map((event) => event.id)).toEqual(["event-0", "event-1"]);
  });
});
