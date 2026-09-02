# WebMCP conformance and security-guidance audit

Checked on 2026-09-02 against the current [WebMCP specification](https://webmachinelearning.github.io/webmcp/) and [Chrome WebMCP tool-security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools). This is an implementation audit, not a standards certification.

## Automated contract

`npm run check:webmcp` parses the TypeScript/TSX syntax tree and fails unless:

- exactly the intended eight tool definitions exist and their names are unique;
- exactly three registration call sites exist, one per registration effect;
- every imperative registration call uses an `AbortSignal` for lifecycle cleanup;
- no registration broadens the same-origin default with `exposedTo`;
- tool names follow the specification grammar;
- names and descriptions remain inside the security guide's 30/500/30/150-character metadata budgets;
- read-only tools declare `readOnlyHint`;
- tools returning source-derived or reviewed evidence declare `untrustedContentHint`; and
- proposal/focus tools are not mislabeled as read-only.

The check runs before lint, tests, TypeScript, and the production build, and is repeated by the clean-commit product preflight.

## API mapping

| Current expectation | Protocol Mirror evidence | Status |
| --- | --- | --- |
| Imperative page tools use `document.modelContext.registerTool()` | `src/app/workspace.tsx` registers through `document.modelContext`, falling back to `navigator.modelContext`, in three effects: pair-independent tools (`get_live_clinical_trial`, `get_live_pubmed_article`, `get_registry_history`, `get_audit_state`, `request_human_review`); pair-bound tools (`get_evidence_spans`, `propose_outcome_mapping`) that re-register whenever the active trial-publication pair changes; and the gated `export_review_receipt`. The conformance check expects exactly three registration call sites; adding the eighth tool did not add a fourth | Enforced |
| Registration completion is asynchronous | The initial registrations are awaited with `Promise.all`; connected state appears only after they resolve | Implemented |
| Registration lifecycle supports cancellation/unregistration | Every call receives `controller.signal`; effect cleanup aborts the controller | Enforced |
| Tool execution receives an `AbortSignal` | All three network-backed tools forward `options.signal` into their local adapter fetch | Tested |
| Tool inputs use structured JSON Schema | Every definition has a closed object schema; parameter enums, bounds, and required keys are explicit | Tested and audited |
| Read-only and externally sourced results are annotated | State/evidence/live-source/export definitions use the corresponding hints; staging and visible focus are not marked read-only | Enforced |
| Cross-origin access is opt-in | No registration uses `exposedTo`; browser same-origin defaults remain intact | Enforced |
| Tool availability can track page state | 7 tools exist initially; the 8th, the receipt tool, exists only while reviewed work is available, and the pair-bound tools re-register against the new identifiers when a real ClinicalTrials.gov/PubMed pair becomes the reviewable case | Browser-verified |
| User control remains visible | No accept/reject capability is registered; only a human UI action changes review status | Browser-verified and contract-tested |

## The eighth tool

`get_registry_history` was added on 2026-09-02 as a read-only, untrusted-content tool in the pair-independent effect. It reads a trial's ClinicalTrials.gov registration history — the original primary outcomes and every version in which the primary outcome set changed — through a new bounded server route, `GET /api/clinical-trials/[nctId]/history`. The route reuses the existing identifier validation and fail-closed error envelope, bounds the version-list body, caps the run at the original plus eight version fetches of at most 8 MB each (an unreadable version is reported, not fatal), decodes character references without entity expansion, and caches upstream reads for twelve hours. The tool adds no registration call site: the conformance check still expects exactly three.

## Output-size decision

The security guide recommends a 1.5K-character individual tool-output budget for agent compatibility. Protocol Mirror keeps small control outputs concise, but does not truncate exact registry outcomes, PubMed abstract sections, evidence quotations, or reviewed receipts merely to hit that advisory number. Truncation would weaken the product's evidence contract.

Instead, the implementation bounds the upstream body, validates and normalizes its shape, exposes targeted `get_evidence_spans` reads for the active case, and labels source-derived content as untrusted. The 24-pair benchmark records the observed live-source envelope sizes and therefore makes this deliberate exception inspectable. Future large-corpus work should add locator-based follow-up reads that return one page of evidence at a time, rather than silently dropping evidence.

## Input-shape compatibility

Chromium's in-page `executeTool()` passes tool input to the executor as a JSON string rather than an object. Every tool executor therefore accepts both an object and a JSON string and parses before validating, so the same tool works from the Codex/ChatGPT in-app browser and from `document.modelContext.executeTool()` in Chrome with the WebMCP testing flag. `npm run smoke:webmcp` exercises the JSON-string path end to end.

## Known draft boundary

The specification and browser implementation are evolving. The installed `webmcp-types@0.1.5` package is the compile-time contract for this candidate, while browser behavior is verified in Google Chrome 152 with the WebMCP testing flag (`npm run smoke:webmcp`) and, for the earlier flow, in the Codex in-app browser on 2026-08-30/31. Draft features not present in that package, such as `requestUserInteraction()`, are not claimed. Protocol Mirror implements the human checkpoint directly in the shared page and withholds decision authority from the tool surface.
