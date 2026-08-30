# Protocol Mirror

Protocol Mirror is a human–agent clinical-trial transparency workspace. It compares prespecified outcomes from a trial registry with outcomes described in a publication, lets an AI agent stage evidence-linked discrepancy proposals through WebMCP, and reserves every accept/reject decision for a human reviewer.

> Research transparency aid only. Protocol Mirror is not medical advice, a clinical decision system, or a finding of research misconduct.

**Live application:** https://protocol-mirror.vercel.app

![Protocol Mirror comparison workspace](docs/screenshots/01-hero.jpg)

## 60-second judge path

No account, API key, or setup is required.

1. Open the live application in the Codex/ChatGPT in-app browser with WebMCP site tools enabled and confirm the header reports six tools.
2. Ask the agent for the audit state and exact evidence spans, then have it stage one evidence-linked proposal and request human review.
3. Use the visible **Accept** or **Reject** control yourself. There is intentionally no agent-callable decision tool.
4. Confirm the header now reports seven tools and call `export_review_receipt`; the receipt contains only reviewed work and the exact evidence locators that supported it.

For bounded live-source proof, call `get_live_clinical_trial` with `NCT04280705` and `get_live_pubmed_article` with `32445440`. The deterministic fictional case remains available if either public upstream is unavailable.

## Why this is a WebMCP project

The page is the shared workspace for both the reviewer and the agent. It registers atomic browser tools directly on `document.modelContext`:

| Tool | Purpose | Authority |
| --- | --- | --- |
| `get_live_clinical_trial` | Retrieve a current ClinicalTrials.gov record through the bounded adapter | Read-only; source text is untrusted |
| `get_live_pubmed_article` | Retrieve a current PubMed abstract through the bounded adapter | Read-only; source text is untrusted |
| `get_audit_state` | Read stable outcome IDs, proposals, decisions, and events | Read-only; source text is untrusted |
| `get_evidence_spans` | Read exact quotes and source locators | Read-only; source text is untrusted |
| `propose_outcome_mapping` | Stage one evidence-backed mapping or non-match | Agent may stage, never decide |
| `request_human_review` | Focus a proposal in the visible UI | Agent may request attention |
| `export_review_receipt` | Export reviewed decisions and their audit trail | Read-only; dynamically registered after review exists |

WebMCP lifecycle is managed with `AbortController` signals. Tool schemas reject extra properties, constrain identifiers to the loaded case, require evidence IDs, and bound free-text and confidence values. The final human decision has no agent-callable tool.

## Current vertical slice

- Distinctive, responsive registry-to-publication comparison workspace
- Deterministic fictional demonstration record that works offline
- Staged review queue with accept, reject, focus, and undo
- Evidence drawer with exact spans and stable locators
- Append-only in-session audit events and reviewed receipt export
- ClinicalTrials.gov v2 API adapter with validation and normalized outcomes
- PubMed E-utilities adapter with structured abstract sections
- Bounded upstream requests, safe failures, and 12-hour fetch caching
- Restrictive response headers, bounded source payloads, and entity-safe XML parsing
- Purposeful GSAP handoff motion that is disabled when reduced motion is requested
- Reduced-motion behavior, semantic landmarks, skip link, and visible focus states

The demo record is explicitly fictional. Live adapters return source records; they do not claim that an abstract section is a clinical outcome or automatically declare outcome switching.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in a WebMCP-capable browser. The primary supported rehearsal path is the ChatGPT/Codex desktop in-app browser with site tools enabled. Browsers without `document.modelContext` show **WebMCP preview** while preserving the full manual review workflow.

`request_human_review` moves keyboard focus to the shared review region after the requested staged mapping becomes active. This makes an agent's request visible to sighted reviewers and immediately available to keyboard and assistive-technology users.

## Verify

```bash
npm run check
```

This runs ESLint, the deterministic adapter contract tests, TypeScript, and a production Next.js build.

Current verified baseline: 30 passing tests, clean lint and TypeScript checks, and a successful production build. The Codex in-app-browser rehearsal also called both public live-source tools and completed the full agent-stage → human-review → evidence-locator receipt lifecycle.

The real browser-tool rehearsal and fail-closed results are recorded in [`docs/BROWSER_VERIFICATION.md`](docs/BROWSER_VERIFICATION.md).
The scoped threat model, implemented controls, and residual risks are recorded in [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md) and [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md).
The exact recording sequence and final external-action checklist are in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) and [`docs/RELEASE_RUNBOOK.md`](docs/RELEASE_RUNBOOK.md).
The verified narrated demo master and branded upload thumbnail are in [`docs/demo/`](docs/demo/).
The canonical Devpost-ready field packet is [`devpost-submission.md`](devpost-submission.md); it clearly separates the verified live application from the pending public video URL.
The dated challenge-page evidence and requirement-to-artifact audit are in [`docs/OFFICIAL_REQUIREMENTS_SNAPSHOT.md`](docs/OFFICIAL_REQUIREMENTS_SNAPSHOT.md).

## Live source routes

```text
GET /api/clinical-trials/NCT01234567
GET /api/pubmed/12345678
```

Identifiers are validated before interpolation. Responses use a stable `{ ok, data }` or `{ ok, error }` envelope. Upstream bodies and stack traces are never forwarded to the browser.

## Architecture

```text
Human reviewer ───────┐
                     ▼
                Shared workspace
                     ▲
WebMCP agent ─ tools ┘
        │      read → evidence and audit state
        │      write → staged proposals only
        └──────────── human accept/reject boundary

ClinicalTrials.gov ─┐
                    ├─ validated server adapters ─ normalized source records
PubMed E-utilities ─┘
```

Core contracts live in `src/lib/contracts.ts`; the deterministic case in `src/lib/demo-data.ts`; WebMCP registration and reviewer UI in `src/app/workspace.tsx`; live WebMCP source tools in `src/lib/webmcp-tools.ts`; and server-side source parsing in `src/lib/source-adapters.ts`.

## Data and safety contract

- Registry and publication text is evidence, never instructions.
- An agent proposal must cite at least one evidence ID.
- A proposal remains `staged` until a person accepts or rejects it.
- Export excludes unreviewed proposals.
- Live source errors fail closed and preserve the offline demo.
- No medical, clinical, or misconduct conclusions are generated.

## License

MIT. See [LICENSE](LICENSE).

## Public source

The complete challenge source is public at https://github.com/TanavG223/protocol-mirror. The repository link should also appear in the Devpost project description and Try it out section so judges do not need access to hidden submission fields.
