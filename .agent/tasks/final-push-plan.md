# Final push plan (Sep 1 → Sep 3, 2026)

Owner: Tanav. Executors: Claude Code (code, tests, smoke, copy) and Codex (video, media contract, anything Tanav assigns). Deadline: Sep 3, 2026, 1:00pm PT. All agent work stops by 11:00am PT; Tanav submits before noon PT.

Goal: a judge opening the live URL, the video, the README or the Devpost page sees an agent stage evidence-linked proposals against a **real** ClinicalTrials.gov/PubMed pair, sees a human decide, and sees nothing that overstates what shipped.

## Coordination rules (both agents)

- Work on `main`. Commit by explicit path with a message that names the phase. Push after each green phase (`npm run check`). Tanav authorized pushes on Sep 1 ~10:15pm ET.
- Before editing a file, run `git status --short` and `git log -3 --oneline -- <file>`; if the other agent touched it in the last hour, read its change first and extend it rather than replace it.
- Never revert, move, or quarantine the other agent's files. Never rewrite history. Never add new tracked media beyond what Codex's media contract already pins.
- The authority invariant holds: agents retrieve, inspect, cite, stage, focus and export reviewed work; **no agent-callable tool accepts or rejects a proposal.**
- Copy may describe only what shipped and was verified. The Codex/ChatGPT in-app browser is claimed as verified only after Tanav runs the judge path there; Chrome 152 with the WebMCP flag is verified by the headless smoke.

## Phase status

| # | Phase | Owner | Status |
|---|---|---|---|
| 0 | Commit Codex's 1080p60 render and media-contract updates; add this plan | Claude | done (3361c56) |
| 1 | `document.modelContext ?? navigator.modelContext`, console errors instead of silent catches, no tool count in preview mode | Claude | done (db4ea41) |
| 2 | Real pair becomes the reviewable case: "Review this pair" after both live fetches; pair-bound tools re-register on the new ids; honest labels (abstract sections, live provenance); 43-outcome layout; switch guard; enum threshold 20 | Claude | done (e754444); smoke passes locally in headless Chrome 152 |
| 3 | Human-side loading: curated real pairs (ACTT-1 NCT04280705/32445440, Pfizer BNT162b2 NCT04368728/33301246, RECOVERY dexamethasone NCT04381936/32678530) as one-click chips plus an NCT/PMID form, so a judge in plain Chrome can load a real case without an agent | Claude | done (e754444) |
| 4 | Domain-first hero; CTA scrolls to the queue; "Uncertain" label; readable benchmark cards; `release-preflight.sh:85` grep updated | Claude | done (0b49388) |
| 5 | ClinicalTrials.gov `?fields=` projection (fixes NCT04368728 502); upstream 400 → `invalid_identifier` | Claude | done (0b49388); NCT04368728 returns 200 |
| 6 | `scripts/webmcp-smoke.mjs`: headless Chrome 152 + `--enable-features=WebMCPTesting` over CDP; drives `executeTool` through the full loop; asserts 6 → 7 → 6 and `generatedFrom: live_sources`; `npm run smoke:webmcp` | Claude | done (e754444); Chromium passes tool input as JSON strings, executors accept both |
| 7 | Session tool-call log (`role="log"`) and a 7-chip tool roster with `export_review_receipt` locked until a decision | Claude | in progress |
| 8 | Copy: Chen citation ("no restriction by journal"), README six-step judge path with pasteable prompts, Devpost text organized by the four required questions, test-count literal refreshed everywhere `check-submission-packet.mjs` enforces it | Claude | pending |
| 9 | Final `npm run check`, honesty grep, push, live checks (badge, NCT04368728 200), hand-off report | Claude | pending |
| 10 | Conditional: `load_trial_pair` as an eighth tool | Claude | only if 6 and 7 are done |
| V | Real screen recording of the in-app browser doing the real-pair loop, own voice, under 2:30; the 1080p60 slideshow stays as the fallback | Tanav (+Codex for capture help) | pending |
| D | YouTube upload with chapters; Devpost form; submit by noon PT Sep 3 | Tanav | pending |

## Phase 2 design (so either agent can continue it)

- `src/lib/contracts.ts`: `TrialPair` gains `provenance?: "demo" | "live"`, `retrievedAt?: string`. `DEMO_PAIR.provenance = "demo"`.
- `src/lib/live-pair.ts`: `buildLiveTrialPair(trial, article): TrialPair`. Registry outcomes keep adapter ids (`registry-primary-1`), evidence span id `ev-<id>`, quote = exact `title` (+ time frame), locator = adapter locator, url = `trial.sourceUrl`. Publication entries are **abstract sections**, one per section, `role: "other"`, title = section label, description = section text, span quote = section text, locator = adapter locator. `id = live-<nct>-<pmid>`.
- `src/lib/case-tools.ts`: `createCaseTools({ getPair, getAudit, stage, focusReview })` returns the four pair-aware tool definitions (`get_audit_state`, `get_evidence_spans`, `propose_outcome_mapping`, `request_human_review`). Enums are emitted only when an id list has ≤ 20 entries; runtime validation (`validateMappingProposal`) stays authoritative.
- `src/app/workspace.tsx`: `activePair` state (default `DEMO_PAIR`) + `pairRef`; every `DEMO_PAIR` read goes through `activePair`/`pairRef`; effect A registers pair-independent tools once; effect B keyed on `activePair.id` registers `get_evidence_spans` and `propose_outcome_mapping`; `switchPair(pair, detail)` refuses when accepted/rejected work exists, discards staged proposals with a notice, resets audit with a `pair_loaded` event carrying NCT, PMID, source URLs, `retrievedAt`.
- UI: "Review this pair" in the live-intake section when both records are loaded; "Return to demonstration case"; "Load 4 example proposals" disabled while live; passport/column/cite/footer labels switch with provenance; receipt `generatedFrom` = `live_sources` with `sourceUrls`.
- `scripts/check-webmcp-conformance.mjs`: add `src/lib/case-tools.ts` to `sourcePaths`; keep the 7-name list; update the registration call-site expectation.

## Verification commands

- `npm run check` (conformance, submission packet, lint, vitest, build)
- `npm run smoke:webmcp` (after Phase 6; needs Google Chrome 152+)
- `curl -s https://protocol-mirror.vercel.app/api/clinical-trials/NCT04368728 | head -c 200` → `{"ok":true,...}` after Phase 5 deploys
