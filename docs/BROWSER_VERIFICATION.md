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
