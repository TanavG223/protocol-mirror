import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

const NctId = z.string().regex(/^NCT\d{8}$/i, "Expected an NCT identifier such as NCT01234567.");
const Pmid = z.string().regex(/^\d{1,9}$/, "Expected a numeric PubMed identifier.");
const MAX_CLINICAL_TRIAL_BYTES = 2_000_000;
const MAX_PUBMED_BYTES = 1_000_000;

const CtgovOutcome = z.object({
  measure: z.string().min(1).max(500),
  description: z.string().max(10_000).optional().default("No description supplied by the registry."),
  timeFrame: z.string().max(500).optional().default("Not specified"),
});

const CtgovStudy = z.object({
  protocolSection: z.object({
    identificationModule: z.object({
      nctId: z.string().max(20),
      briefTitle: z.string().max(1_000),
      organization: z.object({ fullName: z.string().max(500).optional() }).optional(),
    }),
    outcomesModule: z.object({
      primaryOutcomes: z.array(CtgovOutcome).max(250).optional().default([]),
      secondaryOutcomes: z.array(CtgovOutcome).max(250).optional().default([]),
      otherOutcomes: z.array(CtgovOutcome).max(250).optional().default([]),
    }).optional(),
  }),
});

export class SourceAdapterError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: "invalid_identifier" | "not_found" | "upstream_error" | "invalid_upstream_data",
  ) {
    super(message);
  }
}

export function parseNctId(value: string) {
  const parsed = NctId.safeParse(value.trim().toUpperCase());
  if (!parsed.success) throw new SourceAdapterError(parsed.error.issues[0].message, 400, "invalid_identifier");
  return parsed.data;
}

export function parsePmid(value: string) {
  const parsed = Pmid.safeParse(value.trim());
  if (!parsed.success) throw new SourceAdapterError(parsed.error.issues[0].message, 400, "invalid_identifier");
  return parsed.data;
}

async function readBoundedText(response: Response, maxBytes: number, source: string) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new SourceAdapterError(`${source} returned a record larger than the supported limit.`, 502, "invalid_upstream_data");
  }

  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new SourceAdapterError(`${source} returned a record larger than the supported limit.`, 502, "invalid_upstream_data");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function fetchClinicalTrial(rawNctId: string) {
  const nctId = parseNctId(rawNctId);
  // Project the response to the two modules this product reads. Large trials (for example
  // NCT04368728) exceed the 2 MB safety cap when the full study record is requested.
  const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${encodeURIComponent(nctId)}?fields=protocolSection.identificationModule,protocolSection.outcomesModule`, {
    headers: { Accept: "application/json", "User-Agent": "ProtocolMirror/0.1 research-transparency-demo" },
    next: { revalidate: 60 * 60 * 12 },
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 404) throw new SourceAdapterError(`No ClinicalTrials.gov study was found for ${nctId}.`, 404, "not_found");
  if (response.status === 400) throw new SourceAdapterError(`ClinicalTrials.gov rejected ${nctId} as an identifier.`, 400, "invalid_identifier");
  if (!response.ok) throw new SourceAdapterError("ClinicalTrials.gov is temporarily unavailable.", 502, "upstream_error");
  let payload: unknown;
  try {
    payload = JSON.parse(await readBoundedText(response, MAX_CLINICAL_TRIAL_BYTES, "ClinicalTrials.gov"));
  } catch (error) {
    if (error instanceof SourceAdapterError) throw error;
    throw new SourceAdapterError("ClinicalTrials.gov returned malformed JSON.", 502, "invalid_upstream_data");
  }
  const parsed = CtgovStudy.safeParse(payload);
  if (!parsed.success) throw new SourceAdapterError("ClinicalTrials.gov returned an unexpected record shape.", 502, "invalid_upstream_data");
  const section = parsed.data.protocolSection;
  const outcomes = section.outcomesModule;
  const normalize = (role: "primary" | "secondary" | "other", items: z.infer<typeof CtgovOutcome>[]) => items.map((item, index) => ({
    id: `registry-${role}-${index + 1}`,
    role,
    title: item.measure,
    description: item.description,
    timeFrame: item.timeFrame,
    locator: `protocolSection.outcomesModule.${role}Outcomes[${index}]`,
  }));
  return {
    source: "ClinicalTrials.gov",
    sourceUrl: `https://clinicaltrials.gov/study/${nctId}`,
    retrievedAt: new Date().toISOString(),
    nctId: section.identificationModule.nctId,
    title: section.identificationModule.briefTitle,
    sponsor: section.identificationModule.organization?.fullName ?? "Not specified",
    outcomes: [
      ...normalize("primary", outcomes?.primaryOutcomes ?? []),
      ...normalize("secondary", outcomes?.secondaryOutcomes ?? []),
      ...normalize("other", outcomes?.otherOutcomes ?? []),
    ],
  };
}

const xmlParser = new XMLParser({ ignoreAttributes: false, trimValues: true, parseTagValue: false, processEntities: false });
const asArray = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
// Entity processing is disabled in the parser so external entities can never be resolved; the
// five predefined XML entities are decoded here so abstract text reads "P<0.001", not "P&lt;0.001".
const PREDEFINED_ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&apos;": "'", "&amp;": "&" };
export const decodePredefinedEntities = (value: string) => value.replace(/&(lt|gt|quot|apos|amp);/g, (entity) => PREDEFINED_ENTITIES[entity] ?? entity);
const text = (value: unknown): string => {
  if (typeof value === "string") return decodePredefinedEntities(value);
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return [record["#text"], record.i, record.b, record.sup, record.sub].flatMap((item) => asArray(item)).map(text).filter(Boolean).join(" ");
  }
  return "";
};

export async function fetchPubMedArticle(rawPmid: string) {
  const pmid = parsePmid(rawPmid);
  const params = new URLSearchParams({ db: "pubmed", id: pmid, rettype: "abstract", retmode: "xml", tool: "protocol_mirror", email: "protocol-mirror@example.invalid" });
  const response = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${params}`, {
    headers: { Accept: "application/xml", "User-Agent": "ProtocolMirror/0.1 research-transparency-demo" },
    next: { revalidate: 60 * 60 * 12 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new SourceAdapterError("PubMed is temporarily unavailable.", 502, "upstream_error");
  const parsed = xmlParser.parse(await readBoundedText(response, MAX_PUBMED_BYTES, "PubMed")) as Record<string, unknown>;
  const set = parsed.PubmedArticleSet as Record<string, unknown> | undefined;
  const articleRoot = asArray(set?.PubmedArticle)[0] as Record<string, unknown> | undefined;
  if (!articleRoot) throw new SourceAdapterError(`No PubMed article was found for ${pmid}.`, 404, "not_found");
  const citation = articleRoot.MedlineCitation as Record<string, unknown> | undefined;
  const article = citation?.Article as Record<string, unknown> | undefined;
  if (!article) throw new SourceAdapterError("PubMed returned an unexpected record shape.", 502, "invalid_upstream_data");
  const abstractRoot = article.Abstract as Record<string, unknown> | undefined;
  const abstractSections = asArray(abstractRoot?.AbstractText).map((section, index) => {
    const record = typeof section === "object" && section ? section as Record<string, unknown> : {};
    return { id: `publication-abstract-${index + 1}`, label: typeof record["@_Label"] === "string" ? record["@_Label"] : `Abstract section ${index + 1}`, text: text(section), locator: `MedlineCitation.Article.Abstract.AbstractText[${index}]` };
  }).filter((section) => section.text);
  return {
    source: "PubMed",
    sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    retrievedAt: new Date().toISOString(),
    pmid,
    title: text(article.ArticleTitle) || "Untitled PubMed record",
    journal: text((article.Journal as Record<string, unknown> | undefined)?.Title) || "Journal not specified",
    abstractSections,
    limitation: "PubMed abstracts do not provide a canonical outcome schema. Outcome extraction must be proposed and reviewed, never silently inferred.",
  };
}

const MAX_HISTORY_LIST_BYTES = 1_000_000;
const MAX_HISTORY_VERSIONS = 6;
const OUTCOME_MODULE_LABEL = /outcome measures$/i;

const HistoryList = z.object({
  changes: z.array(z.object({
    version: z.number().int().nonnegative(),
    date: z.string().max(40),
    moduleLabels: z.array(z.string().max(80)).max(40).optional().default([]),
  })).min(1).max(2_000),
});

const HistoryVersion = z.object({
  study: z.object({
    protocolSection: z.object({
      outcomesModule: z.object({ primaryOutcomes: z.array(CtgovOutcome).max(250).optional().default([]) }).optional(),
    }),
  }),
});

export interface RegistryPrimaryOutcome { measure: string; timeFrame: string; description: string; locator: string }
export interface RegistryVersionSnapshot { version: number; date: string; primaryOutcomes: RegistryPrimaryOutcome[] }

const normalizeMeasure = (outcome: RegistryPrimaryOutcome) => `${outcome.measure} @ ${outcome.timeFrame}`.toLowerCase().replace(/\s+/g, " ").trim();
const samePrimarySet = (a: RegistryPrimaryOutcome[], b: RegistryPrimaryOutcome[]) =>
  a.length === b.length && a.every((outcome, index) => normalizeMeasure(outcome) === normalizeMeasure(b[index]));

async function fetchHistoryVersion(nctId: string, version: number, date: string): Promise<RegistryVersionSnapshot> {
  const response = await fetch(`https://clinicaltrials.gov/api/int/studies/${encodeURIComponent(nctId)}/history/${version}`, {
    headers: { Accept: "application/json", "User-Agent": "ProtocolMirror/0.1 research-transparency-demo" },
    next: { revalidate: 60 * 60 * 12 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new SourceAdapterError("ClinicalTrials.gov registration history is temporarily unavailable.", 502, "upstream_error");
  let payload: unknown;
  try {
    payload = JSON.parse(await readBoundedText(response, MAX_CLINICAL_TRIAL_BYTES, "ClinicalTrials.gov history"));
  } catch (error) {
    if (error instanceof SourceAdapterError) throw error;
    throw new SourceAdapterError("ClinicalTrials.gov history returned malformed JSON.", 502, "invalid_upstream_data");
  }
  const parsed = HistoryVersion.safeParse(payload);
  if (!parsed.success) throw new SourceAdapterError("ClinicalTrials.gov history returned an unexpected record shape.", 502, "invalid_upstream_data");
  const primaryOutcomes = (parsed.data.study.protocolSection.outcomesModule?.primaryOutcomes ?? []).map((outcome, index) => ({
    measure: outcome.measure,
    timeFrame: outcome.timeFrame,
    description: outcome.description,
    locator: `history/${version}.protocolSection.outcomesModule.primaryOutcomes[${index}]`,
  }));
  return { version, date, primaryOutcomes };
}

/**
 * Every registration version is public. This reads the version list, fetches the original
 * registration plus the versions in which the Outcome Measures module changed (bounded), and
 * reports whether and when the primary outcome set was altered. Only primary outcomes are diffed.
 */
export async function fetchRegistryHistory(rawNctId: string) {
  const nctId = parseNctId(rawNctId);
  const response = await fetch(`https://clinicaltrials.gov/api/int/studies/${encodeURIComponent(nctId)}/history`, {
    headers: { Accept: "application/json", "User-Agent": "ProtocolMirror/0.1 research-transparency-demo" },
    next: { revalidate: 60 * 60 * 12 },
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 404) throw new SourceAdapterError(`No ClinicalTrials.gov registration history was found for ${nctId}.`, 404, "not_found");
  if (!response.ok) throw new SourceAdapterError("ClinicalTrials.gov registration history is temporarily unavailable.", 502, "upstream_error");
  let payload: unknown;
  try {
    payload = JSON.parse(await readBoundedText(response, MAX_HISTORY_LIST_BYTES, "ClinicalTrials.gov history"));
  } catch (error) {
    if (error instanceof SourceAdapterError) throw error;
    throw new SourceAdapterError("ClinicalTrials.gov history returned malformed JSON.", 502, "invalid_upstream_data");
  }
  const parsed = HistoryList.safeParse(payload);
  if (!parsed.success) throw new SourceAdapterError("ClinicalTrials.gov history returned an unexpected list shape.", 502, "invalid_upstream_data");

  const changes = [...parsed.data.changes].sort((a, b) => a.version - b.version);
  const first = changes[0];
  const last = changes[changes.length - 1];
  const outcomeVersions = changes.filter((change) => change.version !== first.version && change.moduleLabels.some((label) => OUTCOME_MODULE_LABEL.test(label)));
  const truncated = outcomeVersions.length > MAX_HISTORY_VERSIONS;
  const selected = truncated ? [...outcomeVersions.slice(0, MAX_HISTORY_VERSIONS - 1), outcomeVersions[outcomeVersions.length - 1]] : outcomeVersions;

  const snapshots = await Promise.all([first, ...selected].map((change) => fetchHistoryVersion(nctId, change.version, change.date)));
  const timeline = snapshots.filter((snapshot, index) => index === 0 || !samePrimarySet(snapshot.primaryOutcomes, snapshots[index - 1].primaryOutcomes));
  const firstChange = timeline.length > 1 ? timeline[1] : null;

  return {
    source: "ClinicalTrials.gov registration history",
    sourceUrl: `https://clinicaltrials.gov/study/${nctId}?tab=history`,
    retrievedAt: new Date().toISOString(),
    nctId,
    totalVersions: changes.length,
    latestVersion: { version: last.version, date: last.date },
    outcomeModuleVersions: outcomeVersions.map((change) => ({ version: change.version, date: change.date })),
    original: snapshots[0],
    timeline,
    primaryOutcomeChanged: firstChange !== null,
    firstPrimaryChange: firstChange ? {
      version: firstChange.version,
      date: firstChange.date,
      from: snapshots[0].primaryOutcomes.map((outcome) => outcome.measure),
      to: firstChange.primaryOutcomes.map((outcome) => outcome.measure),
    } : null,
    truncated,
    limitation: "Only primary outcome measures are compared across registration versions. A change is a registry fact, not a judgment; it may be legitimate and pre-specified elsewhere.",
  };
}

export function sourceErrorResponse(error: unknown) {
  if (error instanceof SourceAdapterError) return Response.json({ ok: false, error: { code: error.code, message: error.message } }, { status: error.status });
  if (error instanceof DOMException && error.name === "TimeoutError") return Response.json({ ok: false, error: { code: "upstream_timeout", message: "The upstream source timed out. Use the deterministic demo and retry later." } }, { status: 504 });
  return Response.json({ ok: false, error: { code: "upstream_error", message: "The source could not be retrieved. Use the deterministic demo and retry later." } }, { status: 502 });
}
