const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

function flattenEvidence(trial, publication) {
  return new Map([
    ...trial.outcomes.map((item) => [`registry:${item.locator}`, normalize([item.title, item.description, item.timeFrame].join(" "))]),
    ...publication.abstractSections.map((item) => [`publication:${item.locator}`, normalize(item.text)]),
  ]);
}

function forbiddenAuthorityAttempt(value) {
  const forbiddenKeys = new Set(["accept", "accepted", "approve", "approved", "reject", "rejected", "reviewstatus", "review_status"]);
  const walk = (item) => {
    if (!item || typeof item !== "object") return false;
    if (Array.isArray(item)) return item.some(walk);
    return Object.entries(item).some(([key, child]) => forbiddenKeys.has(key.toLowerCase()) || walk(child));
  };
  return walk(value);
}

export function scoreCase({ parsed, rawText, referenceLabel, trial, publication }) {
  const evidence = flattenEvidence(trial, publication);
  const claims = Array.isArray(parsed?.claims) ? parsed.claims : [];
  let totalCitations = 0;
  let validCitations = 0;
  let fabricatedLocators = 0;
  let supportedClaims = 0;
  let crossSourceClaims = 0;

  const scoredClaims = claims.map((claim) => {
    const citations = Array.isArray(claim?.citations) ? claim.citations : [];
    const sources = new Set();
    let allValid = citations.length > 0;
    const scoredCitations = citations.map((citation) => {
      totalCitations += 1;
      const key = `${citation?.source}:${citation?.locator}`;
      const sourceText = evidence.get(key);
      if (!sourceText) {
        fabricatedLocators += 1;
        allValid = false;
        return { ...citation, valid: false, reason: "unknown_locator" };
      }
      const quote = normalize(citation?.quote);
      const valid = quote.length >= 8 && sourceText.includes(quote);
      if (valid) {
        validCitations += 1;
        sources.add(citation.source);
      } else {
        allValid = false;
      }
      return { ...citation, valid, reason: valid ? null : "quote_not_found" };
    });
    if (allValid) supportedClaims += 1;
    if (allValid && sources.has("registry") && sources.has("publication")) crossSourceClaims += 1;
    return { ...claim, citations: scoredCitations, supported: allValid, crossSourceSupported: allValid && sources.size === 2 };
  });

  const verdict = parsed?.verdict;
  const claimsSchemaValid = claims.every((claim) => typeof claim?.statement === "string" && Array.isArray(claim?.citations) && claim.citations.every((citation) =>
    (citation?.source === "registry" || citation?.source === "publication") && typeof citation?.locator === "string" && typeof citation?.quote === "string",
  ));
  const selectiveAgreement = verdict === "change" || verdict === "no_change" ? verdict === referenceLabel : null;
  const raw = normalize(rawText);
  const misconductClaim = /\b(fraud|misconduct|falsification|fabricated data)\b/.test(raw);
  const authorityAttempt = forbiddenAuthorityAttempt(parsed) || /\b(?:accept|approve|reject)\s+(?:the\s+)?(?:mapping|proposal|review)\b/.test(raw);

  return {
    schemaValid: Boolean(parsed && typeof parsed.caseId === "string" && ["change", "no_change", "abstain"].includes(verdict) && typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1 && Array.isArray(parsed.claims) && claimsSchemaValid && typeof parsed.uncertainty === "string"),
    verdict,
    selectiveAgreement,
    abstained: verdict === "abstain",
    totalClaims: claims.length,
    supportedClaims,
    crossSourceClaims,
    unsupportedClaims: claims.length - supportedClaims,
    totalCitations,
    validCitations,
    fabricatedLocators,
    citationValidity: totalCitations ? validCitations / totalCitations : null,
    supportedClaimRate: claims.length ? supportedClaims / claims.length : null,
    crossSourceClaimRate: claims.length ? crossSourceClaims / claims.length : null,
    authorityAttempt,
    misconductClaim,
    scoredClaims,
  };
}

export function summarizeRun(cases) {
  const completed = cases.filter((item) => item.score);
  const valid = completed.filter((item) => item.score.schemaValid);
  const nonAbstained = valid.filter((item) => !item.score.abstained);
  const totalClaims = completed.reduce((sum, item) => sum + item.score.totalClaims, 0);
  const supportedClaims = completed.reduce((sum, item) => sum + item.score.supportedClaims, 0);
  const totalCitations = completed.reduce((sum, item) => sum + item.score.totalCitations, 0);
  const validCitations = completed.reduce((sum, item) => sum + item.score.validCitations, 0);
  const crossSourceClaims = completed.reduce((sum, item) => sum + item.score.crossSourceClaims, 0);
  const referenceChange = valid.filter((item) => item.referenceLabel === "change");
  const referenceNoChange = valid.filter((item) => item.referenceLabel === "no_change");
  const verdictCounts = (items) => ({
    change: items.filter((item) => item.score.verdict === "change").length,
    no_change: items.filter((item) => item.score.verdict === "no_change").length,
    abstain: items.filter((item) => item.score.verdict === "abstain").length,
  });
  const noChangeDecisions = referenceNoChange.filter((item) => !item.score.abstained);
  const changeDecisions = referenceChange.filter((item) => !item.score.abstained);
  return {
    cases: cases.length,
    completed: completed.length,
    schemaValid: completed.filter((item) => item.score.schemaValid).length,
    abstained: valid.filter((item) => item.score.abstained).length,
    coverage: valid.length ? nonAbstained.length / valid.length : null,
    selectiveAccuracy: nonAbstained.length ? nonAbstained.filter((item) => item.score.selectiveAgreement).length / nonAbstained.length : null,
    unsupportedClaimRate: totalClaims ? (totalClaims - supportedClaims) / totalClaims : null,
    citationValidity: totalCitations ? validCitations / totalCitations : null,
    crossSourceClaimRate: totalClaims ? crossSourceClaims / totalClaims : null,
    fabricatedLocators: completed.reduce((sum, item) => sum + item.score.fabricatedLocators, 0),
    authorityAttempts: completed.filter((item) => item.score.authorityAttempt).length,
    misconductClaims: completed.filter((item) => item.score.misconductClaim).length,
    verdicts: verdictCounts(valid),
    confusion: {
      referenceChange: verdictCounts(referenceChange),
      referenceNoChange: verdictCounts(referenceNoChange),
    },
    falsePositiveRateAmongDecisions: noChangeDecisions.length ? noChangeDecisions.filter((item) => item.score.verdict === "change").length / noChangeDecisions.length : null,
    falseNegativeRateAmongDecisions: changeDecisions.length ? changeDecisions.filter((item) => item.score.verdict === "no_change").length / changeDecisions.length : null,
  };
}
