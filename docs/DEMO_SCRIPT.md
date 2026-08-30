# Three-minute demo script

Target runtime: 2:45–2:55. Record at 1280 by 720 or higher with browser zoom at 100%, notifications hidden, and the production URL visible at least once. Keep the pointer still while the agent-controlled focus handoff occurs.

## Before recording

1. Open a fresh production session and confirm the header says **WebMCP connected**.
2. Confirm the initial tool list contains exactly four tools and does not contain `export_review_receipt`.
3. Keep `docs/screenshots/01-hero.jpg` available as a fallback title frame.
4. Use the exact prompts below so the workflow is reproducible.

## 0:00–0:20 — The problem

Show the case header and side-by-side outcome record.

“A trial registry captures what researchers planned to measure. A paper captures what readers see. In a 2019 cross-sectional study of 389 trials in high-impact journals, 130 had at least one primary-outcome change between registration and publication. Comparing those records is slow, citation-heavy work—and a confident AI summary can hide exactly the details a reviewer needs.”

On-screen source: Chen et al., *JAMA Network Open* — https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/

## 0:20–0:45 — The WebMCP workspace

Show the WebMCP indicator and use this prompt:

> Inspect the current audit state, then retrieve the exact source spans for the registered systolic-blood-pressure outcome and its reported counterpart. Do not propose or decide anything yet.

“Protocol Mirror turns the live page into a shared, typed workspace. The agent receives stable IDs and source spans rather than scraping the interface. Source text is explicitly untrusted.”

## 0:45–1:20 — Agent stages, human decides

Use this prompt:

> Stage an uncertain mapping between the registered systolic-blood-pressure outcome and the reported systolic-blood-pressure outcome. Cite both exact source spans, explain the measurement and time-point differences, set a calibrated confidence, and request human review. Do not accept or reject it.

“The concepts look similar, but the measurement method and time point differ. The agent can stage this uncertainty with its evidence. It cannot accept its own conclusion.”

Keep the visible keyboard-focus move in the recording: the same tool handoff is perceivable without relying on pointer position or color alone.

Accept the proposal manually, then undo once and accept it again to demonstrate reversibility without leaving the final receipt empty.

## 1:20–1:50 — Discrepancies become legible

Click **Stage guided review**. Show the omitted quality-of-life outcome and introduced response-rate outcome.

“The interface keeps registered intent, reported record, agent rationale, and exact evidence visible together. Reviewers can inspect uncertainty instead of receiving a black-box verdict.”

## 1:50–2:15 — Dynamic capability and receipt

Use this prompt:

> Export the current reviewed receipt and summarize only what the receipt actually contains. Explicitly confirm whether staged proposals were excluded.

“The export tool is dynamically available only when reviewed work exists. Its receipt excludes staged proposals and preserves evidence IDs plus the audit trail.”

## 2:15–2:40 — Live sources and honest boundary

Briefly show the architecture section in the repository README or the validated source routes.

“Live adapters retrieve ClinicalTrials.gov outcomes and PubMed abstract sections with bounded requests and safe failures. The deterministic demo remains available if a public API is down.”

## 2:40–2:45 — Close

“Protocol Mirror makes AI useful precisely where it should not be the final authority.”

## Recording acceptance checks

- Runtime is under three minutes and narration is audible.
- The WebMCP connected state, exact evidence, staged proposal, keyboard-focus handoff, human-only decision, dynamic fifth tool, and reviewed receipt are all visible.
- The recording never calls an agent tool to accept or reject a proposal.
- No clinical-validation, misconduct-detection, or measured-accuracy claim is made.
- The source repository and live-app URLs are included in the video description.
