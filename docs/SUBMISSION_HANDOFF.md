# Protocol Mirror submission handoff

This package contains the complete prepared submission media and copy. It is a handoff bundle, not proof that any external upload, deployment, or Devpost submission has occurred.

## Start here

1. Play `video/protocol-mirror-submission-demo.mp4` from beginning to end with sound.
2. Confirm the voice, pronunciation, pacing, benchmark values, transitions, seven-to-eight tool change, receipt, and closing frame.
3. If approved, upload `video/protocol-mirror-submission-captions.srt` with the video and use `video/title-card.png` as the thumbnail.
4. Paste the title and description from `submission/YOUTUBE_METADATA.md`, then watch the processed public YouTube upload with sound and captions.
5. Use `submission/devpost-submission.md` as the canonical Devpost packet and `submission/OFFICIAL_REQUIREMENTS_SNAPSHOT.md` as the pre-submission checklist.

## Owner confirmations still required

- Complete video watch and explicit approval
- Current official-rules acknowledgment and eligibility confirmation
- Submitter type and country or countries of residence
- New-versus-Existing project status
- Learning-level and career-value answers
- Explicit permission before pushing/deploying the current local commits
- Public YouTube URL after the processed upload is watched
- Final authenticated Devpost preview review
- Separate literal authorization before final submission

## Verified local media contract

- Runtime: 127.900 seconds
- Video: H.264, 1920×1080, constant 60 fps, 7,674 frames
- Audio: AAC stereo, 48 kHz, measured −16.4 LUFS and −4.2 dBTP
- Captions: 24 monotonic English cues ending at 126.460 seconds
- Continuity: no tested black segment of 0.4 seconds or longer; no tested silence of 1.5 seconds or longer
- Narration: local Kokoro-82M v1.0 `af_heart`; provenance in `submission/KOKORO_NARRATION_PROVENANCE.md`

## Official Devpost form fields

Authenticated Devpost preflight on 2026-09-01 at 13:54 UTC returned these exact submission fields. Values marked **Confirm** require the project owner's personal choice; they are not inferred.

| ID | Official field | Prepared answer |
| ---: | --- | --- |
| `28249` | Submitter Type | **Confirm:** Individual, Team of Individuals, or Organization |
| `28250` | Country of residence of yourself and team members if applicable | **Confirm:** required multi-country selection; eligibility must match the official rules |
| `28251` | Organization name | Leave blank unless the selected submitter type requires it |
| `28252` | App Status | **Confirm:** New or Existing; repository creation date alone does not establish project status |
| `28253` | Existing-app update explanation | Complete only if the owner selects Existing; describe the WebMCP work added during the challenge period |
| `28254` | Live URL | https://protocol-mirror.vercel.app |
| `28255` | Testing instructions/credentials | No credentials required. Paste the six-step judge path from `devpost-submission.md` ("Testing instructions"). The page opens on ACTT-1 / PMID 32445440 with its registration history, so nothing has to be loaded first: (1) ask for `get_audit_state` and its `registryHistory` — 25 registration versions, primary outcome changed in versions 9 and 14; (2) ask for `get_evidence_spans` on `ev-registry-original-primary-1` and the RESULTS abstract section; (3) ask for `propose_outcome_mapping` plus `request_human_review`; (4) ask the agent to accept — it has no such tool — then click **Accept** yourself and watch the header move to 8 tools; (5) ask for `export_review_receipt` (it cites the `history/0.` original-registration locator), then click **Undo last decision** to return to 7 tools; (6) reject a proposal with a reason or send a **Note to the agent**, then ask for `get_audit_state` again to read `reviewerFeedback` and `reviewerNotes`. In a browser without WebMCP, steps 4-6 are ordinary clicks. |
| `28256` | Public repository | https://github.com/TanavG223/protocol-mirror |
| `28257` | Tested agents/clients | Google Chrome 152.0.7977.65 with NO flag against the live origin, which serves a Chrome WebMCP origin-trial token (2026-09-02: `document.modelContext` present, header "WebMCP connected · 7 tools"); Codex/ChatGPT desktop in-app browser with WebMCP site tools enabled (registration-history loop, 2026-09-02; earlier flow, 2026-08-30/31); Google Chrome 152.0.7977.65 headless with `--enable-features=WebMCPTesting` driven by `npm run smoke:webmcp` (real-pair loop, 2026-09-01; registration-history loop against a local production build and against https://protocol-mirror.vercel.app, 2026-09-02). |
| `28258` | AI tools leveraged | OpenAI Codex for research, scoping, implementation, debugging, deterministic tests, security review, accessibility inspection, browser verification, deployment, and submission preparation. Protocol Mirror itself uses page-native typed WebMCP tools and does not require a hosted model API at runtime. |
| `28259` | Learning level | **Confirm:** None, Moderate, or Significant |
| `28260` | Career AI value | **Confirm:** Yes or No |

Still required before the form can be finalized:

- Public YouTube demo URL after the project owner watches, approves, and uploads the master
- Explicit rules acknowledgment in the local hackathon workflow
- Final authenticated Devpost preview and the separate literal `yes, submit` confirmation

Official overview, rules, dates, prizes, criteria, and submission schema were checked through the authenticated Devpost integration on 2026-09-01 at 13:54 UTC.

## External-state warning

The repository, public application, YouTube account, and Devpost entry must be checked live immediately before submission. The official Devpost pages and rules prevail if any saved copy differs.

## Devpost story prompt answers (paste if the form asks)

Each answer is 60-120 words and repeats no claim the packet does not already support. Elevator pitch (198 characters): ACTT-1's registered primary outcome changed twice before its NEJM paper appeared. Page-side WebMCP tools read the registry's version history live, quote both spans with locators, and let you decide.

### Inspiration
ACTT-1 registered a 7-point ordinal scale at Day 15 on 2020-02-20. Its NEJM paper reports time to recovery. That change sits in the public registration history with a version number on it, and nobody has to dig for it. Reading it still takes three browser tabs and a lot of copy-paste. Chen et al. found that 130 of 389 trials had changed at least one primary outcome, and 66 of those omitted or never reported the registered one. The retrieval is mechanical, the sources are open APIs, and the call at the end belongs to a person. That split is the shape WebMCP fits.

### What it does
Protocol Mirror opens on a real trial beside its paper, both fetched live from ClinicalTrials.gov and PubMed, and registers 8 WebMCP tools on that page. The agent reads the trial, the abstract, and the registration version history. It quotes exact spans with source locators. It stages a proposal, matched, omitted, introduced, or uncertain, with a rationale and a confidence. You accept or reject. Accepting registers `export_review_receipt`, so the agent can package the reviewed decisions with their locators and source URLs. Rejecting sends your reason and note back through `get_audit_state`, and the agent revises.

### How we built it
A Next.js app with no backend service and no accounts. Two server routes proxy ClinicalTrials.gov and PubMed, validating identifiers before interpolation and returning a stable `{ ok, data }` envelope. Tools register through `document.modelContext.registerTool` with a `navigator.modelContext` fallback, in three effects: pair-independent reads, pair-bound tools that re-register when the case changes, and the gated receipt tool. Every schema is closed, every registration carries an `AbortSignal`, and audit state lives in the tab's `sessionStorage`. A conformance script checks annotations, abort signals, same-origin defaults and Chrome's metadata budgets. A headless Chrome script drives the whole loop.

### Challenges we ran into
Registration history was the hard part. Late versions can carry 4 MB of posted results, so the route caps the version list and compares at most nine versions, then reports which ones it compared and whether each change date is exact. Above six Outcome Measures versions, a bisection dates the first change instead of reading everything. Enum lists of outcome IDs are emitted only at 20 or fewer, with runtime validation authoritative either way. Chromium's in-page `executeTool` passes tool input as JSON strings, so every executor had to accept objects and JSON strings before the smoke run would pass.

### Accomplishments that we're proud of
48/48 live reads through the page's own tools returned the requested record with a canonical URL and non-empty evidence: 172 outcomes and 106 abstract sections across 24 real NCT/PMID pairs. The loop is verified end to end in Google Chrome 152 by a headless smoke script, and in the Codex/ChatGPT desktop in-app browser with site tools enabled. The authority boundary held in both model runs: neither model attempted to accept or reject anything, because there is nothing to call. And the default case is a real trial with a real dated outcome change, fetched at page load.

### What we learned
Two small local models received identical evidence and failed in opposite directions. qwen3:4b called all 10 of its decided no-change cases a change. ornith-1.5:9b missed 10 of its 11 decided change cases. Averaging those two would look reasonable and mean nothing, which is the argument for keeping the accept click human instead of tuning a threshold. The second lesson is smaller. Tool annotations are a contract, and writing a conformance gate for `readOnlyHint`, `untrustedContentHint`, abort signals and metadata budgets keeps them honest as the tool surface changes.

### What's next
The limitations are the roadmap. Registration history compares primary outcome measures only, so secondary outcomes and eligibility changes are the next comparison to add. The publication column shows PubMed abstract sections, so reading full-text results would let a proposal cite reported numbers rather than an abstract summary. Receipts are unsigned and live in the tab's `sessionStorage`, so a signed, portable receipt is worth building. And the loop is verified in two browsers so far. More agent clients, against the same page and the same tools, is the cheapest test of whether this page-side design travels.
