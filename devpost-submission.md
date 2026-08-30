# Protocol Mirror

### ⏳ Not submitted yet
Nothing has been sent to Devpost.

## One-line Summary

Protocol Mirror is a WebMCP-native clinical-trial transparency workspace where an agent compares registered outcomes with published reports, stages evidence-linked discrepancies, and hands every conclusion to a human reviewer.

## Problem

Clinical-trial registries record what researchers planned to measure, while publications record what readers eventually see. Comparing those records is valuable but slow, citation-heavy work. A conventional AI summary can make the problem worse by collapsing uncertainty and evidence into a confident paragraph.

In a 2019 cross-sectional study of 389 trials published in high-impact journals, 130 had at least one primary-outcome change between registration and publication. Of those 130 trials, 66 involved a registered primary outcome that was omitted or not reported. A changed outcome is not automatically improper; reviewers need a transparent comparison, not an automatic misconduct verdict. Source: Chen et al., *JAMA Network Open*: https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/

## Solution

Protocol Mirror places registered and reported outcomes side by side in one human-agent workspace. A WebMCP agent can inspect stable outcome IDs, retrieve exact source spans, stage a mapping or non-match, and focus the relevant review card. Every proposal carries a discrepancy category, rationale, evidence IDs, and calibrated confidence.

The agent cannot accept or reject its own proposal. A person reviews the rationale and exact source spans in the same interface and makes the decision. Only reviewed decisions appear in the exportable receipt, and that export capability is registered dynamically after a human decision exists.

The app includes a deterministic fictional case so the complete judging flow remains available without an upstream network dependency. Validated server adapters also retrieve normalized ClinicalTrials.gov outcomes and structured PubMed abstract sections.

## Why This Matters

Protocol Mirror demonstrates a reason to build for people and agents together rather than adding a chatbot beside an existing interface. The agent handles structured inspection and evidence assembly; the human retains the domain judgment. The shared page makes the agent's limits, citations, uncertainty, and authority boundary visible.

This is a research-transparency aid, not medical advice, a clinical decision system, a finding of misconduct, or a clinically validated detector.

## How We Used AI

The product does not hide a server-side model behind an API route. Instead, it exposes a task-specific capability surface to the agent already operating in the WebMCP-capable browser:

- `get_audit_state` reads stable outcome IDs, proposals, decisions, and audit events.
- `get_evidence_spans` returns exact source quotations and locators while marking source text as untrusted.
- `get_live_clinical_trial` retrieves a current ClinicalTrials.gov record through a fixed-host, bounded server adapter.
- `get_live_pubmed_article` retrieves a current PubMed abstract through a fixed-host, entity-safe server adapter.
- `propose_outcome_mapping` stages one schema-bound, evidence-linked proposal.
- `request_human_review` focuses and scrolls the matching visible checkpoint into view.
- `export_review_receipt` appears only after reviewed work exists and excludes staged proposals.

This lets an agent move from brittle screen interpretation to typed, state-aware collaboration. The model can assemble and explain a candidate comparison, but no agent-callable capability can perform the final accept or reject action.

## How We Used Codex

Codex was used throughout the build as an engineering and browser-testing collaborator. It helped inspect the official challenge materials and WebMCP behavior, implement and refine the Next.js application, build fail-closed validation and security controls, write deterministic contract tests, exercise the real tool lifecycle in the Codex in-app browser, verify desktop and mobile layouts, capture the final screenshots, and prepare the release documentation.

Codex also challenged overbroad claims: the project distinguishes a browser-tool implementation test from clinical validation, preserves PubMed abstract sections instead of pretending they are already clinical outcomes, and records residual security and product limitations explicitly.

## Key Features

- Seven atomic WebMCP tools with narrow schemas and lifecycle cleanup; six are available initially and the reviewed-receipt tool appears only after a human decision
- Stable, evidence-linked registered-to-reported outcome comparison
- Agent-staged proposals with a human-only accept/reject boundary
- Dynamic capability registration after review state changes
- Exact evidence drawer with source quotations and locators
- Reversible decisions and reviewed-only audit receipt export
- Deterministic fictional case for reliable judging
- Bounded ClinicalTrials.gov and PubMed source adapters with safe failures
- Responsive forensic-editorial interface with visible focus and reduced-motion support
- Restrictive production response headers and duplicate/cross-record evidence rejection

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
                    ├─ bounded, validated adapters ─ normalized records
PubMed E-utilities ─┘
```

WebMCP registration and the reviewer UI live in `src/app/workspace.tsx`. Runtime proposal validation lives in `src/lib/proposal-validation.ts`, the deterministic case in `src/lib/demo-data.ts`, and source adapters in `src/lib/source-adapters.ts`.

## Testing Instructions

### Hosted judging flow

1. Open the public app in ChatGPT's in-app browser.
2. Confirm the header says **WebMCP connected · 6 tools** and the browser exposes both live-source tools plus the four case-review tools.
3. Ask the agent to inspect the audit state and retrieve the exact systolic-blood-pressure evidence spans.
4. Ask it to stage an uncertain mapping using both evidence spans and request human review.
5. Confirm focus moves to the visible review checkpoint; accept or reject manually.
6. Confirm `export_review_receipt` appears as the seventh tool.
7. Export the receipt and confirm staged proposals are excluded while the accepted mapping's exact evidence locator is included.

No login, API key, patient data, or paid service is required.

### Local verification

Requirements: Node.js 20.9+ and npm.

```bash
npm ci
npm run check
npm run dev
```

Open `http://localhost:3000` in a WebMCP-capable browser. `npm run check` runs ESLint, 30 deterministic tests, TypeScript through the production build, and the optimized Next.js build.

## Public Demo Link

**TODO before entry:** add the permanent Vercel HTTPS URL after deployed-browser verification.

## Public Repository Link

https://github.com/TanavG223/protocol-mirror

The repository is public, GitHub detects its MIT license, all required source and screenshot assets are tracked, GitHub Actions is green, and no credential-shaped files or high-risk key literals are committed.

## Demo Video

**TODO before entry:** add the public YouTube URL. The final 2:45 script and exact agent prompts are in `docs/DEMO_SCRIPT.md`.

## Screenshot Shot List

1. `docs/screenshots/01-hero.jpg` — case context, connected WebMCP state, and the three-step authority model
2. `docs/screenshots/02-comparison.jpg` — registered and reported outcomes linked across the evidence spine
3. `docs/screenshots/03-review-queue.jpg` — four staged proposals and the human-only checkpoint
4. `docs/screenshots/04-evidence-drawer.jpg` — rationale beside exact quotations and source locators
5. `docs/screenshots/05-mobile.jpg` — responsive 390 by 844 layout without horizontal overflow

## Submission Readiness Notes

- [x] Public repository with all source, assets, instructions, and detected MIT license
- [x] Non-trivial top-level `document.modelContext.registerTool()` implementation
- [x] 30 deterministic tests, clean lint and TypeScript checks, and a successful production build
- [x] Real Codex in-app-browser rehearsal of six-before/seven-after tool registration, both live public adapters, and the complete stage/review/export flow
- [x] Five final screenshots and a timed demo script
- [ ] Permanent live URL deployed and verified in the Codex in-app browser
- [ ] Public YouTube video under three minutes with audio uploaded and watched end to end
- [x] Devpost MCP reports the account registered for The WebMCP Challenge with submissions open
- [ ] Authenticated Devpost project form fields and final preview verified
- [ ] Final Devpost preview reviewed and entry receipt saved before the displayed deadline

## Known Limitations

- The included comparison case is fictional and deterministic; it is implementation evidence, not an accuracy benchmark.
- Live PubMed abstracts do not provide a canonical clinical-outcome schema, so the adapter preserves structured sections for later human-reviewed extraction.
- Audit state is in-session only and is not persisted or cryptographically signed.
- The current application has no authentication and must not be used for protected health information.
- Compatibility has been directly rehearsed in the Codex in-app browser, not claimed for every browser.

## TODO Official Form Fields

- Permanent public demo URL
- Public YouTube demo URL
- Any exact form-only category, team, testing, or credential fields visible after Devpost sign-in
- Codex session ID only if the authenticated form explicitly requests it and the project owner confirms the correct session

Official page snapshot checked in the Codex browser on 2026-08-30. The Devpost website and official rules prevail if any requirement changes.
