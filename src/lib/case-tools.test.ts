import { describe, expect, it, vi } from "vitest";
import type { AuditState, Mapping, TrialPair } from "./contracts";
import { DEMO_PAIR, INITIAL_AUDIT } from "./demo-data";
import { ENUM_LIMIT, createCaseReadTools, createPairBoundTools, enumOf } from "./case-tools";

const options = { signal: new AbortController().signal };

function harness(pair: TrialPair = DEMO_PAIR, audit: AuditState = INITIAL_AUDIT) {
  let current = pair;
  let state = audit;
  const staged: Mapping[] = [];
  const focused: Mapping[] = [];
  const deps = {
    getPair: () => current,
    getAudit: () => state,
    getIntakeHint: () => null,
    stage: vi.fn((proposal: Omit<Mapping, "id" | "status" | "origin">) => {
      const mapping: Mapping = { ...proposal, id: `map-${staged.length + 1}`, status: "staged", origin: "agent" };
      staged.push(mapping);
      state = { mappings: [...state.mappings, mapping], history: state.history };
      return mapping;
    }),
    focusReview: vi.fn((mapping: Mapping) => { focused.push(mapping); }),
  };
  return { deps, staged, focused, setPair: (next: TrialPair) => { current = next; }, setAudit: (next: AuditState) => { state = next; } };
}

const bigPair = (): TrialPair => ({
  ...DEMO_PAIR,
  id: "live-big",
  provenance: "live",
  registryOutcomes: Array.from({ length: 25 }, (_, i) => ({ id: `registry-secondary-${i + 1}`, title: `Outcome ${i + 1}`, description: "x".repeat(400), timeFrame: "Week 1", role: "secondary" as const, evidenceIds: [`ev-registry-secondary-${i + 1}`] })),
  publicationOutcomes: [{ id: "publication-abstract-1", title: "RESULTS · abstract section", description: "Reported.", timeFrame: "Abstract section", role: "other" as const, evidenceIds: ["ev-publication-abstract-1"] }],
  evidence: [
    ...Array.from({ length: 25 }, (_, i) => ({ id: `ev-registry-secondary-${i + 1}`, source: "registry" as const, sourceLabel: "Registry", quote: `Outcome ${i + 1}`, locator: `outcomes[${i}]`, url: "https://clinicaltrials.gov/study/NCT0" })),
    { id: "ev-publication-abstract-1", source: "publication" as const, sourceLabel: "PubMed", quote: "Reported.", locator: "AbstractText[0]", url: "https://pubmed.ncbi.nlm.nih.gov/1/" },
  ],
});

describe("case tools", () => {
  it("emits enums for small id lists and drops them above the limit", () => {
    expect(enumOf(["a", "b"])).toEqual({ enum: ["a", "b"] });
    expect(enumOf(Array.from({ length: ENUM_LIMIT + 1 }, (_, i) => `id-${i}`))).toEqual({});
    const { deps } = harness();
    const [spans, propose] = createPairBoundTools(DEMO_PAIR, deps);
    expect((spans.inputSchema as { properties: { evidenceIds: { items: { enum?: string[] } } } }).properties.evidenceIds.items.enum).toEqual(DEMO_PAIR.evidence.map((item) => item.id));
    const bigTools = createPairBoundTools(bigPair(), deps);
    expect((bigTools[1].inputSchema as { properties: { registryOutcomeId: { enum?: unknown } } }).properties.registryOutcomeId.enum).toBeUndefined();
    expect(propose.name).toBe("propose_outcome_mapping");
  });

  it("reports the active case and compacts long live descriptions in get_audit_state", async () => {
    const { deps } = harness(bigPair());
    const [auditTool] = createCaseReadTools(deps);
    const result = await auditTool.execute({}, options) as { activeCase: string; registryOutcomes: Array<{ description: string }>; publicationNote?: string; pair: { provenance: string } };
    expect(result.activeCase).toBe("live");
    expect(result.pair.provenance).toBe("live");
    expect(result.publicationNote).toContain("abstract sections");
    expect(result.registryOutcomes[0].description.length).toBeLessThanOrEqual(240);
  });

  it("stages a validated proposal against the current pair and refuses a stale binding", async () => {
    const h = harness();
    const [, propose] = createPairBoundTools(DEMO_PAIR, h.deps);
    const result = await propose.execute({
      registryOutcomeId: "reg-sbp-24", publicationOutcomeId: "pub-sbp-12", discrepancy: "uncertain",
      rationale: "The concepts overlap, but the method and time point do not match.", evidenceIds: ["ev-reg-sbp", "ev-pub-sbp"], confidence: 0.7,
    }, options) as { status: string; mapping: Mapping };
    expect(result.status).toBe("staged_for_human_review");
    expect(h.staged).toHaveLength(1);

    h.setPair(bigPair());
    await expect(propose.execute({ registryOutcomeId: "reg-sbp-24", publicationOutcomeId: "pub-sbp-12", discrepancy: "uncertain", rationale: "The concepts overlap, but the method and time point do not match.", evidenceIds: ["ev-reg-sbp", "ev-pub-sbp"], confidence: 0.7 }, options)).rejects.toThrow(/active case changed/);
  });

  it("focuses only staged mappings through request_human_review", async () => {
    const h = harness();
    const [, request] = createCaseReadTools(h.deps);
    await expect(request.execute({ mappingId: "missing" }, options)).rejects.toThrow(/No mapping exists/);
    const [, propose] = createPairBoundTools(DEMO_PAIR, h.deps);
    const staged = await propose.execute({ registryOutcomeId: "reg-qol-24", publicationOutcomeId: null, discrepancy: "omitted", rationale: "No reported outcome describes the prespecified quality-of-life instrument.", evidenceIds: ["ev-reg-qol"], confidence: 0.9 }, options) as { mapping: Mapping };
    const focused = await request.execute({ mappingId: staged.mapping.id }, options) as { decisionAuthority: string };
    expect(focused.decisionAuthority).toBe("human_reviewer_only");
    expect(h.focused[0].id).toBe(staged.mapping.id);
  });
});
