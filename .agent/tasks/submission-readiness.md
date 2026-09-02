# WebMCP Challenge submission task

## Authoritative packet

Read these in order and verify drift before acting:

1. `../../docs/OFFICIAL_REQUIREMENTS_SNAPSHOT.md`
2. `../../docs/internal/JUDGE_SCORECARD.md`
3. `../../devpost-submission.md`
4. `../../docs/RELEASE_RUNBOOK.md`
5. `../../docs/FINAL_RELEASE_MANIFEST.md`

The Devpost website and official rules prevail over the local snapshot.

## Locally proven

- The product build, deterministic tests, TypeScript, lint, and high-severity production dependency audit are enforced by `npm run preflight:product` on a clean commit.
- The six-tool → human decision → seven-tool lifecycle has been exercised in a fresh Codex in-app browser tab.
- Live ClinicalTrials.gov and PubMed reads, fail-closed recovery, desktop/mobile layout, keyboard targets, and reviewed receipt contents have browser evidence in `../../docs/BROWSER_VERIFICATION.md`.
- The 24-pair benchmark has a manifest, 48-call source run, two named raw model runs, scorer, and artifact-integrity tests under `../../benchmarks/`.
- The benchmark-forward narration, storyboard, and seventh screenshot are prepared locally.

## Owner-controlled gates still open

Do not infer or bypass any of these:

1. Explicit permission to push the local commits and update the public deployment.
2. A narration track whose commercial-use rights are confirmed, or an owner-recorded replacement.
3. Owner watch and approval of the complete benchmark-forward 60 fps master with sound.
4. Public YouTube upload, followed by an end-to-end processed-video watch.
5. Personal Devpost fields, eligibility choices, and explicit official-rules acknowledgment.
6. Authenticated final preview review and a separate literal `yes, submit` confirmation.

## Release proof sequence

1. Confirm a clean tree and inspect `git diff` plus the exact commit.
2. Run `npm run preflight:product`.
3. Start that production build locally and verify the judge path using the Codex in-app browser only.
4. With owner permission, push/deploy and repeat the public browser checks.
5. Resolve media rights, render to `docs/demo/BENCHMARK_RECUT_STORYBOARD.md`, verify technical properties, and obtain the owner watch.
6. Complete personal gates and run `npm run preflight:submission` only with truthful confirmation variables.
7. Submit only after the explicit final approval; save the public URLs, commit SHA, and receipt.
