import { describe, expect, it } from "vitest";
import { buildLiveTrialPair, isLivePair } from "./live-pair";
import { validateMappingProposal } from "./proposal-validation";
import { DEMO_PAIR } from "./demo-data";

const trial = {
  source: "ClinicalTrials.gov",
  sourceUrl: "https://clinicaltrials.gov/study/NCT04280705",
  retrievedAt: "2026-09-01T23:59:00.000Z",
  nctId: "NCT04280705",
  title: "Adaptive COVID-19 Treatment Trial (ACTT)",
  sponsor: "NIAID",
  outcomes: [
    { id: "registry-primary-1", role: "primary", title: "Time to Recovery", description: "Day of recovery is defined as…", timeFrame: "Day 1 through Day 29", locator: "protocolSection.outcomesModule.primaryOutcomes[0]" },
    { id: "registry-secondary-1", role: "secondary", title: "Mortality", description: "No description supplied by the registry.", timeFrame: "Day 29", locator: "protocolSection.outcomesModule.secondaryOutcomes[0]" },
    { id: "registry-other-1", role: "exploratory", title: "Odd role", description: "x", timeFrame: "Not specified", locator: "protocolSection.outcomesModule.otherOutcomes[0]" },
  ],
};

const article = {
  source: "PubMed",
  sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/32445440/",
  retrievedAt: "2026-09-02T00:01:00.000Z",
  pmid: "32445440",
  title: "Remdesivir for the Treatment of Covid-19 - Final Report.",
  journal: "The New England journal of medicine",
  abstractSections: [
    { id: "publication-abstract-1", label: "METHODS", text: "The primary outcome was the time to recovery.", locator: "MedlineCitation.Article.Abstract.AbstractText[1]" },
    { id: "publication-abstract-2", label: "RESULTS", text: "Median recovery time was 10 days.", locator: "MedlineCitation.Article.Abstract.AbstractText[2]" },
  ],
  limitation: "PubMed abstracts do not provide a canonical outcome schema.",
};

describe("buildLiveTrialPair", () => {
  const pair = buildLiveTrialPair(trial, article);

  it("keeps adapter identifiers and locators verbatim and quotes exact source text", () => {
    expect(pair.id).toBe("live-NCT04280705-32445440");
    expect(pair.registryOutcomes.map((item) => item.id)).toEqual(["registry-primary-1", "registry-secondary-1", "registry-other-1"]);
    expect(pair.publicationOutcomes.map((item) => item.id)).toEqual(["publication-abstract-1", "publication-abstract-2"]);
    const registrySpan = pair.evidence.find((span) => span.id === "ev-registry-primary-1");
    expect(registrySpan).toMatchObject({ source: "registry", quote: "Time to Recovery", locator: "protocolSection.outcomesModule.primaryOutcomes[0].measure", url: trial.sourceUrl });
    const publicationSpan = pair.evidence.find((span) => span.id === "ev-publication-abstract-1");
    expect(publicationSpan).toMatchObject({ source: "publication", quote: "The primary outcome was the time to recovery.", locator: "MedlineCitation.Article.Abstract.AbstractText[1]", url: article.sourceUrl });
  });

  it("labels publication entries as abstract sections, never as extracted outcomes", () => {
    expect(pair.publicationOutcomes.every((item) => item.role === "other")).toBe(true);
    expect(pair.publicationOutcomes[0].title).toContain("abstract section");
    expect(pair.publicationOutcomes[0].timeFrame).toContain("not an extracted outcome");
  });

  it("normalizes unknown registry roles and marks provenance", () => {
    expect(pair.registryOutcomes[2].role).toBe("other");
    expect(pair.provenance).toBe("live");
    expect(isLivePair(pair)).toBe(true);
    expect(isLivePair(DEMO_PAIR)).toBe(false);
    expect(pair.registryUpdated).toBe("2026-09-01");
  });

  it("produces a pair the existing proposal validator accepts with real ids", () => {
    const proposal = validateMappingProposal({
      registryOutcomeId: "registry-primary-1",
      publicationOutcomeId: "publication-abstract-1",
      discrepancy: "uncertain",
      rationale: "The registered primary outcome and the abstract's METHODS sentence describe the same recovery endpoint.",
      evidenceIds: ["ev-registry-primary-1", "ev-publication-abstract-1"],
      confidence: 0.8,
    }, pair, []);
    expect(proposal.registryOutcomeId).toBe("registry-primary-1");
  });
});
