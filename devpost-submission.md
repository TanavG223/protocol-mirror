# Protocol Mirror

**Tagline:** Did the trial publish what it registered? Your agent pulls ClinicalTrials.gov and PubMed, quotes exact spans. You decide.

**Live app:** https://protocol-mirror.vercel.app · **Source (MIT):** https://github.com/TanavG223/protocol-mirror

## Why this use case is a strong fit for WebMCP

Clinical trials register the outcomes they promise to measure, then publish years later. In a 2019 JAMA Network Open study, Chen et al. checked 389 randomized trials sampled from PubMed and Embase — published 2011-2015, with no restriction by journal — against their registrations: 130 had changed at least one primary outcome, 66 of those omitted or never reported the registered one, and trials with a change reported effect sizes about 16% larger. Journal editors, peer reviewers and systematic reviewers do this check by hand, in two tabs, copying quotes.

An agent alone cannot be trusted with it: scrape both documents and it hands back a confident paragraph you cannot check. A hosted backend is no better — the reviewer never sees what was read. WebMCP is the fit because the tools live on the page the reviewer is already looking at. The agent gets typed outcome IDs and exact locators instead of screenshots, and every read, quote and proposal lands in the reviewer's own view.

## How it creates a better user experience

Before: two browser tabs, a spreadsheet, and hand-copied quotes, with no record of what was compared. In Protocol Mirror you paste one line, and the agent pulls ClinicalTrials.gov `NCT04280705` and PubMed `32445440` into intake cards you can see. You click **Review this pair** and the real trial becomes the case. The agent then quotes the registered outcome and the abstract section verbatim, each with its source locator, and stages a proposal — matched, omitted, introduced, or uncertain — with rationale, cited evidence IDs and a confidence.

You read the rationale beside both quotes and decide. A session log lists every tool call and every human decision as it happens, and a seven-chip tool roster shows exactly which capability is available right now. Nothing enters the exported receipt that a person did not accept.

## What people and agents can do together that was hard before

The agent does the whole investigation and stops precisely where authority begins. It cannot cite an ID that is not in the loaded case, cannot accept or reject — no such tool is registered, so ask it and it will tell you it has none — and cannot export anything until a human has decided.

That last part is the collaboration: the human's click is not just a UI event, it registers a new tool. Accept or reject one proposal and `export_review_receipt` appears; the agent can now package the reviewed decisions with their exact locators and source URLs. Undo the decision and the tool is unregistered. The agent's capability surface is grown and revoked by human review, on a real registry-to-publication pair, in the page both parties share.

## How WebMCP was implemented

Seven tools are registered with `document.modelContext.registerTool` (with a `navigator.modelContext` fallback) in three registration effects: pair-independent tools (`get_live_clinical_trial`, `get_live_pubmed_article`, `get_audit_state`, `request_human_review`); pair-bound tools (`get_evidence_spans`, `propose_outcome_mapping`) that re-register against the new identifiers whenever the case changes; and the gated `export_review_receipt`, registered only while reviewed work exists.

Every registration carries an `AbortSignal` that effect cleanup aborts; every schema is a closed object with `additionalProperties: false`, bounded strings and enum-bound IDs — emitted as enums only for ID lists of 20 or fewer, with runtime validation authoritative either way. Read tools declare `readOnlyHint` and `untrustedContentHint`; staging and focus tools do not claim to be read-only. `propose_outcome_mapping` re-checks category shape and evidence linkage at execute time. A conformance script enforces the annotations, the abort signals, the same-origin default and Chrome's metadata budgets in CI.

## Benchmark

On 24 real NCT/PMID pairs (12 primary-outcome-change, 12 no-change, labels from Chen et al.'s published supplement), 48/48 live reads through the page's own WebMCP tools returned the requested record with a canonical URL and non-empty evidence: 172 outcomes and 106 abstract sections. Two local models then got the exact returned evidence, blinded to the labels, and failed in opposite directions: qwen3:4b called every one of its 10 decided no-change cases a change, while ornith-1.5:9b missed 10 of its 11 decided change cases. Neither ever tried to accept or reject. Run-specific, abstract-only grounding results, not clinical validation — and the opposite biases are the argument for the human click.

## Testing instructions

No login, API key, or paid service. Open https://protocol-mirror.vercel.app in the ChatGPT/Codex in-app browser with site tools enabled, or Chrome 152+ with `chrome://flags/#enable-webmcp-testing`. The header should read **WebMCP connected · 6 tools**; if it reads **WebMCP preview**, click a curated pair chip in **Load a real trial** (or **Load 4 example proposals**) and do steps 4-6 by hand.

1. Paste: *Call get_live_clinical_trial with nctId NCT04280705, then get_live_pubmed_article with pmid 32445440.* Both records appear in the intake cards; click **Review this pair**.
2. Paste: *Call get_audit_state, then call get_evidence_spans for two evidence IDs it returned and quote both spans with their locators.*
3. Paste: *Call propose_outcome_mapping for those two IDs with a discrepancy of uncertain, both evidence IDs, a rationale and a confidence, then call request_human_review with the returned mappingId.*
4. Ask the agent to accept it — it has no such tool. Click **Accept** yourself.
5. The header reads **7 tools**. Paste: *Call export_review_receipt and list its mappings, locators and audit events.* It reports `generatedFrom: "live_sources"`.
6. Click **Undo last decision**; the receipt tool is unregistered and the header returns to 6 tools.

Locally: `npm ci && npm run check` runs the WebMCP conformance gate, ESLint, 54 tests, TypeScript and the production build. `npm run smoke:webmcp` drives the whole loop above through `document.modelContext.getTools()` / `executeTool()` in headless Google Chrome with `--enable-features=WebMCPTesting`; it passed against the live URL on Sep 1, 2026 with Chrome 152.0.7977.65.

## Verified compatibility

The real-pair loop is verified in Google Chrome 152 with the WebMCP flag by the headless smoke script. The Codex/ChatGPT in-app browser was verified on 2026-08-30 and 08-31 against the earlier flow — six initial tools, both live reads rendered in the page, agent-staged proposal, human accept, seventh tool, receipt — on the fictional case; that browser has not yet been run against the new real-pair loop.

## Demo video

The prepared local candidate is `docs/demo/protocol-mirror-submission-demo.mp4`: 113.30 seconds, 1920×1080 H.264 at constant 60 fps, with locally generated Kokoro-82M narration (Apache-2.0 model card; provenance in `docs/demo/KOKORO_NARRATION_PROVENANCE.md`). It is a narrated slideshow and is the fallback; a screen recording of the live loop is preferred. The project owner must still watch and approve the complete master with sound, and the final public YouTube URL remains pending. Paste-ready title, description and chapters are in `docs/YOUTUBE_METADATA.md`.

## Screenshots

1. `docs/screenshots/01-hero.jpg` — the question, the connected WebMCP state, the tool roster
2. `docs/screenshots/02-comparison.jpg` — registered and reported columns side by side
3. `docs/screenshots/03-review-queue.jpg` — staged proposals and the human-only checkpoint
4. `docs/screenshots/04-evidence-drawer.jpg` — rationale beside exact quotations and locators
5. `docs/screenshots/05-mobile.jpg` — 390×844 layout without horizontal overflow
6. `docs/screenshots/06-agent-reviewed.png` — the seven-tool state after a human decision
7. `docs/screenshots/07-real-world-benchmark.png` — the 24-pair stress-test panel
8. `docs/screenshots/08-session-log.png` — the session log and the tool roster with the receipt tool unlocked

## Known limitations

- The default bundled case is a fictional trial; it is implementation evidence, not accuracy evidence.
- PubMed returns abstract sections, not a canonical outcome schema, so the publication column shows sections and labels them as such.
- The benchmark is abstract-only and specific to the named models, prompt and run; it is not clinical validation.
- Audit state is in-session only: not persisted, not signed.
- No authentication; the app must not be used with protected health information.
- Compatibility is claimed only for the browsers listed under **Verified compatibility**.

Protocol Mirror is a research transparency aid. It is not medical advice, a clinical decision system, or a finding of research misconduct.

## Owner-completed form fields

The authenticated Devpost form field map, the answers that require the owner's personal choice, and the remaining external gates are in [`docs/SUBMISSION_HANDOFF.md`](docs/SUBMISSION_HANDOFF.md). The official Devpost pages and rules prevail if any requirement changes.
