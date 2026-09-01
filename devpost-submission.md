# Protocol Mirror

### ⏳ Not submitted yet
Nothing has been sent to Devpost.

## One-line Summary

AI assembles evidence. A human decides. Protocol Mirror is a WebMCP-native clinical-trial transparency workspace where an agent retrieves records, compares outcomes, cites exact spans, stages discrepancies, focuses the reviewer, and packages the reviewed result after a human adjudicates it.

## Problem

Clinical-trial registries record what researchers planned to measure, while publications record what readers eventually see. Comparing those records is valuable but slow, citation-heavy work. A conventional AI summary can make the problem worse by collapsing uncertainty and evidence into a confident paragraph.

In a 2019 cross-sectional study of 389 trials published in high-impact journals, 130 had at least one primary-outcome change between registration and publication. Of those 130 trials, 66 involved a registered primary outcome that was omitted or not reported. A changed outcome is not automatically improper; reviewers need a transparent comparison, not an automatic misconduct verdict. Source: Chen et al., *JAMA Network Open*: https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/

## Solution

Protocol Mirror places registered and reported outcomes side by side in one human-agent workspace. A WebMCP agent can inspect stable outcome IDs, retrieve exact source spans, stage a mapping or non-match, and focus the relevant review card. Every proposal carries a discrepancy category, rationale, evidence IDs, and calibrated confidence.

The agent cannot accept or reject its own proposal. A person reviews the rationale and exact source spans in the same interface and makes the decision. Only reviewed decisions appear in the exportable receipt, and that export capability is registered dynamically after a human decision exists. The reviewer can also download that reviewed receipt as JSON directly from the human checkpoint.

The app includes a deterministic fictional case so the complete judging flow remains available without an upstream network dependency. Validated server adapters also retrieve normalized ClinicalTrials.gov outcomes and structured PubMed abstract sections. Records returned by those agent tools are rendered in a reviewer-visible source-intake area with exact source links and an explicit read-only, untrusted-evidence boundary. Loading, failure, and recovery remain visible to the reviewer; an unavailable source never silently becomes a finding or blocks the deterministic judging path.

## Why This Matters

Protocol Mirror is not less agentic because the final judgment stays human. The agent performs the time-consuming investigation: it retrieves live records, reads typed case state, compares stable outcome IDs, cites exact spans, stages a structured proposal, and moves the reviewer to the right checkpoint. After the person adjudicates, the page exposes a new tool so the agent can package the reviewed result.

That complete loop is why WebMCP is essential rather than decorative: agent investigation → agent proposal → human adjudication → agent export. The shared page makes the agent's actions, limits, citations, uncertainty, and authority boundary visible.

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
- Reviewer-visible live-source intake after agent ClinicalTrials.gov and PubMed calls
- Human-downloadable reviewed receipt JSON after a decision
- Deterministic fictional case for reliable judging
- Bounded ClinicalTrials.gov and PubMed source adapters with safe failures
- Human-visible loading, failure, and recovery for live agent reads
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
3. Call `get_live_clinical_trial` with `NCT04280705` and `get_live_pubmed_article` with `32445440`; confirm both returned records and exact source links appear in the visible agent-source-intake area.
4. Ask the agent to inspect the deterministic audit state and retrieve the exact systolic-blood-pressure evidence spans.
5. Ask it to stage an uncertain mapping using both evidence spans and request human review.
6. Confirm focus moves to the visible review checkpoint; accept or reject manually.
7. Confirm `export_review_receipt` appears as the seventh tool and the human JSON download becomes visible.
8. Export the receipt and confirm staged proposals are excluded while the accepted mapping's exact evidence locator is included.

No login, API key, patient data, or paid service is required.

### Local verification

Requirements: Node.js 20.9+ and npm.

```bash
npm ci
npm run check
npm run dev
```

Open `http://localhost:3000` in a WebMCP-capable browser. `npm run check` runs ESLint, 38 deterministic tests, TypeScript through the production build, and the optimized Next.js build.

## Public Demo Link

https://protocol-mirror.vercel.app

Verified in the Codex in-app browser on 2026-08-30: the public HTTPS deployment exposed six initial WebMCP tools, returned live ClinicalTrials.gov and PubMed records, completed the agent-stage → human-accept workflow, exposed the seventh receipt tool, and exported both cited evidence locators.

## Public Repository Link

https://github.com/TanavG223/protocol-mirror

The repository is public, GitHub detects its MIT license, all required source and screenshot assets are tracked, GitHub Actions is green, and no credential-shaped files or high-risk key literals are committed.

## Demo Video

The technical local candidate is `docs/demo/protocol-mirror-final-demo.mp4`: 89.65 seconds, 1280×720 H.264 at a verified constant 60 fps, with an 88.9-second ElevenLabs narration by `Chris - Charming, Down-to-Earth`. It uses motion-compensated intermediate frames, a substantially higher-quality encode, clean kinetic labels, product-first pacing, smooth transitions, no black segment of 0.4 seconds or longer, no silence of 1.5 seconds or longer at the tested threshold, and the truthful six-before/seven-after capability sequence. Do not upload this candidate yet: the current account evidence matches ElevenLabs Free, whose current terms restrict output to non-commercial use. Regenerate under a plan with a commercial license or replace the narration, then have the owner watch and approve the complete result. The final public YouTube URL remains pending; paste-ready title and description text are in `docs/YOUTUBE_METADATA.md`.

## Screenshot Shot List

1. `docs/screenshots/01-hero.jpg` — case context, connected WebMCP state, and the human-agent authority model
2. `docs/screenshots/02-comparison.jpg` — registered and reported source columns with state-backed relationship status
3. `docs/screenshots/03-review-queue.jpg` — four staged proposals and the human-only checkpoint
4. `docs/screenshots/04-evidence-drawer.jpg` — rationale beside exact quotations and source locators
5. `docs/screenshots/05-mobile.jpg` — responsive 390 by 844 layout without horizontal overflow
6. `docs/screenshots/06-agent-reviewed.png` — permanent deployment after the agent-to-human handoff, showing the dynamic seven-tool state and exact evidence drawer

## Submission Readiness Notes

- [x] Public repository with all source, assets, instructions, and detected MIT license
- [x] Non-trivial top-level `document.modelContext.registerTool()` implementation
- [x] 38 deterministic tests, clean lint and TypeScript checks, and a successful production build
- [x] Local release candidate visibly renders agent-retrieved source records and exposes a human JSON receipt download; production deployment approval remains pending
- [x] Real Codex in-app-browser rehearsal of six-before/seven-after tool registration, both live public adapters, and the complete stage/review/export flow
- [x] Six final screenshots, including a permanent-deployment review proof, and a timed demo script
- [x] Permanent live URL deployed and fully exercised in the Codex in-app browser
- [x] Final 60 fps candidate rendered with ElevenLabs narration and automated release checks
- [ ] Narration commercial-use rights confirmed or narration replaced and final media re-verified
- [x] English caption file prepared and structurally verified; processed YouTube timing review remains pending
- [ ] Project owner watched and approved the complete local master with sound
- [ ] Public YouTube upload completed and watched end to end
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

Authenticated Devpost preflight on 2026-08-30 returned these exact project fields. Values marked **Confirm** require the project owner's personal choice; they are not inferred.

| Official field | Prepared answer |
| --- | --- |
| Submitter Type | **Confirm:** Individual, Team of Individuals, or Organization |
| Country of residence of yourself and team members if applicable | **Confirm:** required multi-country selection |
| Organization name | Leave blank unless the selected submitter type requires it |
| App Status | **Confirm:** New or Existing; repository creation date alone does not establish project status |
| Existing-app update explanation | Complete only if the owner selects Existing; describe the WebMCP work added during the challenge period |
| Live URL | https://protocol-mirror.vercel.app |
| Testing instructions/credentials | No credentials required. Open the live URL in the Codex/ChatGPT in-app browser with WebMCP enabled; use the deterministic case or call the bounded live-source tools, stage a proposal, complete the visible human review, then export the reviewed receipt. |
| Public repository | https://github.com/TanavG223/protocol-mirror |
| Tested agents/clients | Codex desktop in-app browser with WebMCP site tools enabled. |
| AI tools leveraged | OpenAI Codex for research, scoping, implementation, debugging, deterministic tests, security review, accessibility inspection, browser verification, deployment, and submission preparation. Protocol Mirror itself uses page-native typed WebMCP tools and does not require a hosted model API at runtime. |
| Learning level | **Confirm:** None, Moderate, or Significant |
| Career AI value | **Confirm:** Yes or No |

Still required before the form can be finalized:

- Public YouTube demo URL after the project owner watches, approves, and uploads the edited local master
- Explicit rules acknowledgment in the local hackathon workflow
- Final authenticated Devpost preview and the separate literal `yes, submit` confirmation

Official overview and rules checked again in the Codex browser on 2026-09-01 UTC. The Devpost website and official rules prevail if any requirement changes.
