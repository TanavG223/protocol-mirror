import type { DiscrepancyKind, Mapping, TrialPair } from "./contracts";

const CATEGORIES = new Set<DiscrepancyKind>(["matched", "omitted", "downgraded", "upgraded", "introduced", "uncertain"]);

export class ProposalValidationError extends Error {}

export function validateMappingProposal(
  input: Record<string, unknown>,
  pair: TrialPair,
  existingMappings: Mapping[],
): Omit<Mapping, "id" | "status" | "origin"> {
  const registryOutcomeId = typeof input.registryOutcomeId === "string" ? input.registryOutcomeId : null;
  const publicationOutcomeId = typeof input.publicationOutcomeId === "string" ? input.publicationOutcomeId : null;
  const registry = registryOutcomeId ? pair.registryOutcomes.find((item) => item.id === registryOutcomeId) : undefined;
  const publication = publicationOutcomeId ? pair.publicationOutcomes.find((item) => item.id === publicationOutcomeId) : undefined;

  if (!registryOutcomeId && !publicationOutcomeId) throw new ProposalValidationError("A proposal must reference at least one outcome.");
  if (registryOutcomeId && !registry) throw new ProposalValidationError("registryOutcomeId is not part of the loaded registry record.");
  if (publicationOutcomeId && !publication) throw new ProposalValidationError("publicationOutcomeId is not part of the loaded publication record.");
  if (typeof input.discrepancy !== "string" || !CATEGORIES.has(input.discrepancy as DiscrepancyKind)) throw new ProposalValidationError("Unknown discrepancy category.");
  if (input.discrepancy === "omitted" && (!registry || publication)) throw new ProposalValidationError("An omitted outcome requires a registry outcome and a null publication outcome.");
  if (input.discrepancy === "introduced" && (registry || !publication)) throw new ProposalValidationError("An introduced outcome requires a null registry outcome and a publication outcome.");
  if (!["omitted", "introduced"].includes(input.discrepancy) && (!registry || !publication)) throw new ProposalValidationError(`${input.discrepancy} requires both a registry and publication outcome.`);
  if (typeof input.rationale !== "string" || input.rationale.trim().length < 20 || input.rationale.length > 800) throw new ProposalValidationError("Rationale must contain 20 to 800 characters.");
  if (typeof input.confidence !== "number" || !Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) throw new ProposalValidationError("Confidence must be a finite number from 0 to 1.");
  if (!Array.isArray(input.evidenceIds) || input.evidenceIds.length === 0 || input.evidenceIds.some((id) => typeof id !== "string")) throw new ProposalValidationError("At least one valid evidence ID is required.");
  if (input.evidenceIds.length > pair.evidence.length) throw new ProposalValidationError("The proposal cites more evidence IDs than exist in the loaded record.");
  if (new Set(input.evidenceIds).size !== input.evidenceIds.length) throw new ProposalValidationError("Evidence IDs must not contain duplicates.");

  const evidenceIds = input.evidenceIds as string[];
  const knownEvidence = new Set(pair.evidence.map((item) => item.id));
  if (evidenceIds.some((id) => !knownEvidence.has(id))) throw new ProposalValidationError("The proposal cites evidence outside the loaded record.");
  if (registry && !registry.evidenceIds.some((id) => evidenceIds.includes(id))) throw new ProposalValidationError("The selected registry outcome must cite its own registry evidence.");
  if (publication && !publication.evidenceIds.some((id) => evidenceIds.includes(id))) throw new ProposalValidationError("The selected publication outcome must cite its own publication evidence.");
  if (existingMappings.some((item) => item.registryOutcomeId === registryOutcomeId && item.publicationOutcomeId === publicationOutcomeId && item.status !== "rejected")) throw new ProposalValidationError("This outcome pairing is already staged or accepted.");

  return {
    registryOutcomeId,
    publicationOutcomeId,
    discrepancy: input.discrepancy as DiscrepancyKind,
    rationale: input.rationale.trim(),
    evidenceIds,
    confidence: input.confidence,
  };
}
