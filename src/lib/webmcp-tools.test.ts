import { describe, expect, it, vi } from "vitest";
import { createLiveSourceTools } from "./webmcp-tools";

const options = { signal: new AbortController().signal };

describe("live source WebMCP tools", () => {
  it("exposes the two bounded read-only adapters", () => {
    const tools = createLiveSourceTools();
    expect(tools.map((tool) => tool.name)).toEqual(["get_live_clinical_trial", "get_live_pubmed_article"]);
    expect(tools.every((tool) => tool.annotations?.readOnlyHint && tool.annotations?.untrustedContentHint)).toBe(true);
  });

  it("normalizes a valid NCT ID and uses only the local adapter route", async () => {
    const clinicalTrial = { nctId: "NCT01234567", title: "Trial title", outcomes: [] };
    const fetcher = vi.fn(async () => Response.json({ ok: true, data: clinicalTrial }));
    const [tool] = createLiveSourceTools(fetcher);
    const result = await tool.execute({ nctId: "nct01234567" }, options);

    expect(fetcher).toHaveBeenCalledWith("/api/clinical-trials/NCT01234567", expect.objectContaining({ signal: options.signal }));
    expect(result).toMatchObject({ ok: true, data: clinicalTrial });
  });

  it("surfaces successful live reads to the shared reviewer workspace", async () => {
    const clinicalTrial = { nctId: "NCT01234567", title: "Trial title", outcomes: [] };
    const pubMedArticle = { pmid: "12345678", title: "Article title", abstractSections: [] };
    const fetcher = vi.fn(async (url: string) => Response.json({ ok: true, data: url.includes("clinical-trials") ? clinicalTrial : pubMedArticle }));
    const onClinicalTrial = vi.fn();
    const onPubMedArticle = vi.fn();
    const onClinicalTrialStart = vi.fn();
    const onPubMedArticleStart = vi.fn();
    const [trialTool, pubmedTool] = createLiveSourceTools(fetcher, { onClinicalTrialStart, onClinicalTrial, onPubMedArticleStart, onPubMedArticle });

    await trialTool.execute({ nctId: "NCT01234567" }, options);
    await pubmedTool.execute({ pmid: "12345678" }, options);

    expect(onClinicalTrialStart).toHaveBeenCalledOnce();
    expect(onPubMedArticleStart).toHaveBeenCalledOnce();
    expect(onClinicalTrial).toHaveBeenCalledWith(clinicalTrial);
    expect(onPubMedArticle).toHaveBeenCalledWith(pubMedArticle);
  });

  it("surfaces a failed read to the reviewer and preserves the tool error", async () => {
    const fetcher = vi.fn(async () => Response.json({ ok: false, error: { message: "The source is temporarily unavailable." } }, { status: 502 }));
    const onClinicalTrialStart = vi.fn();
    const onClinicalTrialError = vi.fn();
    const [trialTool] = createLiveSourceTools(fetcher, { onClinicalTrialStart, onClinicalTrialError });

    await expect(trialTool.execute({ nctId: "NCT01234567" }, options)).rejects.toThrow("temporarily unavailable");
    expect(onClinicalTrialStart).toHaveBeenCalledOnce();
    expect(onClinicalTrialError).toHaveBeenCalledWith("The source is temporarily unavailable.");
  });

  it("fails visibly when a successful adapter response omits its record", async () => {
    const fetcher = vi.fn(async () => Response.json({ ok: true }));
    const onPubMedArticleError = vi.fn();
    const [, pubmedTool] = createLiveSourceTools(fetcher, { onPubMedArticleError });

    await expect(pubmedTool.execute({ pmid: "12345678" }, options)).rejects.toThrow("no article record");
    expect(onPubMedArticleError).toHaveBeenCalledWith("The source adapter returned no article record.");
  });

  it("rejects malformed identifiers before a request is made", async () => {
    const fetcher = vi.fn();
    const [trialTool, pubmedTool] = createLiveSourceTools(fetcher);

    await expect(trialTool.execute({ nctId: "https://attacker.example" }, options)).rejects.toThrow(/exactly eight digits/);
    await expect(pubmedTool.execute({ pmid: "1/../../admin" }, options)).rejects.toThrow(/one to nine digits/);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
