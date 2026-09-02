# Demo recording plan

The current local candidate is `docs/demo/protocol-mirror-submission-demo.mp4`: a 1:53.30, 1920×1080, constant-60-fps benchmark-forward cut with locally generated Kokoro-82M narration. The narration and shot plan are `docs/demo/BENCHMARK_RECUT_NARRATION.txt` and `docs/demo/BENCHMARK_RECUT_STORYBOARD.md`; exact license provenance and generation settings are in `docs/demo/KOKORO_NARRATION_PROVENANCE.md`.

The plan below and `docs/FINAL_OWNER_DEMO_SCRIPT.md` remain reproducible live-recording fallbacks. No video is upload-approved until the project owner completes the full watch with sound.

This expanded 2:45–2:55 sequence remains a fallback recording plan. Record at 1280 by 720 or higher with browser zoom at 100%, notifications hidden, and the production URL visible at least once. Keep the pointer still while the agent-controlled focus handoff occurs.

## Before recording

1. Open a fresh production session and confirm the header says **WebMCP connected**.
2. Confirm the header says **WebMCP connected · 6 tools** and the initial tool list does not contain `export_review_receipt`.
3. Keep `docs/screenshots/01-hero.jpg` available as a fallback title frame.
4. Use the exact prompts below so the workflow is reproducible.

## 0:00–0:15 — Cold open: working in the first ten seconds

Start on the connected production page and immediately use this prompt:

> Retrieve ClinicalTrials.gov record NCT04280705 and PubMed article 32445440. Summarize only the structured data returned by the tools; do not infer a discrepancy or make a review decision.

As the live records appear inside the reviewer UI, say: “The agent called the page's typed WebMCP tools. The same real source records are now visible to the reviewer—not hidden in a chat transcript.”

## 0:15–0:35 — The problem

Show the case header and side-by-side outcome record.

“A trial registry captures what researchers planned to measure. A paper captures what readers see. In a 2019 cross-sectional study of 389 randomized trials sampled from PubMed and Embase with no restriction by journal, 130 had at least one primary-outcome change between registration and publication. Comparing those records is slow, citation-heavy work—and a confident AI summary can hide exactly the details a reviewer needs.”

On-screen source: Chen et al., *JAMA Network Open* — https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/

## 0:35–0:55 — The real-world stress test

Show `docs/screenshots/07-real-world-benchmark.png` or the live **Real-world stress test** panel.

“We then tested 24 real NCT/PMID pairs. All 48 live WebMCP reads returned the expected record and nonempty evidence. Under the same blinded evidence task, one local model overcalled changes while the other frequently missed them. These are run-specific grounding results—not a universal hallucination or clinical-accuracy claim. Their opposite bias is why the evidence stays inspectable and the consequential conclusion stays human-decided.”

## 0:55–1:10 — The WebMCP workspace

Show the **6 tools** indicator, then ask for the deterministic case's exact systolic-blood-pressure evidence spans. “Protocol Mirror turns the page into a shared, typed workspace. Source text is explicitly untrusted, and live intake never becomes a reviewed finding automatically.”

## 1:10–1:45 — Agent stages, human decides

Use this prompt:

> Stage an uncertain mapping between the registered systolic-blood-pressure outcome and the reported systolic-blood-pressure outcome. Cite both exact source spans, explain the measurement and time-point differences, set a calibrated confidence, and request human review. Do not accept or reject it.

“The concepts look similar, but the measurement method and time point differ. The agent can stage this uncertainty with its evidence. It cannot accept its own conclusion.”

Keep the visible keyboard-focus move in the recording: the same tool handoff is perceivable without relying on pointer position or color alone.

Accept the proposal manually, then undo once and accept it again to demonstrate reversibility without leaving the final receipt empty.

## 1:45–2:05 — Discrepancies become legible

Click **Load 4 example proposals**. Show the omitted quality-of-life outcome and introduced response-rate outcome.

“The interface keeps registered intent, reported record, agent rationale, and exact evidence visible together. Reviewers can inspect uncertainty instead of receiving a black-box verdict.”

## 2:05–2:30 — Dynamic capability and receipt

Use this prompt:

> Export the current reviewed receipt and summarize only what the receipt actually contains. Explicitly confirm whether staged proposals were excluded.

“The seventh tool is dynamically available only when reviewed work exists. Its receipt excludes staged proposals and preserves the exact cited evidence locator plus the audit trail. The human can download the same reviewed JSON directly from the checkpoint.”

## 2:30–2:48 — Live sources and honest boundary

Briefly show the architecture section in the repository README or the validated source routes.

“Live adapters retrieve ClinicalTrials.gov outcomes and PubMed abstract sections with bounded requests and safe failures. The deterministic demo remains available if a public API is down.”

## 2:48–2:55 — Close

“The agent performs the investigation and evidence work. The human remains accountable for the consequential judgment.”

## Recording acceptance checks

- Runtime is under three minutes and narration is audible.
- A real live-source tool action and its visible page result appear in the first 10–15 seconds.
- The WebMCP connected state, benchmark disclaimer, exact evidence, staged proposal, keyboard-focus handoff, human-only decision, dynamic seventh tool, reviewed receipt, and human JSON download are all visible.
- The recording never calls an agent tool to accept or reject a proposal.
- No clinical-validation, misconduct-detection, or measured-accuracy claim is made.
- The source repository and live-app URLs are included in the video description.
