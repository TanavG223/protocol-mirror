# Devpost form answers (paste-ready)

Generated 2026-09-02 from `devpost-submission.md` and `docs/SUBMISSION_HANDOFF.md`. Personal choices are marked.

## General info

- **Project name:** Protocol Mirror
- **Elevator pitch (198 chars):** ACTT-1's registered primary outcome changed twice before its NEJM paper appeared. Page-side WebMCP tools read the registry's version history live, quote both spans with locators, and let you decide.

## Project details

- **Description / story:** paste `devpost-submission.md` from the line `## Why this use case is a strong fit for WebMCP` to the end (Markdown is accepted). If the form shows the standard prompts instead (Inspiration, What it does, ...), use the answers at the end of `docs/SUBMISSION_HANDOFF.md`.
- **Built with (tags):** webmcp, next.js, react, typescript, node.js, vercel, zod, vitest, clinicaltrials.gov, pubmed, chrome-devtools-protocol
- **Try it out links:** https://protocol-mirror.vercel.app and https://github.com/TanavG223/protocol-mirror
- **Video:** the public YouTube URL of `docs/demo/protocol-mirror-submission-demo.mp4` (you upload it; title, description and chapters in `docs/YOUTUBE_METADATA.md`)
- **Images:** upload `docs/screenshots/01-hero.jpg`, `02-comparison.jpg`, `03-review-queue.jpg`, `04-evidence-drawer.jpg`, `06-agent-reviewed.png`, `08-session-log.png`, `07-real-world-benchmark.png`, `05-mobile.jpg` (in that order; the first becomes the thumbnail)

## Hackathon questions

- **Submitter type (28249):** Individual (personal choice)
- **Country of residence (28250):** your country of residence (personal choice; must be an eligible country under the rules)
- **Organization name (28251):** leave blank
- **App status (28252):** New (the project was created for this challenge; repository created 2026-08-29 during the submission period)
- **Existing-app explanation (28253):** leave blank
- **Live URL (28254):** https://protocol-mirror.vercel.app
- **Testing instructions (28255):**

No login, API key, flag, or paid service. Open https://protocol-mirror.vercel.app in Chrome 149 or newer (the live origin serves a Chrome WebMCP origin-trial token, verified in Chrome 152 with no flag on 2026-09-02; a local build still needs `chrome://flags/#enable-webmcp-testing`), or the ChatGPT/Codex in-app browser with site tools enabled. The header should read **WebMCP connected · 7 tools**. Nothing has to be loaded first: the page opens on ACTT-1 `NCT04280705` / PMID `32445440` with its registration history already fetched. If the header reads **WebMCP preview**, skip the pasted prompts; steps 4-6 are ordinary clicks.

1. Paste: *Call get_audit_state and summarize registryHistory: how many registration versions, and when did the primary outcome change?* It reports 25 versions and the change from a 7-point ordinal scale to time to recovery.
2. Paste: *Call get_evidence_spans for ev-registry-original-primary-1 and for the evidence ID of the RESULTS abstract section, and quote both spans with their locators.*
3. Paste: *Call propose_outcome_mapping for those two outcome IDs with a discrepancy of uncertain, both evidence IDs, a rationale and a confidence, then call request_human_review with the returned mappingId.*
4. Ask the agent to accept it. It has no such tool. Click **Accept** yourself; the header moves to **8 tools**.
5. Paste: *Call export_review_receipt and list its mappings, locators and audit events.* It reports `generatedFrom: "live_sources"` and cites the `history/0.` original-registration locator. Click **Undo last decision**; the receipt tool is unregistered and the header returns to 7 tools.
6. Click **Reject** on a proposal and pick a reason, or send a line through **Note to the agent**. Paste: *Call get_audit_state and read reviewerFeedback and reviewerNotes.* Your words come back to the agent, which can revise and re-propose.

Locally: `npm ci && npm run check` runs the WebMCP conformance gate, ESLint, 75 tests, TypeScript and the production build. `npm run smoke:webmcp` drives the whole loop above through `document.modelContext.getTools()` / `executeTool()` in headless Google Chrome with `--enable-features=WebMCPTesting`; it passed against a local production build and against https://protocol-mirror.vercel.app on Sep 2, 2026 with Chrome 152.0.7977.65.

- **Public repository (28256):** https://github.com/TanavG223/protocol-mirror
- **Tested agents/clients (28257):** Google Chrome 152.0.7977.65 with NO flag against the live origin, which serves a Chrome WebMCP origin-trial token (2026-09-02: document.modelContext present, header "WebMCP connected · 7 tools"); Codex/ChatGPT desktop in-app browser with WebMCP site tools enabled (registration-history loop, 2026-09-02; earlier flow, 2026-08-30/31); Google Chrome 152.0.7977.65 headless with --enable-features=WebMCPTesting driven by npm run smoke:webmcp (real-pair loop, 2026-09-01; registration-history loop against a local production build and against https://protocol-mirror.vercel.app, 2026-09-02). No other agent client has been tested.
- **AI tools leveraged (28258):** OpenAI Codex (ChatGPT desktop) and Claude Code for research, scoping, implementation, debugging, deterministic tests, security review, accessibility inspection, browser verification, UI design critique, deployment, and submission preparation; Kokoro-82M (local, Apache-2.0) for the demo narration. Protocol Mirror itself uses page-native typed WebMCP tools and does not require a hosted model API at runtime.
- **Learning level (28259):** Significant (personal choice; WebMCP, origin trials and the ClinicalTrials.gov history API were all new during the build)
- **Career AI value (28260):** Yes (personal choice)

## Before you click Submit

1. Confirm the header on https://protocol-mirror.vercel.app reads "WebMCP connected · 7 tools" in Chrome 149+ with no flag.
2. Confirm the YouTube video is public and plays with sound.
3. Read the rules acknowledgment yourself before ticking it.
4. Save the entry receipt.
