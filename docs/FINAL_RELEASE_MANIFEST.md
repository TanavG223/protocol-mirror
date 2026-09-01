# Final release manifest

Updated on 2026-09-01 America/New_York after the benchmark-forward submission assets were prepared on top of exact product commit `61422b01eb3564a5cd49fd3bb11ee9b03c3acdc1`. The existing constant-60-fps media is a technical candidate only: it predates the real-world benchmark panel, current account evidence matches ElevenLabs Free, and the current terms restrict Free User output to non-commercial use. This is not evidence of commercial-use clearance, owner editorial approval, a Devpost entry, or a YouTube upload.

## Authoritative release references

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
- Current local release candidate: `npm run check` passes ESLint, 42 deterministic tests, TypeScript, and the optimized Next.js production build. The four-step agent investigation → proposal → human adjudication → agent export loop passed through real WebMCP calls in a clean Codex tab. The 24-pair source benchmark completed 48/48 live tool reads, and the exact product commit was visually checked at desktop and 320-pixel widths without overflow or browser errors. These additions are not deployed yet.
- `npm run preflight:product` passed on clean commit `61422b01eb3564a5cd49fd3bb11ee9b03c3acdc1` after a clean dependency install, high-severity production audit, lint, all 42 tests, TypeScript, and the production build.
- `npm run preflight:submission` repeated the product checks and then failed closed at the first truthful owner gate: official-rules acknowledgment remains unset. Media approval, personal fields, and the public YouTube URL remain gated behind it.
- Repository-wide security closure: 17 runtime/tool files fully read, real malformed-route and XML-entity probes, zero reportable findings, zero dependency vulnerabilities at the enforced threshold, and two documented defense-in-depth recommendations.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilities.
- Final public Codex-browser rehearsal: six initial tools; direct pre-mapping evidence; two live-source reads; malformed, duplicate, and unrelated-evidence rejection; agent staging and focus; human-only acceptance; seven-tool reviewed receipt; undo back to six; no browser warnings or errors.
- Responsive proof: 390 by 844 viewport with a 390-pixel document width and no horizontal overflow.
- Production headers: restrictive CSP, anti-framing, MIME-sniffing, referrer, and permissions controls verified.

## Media state

| Artifact | SHA-256 | Verified properties |
| --- | --- | --- |
| `docs/demo/protocol-mirror-final-demo.mp4` | `0ce0b5b4aabaccf1baa5ec6f193b47785bbfff2ef0c4f6ee39a4f689c3f58797` | 89.650000 seconds; 1280×720; H.264; constant 60 fps; 5,379 frames; stereo AAC at 48 kHz |
| `docs/demo/protocol-mirror-final-voiceover.m4a` | `deda8c80e6032b989f9da01250dc3012e91d8a7dba2632faa1908dd6791120c4` | 88.900000 seconds; processed ElevenLabs Chris voice; stereo AAC at 48 kHz |
| `docs/demo/protocol-mirror-elevenlabs-chris-source.mp3` | `161ac9090cebff12f635137fe6ceb15044f42bc8b15ffe42178c377e7da1f9a7` | 93.753438-second ElevenLabs source; Chris, Multilingual v2, default settings recorded in the voice-direction file |
| `docs/demo/protocol-mirror-final-captions.srt` | `99554c275b7862f417f05d70caf6331763b193085b07506853ab0216322f8600` | 19 monotonic English cues; final cue ends at 88.543 seconds; owner must inspect timing against the processed upload |
| `docs/demo/title-card.png` | `f2c30941c47ae9e920933a7e35a1920165f8fa8224cec63ba2a303b26fa4a7bf` | 1280×720 upload thumbnail |

Automated candidate checks found no black segment of 0.4 seconds or longer, no silence of 1.5 seconds or longer, and no variable-frame-rate cadence at the tested thresholds. Audio measured −16.66 LUFS integrated and −4.27 dBTP. These checks do not replace the project owner's complete watch with sound.

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

1. Resolve the narration rights gate: regenerate after the ElevenLabs account is on a plan that explicitly includes a commercial license, or replace the narration with an owner-recorded track; then re-verify the resulting media.
2. Watch and approve the complete cleared local candidate with sound; request any voice, timing, or edit changes before upload.
3. Acknowledge the current official rules and personally confirm age, residence, exclusions, originality, rights, submitter type, and New-versus-Existing project status.
4. Upload the approved video as a publicly visible YouTube video and watch the processed upload end to end.
5. Provide the final YouTube URL and required personal Devpost answers.
6. Create/review the Protocol Mirror Devpost project and inspect the final authenticated preview.
7. Submit only after the separate explicit `yes, submit` confirmation, then preserve the receipt and keep all judging URLs unrestricted through the judging period.

## Post-manifest real-world evaluation

The later local candidate adds a 24-pair real-world evaluation manifest, 48/48 successful live WebMCP source calls, two raw blinded local-model runs, a strict exact-locator/quote scorer, four scorer and artifact-integrity tests, and a judge-visible reality-check section. The current deterministic suite is therefore 42 tests. The two runs showed opposite directional bias and materially different unsupported-claim rates, reinforcing the human-authority design without establishing universal hallucination or clinical-accuracy claims. These additions are local and are not public evidence until the repository and application are explicitly pushed and deployed.
