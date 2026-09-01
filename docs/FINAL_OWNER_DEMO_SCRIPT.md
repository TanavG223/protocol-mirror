# Fallback live owner demo script

Target runtime: 2:30–2:45. Hard limit: under three minutes. The current 1:53.30 edited local master already includes the real-world benchmark; use this script only as a live fallback or when recording an owner-narrated replacement.

## Before recording

- Open `https://protocol-mirror.vercel.app` in a fresh Codex/ChatGPT in-app-browser session with WebMCP site tools enabled.
- Confirm the header reads **WebMCP connected · 6 tools** and `export_review_receipt` is not yet available.
- Confirm no live-source intake is visible before the agent calls the source tools.
- Record at 1280×720 or higher, browser zoom at 100%, notifications hidden, and microphone levels tested.
- Keep the production URL visible near the beginning. Show the agent tool activity and the page response in the same recording.
- Speak naturally. Pause after the two hook lines rather than rushing them.

## 0:00–0:18 — Working product and hook

**On screen:** Start on the connected production page and immediately show the agent calling both live-source tools.

**Prompt the agent:**

> Retrieve ClinicalTrials.gov record NCT04280705 and PubMed article 32445440. Summarize only the structured data returned by the tools; do not infer a discrepancy or make a review decision.

**Say:**

> These are real records retrieved by the agent through the page's WebMCP tools and made visible to the reviewer. This is a complete collaboration loop: the agent investigates, cites, proposes, and packages proof; a human adjudicates the consequential claim.

> AI assembles evidence. A human decides.

## 0:18–0:39 — The real problem

**On screen:** Scroll just enough to show the registered and reported outcome columns. Add a small source caption: “Chen et al., JAMA Network Open (2019) · 389 trials.”

**Say:**

> A clinical-trial registry records what researchers planned to measure. The publication records what readers eventually see. Comparing them is slow, citation-heavy work. A 2019 study of 389 trials found that 130 had at least one primary-outcome change. But a difference is not automatically wrongdoing. Reviewers need evidence and uncertainty—not an AI verdict.

## 0:39–0:58 — Real-world stress test

**On screen:** Show the live **Real-world stress test** panel or `docs/screenshots/07-real-world-benchmark.png`.

**Say:**

> We tested 24 real trial-publication pairs and completed 48 out of 48 live WebMCP source reads. Under the same blinded evidence task, a 4B model overcalled changes while a 9B model frequently missed them. These are run-specific grounding results, not a universal hallucination or clinical-accuracy claim. Their opposite bias is why an agent should assemble evidence without becoming the final authority.

## 0:58–1:17 — Why WebMCP matters

**On screen:** Keep the six-tool badge visible and open the agent tool surface.

**Prompt the agent:**

> Inspect the current audit state and retrieve the exact evidence spans for the registered systolic-blood-pressure outcome and its reported counterpart. Do not propose or decide anything yet.

**Say while the result appears:**

> Protocol Mirror exposes six typed WebMCP tools. The agent reads stable IDs and exact source spans directly from the page instead of guessing from pixels. Registry and publication text is explicitly treated as untrusted evidence.

## 1:17–1:47 — Agent proposes; human authority stays visible

**Prompt the agent:**

> Stage an uncertain mapping between the registered and reported systolic-blood-pressure outcomes. Cite both exact source spans, explain the measurement and time-point differences, use calibrated confidence, and request human review. Do not accept or reject it.

**On screen:** Let the focus handoff move to the review queue. Open the evidence drawer and show both quotations and locators.

**Say:**

> The concepts look similar, but their measurement method and primary time point differ. The agent stages that uncertainty, cites both records, and moves the exact checkpoint into view. It can propose and explain. There is deliberately no agent tool that can accept its own conclusion.

## 1:47–2:05 — The human-only decision

**On screen:** Pause on the Accept and Reject controls, then personally click **Accept**.

**Say:**

> This is the authority boundary. I—not the agent—make the decision. And watch the capability surface: after my review, the page changes from six tools to seven.

## 2:05–2:23 — Dynamic proof, not a black box

**Prompt the agent:**

> Export the reviewed receipt and summarize only what it actually contains. Confirm whether staged proposals were excluded.

**On screen:** Show the receipt result, exact evidence locators, reviewed-only event trail, and the visible **Download reviewed receipt JSON** action.

**Say:**

> The seventh tool exists only when reviewed work exists. Its receipt excludes staged suggestions and preserves the accepted mapping, exact evidence locators, and the audit events that produced it.

## 2:23–2:43 — Reliability and close

**On screen:** Briefly show **Stage guided review**, the live-source tool names, or the architecture section in the README; finish on the hero or reviewed workspace.

**Say:**

> The deterministic case keeps judging reliable, while the agent-retrieved ClinicalTrials.gov and PubMed records remain visible as read-only, untrusted intake. This is a research-transparency aid—not medical advice, a misconduct detector, or a clinical decision system.

> Protocol Mirror does not make the agent passive. It gives the agent the investigation and evidence work—while keeping the consequential judgment accountable to a person.

## Recording acceptance checklist

- The final processed video is public on YouTube, under three minutes, and audible throughout.
- A real live-source tool call and its visible page result appear in the first 10–15 seconds.
- The production URL, connected six-tool state, real-world stress test and disclaimer, exact evidence, focus handoff, human click, seven-tool state, reviewed receipt, and human JSON download are visibly demonstrated.
- The agent is never shown accepting or rejecting a proposal.
- The video makes no clinical-validation, diagnostic-accuracy, or misconduct-detection claim.
- The YouTube description includes the live application and public MIT repository URLs from `docs/YOUTUBE_METADATA.md`.
- Watch the processed YouTube version from beginning to end with sound before adding its URL to Devpost.

## Paste-ready submission hooks

**Tagline:**

> AI assembles evidence. A human decides.

**Opening paragraph:**

> Protocol Mirror turns clinical-trial reporting review into a complete WebMCP collaboration loop. The agent retrieves records, compares outcomes, cites exact evidence, stages a proposal, and focuses the reviewer. A human adjudicates the consequential claim, then the agent packages only the reviewed result.

**Closing line:**

> Protocol Mirror demonstrates that the most trustworthy agent experience is not always the most autonomous one.
