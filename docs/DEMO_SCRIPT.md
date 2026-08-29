# Three-minute demo spine

This is a working script, not the final recording copy.

## 0:00–0:25 — The problem

Show the case header and side-by-side outcome record.

“A trial registry captures what researchers planned to measure. A paper captures what readers see. In a 2019 cross-sectional study of 389 trials in high-impact journals, 130 had at least one primary-outcome change between registration and publication. Comparing those records is slow, citation-heavy work—and a confident AI summary can hide exactly the details a reviewer needs.”

On-screen source: Chen et al., *JAMA Network Open* — https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/

## 0:25–0:55 — The WebMCP workspace

Show the WebMCP indicator and ask the agent to call `get_audit_state`, then `get_evidence_spans`.

“Protocol Mirror turns the live page into a shared, typed workspace. The agent receives stable IDs and source spans rather than scraping the interface. Source text is explicitly untrusted.”

## 0:55–1:35 — Agent stages, human decides

Ask the agent to propose the systolic-pressure mapping and focus it for review. Open the evidence drawer.

“The concepts look similar, but the measurement method and time point differ. The agent can stage this uncertainty with its evidence. It cannot accept its own conclusion.”

Keep the visible keyboard-focus move in the recording: the same tool handoff is perceivable without relying on pointer position or color alone.

Accept or reject the proposal manually. Undo once to demonstrate reversibility.

## 1:35–2:05 — Discrepancies become legible

Stage the guided review. Show the omitted quality-of-life outcome and introduced response-rate outcome.

“The interface keeps registered intent, reported record, agent rationale, and exact evidence visible together. Reviewers can inspect uncertainty instead of receiving a black-box verdict.”

## 2:05–2:35 — Dynamic capability and receipt

Call `export_review_receipt` after a decision.

“The export tool is dynamically available only when reviewed work exists. Its receipt excludes staged proposals and preserves evidence IDs plus the audit trail.”

## 2:35–2:55 — Live sources and honest boundary

Briefly show the validated source routes or architecture diagram.

“Live adapters retrieve ClinicalTrials.gov outcomes and PubMed abstract sections with bounded requests and safe failures. The deterministic demo remains available if a public API is down.”

## 2:55–3:00 — Close

“Protocol Mirror makes AI useful precisely where it should not be the final authority.”
