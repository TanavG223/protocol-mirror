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
const codePointText = (codePoint: number) => Number.isInteger(codePoint) && codePoint > 31 && codePoint <= 0x10ffff && (codePoint < 0xd800 || codePoint > 0xdfff) ? String.fromCodePoint(codePoint) : "";
/** Single-level decoding of numeric character references and the five predefined entities. Entity expansion stays disabled in the parser. */
export const decodePredefinedEntities = (value: string) => value
  .replace(/&#x([0-9a-f]{1,6});/gi, (entity, hex: string) => codePointText(parseInt(hex, 16)) || entity)
  .replace(/&#(\d{1,7});/g, (entity, decimal: string) => codePointText(parseInt(decimal, 10)) || entity)
  .replace(/&(lt|gt|quot|apos|amp);/g, (entity) => PREDEFINED_ENTITIES[entity] ?? entity);
const text = (value: unknown): string => {
  if (typeof value === "string") return decodePredefinedEntities(value);
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return [record["#text"], record.i, record.b, record.sup, record.sub].flatMap((item) => asArray(item)).map(text).filter(Boolean).join(" ");
  }
  return "";
};

const MONTHS: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
const datePart = (value: unknown, kind: "year" | "month" | "day"): string | null => {
  const raw = text(value).trim();
  if (!raw) return null;
  if (kind === "month" && MONTHS[raw.slice(0, 3).toLowerCase()]) return MONTHS[raw.slice(0, 3).toLowerCase()];
  const digits = raw.match(/^\d{1,4}/)?.[0];
  if (!digits) return null;
  if (kind === "year") return digits.length === 4 ? digits : null;
  return digits.padStart(2, "0");
};
/** The earliest publication date PubMed states: the electronic ArticleDate, else the issue PubDate. Partial dates come back as YYYY or YYYY-MM. */
const articlePublicationDate = (article: Record<string, unknown>): string | null => {
  const journal = article.Journal as Record<string, unknown> | undefined;
  const issue = journal?.JournalIssue as Record<string, unknown> | undefined;
  for (const candidate of [...asArray(article.ArticleDate), issue?.PubDate]) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    const year = datePart(record.Year, "year");
    if (!year) continue;
    const month = datePart(record.Month, "month");
    const dayOfMonth = month ? datePart(record.Day, "day") : null;
    return [year, month, dayOfMonth].filter(Boolean).join("-");
  }
  return null;
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
    publishedOn: articlePublicationDate(article),
    abstractSections,
    limitation: "PubMed abstracts do not provide a canonical outcome schema. Outcome extraction must be proposed and reviewed, never silently inferred.",
  };
}

const MAX_HISTORY_LIST_BYTES = 1_000_000;
/** Late registration versions carry posted results; NCT04368728 version 52 is 4.2 MB. */
const MAX_HISTORY_VERSION_BYTES = 8_000_000;
/** Version fetches per call in addition to the original registration. */
const MAX_HISTORY_FETCHES = 8;
/** Up to this many outcome-module versions every one is compared and the timeline is complete. */
const FULL_TIMELINE_LIMIT = 6;
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
export interface RegistryPrimaryChange {
  version: number;
  date: string;
  from: string[];
  to: string[];
  /** False when outcome-module versions between `after` and this one were not compared: the change happened at or before this version. */
  exact: boolean;
  /** The newest compared version that still carried the previous primary outcome set. */
  after: { version: number; date: string };
}

const normalizeText = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
const UNSPECIFIED_TIME_FRAME = normalizeText("Not specified");
const measureKey = (outcomes: RegistryPrimaryOutcome[]) => outcomes.map((outcome) => normalizeText(outcome.measure)).sort().join(" | ");
/** Measures only, order-insensitive. A reworded or newly filled-in time frame is never counted as an outcome change. */
const samePrimarySet = (a: RegistryPrimaryOutcome[], b: RegistryPrimaryOutcome[]) => measureKey(a) === measureKey(b);
/** True when a measure present in both versions carries two different, both specified, time frames. */
const timeFrameEdited = (previous: RegistryPrimaryOutcome[], next: RegistryPrimaryOutcome[]) => {
  const before = new Map(previous.map((outcome) => [normalizeText(outcome.measure), normalizeText(outcome.timeFrame)]));
  return next.some((outcome) => {
    const was = before.get(normalizeText(outcome.measure));
    const now = normalizeText(outcome.timeFrame);
    return was !== undefined && was !== UNSPECIFIED_TIME_FRAME && now !== UNSPECIFIED_TIME_FRAME && was !== now;
  });
};

async function fetchHistoryVersion(nctId: string, version: number, date: string): Promise<RegistryVersionSnapshot> {
  const response = await fetch(`https://clinicaltrials.gov/api/int/studies/${encodeURIComponent(nctId)}/history/${version}`, {
    headers: { Accept: "application/json", "User-Agent": "ProtocolMirror/0.1 research-transparency-demo" },
    next: { revalidate: 60 * 60 * 12 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new SourceAdapterError("ClinicalTrials.gov registration history is temporarily unavailable.", 502, "upstream_error");
  let payload: unknown;
  try {
    payload = JSON.parse(await readBoundedText(response, MAX_HISTORY_VERSION_BYTES, "ClinicalTrials.gov history"));
  } catch (error) {
    if (error instanceof SourceAdapterError) throw error;
    throw new SourceAdapterError("ClinicalTrials.gov history returned malformed JSON.", 502, "invalid_upstream_data");
  }
  const parsed = HistoryVersion.safeParse(payload);
  if (!parsed.success) throw new SourceAdapterError("ClinicalTrials.gov history returned an unexpected record shape.", 502, "invalid_upstream_data");
  // The history endpoint HTML-escapes text (unlike the v2 study API), so quotes decode here.
  const primaryOutcomes = (parsed.data.study.protocolSection.outcomesModule?.primaryOutcomes ?? []).map((outcome, index) => ({
    measure: decodePredefinedEntities(outcome.measure),
    timeFrame: decodePredefinedEntities(outcome.timeFrame),
    description: decodePredefinedEntities(outcome.description),
    locator: `history/${version}.protocolSection.outcomesModule.primaryOutcomes[${index}]`,
  }));
  return { version, date, primaryOutcomes };
}

/**
 * Every registration version is public. This reads the version list and the original registration,
 * then compares primary outcomes across the versions in which the Outcome Measures module changed.
 * Up to FULL_TIMELINE_LIMIT such versions are all compared, so the timeline is complete. Above that,
 * the newest one is compared with the original and a bisection dates the first change, so every
 * reported change says whether its date is exact and the result says which versions were not
 * compared. A version that cannot be read (a results-bearing record above the byte cap, a timeout)
 * is reported, never fatal.
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
  // Without module labels there is no way to know which versions touched the outcomes, so only the
  // latest version is compared and the result is marked incomplete rather than a false "unchanged".
  const labelsAvailable = changes.some((change) => change.moduleLabels.length > 0);
  const outcomeVersions = labelsAvailable
    ? changes.filter((change) => change.version !== first.version && change.moduleLabels.some((label) => OUTCOME_MODULE_LABEL.test(label)))
    : changes.length > 1 ? [last] : [];

  const original = await fetchHistoryVersion(nctId, first.version, first.date);
  const compared: RegistryVersionSnapshot[] = [original];
  const unreadVersions: Array<{ version: number; date: string }> = [];
  const read = async (change: { version: number; date: string }) => {
    try {
      const snapshot = await fetchHistoryVersion(nctId, change.version, change.date);
      compared.push(snapshot);
      return snapshot;
    } catch {
      unreadVersions.push({ version: change.version, date: change.date });
      return null;
    }
  };
  const sameAsOriginal = (snapshot: RegistryVersionSnapshot) => samePrimarySet(snapshot.primaryOutcomes, original.primaryOutcomes);

  if (outcomeVersions.length <= FULL_TIMELINE_LIMIT) {
    await Promise.all(outcomeVersions.map(read));
  } else {
    // Newest readable outcome-module version first, then bisect between the original and it.
    let high = outcomeVersions.length - 1;
    let newest: RegistryVersionSnapshot | null = null;
    while (high >= 0 && !newest && unreadVersions.length < 3) {
      newest = await read(outcomeVersions[high]);
      if (!newest) high -= 1;
    }
    if (newest && !sameAsOriginal(newest)) {
      let low = -1;
      while (high - low > 1 && compared.length - 1 + unreadVersions.length < MAX_HISTORY_FETCHES) {
        const middle = Math.floor((low + high) / 2);
        const snapshot = await read(outcomeVersions[middle]);
        if (!snapshot) break;
        if (sameAsOriginal(snapshot)) low = middle; else high = middle;
      }
    }
  }

  const ordered = [...compared].sort((a, b) => a.version - b.version);
  const timeline = ordered.filter((snapshot, index) => index === 0 || !samePrimarySet(snapshot.primaryOutcomes, ordered[index - 1].primaryOutcomes));
  const comparedVersions = ordered.map((snapshot) => snapshot.version);
  const comparedSet = new Set(comparedVersions);
  const primaryChanges: RegistryPrimaryChange[] = timeline.slice(1).map((snapshot, index) => {
    const previous = timeline[index];
    const after = [...ordered].reverse().find((item) => item.version < snapshot.version) ?? previous;
    const skipped = outcomeVersions.some((change) => change.version > after.version && change.version < snapshot.version && !comparedSet.has(change.version));
    return {
      version: snapshot.version,
      date: snapshot.date,
      from: previous.primaryOutcomes.map((outcome) => outcome.measure),
      to: snapshot.primaryOutcomes.map((outcome) => outcome.measure),
      exact: !skipped,
      after: { version: after.version, date: after.date },
    };
  });
  const timeFrameEdits = ordered.slice(1)
    .filter((snapshot, index) => samePrimarySet(snapshot.primaryOutcomes, ordered[index].primaryOutcomes) && timeFrameEdited(ordered[index].primaryOutcomes, snapshot.primaryOutcomes))
    .map((snapshot) => ({ version: snapshot.version, date: snapshot.date }));
  const uncompared = outcomeVersions.filter((change) => !comparedSet.has(change.version));
  const complete = labelsAvailable && uncompared.length === 0;

  return {
    source: "ClinicalTrials.gov registration history",
    sourceUrl: `https://clinicaltrials.gov/study/${nctId}?tab=history`,
    retrievedAt: new Date().toISOString(),
    nctId,
    totalVersions: changes.length,
    latestVersion: { version: last.version, date: last.date },
    outcomeModuleVersions: outcomeVersions.map((change) => ({ version: change.version, date: change.date })),
    comparedVersions,
    unreadVersions,
    complete,
    original,
    timeline,
    changes: primaryChanges,
    timeFrameEdits,
    primaryOutcomeChanged: primaryChanges.length > 0,
    firstPrimaryChange: primaryChanges[0] ?? null,
    truncated: !complete,
    limitation: [
      "Only primary outcome measures are compared across registration versions. An edit between two stated time frames is listed separately and never counted as a change; a time frame first supplied after registration is not listed. A change is a registry fact, not a judgment; it may be legitimate and pre-specified elsewhere.",
      labelsAvailable ? "" : "The registry did not label which versions changed the Outcome Measures module, so only the original and latest versions were compared.",
      !labelsAvailable || complete ? "" : `${comparedVersions.length} of ${changes.length} versions were compared; ${uncompared.length} outcome-module version${uncompared.length === 1 ? " was" : "s were"} not, so a change made and reverted between compared versions would not appear here.`,
      unreadVersions.length ? `Version${unreadVersions.length === 1 ? "" : "s"} ${unreadVersions.map((item) => item.version).join(", ")} could not be read.` : "",
    ].filter(Boolean).join(" "),
  };
}

export function sourceErrorResponse(error: unknown) {
  if (error instanceof SourceAdapterError) return Response.json({ ok: false, error: { code: error.code, message: error.message } }, { status: error.status });
  if (error instanceof DOMException && error.name === "TimeoutError") return Response.json({ ok: false, error: { code: "upstream_timeout", message: "The upstream source timed out. Use the deterministic demo and retry later." } }, { status: 504 });
  return Response.json({ ok: false, error: { code: "upstream_error", message: "The source could not be retrieved. Use the deterministic demo and retry later." } }, { status: 502 });
}
