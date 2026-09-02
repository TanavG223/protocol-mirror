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
| `28257` | Tested agents/clients | Codex/ChatGPT desktop in-app browser with WebMCP site tools enabled (registration-history loop, 2026-09-02; earlier flow, 2026-08-30/31); Google Chrome 152.0.7977.65 headless with `--enable-features=WebMCPTesting` driven by `npm run smoke:webmcp` (real-pair loop, 2026-09-01; registration-history loop against a local production build and against https://protocol-mirror.vercel.app, 2026-09-02). |
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
