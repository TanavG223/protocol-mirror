# Scoped security review

Review date: 2026-08-31

## Executive summary

The review covered the complete deployed Next.js runtime, WebMCP argument and authority boundaries, both public-source adapters, rendering and receipt sinks, response headers, dependencies, secrets, and privileged release/demo scripts. A separate threat-model → discovery → validation → attack-path pass fully read 17 runtime/tool files and promoted zero reportable findings. Three earlier hardening findings remain fixed and covered by deterministic tests.

The public CI pipeline runs `npm audit --omit=dev --audit-level=high` before lint, deterministic tests, TypeScript validation, and the production build. The 2026-08-31 repository scan and release audit reported zero vulnerabilities. Crafted URL-, path-, and query-shaped identifiers returned structured 400 responses through the real HTTP interface, and an external XML entity probe failed closed.

This is a focused application review, not an external penetration test, clinical-system assessment, or compliance certification.

## Fixed findings

### SEC-001 — Missing defensive response headers

- Severity before fix: Medium
- Affected code: `next.config.ts:4-13`, `src/lib/security-headers.ts:1-35`
- Resolution: all routes now receive a restrictive Content Security Policy, anti-framing, MIME-sniffing, referrer, and permissions controls. The framework-identifying response header is disabled. Development-only `unsafe-eval` is excluded from production.
- Verification: deterministic header-policy tests, production build, and live production-response inspection.

### SEC-002 — Upstream response size was not bounded during transport

- Severity before fix: Medium
- Affected code: `src/lib/source-adapters.ts:6-28`, `src/lib/source-adapters.ts:52-99`, `src/lib/source-adapters.ts:125-167`
- Resolution: declared lengths are rejected early, streamed chunks are counted and cancelled at the limit, record fields and collection sizes are constrained, malformed JSON fails closed, XML entity processing is disabled, and requests retain an eight-second timeout.
- Verification: deterministic malformed and oversized upstream-response tests.

### SEC-003 — Duplicate evidence IDs were silently normalized

- Severity before fix: Low
- Affected code: `src/lib/proposal-validation.ts:24-35`
- Resolution: runtime validation now rejects duplicate or excessive evidence IDs instead of normalizing them. The WebMCP schemas also declare `uniqueItems` and a case-specific `maxItems`.
- Verification: deterministic proposal-validation tests and a live browser-tool rejection.

## Residual observations

### SEC-R1 — Static production policy permits inline script and style

- Severity: Low
- The static Next.js output requires inline execution and styling in the current configuration. The policy still limits script origin to self, blocks object embedding and framing, and excludes `unsafe-eval` in production. The React UI uses escaped text and does not render raw HTML.
- Recommendation: evaluate nonce-based CSP before adding authentication, sensitive data, or third-party scripts.

### SEC-R2 — Audit state is demonstrative, not tamper-evident

- Severity: Informational
- Audit events are append-only within the running browser state but are not persisted or cryptographically signed.
- Recommendation: add server-side versioned receipts and signatures before making durability or provenance claims.

### SEC-R3 — No embedded model target exists

- Severity: Informational
- Model-focused scanners such as promptfoo, PyRIT, and garak do not have a model or inference API to probe in the current architecture.
- Recommendation: add those suites if a future version introduces model inference, model-controlled retrieval, or a remote agent endpoint.

### SEC-R4 — Distributed abuse throttling is deployment-owned

- Severity: Informational
- The public adapters accept high-cardinality valid NCT/PMID identifiers, so many distinct requests can create cache misses. Each request remains fixed-host, read-only, capped at one or two megabytes, aborted after eight seconds, safely parsed, and cached for twelve hours.
- Recommendation: configure hosting-layer rate and abuse controls if public traffic becomes material. No SSRF, protected-data, state-change, or concrete outage/billing impact was validated in the reviewed repository.

## Final validation evidence

- 17 runtime and privileged-tool files fully read.
- Five targeted security/control files: 29 tests passed during validation.
- Full release candidate: 38 deterministic tests passed.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilities.
- Secret-pattern and tracked credential-shaped-file scans: no candidates.
- Real production response: CSP, frame denial, nosniff, strict-origin referrer, and restrictive permissions policy present.

This is an evidence-backed repository scan, not a penetration test, compliance certification, or guarantee that no defect exists.
