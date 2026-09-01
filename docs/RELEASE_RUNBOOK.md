# Submission release runbook

This runbook starts from a clean, CI-verified `main` branch.

## Current release state

- Permanent application: https://protocol-mirror.vercel.app
- Public MIT repository: https://github.com/TanavG223/protocol-mirror
- Permanent WebMCP workflow: verified end to end in the Codex in-app browser
- Technical local candidate: `docs/demo/protocol-mirror-final-demo.mp4`; 89.65 seconds, 1280×720 H.264 at constant 60 fps, ElevenLabs narration; **not cleared for upload until commercial-use rights are resolved**
- Candidate verification: 5,379 frames; no tested black/silence discontinuity; no variable cadence; owner watch-and-approve still pending
- Reproducible edit: `scripts/render-final-demo.sh`; release mode requires `ELEVENLABS_AUDIO`
- Upload thumbnail: `docs/demo/title-card.png` (1280×720)
- Still pending by owner choice: public YouTube upload, explicit rules acknowledgment, Devpost project write, and final `yes, submit`

The steps below are the reproducible release procedure and final external-action checklist. Do not repeat completed account or deployment actions unless current verification contradicts the state above.

## 1. Claim the permanent deployment

This step changes external state and requires the project owner's explicit confirmation at action time.

Before any push or deployment, commit the candidate and run `npm run preflight:product`. The command requires a clean tree and prints the exact commit SHA after the dependency audit, 38-test contract, TypeScript check, and production build pass.

1. Import `https://github.com/TanavG223/protocol-mirror` into Vercel.
2. Keep the detected Next.js defaults. The current application requires no environment variables.
3. Deploy the `main` branch and record the permanent HTTPS URL.
4. Do not describe the app as deployed until the URL passes the checks below.

## 2. Verify the deployed build

- Home page returns HTTP 200 over HTTPS.
- Header shows **WebMCP connected** in the Codex in-app browser.
- Exactly six tools exist initially; the export tool appears as the seventh only after a human decision.
- Stage, focus, accept, undo, re-accept, and export complete without console errors.
- The receipt excludes staged proposals.
- Invalid live-source identifiers return the documented structured 400 response.
- CSP, anti-framing, MIME-sniffing, referrer, and permissions headers remain present.
- A 390-pixel viewport has no horizontal overflow.

Record the URL and verification date in `README.md`, `docs/SUBMISSION_DRAFT.md`, and `docs/BROWSER_VERIFICATION.md`, then run `npm run check`, commit, push, and wait for green CI.

## 3. Record and publish the demo

1. Resolve the narration rights gate: regenerate after the ElevenLabs account is on a plan explicitly including a commercial license, or replace the narration with an owner-recorded track. Do not assume a later upgrade retroactively clears the Free-plan generation.
2. Generate the final narration from `docs/demo/FINAL_VIDEO_NARRATION.txt`, following `docs/demo/ELEVENLABS_VOICE_DIRECTION.md`, and have the owner approve the audio.
3. Render with `ELEVENLABS_AUDIO=/absolute/path/to/approved-audio ./scripts/render-final-demo.sh`; the script refuses a silent system-voice fallback.
4. Re-run the codec, frame-cadence, black-segment, silence, loudness, and checksum checks; update `docs/YOUTUBE_METADATA.md` and `docs/FINAL_RELEASE_MANIFEST.md`.
5. Watch the complete `docs/demo/protocol-mirror-final-demo.mp4` local master with sound and confirm the narration, pacing, overlays, and visible six-to-seven tool sequence.
6. Use the paste-ready metadata in `docs/YOUTUBE_METADATA.md` and confirm the processed runtime remains under three minutes with clear narration.
7. Upload `docs/demo/protocol-mirror-final-captions.srt` as English captions and inspect every cue in YouTube's caption editor against the processed audio.
8. Watch the complete upload with sound and captions before making it public; the challenge requires a publicly visible YouTube video.
9. Put the live app and public repository links in the video description.
10. Replace the pending demo-video lines in `docs/SUBMISSION_DRAFT.md` and `devpost-submission.md` with the final URL only after watching the uploaded result end to end with sound.

## 4. Complete the Devpost entry

Run `npm run preflight:submission` only after the owner has completed every personal and media gate. The command deliberately requires the four `PROTOCOL_MIRROR_*` confirmation variables documented by its error messages; never set them merely to make the command pass.

- Paste the narrative from `docs/SUBMISSION_DRAFT.md` and preserve its truthful-claim guardrail.
- Add the six files from `docs/screenshots/` in narrative order; use `06-agent-reviewed.png` as direct proof of the public seven-tool reviewed state.
- Put the permanent app URL in **Try it out** and repeat the public source URL in the description.
- Add the public video URL and repository license URL.
- Re-open the official rules immediately before submission and verify the displayed deadline, eligibility, required fields, public-access requirements, and video limit.

## 5. Freeze and archive evidence

- Run `npm ci`, `npm run check`, and `npm audit --omit=dev --audit-level=high` from a clean checkout.
- Confirm GitHub Actions is green for the submitted commit and the working tree is clean.
- Save the submitted Devpost URL, live URL, video URL, commit SHA, and a screenshot of the final confirmation page.
- Avoid post-deadline deployment or repository changes unless the official rules explicitly allow them.
