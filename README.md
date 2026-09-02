# Protocol Mirror

**Did the trial publish what it registered? Your agent pulls ClinicalTrials.gov and PubMed, quotes exact spans. You decide.**

**Live app:** https://protocol-mirror.vercel.app · **Source (MIT):** https://github.com/TanavG223/protocol-mirror

Research transparency aid only. Not medical advice, a clinical decision system, or a finding of research misconduct.

![Protocol Mirror comparison workspace](docs/screenshots/01-hero.jpg)

## Five-minute judge path

No account, API key, or setup. Open https://protocol-mirror.vercel.app in the ChatGPT/Codex in-app browser with site tools enabled, or in Chrome 152+ with `chrome://flags/#enable-webmcp-testing`. The header should read **WebMCP connected · 6 tools**.

**If the header reads "WebMCP preview"**, this browser did not expose WebMCP. Skip the prompts: in the **Load a real trial** section click the **ACTT-1 · remdesivir** chip to load the real pair, or click **Load 4 example proposals** in the hero to run the same review loop on the bundled fictional case. Steps 4-6 work identically by hand.

1. **Load a real pair.** Paste:
   > Call get_live_clinical_trial with nctId NCT04280705, then get_live_pubmed_article with pmid 32445440.

   Both records appear in the page's intake cards with their ClinicalTrials.gov and PubMed links. Click **Review this pair** to make them the reviewable case; the pair-bound tools re-register against the real identifiers.
2. **Read the exact text.** Paste:
   > Call get_audit_state, then call get_evidence_spans for two evidence IDs it returned — one registered outcome and one publication section — and quote both spans with their locators.

   You get the registered outcome's exact wording and the abstract section's exact wording, each with a source locator such as `OutcomesModule.primaryOutcomes[0]`.
3. **Let the agent propose.** Paste:
   > Call propose_outcome_mapping for those two IDs with a discrepancy of uncertain, both evidence IDs, a one-sentence rationale and a calibrated confidence, then call request_human_review with the returned mappingId.

   The proposal lands in the review queue next to its quotes and the checkpoint takes keyboard focus.
4. **Ask the agent to accept it.** It cannot — no accept or reject tool is registered. Click **Accept** yourself.
5. **Watch the tool surface grow.** The header now reads **7 tools** and `export_review_receipt` unlocks in the tool roster. Paste:
   > Call export_review_receipt and list its mappings, locators and audit events.

   The receipt carries only the reviewed decision, its exact locators, the source URLs, and `generatedFrom: "live_sources"`.
6. **Undo.** Click **Undo last decision**. The receipt tool is unregistered and the header returns to 6 tools.

The session log below the queue lists every tool call and human decision as it happens, so nothing in this path has to be taken on trust.

## What it does

Trial registries record the outcomes researchers promised to measure; publications record what readers eventually see. Checking one against the other is slow, quotation-heavy work done by journal editors, peer reviewers, and systematic reviewers scoring selective-reporting bias. In a 2019 JAMA Network Open study, Chen et al. checked 389 randomized trials sampled from PubMed and Embase (published 2011-2015, with no restriction by journal) against their registrations: 130 had at least one primary-outcome change, 66 of those omitted or never reported the registered primary outcome, and trials with a change reported intervention effect sizes about 16% larger ([PMC6646984](https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/)).

Protocol Mirror puts the registry record and the publication side by side and gives the agent on the page typed tools over that shared state. The loop is: **agent retrieves → agent quotes exact spans → agent stages a proposal → human accepts or rejects → agent exports the reviewed receipt.** The agent never decides; the decision is what unlocks the agent's seventh tool.

## The seven WebMCP tools

All are registered with `document.modelContext.registerTool` (falling back to `navigator.modelContext`), each with an `AbortSignal`, a closed schema (`additionalProperties: false`), and Chrome's `readOnlyHint` / `untrustedContentHint` annotations.

| Tool | Purpose | Authority |
| --- | --- | --- |
| `get_live_clinical_trial` | Retrieve a current ClinicalTrials.gov record | Read-only; source text is untrusted |
| `get_live_pubmed_article` | Retrieve a current PubMed abstract | Read-only; source text is untrusted |
| `get_audit_state` | Read stable outcome IDs, proposals, decisions, and events | Read-only; source text is untrusted |
| `get_evidence_spans` | Read exact quotes and source locators | Read-only; source text is untrusted |
| `propose_outcome_mapping` | Stage one evidence-backed mapping or non-match | Agent may stage, never decide |
| `request_human_review` | Focus a proposal in the visible UI | Agent may request attention |
| `export_review_receipt` | Export reviewed decisions and their audit trail | Registered only after a human decision; removed on undo |

Schemas bind outcome and evidence IDs to the loaded case; enum lists are emitted only for ID lists of 20 or fewer, and runtime validation stays authoritative either way. There is deliberately no agent-callable accept or reject.

## Load a real trial

A real ClinicalTrials.gov/PubMed pair can become the reviewable case from either side:

- **Agent side** — the agent calls `get_live_clinical_trial` and `get_live_pubmed_article`; the records land in the intake cards; a human clicks **Review this pair**.
- **Human side** — one-click curated pairs (ACTT-1 `NCT04280705` / PMID `32445440`; Pfizer BNT162b2 `NCT04368728` / `33301246`; RECOVERY dexamethasone `NCT04381936` / `32678530`), or type any NCT + PMID into the **Load a real trial** form.

After promotion, `get_evidence_spans` and `propose_outcome_mapping` re-register bound to the real identifiers, `get_audit_state` reports `activeCase: "live"`, and the receipt reports `generatedFrom: "live_sources"` with source URLs. Publication entries are PubMed abstract sections and are labelled as such — never presented as extracted outcomes. Switching cases is refused while accepted or rejected decisions exist; staged proposals are discarded with a visible notice. The fictional Cardioluma case remains the default so the loop always runs, even offline.

## Benchmark

A separate reproducible run tests the source layer and model grounding on **24 real NCT/PMID pairs** (12 primary-outcome-change, 12 no-change, labels from eTable 4 of Chen et al.). All **48/48** live reads through the page's own WebMCP tools returned the requested record with a canonical URL and non-empty evidence: **172 outcomes** and **106 abstract sections**. Two local models then received the exact returned evidence, blinded to the labels, and failed in opposite directions: **`qwen3:4b`** called every one of its 10 decided no-change cases a change, while **`ornith-1.5:9b`** missed 10 of its 11 decided change cases. Neither attempted to accept or reject anything. These are run-specific, abstract-only grounding results, not clinical validation — and the opposite biases are the argument for keeping the decision human. Manifest, runner, scorer, and raw outputs are in [`benchmarks/`](benchmarks/).

## Run locally

Requires Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in a WebMCP-capable browser. Browsers without `document.modelContext` or `navigator.modelContext` show **WebMCP preview** and keep the complete manual review workflow.

Live source routes, used by both the tools and the human loader:

```text
GET /api/clinical-trials/NCT01234567
GET /api/pubmed/12345678
```

Identifiers are validated before interpolation; responses use a stable `{ ok, data }` / `{ ok, error }` envelope; upstream bodies and stack traces are never forwarded to the browser.

## Verify

```bash
npm run check          # WebMCP conformance, submission packet, ESLint, 54 tests, TypeScript, production build
npm run smoke:webmcp   # headless Chrome 152+ drives the page's own tools through the whole loop
```

`npm run smoke:webmcp` is a dependency-free DevTools-protocol script. It launches Google Chrome headless with `--enable-features=WebMCPTesting` and calls `document.modelContext.getTools()` / `executeTool()` on the real page: 6 tools → both live reads → human promotion via a DOM click → `get_audit_state` → `get_evidence_spans` → `propose_outcome_mapping` → `request_human_review` → DOM **Accept** → 7 tools → `export_review_receipt` with `generatedFrom: "live_sources"` → **Undo** → 6 tools. It passed against the local production build and against https://protocol-mirror.vercel.app on Sep 1, 2026 with Google Chrome 152.0.7977.65. Chromium's in-page `executeTool` passes tool input as JSON strings, so every executor accepts both objects and JSON strings.

Verification records: [`docs/BROWSER_VERIFICATION.md`](docs/BROWSER_VERIFICATION.md) (Chrome 152 smoke of the real-pair loop, plus the Codex in-app browser run of the earlier flow on Aug 30-31), [`docs/WEBMCP_CONFORMANCE.md`](docs/WEBMCP_CONFORMANCE.md), [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md), and [`docs/RELEASE_RUNBOOK.md`](docs/RELEASE_RUNBOOK.md) for the release and media procedure.

## Limitations

- The default bundled case is a fictional trial; it is implementation evidence, not accuracy evidence.
- PubMed gives abstract sections, not a canonical outcome schema, so the publication column shows sections and says so.
- The benchmark is abstract-only, model-, prompt- and run-specific; it is not clinical validation.
- Audit state is in-session only: not persisted, not signed.
- No authentication; do not use with protected health information.
- The new real-pair loop is verified in Google Chrome 152 with the WebMCP flag; the Codex/ChatGPT in-app browser verification on Aug 30-31 covered the earlier flow (fictional case, 6→7 tools, live intake cards).

## Architecture

```text
Human reviewer ───────┐
                     ▼
                Shared workspace
                     ▲
WebMCP agent ─ tools ┘
        │      read → evidence and audit state
        │      write → staged proposals only
        └──────────── human accept/reject boundary

ClinicalTrials.gov ─┐
                    ├─ validated server adapters ─ normalized source records
PubMed E-utilities ─┘
```

Contracts in `src/lib/contracts.ts`; the fictional case in `src/lib/demo-data.ts`; live-pair construction in `src/lib/live-pair.ts`; pair-bound tool definitions in `src/lib/case-tools.ts`; live source tools in `src/lib/webmcp-tools.ts`; server-side parsing in `src/lib/source-adapters.ts`; registration and reviewer UI in `src/app/workspace.tsx`. Coding agents should start at [`.agent/README.md`](.agent/README.md).

## License

MIT. See [LICENSE](LICENSE).
