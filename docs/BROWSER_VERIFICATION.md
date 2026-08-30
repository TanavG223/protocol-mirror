# WebMCP browser verification

Verified on 2026-08-30 in the Codex desktop in-app browser against a local production build at `http://localhost:3001`. This is a release rehearsal, not evidence of a permanent public deployment.

## Initial capability surface

The browser exposed four tools before any human decision:

1. `get_audit_state`
2. `get_evidence_spans`
3. `propose_outcome_mapping`
4. `request_human_review`

The reported schemas included bounded identifiers and arrays, per-property descriptions, `additionalProperties: false`, and read-only/untrusted-content annotations on the read tools.

## Exercised workflow

- `get_audit_state` returned the deterministic pair, stable outcome IDs, and an empty mapping list.
- `get_evidence_spans` returned exact registry and publication quotes with stable locators.
- `propose_outcome_mapping` staged an `omitted` proposal. An immediate `get_audit_state` call observed the new mapping and its subject-linked audit event, confirming the UI state was committed before the first tool returned.
- `request_human_review` selected the mapping, moved actual keyboard focus to the `review-dock` region labelled by `review-title`, and scrolled the checkpoint into view.
- A human click on **Accept** dynamically exposed `export_review_receipt` as the fifth tool.
- The exported receipt contained the accepted mapping and its pair/stage/accept events. No staged mapping was present.

## Fail-closed checks

- An `omitted` proposal that supplied both registry and publication outcomes was rejected with the category-shape error and did not change mapping or history counts.
- A duplicate evidence-ID request was rejected rather than silently normalized.
- Two rapid activations of **Stage guided review** produced exactly four unique demo mappings and one logical demo load, not duplicate proposals.

## Production and responsive checks

- The production response included a Content Security Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a restrictive Permissions Policy, and `Referrer-Policy: strict-origin-when-cross-origin`; the framework-identifying header was absent.
- The four initial tools still registered under the production CSP, and the full stage/review/export workflow completed without browser warnings or errors.
- GSAP interface transitions remained tied to workflow state; reduced-motion users bypass the animation code path.
- At an exact 390 by 844 CSS-pixel viewport, the document width remained 390 pixels with no horizontal overflow.

This is implementation evidence, not clinical validation or measured research-integrity accuracy.
