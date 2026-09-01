import { readFile } from "node:fs/promises";

const paths = {
  readme: "README.md",
  packet: "devpost-submission.md",
  draft: "docs/SUBMISSION_DRAFT.md",
  scorecard: "docs/JUDGE_SCORECARD.md",
  requirements: "docs/OFFICIAL_REQUIREMENTS_SNAPSHOT.md",
  manifest: "docs/FINAL_RELEASE_MANIFEST.md",
  handoff: "docs/SUBMISSION_HANDOFF.md",
  pairs: "benchmarks/real-world-pairs.json",
  sources: "benchmarks/runs/live-source-webmcp-2026-08-31.json",
  qwen: "benchmarks/runs/qwen3-4b-2026-08-31.json",
  ornith: "benchmarks/runs/ornith-1-5-9b-2026-08-31.json",
};

function fail(message) {
  throw new Error(`SUBMISSION_PACKET_FAIL: ${message}`);
}

async function text(path) {
  return readFile(path, "utf8");
}

async function json(path) {
  return JSON.parse(await text(path));
}

function requireText(content, expected, label) {
  if (!content.includes(expected)) fail(`${label} is missing: ${expected}`);
}

function requireAll(content, expected, label) {
  for (const item of expected) requireText(content, item, label);
}

const [readme, packet, draft, scorecard, requirements, manifest, handoff, pairs, sources, qwen, ornith] = await Promise.all([
  text(paths.readme),
  text(paths.packet),
  text(paths.draft),
  text(paths.scorecard),
  text(paths.requirements),
  text(paths.manifest),
  text(paths.handoff),
  json(paths.pairs),
  json(paths.sources),
  json(paths.qwen),
  json(paths.ornith),
]);

const combinedJudgeCopy = [readme, packet, draft, scorecard, requirements, manifest].join("\n");
const publicApp = "https://protocol-mirror.vercel.app";
const publicRepo = "https://github.com/TanavG223/protocol-mirror";
const criteria = ["WebMCP Leverage", "Execution", "Potential Impact", "Creativity & Ambition"];
const requiredPacketSections = [
  "## One-line Summary",
  "## Problem",
  "## Solution",
  "## Why This Matters",
  "## How We Used AI",
  "## How We Used Codex",
  "## Key Features",
  "## Architecture",
  "## Testing Instructions",
  "## Public Demo Link",
  "## Public Repository Link",
  "## Demo Video",
  "## Known Limitations",
];

requireAll(packet, requiredPacketSections, paths.packet);
requireAll(requirements, criteria, paths.requirements);
requireAll(scorecard, criteria, paths.scorecard);
requireAll(packet, [publicApp, publicRepo, "### ⏳ Not submitted yet", "not medical advice", "or a clinically validated detector"], paths.packet);
requireAll(draft, [publicApp, publicRepo, "Truthful-claim guardrail"], paths.draft);
requireAll(readme, [publicApp, publicRepo, "42 passing tests"], paths.readme);
requireAll(manifest, ["Owner-only gates still open", "without establishing universal hallucination or clinical-accuracy claims"], paths.manifest);
requireAll(handoff, ["Complete video watch and explicit approval", "Current official-rules acknowledgment", "Separate literal authorization before final submission", "External-state warning"], paths.handoff);

for (let fieldId = 28249; fieldId <= 28260; fieldId += 1) {
  requireText(packet, `\`${fieldId}\``, `${paths.packet} official form map`);
}

if (/\b(?:TBD|TODO:|YOUR_[A-Z_]+|INSERT_[A-Z_]+)\b/.test(combinedJudgeCopy)) {
  fail("judge-facing copy contains an unresolved placeholder");
}

if (pairs.selection.includedPairs !== 24 || pairs.cases.length !== 24) fail("benchmark manifest must contain exactly 24 included pairs");
if (pairs.selection.changed !== 12 || pairs.selection.unchanged !== 12) fail("benchmark manifest must remain balanced 12 change / 12 no-change");

const sourceSummary = sources.summary;
if (sourceSummary.pairs !== 24 || sourceSummary.toolCalls !== 48 || sourceSummary.successfulToolCalls !== 48) fail("live-source run must prove 24 pairs and 48/48 tool calls");
if (sourceSummary.identifierMismatches !== 0 || sourceSummary.sourceUrlMismatches !== 0 || sourceSummary.emptyEvidenceRecords !== 0) fail("live-source run contains a fidelity failure");
if (sourceSummary.registryOutcomes !== 172 || sourceSummary.publicationAbstractSections !== 106) fail("tracked live-source evidence totals changed; update and review judge copy deliberately");

for (const [label, run] of [["qwen3:4b", qwen], ["ornith-1.5:9b", ornith]]) {
  if (run.run.model !== label) fail(`unexpected model identity for ${label}`);
  if (run.summary.cases !== 24 || run.summary.completed !== 24 || run.summary.schemaValid !== 24) fail(`${label} run is incomplete`);
  if (run.summary.authorityAttempts !== 0 || run.summary.misconductClaims !== 0) fail(`${label} run violates the recorded authority/claim boundary`);
}

requireAll(combinedJudgeCopy, [
  "24 real NCT/PMID pairs",
  "48/48",
  "172 outcomes",
  "106 abstract sections",
  "qwen3:4b",
  "ornith-1.5:9b",
], "judge-facing benchmark claims");

requireAll(packet, ["113.30 seconds", "Kokoro-82M", "project owner must still watch and approve", "final public YouTube URL remains pending"], `${paths.packet} media boundary`);
requireAll(requirements, ["owner watch and public upload remain", "Missing"], `${paths.requirements} media status`);
requireAll(manifest, ["not evidence of owner editorial approval, a Devpost entry, or a YouTube upload", "Owner-only gates still open"], `${paths.manifest} external-state boundary`);

console.log("SUBMISSION_PACKET=PASS");
console.log("OFFICIAL_CRITERIA=4/4");
console.log("DEVPOST_FIELDS=12/12");
console.log(`BENCHMARK_PAIRS=${pairs.cases.length}`);
console.log(`LIVE_SOURCE_CALLS=${sourceSummary.successfulToolCalls}/${sourceSummary.toolCalls}`);
console.log(`EVIDENCE_TOTALS=${sourceSummary.registryOutcomes}_outcomes+${sourceSummary.publicationAbstractSections}_abstract_sections`);
console.log("EXTERNAL_STATE=not_submitted_video_pending");
