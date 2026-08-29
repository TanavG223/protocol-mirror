import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SourceAdapterError,
  fetchClinicalTrial,
  fetchPubMedArticle,
  parseNctId,
  parsePmid,
  sourceErrorResponse,
} from "./source-adapters";

afterEach(() => vi.unstubAllGlobals());

describe("identifier contracts", () => {
  it("normalizes valid NCT identifiers", () => {
    expect(parseNctId(" nct01234567 ")).toBe("NCT01234567");
  });

  it.each(["NCT123", "01234567", "NCT0123456X", "NCT012345678"])(
    "rejects malformed NCT identifier %s",
    (value) => expect(() => parseNctId(value)).toThrow(SourceAdapterError),
  );

  it("allows only bounded numeric PubMed identifiers", () => {
    expect(parsePmid(" 12345678 ")).toBe("12345678");
    expect(() => parsePmid("12;db=protein")).toThrow(SourceAdapterError);
    expect(() => parsePmid("1234567890")).toThrow(SourceAdapterError);
  });
});

describe("ClinicalTrials.gov adapter", () => {
  it("normalizes outcomes and emits stable source locators", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      protocolSection: {
        identificationModule: { nctId: "NCT01234567", briefTitle: "Example trial", organization: { fullName: "Example sponsor" } },
        outcomesModule: {
          primaryOutcomes: [{ measure: "Primary measure", description: "Prespecified endpoint", timeFrame: "Week 12" }],
          secondaryOutcomes: [{ measure: "Secondary measure" }],
        },
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const result = await fetchClinicalTrial("NCT01234567");
    expect(result.outcomes).toHaveLength(2);
    expect(result.outcomes[0]).toMatchObject({ id: "registry-primary-1", role: "primary", locator: "protocolSection.outcomesModule.primaryOutcomes[0]" });
    expect(result.outcomes[1].description).toBe("No description supplied by the registry.");
  });

  it("fails closed when the upstream shape is invalid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "not a study" }), { status: 200 })));
    await expect(fetchClinicalTrial("NCT01234567")).rejects.toMatchObject({ code: "invalid_upstream_data", status: 502 });
  });
});

describe("PubMed adapter", () => {
  it("preserves structured abstract sections without claiming outcome extraction", async () => {
    const xml = `<?xml version="1.0"?><PubmedArticleSet><PubmedArticle><MedlineCitation><Article><ArticleTitle>Example publication</ArticleTitle><Journal><Title>Evidence Journal</Title></Journal><Abstract><AbstractText Label="METHODS">Registered methods.</AbstractText><AbstractText Label="RESULTS">Reported results.</AbstractText></Abstract></Article></MedlineCitation></PubmedArticle></PubmedArticleSet>`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(xml, { status: 200, headers: { "Content-Type": "application/xml" } })));

    const result = await fetchPubMedArticle("12345678");
    expect(result.title).toBe("Example publication");
    expect(result.abstractSections).toEqual([
      expect.objectContaining({ label: "METHODS", text: "Registered methods.", locator: "MedlineCitation.Article.Abstract.AbstractText[0]" }),
      expect.objectContaining({ label: "RESULTS", text: "Reported results." }),
    ]);
    expect(result.limitation).toContain("must be proposed and reviewed");
  });
});

describe("safe error responses", () => {
  it("returns structured errors without upstream bodies", async () => {
    const response = sourceErrorResponse(new SourceAdapterError("No study found.", 404, "not_found"));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: { code: "not_found", message: "No study found." } });
  });
});
