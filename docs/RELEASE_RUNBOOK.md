# Submission release runbook

This runbook starts from a clean, CI-verified `main` branch.

## Current release state

- Permanent application: https://protocol-mirror.vercel.app
- Public MIT repository: https://github.com/TanavG223/protocol-mirror
- Permanent WebMCP workflow: verified end to end in the Codex in-app browser
- Benchmark-forward local candidate: `docs/demo/protocol-mirror-submission-demo.mp4`; 127.90 seconds, 1920×1080 H.264 at constant 60 fps, rights-documented Kokoro-82M narration
- Candidate verification: 7,674 frames; no tested black/silence discontinuity; no variable cadence; −16.4 LUFS and −4.2 dBTP; owner watched and approved the master on 2026-09-02
- Reproducible HD edit: `scripts/render-hd-submission-demo.sh`; release mode requires an explicit rights-cleared `NARRATION_AUDIO`
- Upload thumbnail: `docs/demo/title-card.png` (1280×720)
- Owner-side steps after this runbook (YouTube upload, Devpost form and submission) are tracked in `docs/SUBMISSION_HANDOFF.md`

The steps below are the reproducible release procedure and final external-action checklist. Do not repeat completed account or deployment actions unless current verification contradicts the state above.

## 1. Claim the permanent deployment

This step changes external state and requires the project owner's explicit confirmation at action time.

Before any push or deployment, commit the candidate and run `npm run preflight:product`. The command requires a clean tree and prints the exact commit SHA after the dependency audit, 62-test contract, TypeScript check, and production build pass.

1. Import `https://github.com/TanavG223/protocol-mirror` into Vercel.
2. Keep the detected Next.js defaults. The current application requires no environment variables.
3. Deploy the `main` branch and record the permanent HTTPS URL.
4. Do not describe the app as deployed until the URL passes the checks below.

## 2. Verify the deployed build

- Home page returns HTTP 200 over HTTPS.
- Header shows **WebMCP connected** in the Codex in-app browser.
- Exactly 7 tools exist initially; the export tool appears as the 8th only after a human decision.
- Stage, focus, accept, undo, re-accept, and export complete without console errors.
- The receipt excludes staged proposals.
- Invalid live-source identifiers return the documented structured 400 response.
- CSP, anti-framing, MIME-sniffing, referrer, and permissions headers remain present.
- A 390-pixel viewport has no horizontal overflow.

Record the URL and verification date in `README.md`, `docs/SUBMISSION_DRAFT.md`, and `docs/BROWSER_VERIFICATION.md`, then run `npm run check`, commit, push, and wait for green CI.

## 3. Record and publish the demo

1. Review `docs/demo/KOKORO_NARRATION_PROVENANCE.md`; the current candidate replaces the unresolved ElevenLabs Free-plan path with locally generated Apache-2.0 Kokoro-82M narration.
2. Watch the complete `docs/demo/protocol-mirror-submission-demo.mp4` local master with sound and confirm the narration, pacing, benchmark panel, overlays, and visible seven-to-eight tool sequence.
3. If the owner requests a voice or timing change, regenerate from `docs/demo/BENCHMARK_RECUT_NARRATION.txt` and render with `scripts/render-hd-submission-demo.sh`, passing the approved track as `NARRATION_AUDIO`.
4. Re-run the codec, frame-cadence, black-segment, silence, loudness, caption, and checksum checks after any change; update `docs/YOUTUBE_METADATA.md` and `docs/FINAL_RELEASE_MANIFEST.md`.
5. Do not upload until the project owner explicitly approves the complete master with sound.
6. Use the paste-ready metadata in `docs/YOUTUBE_METADATA.md` and confirm the processed runtime remains under three minutes with clear narration.
7. Upload `docs/demo/protocol-mirror-submission-captions.srt` as English captions and inspect every cue in YouTube's caption editor against the processed audio.
8. Watch the complete upload with sound and captions before making it public; the challenge requires a publicly visible YouTube video.
9. Put the live app and public repository links in the video description.
10. Add the final public video URL to `docs/SUBMISSION_HANDOFF.md` and the Devpost Video field after watching the uploaded result end to end with sound.

## 4. Complete the Devpost entry

Run `npm run preflight:submission` only after the owner has completed every personal and media gate. The command deliberately requires the four `PROTOCOL_MIRROR_*` confirmation variables documented by its error messages; never set them merely to make the command pass.

- Paste the narrative from `docs/SUBMISSION_DRAFT.md` and preserve its truthful-claim guardrail.
- Add the eight files from `docs/screenshots/` in narrative order; use `06-agent-reviewed.png` as direct proof of the public reviewed state with the export tool unlocked and `07-real-world-benchmark.png` as the reality-check differentiator.
- Put the permanent app URL in **Try it out** and repeat the public source URL in the description.
- Add the public video URL and repository license URL.
- Re-open the official rules immediately before submission and verify the displayed deadline, eligibility, required fields, public-access requirements, and video limit.

## 5. Freeze and archive evidence

- Run `npm ci`, `npm run check`, and `npm audit --omit=dev --audit-level=high` from a clean checkout.
- Confirm GitHub Actions is green for the submitted commit and the working tree is clean.
- Save the submitted Devpost URL, live URL, video URL, commit SHA, and a screenshot of the final confirmation page.
- Avoid post-deadline deployment or repository changes unless the official rules explicitly allow them.

## Appendix. Verification commands and release plumbing

Moved here from `README.md` on 2026-09-01 so the public README stays a product page. These are the maintainer-facing commands.

| Command | What it does |
| --- | --- |
| `npm run check` | WebMCP metadata/lifecycle conformance, judge-facing submission-packet consistency, ESLint, 62 deterministic tests, TypeScript, and a production Next.js build |
| `npm run smoke:webmcp` | Headless Google Chrome 152+ with `--enable-features=WebMCPTesting`; drives the page's own tools through the full 7 tools → opening on ACTT-1 with its registration history → live reads → human promotion → propose → human Accept → 8 → receipt citing a `history/0.` locator → Undo → 7 loop, plus reject-with-reason, reviewer note, reload, session clear and deep link. Add `--url=` to point it at the deployment |
| `npm run check:media` | Exact checksums, codec, 60 fps cadence, duration, frame count, audio contract, black/silence thresholds, and the 24-cue caption timeline for the demo master |
| `npm run preflight:product` | Fails closed unless source, license, screenshots, media assets, WebMCP registrations, dependency audit, tests, and the production build all map to one clean commit; prints that `COMMIT_SHA` |
| `npm run preflight:submission` | Adds owner-controlled gates for rules acknowledgment, narration/media approval, personal Devpost answers, and the watched public YouTube URL. Expected to fail until those external gates are truthfully complete |

Judge-evidence summary for the current candidate:

| Judge evidence | Verified result |
| --- | --- |
| Automated release checks | 75 tests, lint, TypeScript, and an optimized build pass |
| WebMCP metadata contract | Eight unique tools, three registration call sites, signal cleanup, same-origin exposure, annotations, and Chrome's character budgets enforced |
| Real WebMCP lifecycle | Seven initial tools; a human decision alone exposes the eighth; undo removes it. Driven end to end by `npm run smoke:webmcp` in Google Chrome 152 |
| Real-pair loop | The page opens on a real pair with its ClinicalTrials.gov registration history; the original registered primary outcome is listed first; a pair can also be promoted from the agent side or the human loader, and pair-bound tools re-register on the new identifiers |
| Two-way review | A rejection reason and a free-text reviewer note return to the agent through `get_audit_state` |
| Real-world source stress test | 24 NCT/PMID pairs; 48/48 WebMCP source calls; 172 outcomes and 106 abstract sections |
| Failure behavior | Invalid identifiers, malformed/oversized/entity-shaped source data, missing records, duplicate proposals, and unrelated evidence fail closed |
| Human authority | No agent accept/reject tool; reviewed JSON is available only after a human decision |
| Responsive UX | 320- and 390-pixel layouts verified without horizontal overflow; visible enabled targets are at least 44×44 pixels |
| Security | Zero reportable repository-scan findings and zero dependency vulnerabilities at the enforced threshold |
