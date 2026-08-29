import type { AuditState, TrialPair } from "./contracts";

export const DEMO_PAIR: TrialPair = {
  id: "demo-cardio-001",
  nctId: "NCT-DEMO-042",
  pmid: "PMID-DEMO-2042",
  title: "A randomized study of Cardioluma for persistent hypertension",
  sponsor: "Northstar Therapeutics",
  phase: "Phase 3 · deterministic demonstration record",
  registryUpdated: "2025-02-14",
  publicationDate: "2026-01-09",
  registryUrl: "https://clinicaltrials.gov/",
  publicationUrl: "https://pubmed.ncbi.nlm.nih.gov/",
  registryOutcomes: [
    { id: "reg-sbp-24", title: "Change in ambulatory systolic blood pressure", description: "Mean change from baseline measured by 24-hour ambulatory monitoring.", timeFrame: "Baseline to week 24", role: "primary", evidenceIds: ["ev-reg-sbp"] },
    { id: "reg-qol-24", title: "Hypertension quality-of-life score", description: "Change from baseline in the prespecified validated quality-of-life instrument.", timeFrame: "Baseline to week 24", role: "secondary", evidenceIds: ["ev-reg-qol"] },
    { id: "reg-ae-24", title: "Participants with serious adverse events", description: "Number and proportion of participants experiencing one or more serious adverse events.", timeFrame: "Randomization through week 24", role: "secondary", evidenceIds: ["ev-reg-ae"] },
  ],
  publicationOutcomes: [
    { id: "pub-sbp-12", title: "Clinic systolic blood pressure", description: "Adjusted change measured during an in-clinic visit in the efficacy population.", timeFrame: "Baseline to week 12", role: "primary", evidenceIds: ["ev-pub-sbp"] },
    { id: "pub-response-24", title: "Blood-pressure response rate", description: "Post-hoc proportion reaching a systolic blood pressure below 130 mmHg.", timeFrame: "Week 24", role: "secondary", evidenceIds: ["ev-pub-response"] },
    { id: "pub-ae-24", title: "Serious adverse events", description: "Participants with serious adverse events summarized by treatment arm.", timeFrame: "Through week 24", role: "secondary", evidenceIds: ["ev-pub-ae"] },
  ],
  evidence: [
    { id: "ev-reg-sbp", source: "registry", sourceLabel: "Registry · Primary outcome 1", quote: "Change from baseline in mean 24-hour ambulatory systolic blood pressure at week 24.", locator: "OutcomesModule.primaryOutcomes[0]", url: "https://clinicaltrials.gov/" },
    { id: "ev-reg-qol", source: "registry", sourceLabel: "Registry · Secondary outcome 1", quote: "Change in hypertension quality-of-life score from baseline to week 24.", locator: "OutcomesModule.secondaryOutcomes[0]", url: "https://clinicaltrials.gov/" },
    { id: "ev-reg-ae", source: "registry", sourceLabel: "Registry · Secondary outcome 2", quote: "Participants with one or more serious adverse events through week 24.", locator: "OutcomesModule.secondaryOutcomes[1]", url: "https://clinicaltrials.gov/" },
    { id: "ev-pub-sbp", source: "publication", sourceLabel: "Publication · Results, paragraph 2", quote: "The primary endpoint was adjusted clinic systolic pressure at week 12.", locator: "Results · paragraph 2", url: "https://pubmed.ncbi.nlm.nih.gov/" },
    { id: "ev-pub-response", source: "publication", sourceLabel: "Publication · Figure 3", quote: "A greater proportion of participants achieved systolic pressure below 130 mmHg at week 24.", locator: "Figure 3 caption", url: "https://pubmed.ncbi.nlm.nih.gov/" },
    { id: "ev-pub-ae", source: "publication", sourceLabel: "Publication · Safety, paragraph 1", quote: "Serious adverse events occurred in 4.1% and 4.3% of participants, respectively.", locator: "Safety · paragraph 1", url: "https://pubmed.ncbi.nlm.nih.gov/" },
  ],
};

export const INITIAL_AUDIT: AuditState = {
  mappings: [{ id: "map-ae", registryOutcomeId: "reg-ae-24", publicationOutcomeId: "pub-ae-24", discrepancy: "matched", rationale: "Outcome concept and assessment window agree across both records.", evidenceIds: ["ev-reg-ae", "ev-pub-ae"], confidence: 0.97, status: "accepted", origin: "demo" }],
  history: [
    { id: "event-0", action: "pair_loaded", detail: "Deterministic demonstration pair loaded.", actor: "system" },
    { id: "event-1", action: "mapping_accepted", detail: "Serious adverse event outcome verified by reviewer.", actor: "reviewer" },
  ],
};
