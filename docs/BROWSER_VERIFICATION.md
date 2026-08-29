# WebMCP browser verification

Verified on 2026-08-29 in the Codex desktop in-app browser against `http://localhost:3000`.

## Initial capability surface

The browser exposed four tools before any human decision:

1. `get_audit_state`
2. `get_evidence_spans`
3. `propose_outcome_mapping`
4. `request_human_review`

The reported schemas included bounded identifiers, per-property descriptions, `additionalProperties: false`, and read-only/untrusted-content annotations on the read tools.

## Exercised workflow

- `get_audit_state` returned the deterministic pair, stable outcome IDs, and an empty mapping list.
- `get_evidence_spans` returned exact registry and publication quotes with stable locators.
- `propose_outcome_mapping` staged an `omitted` proposal. An immediate `get_audit_state` call observed the new mapping and its subject-linked audit event, confirming the UI state was committed before the first tool returned.
- `request_human_review` selected the mapping and moved actual keyboard focus to the `review-dock` region labelled by `review-title`.
- A human click on **Accept** dynamically exposed `export_review_receipt` as the fifth tool.
- The exported receipt contained the accepted mapping and its pair/stage/accept events. No staged mapping was present.

## Fail-closed checks

- An `omitted` proposal that supplied both registry and publication outcomes was rejected with the category-shape error and did not change mapping or history counts.
- Two rapid activations of **Stage guided review** produced exactly four unique demo mappings and one logical demo load, not duplicate proposals.

This is implementation evidence, not clinical validation or measured research-integrity accuracy.
