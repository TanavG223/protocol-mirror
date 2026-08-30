# Final owner demo script

Target runtime: 2:10–2:25. Hard limit: under three minutes. This is the final owner-recording plan; any older generated media in `docs/demo/` is reference material only.

## Before recording

- Open `https://protocol-mirror.vercel.app` in a fresh Codex/ChatGPT in-app-browser session with WebMCP site tools enabled.
- Confirm the header reads **WebMCP connected · 6 tools** and `export_review_receipt` is not yet available.
- Record at 1280×720 or higher, browser zoom at 100%, notifications hidden, and microphone levels tested.
- Keep the production URL visible near the beginning. Show the agent tool activity and the page response in the same recording.
- Speak naturally. Pause after the two hook lines rather than rushing them.

## 0:00–0:16 — The hook

**On screen:** Start on the hero, with **WebMCP connected · 6 tools** visible.

**Say:**

> Most AI demos ask, “What can an agent do for a person?” Protocol Mirror asks a harder question: how should humans and agents work together when the agent is useful—but should not have final authority?

> AI assembles evidence. A human decides.

## 0:16–0:37 — The real problem

**On screen:** Scroll just enough to show the registered and reported outcome columns. Add a small source caption: “Chen et al., JAMA Network Open (2019) · 389 trials.”

**Say:**

> A clinical-trial registry records what researchers planned to measure. The publication records what readers eventually see. Comparing them is slow, citation-heavy work. A 2019 study of 389 trials found that 130 had at least one primary-outcome change. But a difference is not automatically wrongdoing. Reviewers need evidence and uncertainty—not an AI verdict.

## 0:37–0:55 — Why WebMCP matters

**On screen:** Keep the six-tool badge visible and open the agent tool surface.

**Prompt the agent:**

> Inspect the current audit state and retrieve the exact evidence spans for the registered systolic-blood-pressure outcome and its reported counterpart. Do not propose or decide anything yet.

**Say while the result appears:**

> Protocol Mirror exposes six typed WebMCP tools. The agent reads stable IDs and exact source spans directly from the page instead of guessing from pixels. Registry and publication text is explicitly treated as untrusted evidence.

## 0:55–1:25 — Agent proposes; human authority stays visible

**Prompt the agent:**

> Stage an uncertain mapping between the registered and reported systolic-blood-pressure outcomes. Cite both exact source spans, explain the measurement and time-point differences, use calibrated confidence, and request human review. Do not accept or reject it.

**On screen:** Let the focus handoff move to the review queue. Open the evidence drawer and show both quotations and locators.

**Say:**

> The concepts look similar, but their measurement method and primary time point differ. The agent stages that uncertainty, cites both records, and moves the exact checkpoint into view. It can propose and explain. There is deliberately no agent tool that can accept its own conclusion.

## 1:25–1:43 — The human-only decision

**On screen:** Pause on the Accept and Reject controls, then personally click **Accept**.

**Say:**

> This is the authority boundary. I—not the agent—make the decision. And watch the capability surface: after my review, the page changes from six tools to seven.

## 1:43–2:00 — Dynamic proof, not a black box

**Prompt the agent:**

> Export the reviewed receipt and summarize only what it actually contains. Confirm whether staged proposals were excluded.

**On screen:** Show the receipt result, exact evidence locators, and reviewed-only event trail.

**Say:**

> The seventh tool exists only when reviewed work exists. Its receipt excludes staged suggestions and preserves the accepted mapping, exact evidence locators, and the audit events that produced it.

## 2:00–2:18 — Reliability and close

**On screen:** Briefly show **Stage guided review**, the live-source tool names, or the architecture section in the README; finish on the hero or reviewed workspace.

**Say:**

> The deterministic case keeps judging reliable, while bounded adapters can retrieve live ClinicalTrials.gov and PubMed records. This is a research-transparency aid—not medical advice, a misconduct detector, or a clinical decision system.

> Protocol Mirror makes AI useful precisely where it should not be the final authority.

## Recording acceptance checklist

- The final processed video is public on YouTube, under three minutes, and audible throughout.
- The production URL, connected six-tool state, real agent calls, exact evidence, focus handoff, human click, seven-tool state, and reviewed receipt are visibly demonstrated.
- The agent is never shown accepting or rejecting a proposal.
- The video makes no clinical-validation, diagnostic-accuracy, or misconduct-detection claim.
- The YouTube description includes the live application and public MIT repository URLs from `docs/YOUTUBE_METADATA.md`.
- Watch the processed YouTube version from beginning to end with sound before adding its URL to Devpost.

## Paste-ready submission hooks

**Tagline:**

> AI assembles evidence. A human decides.

**Opening paragraph:**

> Most agent experiences are designed around delegation: tell the agent what you want, and it performs an action. Protocol Mirror explores a harder WebMCP question—how should humans and agents work together when the agent is useful but should not have final authority? It turns clinical-trial reporting review into a shared, evidence-linked workspace where an agent investigates and proposes while a human retains every consequential decision.

**Closing line:**

> Protocol Mirror demonstrates that the most trustworthy agent experience is not always the most autonomous one.
