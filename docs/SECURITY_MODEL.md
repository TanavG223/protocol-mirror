# Security model

## Scope and architecture

Protocol Mirror is a browser workspace backed by two read-only server adapters. It has no authentication, persistent database, embedded language-model endpoint, secret-bearing client configuration, or agent-callable human-decision action.

The principal trust boundaries are:

1. Public registry and publication text crossing into server adapters.
2. WebMCP tool arguments crossing into the live browser state.
3. Agent-staged proposals crossing the human-review boundary.
4. Browser responses crossing the deployment boundary.

## Implemented controls

- ClinicalTrials.gov and PubMed identifiers are validated before URL construction.
- Upstream responses have strict byte limits, timeouts, shape constraints, and stable fail-closed error envelopes.
- XML entity processing is disabled for PubMed input.
- WebMCP schemas reject extra properties, bound arrays and text, constrain identifiers to the loaded case, and label source text as untrusted.
- Runtime proposal validation repeats the important schema checks and rejects unknown, unrelated, excessive, or duplicate evidence IDs.
- An agent can only stage a proposal and focus its review card. Accept and reject remain human-only UI actions.
- The export tool is registered only after a reviewed decision exists and excludes staged proposals.
- Production responses set a restrictive Content Security Policy and defensive browser headers, and omit the framework-identifying header.
- React's escaped rendering is used throughout; no raw HTML rendering or dynamic code execution is used.
- Dependencies are locked, reviewed by the automated audit, and verified by CI.

## Security-resource decisions

| Resource | Decision | Reason |
| --- | --- | --- |
| awesome-llm-security | Reference taxonomy only | Useful catalogue; not a runtime control |
| llama-cookbook | Not integrated | General model-building guidance does not match this browser-only architecture |
| Rebuff | Not integrated | Prototype prompt-injection stack would add unrelated services and dependencies |
| LLM Guard | Not integrated | Archived project and no embedded model-input pipeline to protect |
| promptfoo | Deferred | Valuable when Protocol Mirror gains a model or API target; current deterministic contracts are better covered by Vitest and browser rehearsal |
| PyRIT and garak | Deferred | Designed to probe model targets; Protocol Mirror exposes no model endpoint |
| Claude cybersecurity skill collections | Reference only | Broad agent instructions are not application controls and were not installed into the project |
| cybersec-toolkit | Rejected | Very broad dual-use toolkit, unsupported on macOS, and unnecessary for this scope |

## Residual risks and limits

- The current Content Security Policy permits inline styles and scripts needed by the statically rendered Next.js application. Scripts remain same-origin and production disallows `unsafe-eval`. A nonce-based policy should be evaluated before adding authentication or sensitive data.
- In-session audit events are not durable or cryptographically signed. Refreshing the page resets the demonstration state.
- Public upstream APIs can change shape or availability. Adapters fail closed, but live-source compatibility still requires monitoring.
- This review does not establish clinical validation, research-integrity accuracy, regulatory compliance, or the safety of handling protected health information.
- No external penetration test was performed, and model-focused red-team suites were not applicable because the project has no embedded model endpoint.
