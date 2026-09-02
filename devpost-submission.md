# Protocol Mirror

**Tagline:** Did the trial publish what it registered? Your agent pulls ClinicalTrials.gov and PubMed, quotes exact spans. You decide.

**Live app:** https://protocol-mirror.vercel.app · **Source (MIT):** https://github.com/TanavG223/protocol-mirror

## Inspiration

I have always loved medicine because it combines scientific discovery with decisions that can genuinely affect people's lives. AI is also part of how I learn, research, prototype ideas, and solve problems every day. Bringing those interests together made me ask a harder question than simply, “What can an AI agent do?” In medicine-related research, how can an agent be genuinely useful without asking people to trust a confident answer they cannot inspect?

That question became concrete when I looked at clinical trials. Registries record what researchers planned to measure; publications show what readers ultimately see. Editors, peer reviewers, and systematic reviewers may need to compare those records and their version histories by hand across multiple pages. It is slow, detail-heavy work, but handing the final judgment to a generic AI summary would only hide the uncertainty behind fluent language.

Protocol Mirror grew from the idea that AI should remove investigative friction without removing human accountability. WebMCP lets the page give an agent precise, state-aware tools to retrieve live records, trace dated registration changes, quote exact source spans, and stage an evidence-linked proposal inside the same workspace a person reviews. The agent has no accept or reject tool. Only a human decision unlocks the final reviewed-receipt capability. I wanted to build more than another chatbot that acts for the user: I wanted to explore an interface where the tools themselves reflect who should investigate, who should decide, and why.

## Why this use case is a strong fit for WebMCP

ACTT-1 registered its primary outcome on 2020-02-20: a 7-point ordinal scale at Day 15. Its NEJM report, published online 2020-10-08, presents time to recovery. The registry dated that change to a numbered version, before the paper existed.

Editors, peer reviewers and systematic reviewers check this by hand across three tabs: the registry record, its version history, the paper. In a 2019 JAMA Network Open study, Chen et al. checked 389 randomized trials sampled from PubMed and Embase (published 2011-2015, with no restriction by journal) against their registrations: 130 had changed at least one primary outcome, 66 of those omitted or never reported the registered one, and trials with a change reported effect sizes about 16% larger.

An agent working alone returns a paragraph you cannot check; a hosted backend hides the same reads behind a server. WebMCP puts the tools on the page the reviewer already has open: typed outcome IDs and exact source locators instead of screenshots, every read and proposal landing in the reviewer's own view.

## How it creates a better user experience

Nothing has to be loaded first. The page opens on ACTT-1 (`NCT04280705`) beside its NEJM report (PubMed `32445440`), with the ClinicalTrials.gov registration history already fetched.

Outcome switching is a claim about what was registered *first*, so the tools read the version history behind the current record. `get_registry_history` walks the public version list: ACTT-1 has 25 registration versions, and the primary outcome changed in version 9 (an 8-point scale), version 14 (time to recovery, which is what the publication presents as primary) and version 24 (subgroup entries added). Two of the three changes predate the paper's electronic publication, and the page says so. The originally registered outcome sits first in the registry column with a `history/0.` locator, so a proposal can cite what was promised. Retype the trial ID in the URL and the page rebuilds around that pair.

The agent quotes both spans verbatim with their locators, then stages a proposal, matched, omitted, introduced, or uncertain, with rationale, evidence IDs and a confidence. You read it beside the quotes and decide. A session log records every tool call and human decision as it happens; an eight-chip roster shows which capability is live.

## What people and agents can do together that was hard before

The agent runs the whole investigation and stops where authority begins. It cannot cite an ID outside the loaded case, and cannot export until a human has decided. It cannot accept or reject: no such tool is registered.

Accept or reject one proposal and `export_review_receipt` is registered, so the agent can package the reviewed decisions with their exact locators and source URLs; undo, and the tool is unregistered. Rejection carries information too: the reviewer picks a reason or types a note, and both reach the agent through `get_audit_state` as `reviewerFeedback` and `reviewerNotes`, so it can revise and re-propose. The agent proposes and the human decides. That holds because the page registers no accept tool, and the decision is what registers the next one.

## How WebMCP was implemented

Eight tools are registered with `document.modelContext.registerTool` (with a `navigator.modelContext` fallback) in three registration effects: pair-independent tools (`get_live_clinical_trial`, `get_live_pubmed_article`, `get_registry_history`, `get_audit_state`, `request_human_review`); pair-bound tools (`get_evidence_spans`, `propose_outcome_mapping`) that re-register whenever the case changes; and the gated `export_review_receipt`, registered only while reviewed work exists.

`get_registry_history` is read-only and untrusted-content annotated, backed by a bounded server route that validates the identifier, caps the version list, and fetches at most nine registration versions (the original plus eight), comparing primary outcome measures only. Every registration carries an `AbortSignal` that effect cleanup aborts; every schema is a closed object with `additionalProperties: false`, bounded strings and enum-bound IDs. Read tools declare `readOnlyHint` and `untrustedContentHint`; staging and focus tools claim neither. A conformance script enforces the annotations, the abort signals, the same-origin default and Chrome's metadata budgets in CI.

## Benchmark

On 24 real NCT/PMID pairs (12 primary-outcome-change, 12 no-change, labels from Chen et al.'s published supplement), 48/48 live reads through the page's own WebMCP tools returned the requested record with a canonical URL and non-empty evidence: 172 outcomes and 106 abstract sections. Two local models then got the exact returned evidence, blinded to the labels, and failed in opposite directions. qwen3:4b called every one of its 10 decided no-change cases a change. ornith-1.5:9b missed 10 of its 11 decided change cases. Neither ever tried to accept or reject. These are run-specific, abstract-only grounding results, not clinical validation, and the opposite biases are the argument for the human click.

## Testing instructions

No login, API key, flag, or paid service. Open https://protocol-mirror.vercel.app in Chrome 149 or newer (the live origin serves a Chrome WebMCP origin-trial token, verified in Chrome 152 with no flag on 2026-09-02; a local build still needs `chrome://flags/#enable-webmcp-testing`), or the ChatGPT/Codex in-app browser with site tools enabled. The header should read **WebMCP connected · 7 tools**. Nothing has to be loaded first: the page opens on ACTT-1 `NCT04280705` / PMID `32445440` with its registration history already fetched. If the header reads **WebMCP preview**, skip the pasted prompts; steps 4-6 are ordinary clicks.

1. Paste: *Call get_audit_state and summarize registryHistory: how many registration versions, and when did the primary outcome change?* It reports 25 versions and the change from a 7-point ordinal scale to time to recovery.
2. Paste: *Call get_evidence_spans for ev-registry-original-primary-1 and for the evidence ID of the RESULTS abstract section, and quote both spans with their locators.*
3. Paste: *Call propose_outcome_mapping for those two outcome IDs with a discrepancy of uncertain, both evidence IDs, a rationale and a confidence, then call request_human_review with the returned mappingId.*
4. Ask the agent to accept it. It has no such tool. Click **Accept** yourself; the header moves to **8 tools**.
5. Paste: *Call export_review_receipt and list its mappings, locators and audit events.* It reports `generatedFrom: "live_sources"` and cites the `history/0.` original-registration locator. Click **Undo last decision**; the receipt tool is unregistered and the header returns to 7 tools.
6. Click **Reject** on a proposal and pick a reason, or send a line through **Note to the agent**. Paste: *Call get_audit_state and read reviewerFeedback and reviewerNotes.* Your words come back to the agent, which can revise and re-propose.

Locally: `npm ci && npm run check` runs the WebMCP conformance gate, ESLint, 75 tests, TypeScript and the production build. `npm run smoke:webmcp` drives the whole loop above through `document.modelContext.getTools()` / `executeTool()` in headless Google Chrome with `--enable-features=WebMCPTesting`; it passed against a local production build and against https://protocol-mirror.vercel.app on Sep 2, 2026 with Chrome 152.0.7977.65.

## Verified compatibility

The real-pair loop with registration history is verified in Google Chrome 152 with the WebMCP flag by the headless smoke script, and in the Codex/ChatGPT desktop in-app browser with site tools enabled. On 2026-09-02 the Codex/ChatGPT desktop in-app browser (site tools enabled) ran this loop end to end: the real ACTT-1 case loaded automatically, the registration history showed 25 versions with the three dated changes, the tool count went from seven to eight after a human decision, the rejection reason reached the agent, the agent revised and re-proposed, the receipt carried live-source provenance with a `history/0…` locator, and the case survived a reload. The in-app browser had earlier (2026-08-30 and 08-31) verified the previous flow on the fictional case. No other agent client has been tested.

## Demo video

The demo video linked in this submission's Video field is 2:08 (127.90 seconds), 1920×1080 H.264 at 60 fps, with locally generated Kokoro-82M narration (Apache-2.0 model card; provenance in `docs/demo/KOKORO_NARRATION_PROVENANCE.md`); the same master is in the repository at `docs/demo/protocol-mirror-submission-demo.mp4` (Git LFS).

## Screenshots

1. `docs/screenshots/01-hero.jpg`: the question, the connected WebMCP state, the tool roster
2. `docs/screenshots/02-comparison.jpg`: registered and reported columns side by side
3. `docs/screenshots/03-review-queue.jpg`: staged proposals and the human-only checkpoint
4. `docs/screenshots/04-evidence-drawer.jpg`: rationale beside exact quotations and locators
5. `docs/screenshots/05-mobile.jpg`: 390×844 layout without horizontal overflow
6. `docs/screenshots/06-agent-reviewed.png`: the unlocked export state after a human decision
7. `docs/screenshots/07-real-world-benchmark.png`: the 24-pair stress-test panel
8. `docs/screenshots/08-session-log.png`: the session log and the tool roster with the receipt tool unlocked

## Known limitations

- The default case is a real trial fetched live from public APIs; the bundled fictional trial is the teaching fallback and offline path, and is implementation evidence, not accuracy evidence.
- Registration history compares primary outcome measures only. Histories with more than six Outcome Measures versions are sampled (original, newest, and a bisection to date the first change); the response says which versions were compared and whether each change date is exact. A change is a registry fact, not a judgment; it may be legitimate and pre-specified elsewhere.
- PubMed returns abstract sections, not a canonical outcome schema, so the publication column shows sections and labels them as such.
- The benchmark is abstract-only and specific to the named models, prompt and run; it is not clinical validation.
- Audit state is kept in the tab's `sessionStorage`: per tab, not persisted, not signed, and never sent anywhere.
- No authentication; the app must not be used with protected health information.
- Compatibility is claimed only for the browsers listed under **Verified compatibility**.

Protocol Mirror is a research transparency aid. It is not medical advice, a clinical decision system, or a finding of research misconduct.
```

---
