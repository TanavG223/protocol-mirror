# WebMCP conformance and security-guidance audit

Checked on 2026-09-01 against the current [WebMCP specification](https://webmachinelearning.github.io/webmcp/) and [Chrome WebMCP tool-security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools) in the Codex in-app browser. This is an implementation audit, not a standards certification.

## Automated contract

`npm run check:webmcp` parses the TypeScript/TSX syntax tree and fails unless:

- exactly the intended seven tool definitions exist and their names are unique;
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
| Imperative page tools use `document.modelContext.registerTool()` | `src/app/workspace.tsx` registers the two live-source definitions plus four case tools; the reviewed receipt is registered separately | Enforced |
| Registration completion is asynchronous | The initial registrations are awaited with `Promise.all`; connected state appears only after they resolve | Implemented |
| Registration lifecycle supports cancellation/unregistration | Every call receives `controller.signal`; effect cleanup aborts the controller | Enforced |
| Tool execution receives an `AbortSignal` | Both network-backed tools forward `options.signal` into their local adapter fetch | Tested |
| Tool inputs use structured JSON Schema | Every definition has a closed object schema; parameter enums, bounds, and required keys are explicit | Tested and audited |
| Read-only and externally sourced results are annotated | State/evidence/live-source/export definitions use the corresponding hints; staging and visible focus are not marked read-only | Enforced |
| Cross-origin access is opt-in | No registration uses `exposedTo`; browser same-origin defaults remain intact | Enforced |
| Tool availability can track page state | Six tools exist initially; the seventh receipt tool exists only while reviewed work is available | Browser-verified |
| User control remains visible | No accept/reject capability is registered; only a human UI action changes review status | Browser-verified and contract-tested |

## Output-size decision

The security guide recommends a 1.5K-character individual tool-output budget for agent compatibility. Protocol Mirror keeps small control outputs concise, but does not truncate exact registry outcomes, PubMed abstract sections, evidence quotations, or reviewed receipts merely to hit that advisory number. Truncation would weaken the product's evidence contract.

Instead, the implementation bounds the upstream body, validates and normalizes its shape, exposes targeted `get_evidence_spans` reads for the deterministic review case, and labels source-derived content as untrusted. The 24-pair benchmark records the observed live-source envelope sizes and therefore makes this deliberate exception inspectable. Future large-corpus work should add pagination or locator-based follow-up tools rather than silently dropping evidence.

## Known draft boundary

The specification and browser implementation are evolving. The installed `webmcp-types@0.1.5` package is the compile-time contract for this candidate, while browser behavior is verified in the Codex in-app browser. Draft features not present in that package, such as `requestUserInteraction()`, are not claimed. Protocol Mirror implements the human checkpoint directly in the shared page and withholds decision authority from the tool surface.
