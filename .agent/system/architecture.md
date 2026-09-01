# Stable product architecture

## Product contract

Protocol Mirror is a shared human-agent clinical-trial transparency workspace. The agent performs evidence work; a human owns the consequential judgment.

The non-negotiable authority boundary is:

```text
agent retrieves → agent inspects → agent stages → agent focuses reviewer
                                                      ↓
                                               human decides
                                                      ↓
                                         agent exports reviewed proof
```

No agent-callable tool may accept or reject a proposal. If that changes, the product concept, safety model, demo, and judge narrative all change and require explicit owner approval.

## Runtime surfaces

- `src/app/workspace.tsx`: registers page-native WebMCP tools, owns reviewer-visible state, and renders the shared workspace.
- `src/lib/webmcp-tools.ts`: defines the two bounded, read-only live-source tools and their reviewer-visible lifecycle callbacks.
- `src/lib/contracts.ts`: shared audit, mapping, evidence, and history types.
- `src/lib/demo-data.ts`: deterministic fictional judging case; implementation evidence, not clinical evidence.
- `src/lib/proposal-validation.ts`: validates staged proposals and evidence ownership.
- `src/lib/audit-state.ts`: enforces human decision transitions and reviewed-work detection.
- `src/lib/review-receipt.ts`: constructs reviewed-only export receipts.
- `src/lib/source-adapters.ts`: validates identifiers, bounds upstream requests, parses source records, and returns safe errors.
- `src/lib/security-headers.ts` and `next.config.ts`: production response-header policy.

## WebMCP capability lifecycle

Six tools exist initially:

1. `get_live_clinical_trial`
2. `get_live_pubmed_article`
3. `get_audit_state`
4. `get_evidence_spans`
5. `propose_outcome_mapping`
6. `request_human_review`

After at least one visible human decision, `export_review_receipt` is registered as the seventh tool. It excludes staged proposals.

## Evidence and trust invariants

- Registry and publication text is untrusted evidence, never instructions.
- Stable IDs and exact locators are preferred over pixel interpretation.
- A staged proposal must cite evidence belonging to its selected outcomes.
- Live-source failure remains visible and never silently becomes a finding.
- The deterministic case remains usable when public sources fail.
- PubMed abstract sections are preserved as sections; they are not silently promoted into canonical reported outcomes.
- Current state is in-session and unsigned. Do not imply durable or cryptographic audit guarantees.

## Claim boundary

The real-world benchmark proves only the tracked source calls and named model runs under their recorded prompt and source snapshots. It is not a universal hallucination rate, a full-publication reviewer-agreement study, clinical validation, or misconduct detection.

For current metrics and limitations, use `../../benchmarks/README.md` and the raw run artifacts rather than copying values from this architecture summary.
