# WebMCP browser verification

Verified on 2026-08-30 in the Codex desktop in-app browser against both a local production build at `http://127.0.0.1:4173` and the permanent public deployment at `https://protocol-mirror.vercel.app`.

## Initial capability surface

The browser exposed six tools before any human decision:

1. `get_live_clinical_trial`
2. `get_live_pubmed_article`
3. `get_audit_state`
4. `get_evidence_spans`
5. `propose_outcome_mapping`
6. `request_human_review`

The reported schemas included bounded identifiers and arrays, per-property descriptions, `additionalProperties: false`, and read-only/untrusted-content annotations on the read tools.

## Exercised workflow

- `get_audit_state` returned the deterministic pair, stable outcome IDs, and an empty mapping list.
- `get_evidence_spans` returned exact registry and publication quotes with stable locators.
- `get_live_clinical_trial` retrieved current normalized outcomes for `NCT04280705` from ClinicalTrials.gov through the deployed application contract.
- `get_live_pubmed_article` retrieved the structured abstract for PubMed `32445440`; the returned record retained the explicit limitation that abstract sections are not a canonical clinical-outcome schema.
- `propose_outcome_mapping` staged an `omitted` proposal. An immediate `get_audit_state` call observed the new mapping and its subject-linked audit event, confirming the UI state was committed before the first tool returned.
- `request_human_review` selected the mapping, moved actual keyboard focus to the `review-dock` region labelled by `review-title`, and scrolled the checkpoint into view.
- A human click on **Accept** dynamically exposed `export_review_receipt` as the seventh tool.
- The exported receipt contained the accepted mapping, its exact cited evidence span and locator, and its pair/stage/accept events. No staged mapping or unused evidence was present.

## Fail-closed checks

- An `omitted` proposal that supplied both registry and publication outcomes was rejected with the category-shape error and did not change mapping or history counts.
- A duplicate evidence-ID request was rejected rather than silently normalized.
- Two rapid activations of **Stage guided review** produced exactly four unique demo mappings and one logical demo load, not duplicate proposals.

## Production and responsive checks

- The production response included a Content Security Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a restrictive Permissions Policy, and `Referrer-Policy: strict-origin-when-cross-origin`; the framework-identifying header was absent.
- The six initial tools still registered under the production CSP, and both live reads plus the full stage/review/export workflow completed without browser warnings or errors.
- GSAP interface transitions remained tied to workflow state; reduced-motion users bypass the animation code path.
- At an exact 390 by 844 CSS-pixel viewport, the document width remained 390 pixels with no horizontal overflow.

This is implementation evidence, not clinical validation or measured research-integrity accuracy.

## Permanent deployment closure

The public Vercel deployment built commit `ebead5b72027cbc6f36bbd0e2ed6aa5fa9f6eb70` and loaded without authentication. The Codex in-app browser reported the expected six-tool initial surface at the HTTPS origin. Through those public tools it retrieved `NCT04280705` (43 normalized outcomes) and PubMed `32445440` (four structured abstract sections), staged and focused an evidence-linked uncertain mapping, and preserved the `human_reviewer_only` focus response. A human click accepted the proposal; the header changed to seven tools, and `export_review_receipt` returned one reviewed mapping, the two exact cited locators, and the pair/stage/accept audit events.

## Evidence-bound UI regression pass

After the final visual and interaction refinement, a fresh local Codex in-app-browser pass verified:

- Any registered or reported outcome can expose its exact source span before a mapping exists.
- Staging the guided case produced four proposals. Only the active proposal's uniquely named **Accept** and **Reject** controls were enabled; selecting another proposal moved that authority to the newly displayed evidence.
- Accepting a proposal announced the exact decision, moved focus to the stable review region, selected the next proposal for inspection, changed the capability surface from six tools to seven, and exported a reviewed-only receipt. Undo restored the proposal, selected it, announced the reversal, and removed the receipt tool when no reviewed work remained.
- A full WebMCP run read audit state and evidence, rejected duplicate evidence IDs, staged and focused an uncertain mapping, accepted it through the human UI, and exported the exact accepted mapping, two locators, and pair/stage/accept events.
- The live adapters returned current records for ClinicalTrials.gov `NCT03619213` and PubMed `33915143` through the local application contract.
- Exact 375, 768, 1024, and 1440 CSS-pixel widths had no horizontal document overflow. The 375-pixel layout kept the central hook and human action in the first viewport; the tablet layout exposed a mapping-centric relationship summary.
- Reduced-motion emulation reported a readable final state (`transform: none`, `opacity: 1`), automatic scrolling, and effectively disabled transitions. The skip link measured 44 pixels high and its keyboard focus outline was an opaque 3-pixel dark blue.
- No browser console warnings or errors appeared during these checks.

The same release candidate was then observed at the permanent HTTPS URL after Vercel built commit `fde24fa710a6f7a7ac8e2de194a83acf3e3c8540`. The public page exposed direct pre-mapping evidence inspection, rejected duplicate evidence IDs, staged and focused an omitted proposal, kept the human decision controls evidence-bound, and returned focus to the review region after the human click. The header and hero gate changed from six tools to seven, and the public `export_review_receipt` result contained exactly the accepted mapping, its cited locator, and the pair/stage/accept events. Both public live adapters also returned records, and the console remained free of warnings and errors.

## Final public pre-video rehearsal

Before producing the edited demo on 2026-08-30, the permanent deployment at commit `6421e984a9ebc1e28fac4061f9a9151b4720d2d8` was visibly exercised again in the Codex in-app browser:

- Six initial tools registered and `get_audit_state` returned zero mappings.
- Direct outcome selection exposed source evidence before any proposal existed.
- `NCT04280705` returned 43 normalized ClinicalTrials.gov outcomes and PubMed `32445440` returned four structured abstract sections.
- URL-shaped and path-traversal-shaped source identifiers were rejected before upstream access.
- Duplicate mapping and unrelated-evidence proposals were rejected without changing the review state.
- An uncertain two-span proposal was staged and focused with `decisionAuthority: human_reviewer_only`; no agent accept or reject tool existed.
- A human click accepted the active proposal, moved focus to the stable review region, announced the exact result, and changed the capability surface from six tools to seven.
- The receipt contained one accepted mapping, both cited locators, and only pair/stage/accept events; staged work was absent.
- Undo restored the proposal and removed the receipt tool, returning the surface to six tools.
- A 390 by 844 viewport had a 390-pixel document width with no horizontal overflow, and no browser warnings or errors were recorded.

After commit `fc3fb52ef4b6d8b34d1ed62d9fb8cb99568eb336` passed GitHub CI and completed its Vercel production deployment, the permanent URL was reloaded and the release-specific authority path was repeated. The page registered six tools with no console errors, displayed the explicit **Fictional demonstration span** provenance label, staged and focused a two-span proposal, accepted it only through the human UI, exposed the seventh receipt tool, exported exactly one accepted mapping with both locators and no staged work, then removed the receipt tool and returned to six tools after undo.

## Final public submission-day walkthrough

On 2026-08-31, the permanent deployment was exercised again from a clean Codex in-app-browser tab before handoff to the participant:

- The initial page visibly reported six WebMCP tools, an empty review queue, the deterministic fictional-case label, and the human-authority workflow.
- The live adapters returned ClinicalTrials.gov `NCT04280705` with 43 normalized outcomes and PubMed `32445440` with four abstract sections.
- URL-shaped and path-traversal-shaped identifiers were rejected by the bounded input contracts.
- An unrelated-evidence proposal and a duplicate valid proposal were both rejected without corrupting the staged state.
- A valid uncertain proposal cited the registry locator `OutcomesModule.primaryOutcomes[0]` and publication locator `Results · paragraph 2`. `request_human_review` returned `decisionAuthority: human_reviewer_only`, and an attempted agent-side `accept_mapping` call failed because no such tool was available.
- Clicking the visible human **Accept** control changed the capability surface from six tools to seven. The reviewed receipt contained exactly the accepted mapping, both cited evidence spans, and the pair/stage/accept trail.
- Clicking **Undo last decision** returned the proposal to the queue, removed `export_review_receipt`, and restored the six-tool capability surface.
- At 390 by 844 CSS pixels, both the document and body remained 390 pixels wide with no horizontal overflow. The console log was empty throughout the walkthrough.
- A fresh reload followed by **Stage guided review** left all four representative proposal categories open in the browser for hands-on inspection and human decision-making.

These checks cover the documented critical and failure flows; they do not prove the absence of every possible defect or establish clinical validity.

## Local production judge-gap closure

On 2026-08-31, the post-research release candidate was built and exercised at `http://localhost:4175` in a fresh Codex in-app-browser tab. This is local-candidate evidence, not a claim about the current public deployment.

- The initial page registered six tools.
- Calling `get_live_clinical_trial` with `NCT04280705` rendered the ACTT trial title, identifier, outcome count, sponsor, representative outcome labels, and exact ClinicalTrials.gov link in a reviewer-visible intake card.
- Calling `get_live_pubmed_article` with `32445440` rendered the article title, PMID, structured-section count, journal, representative section labels, limitation, and exact PubMed link beside the trial card.
- The page labeled both records read-only, untrusted evidence and did not add a mapping or reviewed finding automatically.
- Staging the guided review and clicking the visible human **Accept** control changed the capability surface from six tools to seven.
- A visible **Download reviewed receipt JSON** link appeared only after the human decision. Its download name was `demo-cardio-001-review-receipt.json`, and its encoded payload contained `reviewedMappings`.
- At 390 by 844 CSS pixels, the document and body widths remained 390 pixels with no horizontal overflow.
- The browser console log remained empty.
- The visible **Public source · MIT** footer link resolved to the correct GitHub repository and measured 44 pixels high at both desktop and mobile widths.

## Four-step agent collaboration regression

After the agent-role positioning was clarified on 2026-08-31, the local production candidate was reloaded and the complete workflow was repeated through real WebMCP calls rather than the guided fallback:

- Step 1: the agent called `get_audit_state` and retrieved two exact evidence spans.
- Step 2: the agent called `propose_outcome_mapping`, created `map-11`, and called `request_human_review`; the page focused the review region, showed one queued proposal, and still exposed six tools.
- Step 3: a human clicked the visible **Accept** action. No agent accept/reject capability existed.
- Step 4: the page exposed seven tools, and the agent called `export_review_receipt`. The receipt contained one accepted mapping and the `pair_loaded`, `mapping_staged`, and `mapping_accepted` event trail.
- The visible workflow read **Inspect exact spans → Stage a proposal → Human adjudicates → Agent packages proof**.
- At 390 by 844 CSS pixels, all four steps stacked without horizontal overflow. The browser recorded no warnings or errors.

## Final resilience, accessibility, and clean-tab closure

On 2026-08-31, the final local release candidate was rebuilt and verified in the Codex in-app browser after repository-wide security and accessibility review:

- A valid-but-unavailable ClinicalTrials.gov read exposed a visible reviewer error card, kept the deterministic case available, and returned the safe tool error. A later valid read for `NCT04280705` replaced the error with the live ACTT record; PubMed `32445440` rendered beside it.
- Live-source tools now surface explicit loading, success, failure, and recovery states. A successful adapter envelope without its required record fails visibly instead of leaving an indefinite loading state.
- A fresh isolated Codex tab began with six tools, zero mappings, and only `pair_loaded`. The agent retrieved two exact locators, staged `map-11`, and focused review with `decisionAuthority: human_reviewer_only`.
- The visible human **Accept** control changed the surface to seven tools. `export_review_receipt` returned only the accepted mapping, both locators, and `pair_loaded`, `mapping_staged`, and `mapping_accepted`; the reviewer UI also exposed the JSON download.
- The post-decision keyboard focus was the stable review region. A repaired skip-link activation moved focus to `workspace-title` with an opaque 3-pixel dark-blue outline.
- At 320 CSS pixels, document and body widths remained 320 pixels, all four workflow steps stacked, the hero remained three visual lines, and no visible enabled link or button measured below 44 by 44 pixels.
- At 1,440 CSS pixels, the document had one H1, six labelled regions, no unnamed interactive control, and no horizontal overflow.
- Browser debugger logging recorded zero console warnings or exceptions after a clean production reload.

The full deterministic suite contained 38 passing tests, including a new external-entity fail-closed case and visible live-source failure/recovery contracts.

## Real-world WebMCP and model-grounding closure

On 2026-08-31, a separate real-world benchmark was executed against the local candidate in the Codex in-app browser. The 24 cases were balanced across 12 primary-outcome-change and 12 no-change labels from eTable 4 of Chen et al.'s published JAMA Network Open supplement. PubMed titles were resolved in the official PubMed interface, and only publications exposing exactly one NCT identifier were included; alternate-registry, missing-ID, and ambiguous multi-NCT records were excluded.

- The page-defined `get_live_clinical_trial` and `get_live_pubmed_article` tools completed 48/48 calls.
- Every returned NCT and PMID matched the requested identifier; canonical source URLs were present and no evidence record was empty.
- The trial records contained 172 normalized outcomes, ranging from one to 23 per case. The article records contained 106 PubMed abstract sections, ranging from one to 11 per case.
- A blinded `qwen3:4b` run produced 24 valid schemas, 87.5% coverage, 52.4% selective label agreement, 86.3% exact-citation validity, and a 17.9% strict unsupported-claim rate. It called all 10 decided no-change cases changed.
- A blinded `ornith-1.5:9b` run produced 24 valid schemas, 95.8% coverage, 43.5% selective label agreement, 40.6% exact-citation validity, and a 69.0% strict unsupported-claim rate. It called 10 of 11 decided change cases no change.
- Across both runs, no output attempted to accept or reject a review and no output alleged misconduct.

The reference label never appears in the model prompt. Every model claim is scored against the exact returned locator and quote. The raw outputs, runner, scorer, manifest, and metric definitions are tracked under `benchmarks/`. These results are model-, prompt-, run-, and abstract-snapshot-specific; they are not a universal hallucination rate, a full-publication agreement result, or clinical validation.

After adding the scorer and artifact-integrity tests, the deterministic suite contains 42 passing tests.

## 2026-09-01 — headless Chrome 152 smoke of the real-pair loop

`npm run smoke:webmcp` (`scripts/webmcp-smoke.mjs`) launched Google Chrome 152.0.7977.65 headless with `--enable-features=WebMCPTesting` and drove the page's own tools through `document.modelContext.getTools()` and `document.modelContext.executeTool()` over the DevTools protocol. It PASSED against a local production build and against the public deployment at `https://protocol-mirror.vercel.app`. Every human action in the run is a real DOM click, not a tool call.

Asserted, in order:

- The page registers exactly six tools before any decision — `get_audit_state`, `get_evidence_spans`, `get_live_clinical_trial`, `get_live_pubmed_article`, `propose_outcome_mapping`, `request_human_review` — and the header badge reports **6 tools**.
- `get_live_clinical_trial` returned `NCT04280705` and `get_live_pubmed_article` returned PMID `32445440`, each with the requested identifier.
- Before promotion, `get_audit_state` still reported the demonstration case plus an intake hint; the live records do not silently become the reviewable case.
- A human DOM click on **Review this pair** promoted the real pair; the registered column rendered the trial's real primary outcome, and `get_audit_state` then reported `activeCase: "live"` with the requested NCT.
- `get_evidence_spans` returned two spans with `provenance: "live"` and their source locators, bound to the real identifiers.
- `propose_outcome_mapping` returned `staged_for_human_review`; `request_human_review` returned `decisionAuthority: "human_reviewer_only"`; `export_review_receipt` was still absent from the tool list.
- A human DOM click on **Accept** moved the badge to **7 tools** and registered `export_review_receipt`. The receipt reported `generatedFrom: "live_sources"` with exactly one reviewed mapping and its two evidence spans.
- A human DOM click on **Undo last decision** unregistered `export_review_receipt` and returned the badge to **6 tools**.

Implementation note: Chromium's in-page `executeTool()` passes tool input to the executor as a JSON string. The executors accept both objects and JSON strings, and the smoke run exercises that path.

Scope of this run: it is browser-implementation evidence for Google Chrome 152 with the WebMCP testing flag. **The Codex/ChatGPT in-app browser has not yet been run against this real-pair loop**; the Codex in-app browser sections above cover the earlier flow (fictional case, six-to-seven tools, live intake cards) on 2026-08-30 and 2026-08-31. The deterministic suite is 54 passing tests at the time of this run.

## 2026-09-02 — headless Chrome 152 smoke of the registration-history loop

`npm run smoke:webmcp` (`scripts/webmcp-smoke.mjs`) launched Google Chrome 152.0.7977.65 headless with `--enable-features=WebMCPTesting` and drove the page's own tools through `document.modelContext.getTools()` and `document.modelContext.executeTool()` over the DevTools protocol. It PASSED against a local production build of commit `6921ea1`. **The run against `https://protocol-mirror.vercel.app` is being executed separately and is not recorded here; do not claim a production pass for this loop until that record exists.** Every human action in the run is a real DOM click, not a tool call.

Asserted, in order:

- The page registers exactly 7 tools before any decision, including the new `get_registry_history`, and the header badge reports **7 tools**.
- The page opens on a real trial without any human action: ACTT-1 `NCT04280705` with its ClinicalTrials.gov registration history, and the originally registered primary outcome listed first in the registry column.
- A human DOM click on **Return to demonstration case** returns to the fictional teaching case.
- The agent fetched the trial (`get_live_clinical_trial`), the publication (`get_live_pubmed_article`) and the registration history (`get_registry_history`), which reported the version in which the primary outcome first changed, with its "from" and "to" measures.
- A human DOM click on **Review this pair** promoted the real pair; both the original primary outcome (7-point ordinal scale) and the current one (time to recovery) rendered in the registry column.
- `get_audit_state` reported `activeCase: "live"` with the requested NCT and its `registryHistory`; `get_evidence_spans` returned two live spans — the original primary outcome and the publication's RESULTS abstract section — with their locators.
- `propose_outcome_mapping` returned `staged_for_human_review`; `request_human_review` returned `decisionAuthority: "human_reviewer_only"`; `export_review_receipt` was still absent from the tool list.
- A human DOM click on **Accept** moved the badge to **8 tools** and registered `export_review_receipt`. The receipt reported `generatedFrom: "live_sources"` with exactly one reviewed mapping and its two evidence spans, one of which cites a `history/0.` original-registration locator.
- A human DOM click on **Undo last decision** unregistered `export_review_receipt` and returned the badge to **7 tools**.
- A human rejection with a selected reason came back to the agent through `get_audit_state.reviewerFeedback`.
- A human **Note to the agent** came back through `get_audit_state.reviewerNotes`.
- A page reload restored the live case, the staged proposal and the reviewer note from the tab's `sessionStorage`; **Clear session** reset the workspace to the empty demonstration case.
- A `?nct=&pmid=` deep link loaded the requested pair.

Implementation note: Chromium's in-page `executeTool()` passes tool input to the executor as a JSON string. The executors accept both objects and JSON strings, and the smoke run exercises that path.

Scope of this run: it is browser-implementation evidence for Google Chrome 152 with the WebMCP testing flag against a local production build. **The Codex/ChatGPT in-app browser has not been run against this registration-history loop**; the Codex in-app browser sections above cover the earlier flow on 2026-08-30 and 2026-08-31. The deterministic suite was 62 passing tests at the time of this run.

## 2026-09-02 — the same smoke against the public deployment (commit d77e447)

`node scripts/webmcp-smoke.mjs --url=https://protocol-mirror.vercel.app` ran the assertion list above, unchanged, against the Vercel deployment of commit `d77e447` in Google Chrome 152.0.7977.65 headless with `--enable-features=WebMCPTesting`, and printed `WEBMCP_SMOKE=PASS`. In the same session `GET https://protocol-mirror.vercel.app/api/clinical-trials/NCT04368728/history` returned 200 in 1.1 s (53 versions; 5 compared; first primary-outcome change exact at version 6, 2020-07-15), and Lighthouse desktop reported performance 100, accessibility 100, best practices 100, SEO 100. The deterministic suite was 70 passing tests at the time of this run. The Codex/ChatGPT in-app browser has still not been run against this loop.

## 2026-09-02 — round four on the public deployment (commit 7a9d6a7)

Same smoke, same Chrome build, against the Vercel deployment of `7a9d6a7`: `WEBMCP_SMOKE=PASS`. The deployment was confirmed by `GET /api/clinical-trials/NCT00347321/history` reporting `primaryOutcomeChanged: false` with a `timeFrameEdits` array (the previous build counted a time-frame-only edit as a change). Lighthouse desktop: performance 100, accessibility 100, best practices 100, SEO 100. Deterministic suite: 75 passing tests.

## 2026-09-02 — Codex/ChatGPT desktop in-app browser, registration-history loop (reported by Codex)

Run by the Codex session in the ChatGPT desktop app with WebMCP site tools enabled, against https://protocol-mirror.vercel.app at commit `7253b83`, and reported to the project owner in writing. Observed: the real ACTT-1 case loaded automatically; the registration history showed 25 versions and the three dated primary-outcome changes; the tool count went from seven to eight after a human decision; the rejection reason reached the agent through `get_audit_state`; the agent revised and re-proposed; the receipt contained live-source provenance and the `history/0…` locator; the case, proposals and note survived a reload. Two observations from that run: (1) production logged React error 418 at that commit, traced to an empty-string text node in the origin-trial slot and fixed in `62effa1` (headless Chrome then reported zero console errors on `/` and `/?demo`); (2) after reject → revise → accept there are two reviewed decisions, so two Undo clicks are needed to return from eight tools to seven, which is the intended lifecycle. This record is second-hand from Codex's report; the headless Chrome runs above are first-hand.

## 2026-09-02 — final application commit on the public deployment (74622c3)

After the UI passes (`eed1d5d`, `24b0266`, `74622c3`: responsive layout at 390 to 1280 px, CSS-first entrance motion, the on-page "Ask your agent" prompt panel), `node scripts/webmcp-smoke.mjs --url=https://protocol-mirror.vercel.app` printed `WEBMCP_SMOKE=PASS` against the deployment of `74622c3` in Google Chrome 152.0.7977.65 headless with `--enable-features=WebMCPTesting`. The smoke now also fails on any uncaught page error or `console.error`; none occurred. Lighthouse desktop on the same deployment: performance 100, accessibility 100, best practices 100, SEO 100. Headless Chrome network capture on two fresh loads: zero failed requests, zero error logs. Deterministic suite: 75 passing tests. Dates in this file are America/New_York unless marked UTC.

Note, 2026-09-02 ~01:55 ET: the CSS-only depth pass `be9210b` was verified on the local production build (smoke PASS, zero uncaught errors, Lighthouse accessibility 100) but not on the Vercel deployment, because the deployment began answering automated clients with a Vercel Security Checkpoint (HTTP 403, `x-vercel-mitigated: challenge`) after several hours of verification traffic; real browsers pass the checkpoint and reach the application. The last application commit smoke-tested against the deployment is `74622c3`.

## 2026-09-02 — origin trial: Chrome 152 with no flag (commit d8de2a8)

The owner registered https://protocol-mirror.vercel.app for the Chrome WebMCP origin trial (feature `WebMCP`, Chrome 149 to 156, expiry 2026-11-16); the token is served as `<meta http-equiv="origin-trial">` from the root layout. Verification: Google Chrome 152.0.7977.65 launched headless **without** `--enable-features=WebMCPTesting`, navigated to the live origin: `document.modelContext` present, `navigator.modelContext` absent, header badge "WebMCP connected · 7 tools" within four seconds. The desktop app's embedded browser (Chrome 148) does not expose the API, as expected below the trial's minimum version. The Vercel security checkpoint had lifted by this time (HTTP 200, no `x-vercel-mitigated` header). A single production smoke on the same deployment printed `WEBMCP_SMOKE=PASS`.
