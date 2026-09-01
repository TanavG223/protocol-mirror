# Final release manifest

Updated on 2026-09-01 America/New_York after rendering and technically verifying the benchmark-forward 1:53.30 candidate with locally generated Kokoro-82M narration. The exact current release candidate is always the commit containing this manifest and must be confirmed by the `COMMIT_SHA` printed by `npm run preflight:product`; the manifest does not embed its own changing commit hash. The model-card license provenance is documented, but this is not evidence of owner editorial approval, a Devpost entry, or a YouTube upload.

## Authoritative release references

- Exact local release candidate: resolve with `git rev-parse HEAD` and match it to the clean preflight's `COMMIT_SHA`
- WebMCP conformance-gate commit: `982c4aa5a0aaf2f974f57f5e8d6f616ca5aad105`
- Real-world benchmark implementation commit: `61422b01eb3564a5cd49fd3bb11ee9b03c3acdc1`
- Product and final-media commit: `fc3fb52ef4b6d8b34d1ed62d9fb8cb99568eb336`
- Final browser-evidence commit: `a408bdb815344e49407f004b043273a649836da8`
- 60 fps/ElevenLabs release-pipeline commit: `c39b921cf54bf26d37257990dafb3eab2a7ac4e9`
- Final 60 fps ElevenLabs candidate commit: `ba3a1b811e51ab01a0cdd8446a395caad7baa9d3`
- Four-step agent collaboration and fail-closed preflight implementation commit: `71287b406fc1fbb8d27dad73bf294742ae1d4f47`
- Final resilience, accessibility, and security hardening commit: `0775f17de106b4917b121c8345335e295e567ffb`
- Public repository: https://github.com/TanavG223/protocol-mirror
- Permanent application: https://protocol-mirror.vercel.app
- CI verification: https://github.com/TanavG223/protocol-mirror/actions/runs/33346345077
- Vercel production deployment ID for the evidence commit: `6173273429` (`success`)

## Verified engineering state

- Public baseline: `npm run check` passed ESLint, 34 deterministic tests, TypeScript, and the optimized Next.js production build.
- Current local release candidate: `npm run check` passes the WebMCP conformance gate, ESLint, 42 deterministic tests, TypeScript, and the optimized Next.js production build. The four-step agent investigation → proposal → human adjudication → agent export loop passed through real WebMCP calls in a clean Codex tab. The 24-pair source benchmark completed 48/48 live tool reads, and the exact product commit was visually checked at desktop and 320-pixel widths without overflow or browser errors. These additions are not deployed yet.
- `npm run preflight:product` must pass on the clean commit containing this manifest and print the matching `COMMIT_SHA`; it performs a clean dependency install, WebMCP and submission consistency checks, exact media-integrity verification, high-severity production audit, lint, all 42 tests, TypeScript, and the production build.
- `npm run preflight:submission` repeated the product checks and then failed closed at the first truthful owner gate: official-rules acknowledgment remains unset. Media approval, personal fields, and the public YouTube URL remain gated behind it.
- Repository-wide security closure: 17 runtime/tool files fully read, real malformed-route and XML-entity probes, zero reportable findings, zero dependency vulnerabilities at the enforced threshold, and two documented defense-in-depth recommendations.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilities.
- Exact-commit Codex-browser rehearsal: six initial tools; four evidence-linked proposals staged; human accept/reject decisions; a seven-tool reviewed state; a downloadable receipt with decisions, locators, and audit events; one H1; no horizontal overflow at 1280 pixels; no browser warnings or errors.
- Responsive proof: 390 by 844 viewport with a 390-pixel document width and no horizontal overflow.
- Production headers: restrictive CSP, anti-framing, MIME-sniffing, referrer, and permissions controls verified.

## Media state

| Artifact | SHA-256 | Verified properties |
| --- | --- | --- |
| `docs/demo/protocol-mirror-submission-demo.mp4` | `c39f2720d788b7ae60c7553174bf003a92af6c971219986d41aa4126a5a9d10f` | 113.300000 seconds; 1280×720; H.264; constant 60 fps; 6,798 frames; stereo AAC at 48 kHz; benchmark-forward candidate |
| `docs/demo/protocol-mirror-submission-voiceover.m4a` | `4fc5bd5469c88f3f93a028fd974e72f246a004a6ee93c79659d164a04012d12a` | processed Kokoro-82M `af_heart` narration; −16.4 LUFS; −4.2 dBTP; stereo AAC at 48 kHz |
| `docs/demo/protocol-mirror-kokoro-source.wav` | `feb90ecf25cd785f78f40faee612947e79a95aa5d3c6288ea08daf607fa730e0` | 124.050-second local Kokoro-82M v1.0 source; 24 kHz mono PCM; generation settings and Apache-2.0 model-card evidence recorded separately |
| `docs/demo/protocol-mirror-submission-captions.srt` | `acdac92ee20705ec4b1d9ce584c1c204e688f802ebc48606e885232846a7f4e4` | 23 monotonic English cues; final cue ends at 113.288 seconds; owner must inspect timing against the processed upload |
| `docs/demo/protocol-mirror-final-demo.mp4` | `0ce0b5b4aabaccf1baa5ec6f193b47785bbfff2ef0c4f6ee39a4f689c3f58797` | 89.650000 seconds; 1280×720; H.264; constant 60 fps; 5,379 frames; stereo AAC at 48 kHz |
| `docs/demo/protocol-mirror-final-voiceover.m4a` | `deda8c80e6032b989f9da01250dc3012e91d8a7dba2632faa1908dd6791120c4` | 88.900000 seconds; processed ElevenLabs Chris voice; stereo AAC at 48 kHz |
| `docs/demo/protocol-mirror-elevenlabs-chris-source.mp3` | `161ac9090cebff12f635137fe6ceb15044f42bc8b15ffe42178c377e7da1f9a7` | 93.753438-second ElevenLabs source; Chris, Multilingual v2, default settings recorded in the voice-direction file |
| `docs/demo/protocol-mirror-final-captions.srt` | `99554c275b7862f417f05d70caf6331763b193085b07506853ab0216322f8600` | 19 monotonic English cues; final cue ends at 88.543 seconds; owner must inspect timing against the processed upload |
| `docs/demo/title-card.png` | `f2c30941c47ae9e920933a7e35a1920165f8fa8224cec63ba2a303b26fa4a7bf` | 1280×720 upload thumbnail |

Automated checks on the benchmark-forward candidate found no black segment of 0.4 seconds or longer, no silence of 1.5 seconds or longer, and no variable-frame-rate cadence at the tested thresholds. Audio measured −16.4 LUFS integrated and −4.2 dBTP. A representative-frame sheet and exact timestamp frames were visually inspected. These checks do not replace the project owner's complete watch with sound.

## Screenshot checksums

| File | SHA-256 |
| --- | --- |
| `docs/screenshots/01-hero.jpg` | `ea560156e168cbe531049113be080c43208a9c63dc425ca1b83c512d1a3612ef` |
| `docs/screenshots/02-comparison.jpg` | `0453ac95b738edebf8c4a6d8418cf1e0f6395dccd9e1975faf40194a294c6a01` |
| `docs/screenshots/03-review-queue.jpg` | `e73547d6e58780eba23e47eace43ec95a42a4591a233ed16616176c3518a0910` |
| `docs/screenshots/04-evidence-drawer.jpg` | `f3ecd4ccb67fe0300a4f0deec95d00b3cfc3f1bce4ca9dad68b4da40b976a883` |
| `docs/screenshots/05-mobile.jpg` | `04675215c9dab8c583d0ea64b44e6fcf35171cb37c11fa334ba3d7b747131671` |
| `docs/screenshots/06-agent-reviewed.png` | `928ff0ac3317bd9dad43067267b188250a0d4a99fbe18da2907acf4e1dfbb425` |
| `docs/screenshots/07-real-world-benchmark.png` | `e206663c203b5a12d04497baca384cd6de4bc9c80efb2e03164abda50ccaf227` |

## Owner-only gates still open

1. Watch and approve the complete benchmark-forward local candidate with sound; request any voice, timing, or edit changes before upload.
2. Acknowledge the current official rules and personally confirm age, residence, exclusions, originality, rights, submitter type, and New-versus-Existing project status.
3. Authorize the final push/deployment, then repeat the public lifecycle and responsive checks on that exact commit.
4. Upload the approved video as a publicly visible YouTube video and watch the processed upload end to end.
5. Provide the final YouTube URL and required personal Devpost answers.
6. Create/review the Protocol Mirror Devpost project and inspect the final authenticated preview.
7. Submit only after the separate explicit `yes, submit` confirmation, then preserve the receipt and keep all judging URLs unrestricted through the judging period.

## Real-world evaluation boundary

The local candidate includes a 24-pair real-world evaluation manifest, 48/48 successful live WebMCP source calls, two raw blinded local-model runs, a strict exact-locator/quote scorer, four scorer and artifact-integrity tests, and a judge-visible reality-check section. The current deterministic suite is therefore 42 tests. The two runs showed opposite directional bias and materially different unsupported-claim rates, reinforcing the human-authority design without establishing universal hallucination or clinical-accuracy claims. These additions are local and are not public evidence until the repository and application are explicitly pushed and deployed.
