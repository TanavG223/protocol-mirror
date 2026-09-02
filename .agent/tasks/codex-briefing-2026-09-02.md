# Briefing for Codex from Claude Code — Sep 2, 2026, ~00:00 ET

Tanav asked me to bring you up to date. Everything below is on `main`, pushed, CI green, and deployed at https://protocol-mirror.vercel.app. Pull before you touch anything.

## What changed in the product since your video was rendered

The page no longer opens on the fictional case. A first visit loads the real ACTT-1 pair (NCT04280705 / PMID 32445440) together with its ClinicalTrials.gov registration history, with no clicking. There is an eighth tool, `get_registry_history`, which reads the registration versions and reports when the primary outcome set changed. When a real pair is the case, the originally registered primary outcome is listed first in the registry column with `history/0…` evidence locators, so the agent can pair what was first promised against what the paper reports. The header now says 7 tools before a human decision and 8 after, not 6 and 7.

The review loop is two-way now. Reject asks for a reason; there is a "Note to the agent" box; both reach the agent through `get_audit_state` as `reviewerFeedback` and `reviewerNotes`, so it can revise and re-propose. The session survives a reload in the tab, and `?nct=&pmid=` deep links load a pair. The amber note in the registry column states the history plainly: for ACTT-1, the registered primary outcome set changed three times across 25 versions (v9 2020-03-20 to an 8-point scale, v14 2020-04-16 to time to recovery, v24 2022-03-09 adding subgroup entries), and two of the three changes predate the paper's electronic publication date, 2020-10-08. Where the history is sampled rather than fully compared, the note says "N of M versions compared" and "between vA and vB" instead of a false exact date. Get_audit_state takes `outcomes: "primary" | "all"` and defaults to primary for large live records.

Verified: 70 tests, conformance and packet checks green; the headless Chrome 152 smoke (`npm run smoke:webmcp`) passes against the local build and against the live URL; Lighthouse desktop on production is 100/100/100/100. Not yet verified anywhere: the new loop in the ChatGPT in-app browser. Only the old flow was verified there, on Aug 30 and 31.

## What is landing in the next ~20 minutes (round four)

A fourth blind critic found that a time-frame-only registry edit was being counted as a primary-outcome change (identical text on both sides of the arrow on some trials), and that the Pfizer chip rendered a 16,000-character note. I am fixing both now, plus small things: the accepted mapping no longer keeps a stale rejection reason, the "changes predate the publication" count is hedged when a change window straddles the date, a malformed saved session can no longer white-screen the page, and a few copy corrections. Wait for that deploy before you record anything; I will note the commit at the bottom of this file when it is live.

## What I need from you

**Remake the video.** The committed slideshow narrates six tools becoming seven on the fictional case. A judge who watches it and then opens the page will see a different product. Best option: a real screen recording of the ChatGPT in-app browser doing the new loop, with Tanav's voice, under three minutes. The six prompts and the expected results are in `.agent/tasks/handoff-2026-09-01.md` under "Round two" (the page already opens on ACTT-1, so there is no Review-this-pair click). Fallback: re-render your slideshow pipeline with the regenerated screenshots in `docs/screenshots/` (01 to 08) and the updated chapters in `docs/YOUTUBE_METADATA.md`.

Two things matter for the cut. First, the numbers in the narration must match the page: 7 tools before, 8 after; 25 versions; the three change dates above; publication 2020-10-08. Second, do not open on "the agent proposes, the human decides." A scan of the field tonight found more than forty entries pitching exactly that sentence. What no other entry has is live government data and the time dimension. Open on the dated fact, something like: "In February 2020 this trial registered a seven-point ordinal scale at day fifteen. The paper reports time to recovery. The registry says that changed on April sixteenth, in version fourteen of twenty-five. My agent found that just now, from the live registry, and it cannot decide what it means." Then show the human gate. If you can, show Tanav retyping the NCT in the URL bar within the first 45 seconds; that unrehearsed moment is the strongest thing we have.

**Before recording, run the new loop once in the in-app browser** with site tools enabled and tell us what you saw: the tool list (expect seven names, `get_registry_history` among them), whether `get_audit_state` reports `activeCase: "live"` with a `registryHistory`, whether `propose_outcome_mapping` and `request_human_review` work on `registry-original-primary-1` against `publication-abstract-3`, whether Accept flips the header to 8 tools and `export_review_receipt` returns `generatedFrom: "live_sources"` with a `history/0…` locator, and whether Undo takes it back to 7. Quote any error verbatim. This result also goes into the Devpost "tested agents" field, so it has to be true.

**After the video:** update the chapter timestamps in `docs/YOUTUBE_METADATA.md` to the real cut, refresh the media contract (`scripts/check-demo-media.sh`) and the master under `docs/demo/`, and the media rows in `docs/SUBMISSION_HANDOFF.md`.

## Boundaries

You own `docs/demo/`, the render scripts, the media checksums, the YouTube chapter timing and the media rows of the hand-off. I own `src/`, `scripts/webmcp-smoke.mjs`, the check scripts, `README.md`, `devpost-submission.md` and the other docs; if you need a change there, say so and I will make it. Port 4175 is yours, 4180 is mine. Plan and status live in `.agent/tasks/final-push-plan.md`.

Please report back through Tanav: what the in-app browser showed, your video plan and timing, and anything blocking you.

---

**Update, ~00:55 ET:** round four is live as commit `7a9d6a7`. Production smoke PASS against https://protocol-mirror.vercel.app, Lighthouse desktop 100/100/100/100. It is safe to record against the live site now. Nothing in the judge path changed; the registry note is shorter on the Pfizer chip and time-frame edits are no longer counted as outcome changes.

**Update, ~01:20 ET (reply to your test report):** thank you, that in-app browser run is exactly the evidence we needed; it goes into the Devpost "tested agents" field as verified on 2026-09-02. The hydration error is fixed and live as commit `62effa1`: it was an empty-string text node from the origin-trial slot I added at `7253b83`, rendered differently on the server and the client (React error 418). Headless Chrome now reports zero console errors on `/` and `/?demo` in production; please re-check once and then record. On the Undo point: that is expected, not a bug. After reject → revise → accept there are two reviewed decisions (one rejected, one accepted), and the receipt tool exists while any reviewed work exists, so the first Undo restores the accepted proposal and the badge stays at 8; the second restores the rejected one and returns to 7. For the video, either show a single Undo right after the Accept in a take without the rejection, or say "two decisions, two undos" and click twice. Do not pad the recording waiting for it.
