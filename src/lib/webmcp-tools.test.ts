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
    const fetcher = vi.fn(async () => Response.json({ ok: true, nctId: "NCT01234567" }));
    const [tool] = createLiveSourceTools(fetcher);
    const result = await tool.execute({ nctId: "nct01234567" }, options);

    expect(fetcher).toHaveBeenCalledWith("/api/clinical-trials/NCT01234567", expect.objectContaining({ signal: options.signal }));
    expect(result).toMatchObject({ ok: true, nctId: "NCT01234567" });
  });

  it("rejects malformed identifiers before a request is made", async () => {
    const fetcher = vi.fn();
    const [trialTool, pubmedTool] = createLiveSourceTools(fetcher);

    await expect(trialTool.execute({ nctId: "https://attacker.example" }, options)).rejects.toThrow(/exactly eight digits/);
    await expect(pubmedTool.execute({ pmid: "1/../../admin" }, options)).rejects.toThrow(/one to nine digits/);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
