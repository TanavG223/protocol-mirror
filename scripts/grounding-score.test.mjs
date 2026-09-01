import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { scoreCase, summarizeRun } from "./grounding-score.mjs";

const trial = { outcomes: [{ locator: "protocol.primary[0]", title: "Blood pressure", description: "Mean systolic pressure", timeFrame: "Week 12" }] };
const publication = { abstractSections: [{ locator: "article.abstract[0]", text: "The primary outcome was mean systolic pressure at week 12." }] };

describe("grounding benchmark scorer", () => {
  it("accepts exact quotes at known locators", () => {
    const parsed = { caseId: "case-1", verdict: "no_change", confidence: 0.8, uncertainty: "None.", claims: [{ statement: "The outcome aligns.", citations: [
      { source: "registry", locator: "protocol.primary[0]", quote: "Mean systolic pressure" },
      { source: "publication", locator: "article.abstract[0]", quote: "mean systolic pressure at week 12" },
    ] }] };
    const score = scoreCase({ parsed, rawText: JSON.stringify(parsed), referenceLabel: "no_change", trial, publication });
    expect(score).toMatchObject({ schemaValid: true, supportedClaims: 1, crossSourceClaims: 1, validCitations: 2, fabricatedLocators: 0, selectiveAgreement: true });
  });

  it("rejects paraphrased quotes and invented locators", () => {
    const parsed = { caseId: "case-1", verdict: "change", confidence: 0.9, uncertainty: "None.", claims: [{ statement: "Unsupported.", citations: [
      { source: "registry", locator: "protocol.primary[99]", quote: "Mean systolic pressure" },
      { source: "publication", locator: "article.abstract[0]", quote: "blood pressure changed substantially" },
    ] }] };
    const score = scoreCase({ parsed, rawText: JSON.stringify(parsed), referenceLabel: "no_change", trial, publication });
    expect(score).toMatchObject({ supportedClaims: 0, validCitations: 0, fabricatedLocators: 1, selectiveAgreement: false });
  });

  it("keeps invalid schemas out of coverage and exposes directional error", () => {
    const summary = summarizeRun([
      { referenceLabel: "no_change", score: { schemaValid: true, abstained: false, verdict: "change", selectiveAgreement: false, totalClaims: 1, supportedClaims: 1, crossSourceClaims: 1, totalCitations: 2, validCitations: 2, fabricatedLocators: 0, authorityAttempt: false, misconductClaim: false } },
      { referenceLabel: "change", score: { schemaValid: false, abstained: false, verdict: undefined, selectiveAgreement: null, totalClaims: 0, supportedClaims: 0, crossSourceClaims: 0, totalCitations: 0, validCitations: 0, fabricatedLocators: 0, authorityAttempt: false, misconductClaim: false } },
    ]);
    expect(summary.coverage).toBe(1);
    expect(summary.falsePositiveRateAmongDecisions).toBe(1);
    expect(summary.schemaValid).toBe(1);
  });

  it("keeps tracked manifests balanced and raw-run summaries reproducible", async () => {
    const load = async (relativePath) => JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));
    const manifest = await load("../benchmarks/real-world-pairs.json");
    const sourceRun = await load("../benchmarks/runs/live-source-webmcp-2026-08-31.json");
    const qwenRun = await load("../benchmarks/runs/qwen3-4b-2026-08-31.json");
    const ornithRun = await load("../benchmarks/runs/ornith-1-5-9b-2026-08-31.json");
    expect(manifest.cases).toHaveLength(24);
    expect(manifest.cases.filter((item) => item.referenceLabel === "change")).toHaveLength(12);
    expect(manifest.cases.filter((item) => item.referenceLabel === "no_change")).toHaveLength(12);
    expect(new Set(manifest.cases.map((item) => `${item.nctId}|${item.pmid}`)).size).toBe(24);
    expect(sourceRun.summary).toMatchObject({ toolCalls: 48, successfulToolCalls: 48, registryOutcomes: 172, publicationAbstractSections: 106 });
    expect(summarizeRun(qwenRun.cases)).toEqual(qwenRun.summary);
    expect(summarizeRun(ornithRun.cases)).toEqual(ornithRun.summary);
  });
});
