# Judging checklist

## WebMCP leverage

This criterion is equal-weight with the other three and is the first tie-break.

- [x] Top-level `document.modelContext.registerTool()` registration
- [x] Atomic live-source read, case read, propose, focus, and export tools
- [x] Narrow schemas with `additionalProperties: false`
- [x] Read-only and untrusted-content annotations
- [x] Abort-signal lifecycle cleanup
- [x] Dynamic export registration after human review
- [x] Agent cannot call the human accept/reject action
- [x] Codex browser reported the expected before-and-after tool counts (earlier flow, 2026-08-30/31)
- [x] `npm run smoke:webmcp` drives the real-pair loop end to end through `getTools()`/`executeTool()` in Google Chrome 152 with the WebMCP flag, locally and against the public deployment
- [x] `get_registry_history` compares the original registration against the publication; the smoke asserts the whole registration-history loop against a local production build and against the Vercel deployment (2026-09-02, commit d77e447)
- [x] Two-way review: a rejection reason and a reviewer note return to the agent through `get_audit_state`
- [x] Production smoke run of the registration-history loop against https://protocol-mirror.vercel.app (2026-09-02, commit d77e447; Lighthouse desktop 100/100/100/100 the same night)
- [x] A real ClinicalTrials.gov/PubMed pair becomes the reviewable case; pair-bound tools re-register on the new identifiers
- [ ] Codex/ChatGPT in-app browser run of the new real-pair loop
- [x] Both live ClinicalTrials.gov and PubMed tools exercised through the real WebMCP surface
- [x] Agent-retrieved live records appear in the shared reviewer UI with exact source links
- [x] Complete agent investigation → proposal → human adjudication → agent export loop exercised through real WebMCP calls

## Execution

This criterion is equal-weight with the other three and is the second tie-break.

- [x] Responsive primary workflow
- [x] Deterministic offline demonstration
- [x] ClinicalTrials.gov and PubMed source adapters
- [x] Structured safe failures and request timeouts
- [x] Lint, tests, TypeScript, and production build pass
- [x] Public repository and MIT license
- [x] Public repository URL repeated in the submission draft's required links
- [x] Permanent public deployment claimed and fully exercised in the Codex in-app browser
- [x] WCAG AA-oriented structure, semantics, focus styling, and key color-pair contrast checks completed
- [x] Agent-triggered review focus exercised as an accessibility handoff
- [x] Final production-mode supported-browser rehearsal completed in the Codex in-app browser
- [x] Reviewed receipt is available through both the dynamic agent tool and a visible human JSON download
- [x] Public MIT repository link is visible in the application footer

## Impact

This criterion is equal-weight with the other three and is the third tie-break.

- [x] Concrete reviewer audience and research-transparency task
- [x] Exact evidence spans remain visible with proposals
- [x] Live source intake is visibly separated from the deterministic reviewed case and cannot become a finding automatically
- [x] Human authority and product limitations are explicit
- [x] Sourced, bounded impact statement added to the description and demo script
- [x] Balanced 24-pair reality check separates 48/48 WebMCP source fidelity from two named models' opposite decision bias

## Creativity and ambition

This criterion is equal-weight with the other three and is the fourth tie-break.

- [x] Source-first comparison and state-backed relationship language rather than a generic chatbot
- [x] State-dependent capability model
- [x] Reversible, auditable review decisions
- [x] Honest online/offline source architecture
- [x] Judge-visible opposite-model-bias result turns the authority boundary into tested product evidence rather than a slogan

## Submission assets

- [x] README and architecture summary
- [x] Originality and provenance log
- [x] Three-minute demo spine
- [x] Devpost narrative draft
- [x] Canonical plugin-shaped `devpost-submission.md` packet with testing instructions, AI/Codex usage, limitations, and explicit placeholders
- [x] Eight final screenshots captured and visually reviewed, including mobile, the reviewed state with the export tool unlocked, the real-world benchmark panel, and the session log
- [x] Constant-60-fps visual preview, kinetic overlays, and fail-closed release renderer prepared
- [x] Pre-benchmark technical candidate rendered with ElevenLabs narration and re-verified as media-pipeline evidence
- [x] Benchmark-forward narration and 1:45–1:55 storyboard prepared
- [x] Rights-documented benchmark-forward master rendered with Apache-2.0 Kokoro-82M narration and re-verified
- [x] ElevenLabs Free-plan output replaced; model-card license provenance and generation settings recorded
- [x] Branded 1280×720 upload thumbnail and exact YouTube metadata prepared
- [x] Structurally validated 23-cue English caption file prepared; owner listening and processed-upload timing review remain owner gates
- [x] Judge-facing five-minute no-credentials test path with pasteable prompts and a no-agent fallback in the public README
- [ ] Project owner watched and approved the complete local master with sound
- [ ] Public YouTube upload under three minutes with audio
- [x] Devpost integration reports hackathon registration complete and submissions open
- [ ] Devpost form completed and reviewed
- [x] Published baseline remains on a green public `main` branch
- [x] New judge-gap release candidate passes locally; push, CI, deployment, and permanent-URL recheck remain owner-approved actions
- [x] Fail-closed product and submission preflight commands added; product preflight must map all evidence to one clean commit
- [ ] Freeze the final external URLs and Devpost receipt before the deadline
