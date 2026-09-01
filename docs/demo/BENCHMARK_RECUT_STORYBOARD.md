# Benchmark recut storyboard

Target runtime: 1:45–1:55. Hard limit: under three minutes. This plan produced the current 1:53.30 local candidate and supersedes the preserved 1:29 technical master because it shows the real-world stress test without rushing the evidence or authority-boundary explanation.

The current render uses locally generated Kokoro-82M narration with Apache-2.0 model-card provenance recorded in `KOKORO_NARRATION_PROVENANCE.md`. The owner must still complete a full watch with sound before upload. Do not substitute the preserved Free-plan ElevenLabs track.

## 0:00–0:10 — Hook

- Start on the title card, then reveal the live connected page.
- On-screen line: **What happens when models disagree on consequential evidence?**
- Keep the production URL and **WebMCP connected · 6 tools** visible.

## 0:10–0:32 — Real-world stress test

- Use `docs/screenshots/07-real-world-benchmark.png` full-frame with a restrained 2–3% push-in.
- Highlight, in order: **24 real NCT/PMID pairs**, **48/48 live WebMCP reads**, then the 4B and 9B directional-bias cards.
- Leave the disclaimer visible. Do not animate the metric values as if they were live counters.

## 0:32–0:55 — Typed evidence, not pixel guessing

- Show the registered/reported comparison and exact evidence drawer.
- Show the agent calling `get_audit_state` and `get_evidence_spans`.
- Keep both exact locators visible long enough to read.

## 0:55–1:15 — Agent proposal, human-only decision

- Show `propose_outcome_mapping`, then `request_human_review` moving focus to the checkpoint.
- Pause on the evidence-linked proposal.
- The human—not the agent—clicks **Accept** once.

## 1:15–1:30 — Dynamic capability proof

- Hold on the change from six tools to seven.
- Call `export_review_receipt` and show that staged work is excluded.
- Show the exact locators and the human-downloadable JSON action.

## 1:30–1:50 — Live intake and close

- Show the two live-source tools and reviewer-visible source intake.
- Return to the stress-test or hero panel for the final line.
- Close on: **AI assembles evidence. A human decides.**

## Editorial acceptance checks

- Constant 60 fps, 1280×720 or higher, H.264/AAC, no inserted black frames, and no silence longer than 1.5 seconds.
- Spoken numbers match the tracked benchmark artifacts exactly.
- The run-specific disclaimer is visible while model metrics are narrated.
- The agent never accepts or rejects a proposal.
- The six-to-seven tool transition and reviewed-only receipt are visible, not merely narrated.
- The owner watches the complete cleared local master with sound before any upload.
