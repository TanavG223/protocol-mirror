import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SourceAdapterError,
  fetchClinicalTrial,
  decodePredefinedEntities,
  fetchPubMedArticle,
  fetchRegistryHistory,
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
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("https://clinicaltrials.gov/api/v2/studies/NCT01234567?fields=protocolSection.identificationModule,protocolSection.outcomesModule");
    expect(result.outcomes).toHaveLength(2);
    expect(result.outcomes[0]).toMatchObject({ id: "registry-primary-1", role: "primary", locator: "protocolSection.outcomesModule.primaryOutcomes[0]" });
    expect(result.outcomes[1].description).toBe("No description supplied by the registry.");
  });

  it("fails closed when the upstream shape is invalid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "not a study" }), { status: 200 })));
    await expect(fetchClinicalTrial("NCT01234567")).rejects.toMatchObject({ code: "invalid_upstream_data", status: 502 });
  });

  it("rejects malformed and oversized upstream records", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("{not-json", { status: 200 })));
    await expect(fetchClinicalTrial("NCT01234567")).rejects.toMatchObject({ code: "invalid_upstream_data" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("{}", {
      status: 200,
      headers: { "Content-Length": "2000001" },
    })));
    await expect(fetchClinicalTrial("NCT01234567")).rejects.toMatchObject({ code: "invalid_upstream_data" });

    const encoder = new TextEncoder();
    const oversizedStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("a".repeat(1_500_000)));
        controller.enqueue(encoder.encode("b".repeat(500_001)));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(oversizedStream, { status: 200 })));
    await expect(fetchClinicalTrial("NCT01234567")).rejects.toMatchObject({ code: "invalid_upstream_data" });
  });
});

describe("ClinicalTrials.gov registration history", () => {
  it("fetches the original and outcome-changing versions and reports the first primary-outcome change", async () => {
    const list = { changes: [
      { version: 0, date: "2020-02-20", moduleLabels: [] },
      { version: 1, date: "2020-02-21", moduleLabels: ["Study Status"] },
      { version: 9, date: "2020-03-20", moduleLabels: ["Outcome Measures"] },
      { version: 14, date: "2020-04-16", moduleLabels: ["Outcome Measures", "Study Design"] },
    ] };
    const version = (measures: string[]) => ({ study: { protocolSection: { outcomesModule: { primaryOutcomes: measures.map((measure) => ({ measure, timeFrame: "Day 15" })) } } } });
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/history")) return new Response(JSON.stringify(list), { status: 200 });
      if (url.endsWith("/history/0")) return new Response(JSON.stringify(version(["7-point ordinal scale"])), { status: 200 });
      if (url.endsWith("/history/9")) return new Response(JSON.stringify(version(["7-point ordinal scale"])), { status: 200 });
      return new Response(JSON.stringify(version(["Time to recovery"])), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRegistryHistory("nct04280705");
    expect(fetchMock.mock.calls.map(([url]) => String(url).split("/api/int/studies/")[1])).toEqual([
      "NCT04280705/history", "NCT04280705/history/0", "NCT04280705/history/9", "NCT04280705/history/14",
    ]);
    expect(result.totalVersions).toBe(4);
    expect(result.original.primaryOutcomes[0]).toMatchObject({ measure: "7-point ordinal scale", locator: "history/0.protocolSection.outcomesModule.primaryOutcomes[0]" });
    expect(result.primaryOutcomeChanged).toBe(true);
    expect(result.firstPrimaryChange).toMatchObject({ version: 14, date: "2020-04-16", from: ["7-point ordinal scale"], to: ["Time to recovery"], exact: true, after: { version: 9, date: "2020-03-20" } });
    expect(result.complete).toBe(true);
    expect(result.comparedVersions).toEqual([0, 9, 14]);
    expect(result.timeline.map((snapshot) => snapshot.version)).toEqual([0, 14]);
    expect(result.sourceUrl).toBe("https://clinicaltrials.gov/study/NCT04280705?tab=history");
  });

  it("reports no change when every outcome-module edit left the primary set intact", async () => {
    const list = { changes: [{ version: 0, date: "2021-01-01", moduleLabels: [] }, { version: 3, date: "2021-02-01", moduleLabels: ["Outcome Measures"] }] };
    const version = { study: { protocolSection: { outcomesModule: { primaryOutcomes: [{ measure: "Mortality", timeFrame: "Day 28" }] } } } };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith("/history") ? list : version), { status: 200 })));
    const result = await fetchRegistryHistory("NCT00000001");
    expect(result.primaryOutcomeChanged).toBe(false);
    expect(result.firstPrimaryChange).toBeNull();
    expect(result.timeline).toHaveLength(1);
  });

  it("keeps the history when one version cannot be read and marks the change inexact", async () => {
    const list = { changes: [
      { version: 0, date: "2020-01-01", moduleLabels: [] },
      { version: 3, date: "2020-02-01", moduleLabels: ["Outcome Measures"] },
      { version: 5, date: "2020-03-01", moduleLabels: ["Outcome Measures"] },
    ] };
    const version = (measure: string) => ({ study: { protocolSection: { outcomesModule: { primaryOutcomes: [{ measure, timeFrame: "Day 28" }] } } } });
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/history")) return new Response(JSON.stringify(list), { status: 200 });
      if (url.endsWith("/history/3")) return new Response("{}", { status: 200, headers: { "content-length": "9000000" } });
      return new Response(JSON.stringify(version(url.endsWith("/history/0") ? "Mortality" : "Time to discharge")), { status: 200 });
    }));
    const result = await fetchRegistryHistory("NCT00000002");
    expect(result.unreadVersions).toEqual([{ version: 3, date: "2020-02-01" }]);
    expect(result.complete).toBe(false);
    expect(result.primaryOutcomeChanged).toBe(true);
    expect(result.firstPrimaryChange).toMatchObject({ version: 5, exact: false, after: { version: 0, date: "2020-01-01" } });
    expect(result.limitation).toContain("Version 3 could not be read");
  });

  it("samples long histories: original, newest outcome version, then a bisection that dates the first change", async () => {
    const list = { changes: [{ version: 0, date: "2020-01-01", moduleLabels: [] }, ...Array.from({ length: 11 }, (_, i) => ({ version: i + 1, date: `2020-${String(i + 2).padStart(2, "0")}-01`, moduleLabels: ["Outcome Measures"] }))] };
    const version = (measure: string) => ({ study: { protocolSection: { outcomesModule: { primaryOutcomes: [{ measure, timeFrame: "Week 4" }] } } } });
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/history")) return new Response(JSON.stringify(list), { status: 200 });
      const number = Number(url.split("/history/")[1]);
      return new Response(JSON.stringify(version(number >= 7 ? "Composite endpoint" : "Mortality")), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchRegistryHistory("NCT00000003");
    expect(fetchMock.mock.calls.map(([url]) => Number(String(url).split("/history/")[1])).filter(Number.isFinite)).toEqual([0, 11, 5, 8, 6, 7]);
    expect(result.complete).toBe(false);
    expect(result.comparedVersions).toEqual([0, 5, 6, 7, 8, 11]);
    expect(result.changes).toHaveLength(1);
    expect(result.firstPrimaryChange).toMatchObject({ version: 7, date: "2020-08-01", exact: true, after: { version: 6 } });
    expect(result.limitation).toContain("6 of 12 versions were compared");
  });

  it("decodes the HTML-escaped text the history endpoint returns", async () => {
    const list = { changes: [{ version: 0, date: "2020-01-01", moduleLabels: [] }] };
    const version = { study: { protocolSection: { outcomesModule: { primaryOutcomes: [{ measure: "Death within the &#x27;no additional treatment&#x27; arm", timeFrame: "&lt;28 days", description: "Cause &amp; time of death" }] } } } };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith("/history") ? list : version), { status: 200 })));
    const result = await fetchRegistryHistory("NCT00000004");
    expect(result.original.primaryOutcomes[0]).toMatchObject({ measure: "Death within the 'no additional treatment' arm", timeFrame: "<28 days", description: "Cause & time of death" });
  });

  it("fails closed on an unexpected history shape", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ nope: true }), { status: 200 })));
    await expect(fetchRegistryHistory("NCT00000001")).rejects.toMatchObject({ code: "invalid_upstream_data" });
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

  it("decodes the predefined XML entities in abstract text without enabling entity expansion", async () => {
    const xml = `<?xml version="1.0"?><PubmedArticleSet><PubmedArticle><MedlineCitation><Article><ArticleTitle>Entities &amp; markup</ArticleTitle><Abstract><AbstractText Label="RESULTS">rate ratio 1.29; P&lt;0.001 &quot;log-rank&quot;</AbstractText></Abstract></Article></MedlineCitation></PubmedArticle></PubmedArticleSet>`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(xml, { status: 200, headers: { "Content-Type": "application/xml" } })));

    const result = await fetchPubMedArticle("12345678");
    expect(result.title).toBe("Entities & markup");
    expect(result.abstractSections[0].text).toBe('rate ratio 1.29; P<0.001 "log-rank"');
  });

  it("rejects oversized PubMed responses before parsing XML", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<PubmedArticleSet />", {
      status: 200,
      headers: { "Content-Length": "1000001" },
    })));

    await expect(fetchPubMedArticle("12345678")).rejects.toMatchObject({ code: "invalid_upstream_data" });
  });

  it("fails closed on an external XML entity declaration", async () => {
    const xml = `<!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><PubmedArticleSet><PubmedArticle><MedlineCitation><Article><ArticleTitle>&xxe;</ArticleTitle></Article></MedlineCitation></PubmedArticle></PubmedArticleSet>`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(xml, { status: 200 })));

    await expect(fetchPubMedArticle("12345678")).rejects.toThrow("External entities are not supported");
  });
});

describe("safe error responses", () => {
  it("returns structured errors without upstream bodies", async () => {
    const response = sourceErrorResponse(new SourceAdapterError("No study found.", 404, "not_found"));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: { code: "not_found", message: "No study found." } });
  });
});

describe("entity decoding", () => {
  it("decodes numeric references and predefined entities one level deep", () => {
    expect(decodePredefinedEntities("the &#x27;no additional treatment&#x27; arm &amp; P&lt;0.001 &#8804; 5 &amp;lt;")).toBe("the 'no additional treatment' arm & P<0.001 ≤ 5 &lt;");
  });
});

describe("PubMed publication date", () => {
  const xml = (dates: string) => `<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>1</PMID><Article><Journal><Title>J</Title><JournalIssue>${dates.includes("PubDate") ? dates.match(/<PubDate>.*<\/PubDate>/)?.[0] ?? "" : ""}</JournalIssue></Journal><ArticleTitle>T</ArticleTitle><Abstract><AbstractText Label="RESULTS">x</AbstractText></Abstract>${dates.replace(/<PubDate>.*<\/PubDate>/, "")}</Article></MedlineCitation></PubmedArticle></PubmedArticleSet>`;

  it("prefers the electronic article date", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(xml('<PubDate><Year>2020</Year><Month>Nov</Month><Day>5</Day></PubDate><ArticleDate DateType="Electronic"><Year>2020</Year><Month>05</Month><Day>22</Day></ArticleDate>'), { status: 200 })));
    expect((await fetchPubMedArticle("32445440")).publishedOn).toBe("2020-05-22");
  });

  it("falls back to the issue date and tolerates partial dates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(xml("<PubDate><Year>2020</Year><Month>Nov</Month></PubDate>"), { status: 200 })));
    expect((await fetchPubMedArticle("1")).publishedOn).toBe("2020-11");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(xml(""), { status: 200 })));
    expect((await fetchPubMedArticle("1")).publishedOn).toBeNull();
  });
});
