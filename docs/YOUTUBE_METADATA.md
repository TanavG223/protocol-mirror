# YouTube upload metadata

## Final local candidate

- File: `docs/demo/protocol-mirror-submission-demo.mp4`
- Status: **do not upload** until the project owner watches and explicitly approves the complete master with sound
- SHA-256: `275291234fbc9dfb4359d0659ed79fc9833a7db4f15c8cf4357b3a00e089be40`
- Duration: 127.900000 seconds
- Video: H.264, 1920×1080, constant 60 fps, 7,674 frames
- Audio: AAC stereo, 48 kHz, integrated −16.4 LUFS, true peak −4.2 dBTP
- Narration: locally generated Kokoro-82M v1.0 `af_heart`; model-card license provenance and exact settings in `docs/demo/KOKORO_NARRATION_PROVENANCE.md`
- Music: none
- File size: 116,252,754 bytes
- Automated continuity checks: no black segment of 0.4 seconds or longer; no silence of 1.5 seconds or longer below −40 dB; no variable-frame-rate cadence
- Thumbnail SHA-256: `f2c30941c47ae9e920933a7e35a1920165f8fa8224cec63ba2a303b26fa4a7bf`

These checks confirm timing, codec, cadence, continuity, captions, representative frames, and measured audio properties; they do not replace human editorial review. The project owner must watch and approve the complete local candidate with sound, then watch the processed public YouTube upload end to end before using its URL in the entry.

This candidate includes the 24-pair real-world stress-test panel and supersedes the preserved 1:29 technical master for submission.

This file describes the narrated production cut: verified browser captures, restrained camera motion, animated overlays, and synthetic narration. If a continuous live screen recording replaces it, keep the title and description below and re-time the chapters against that cut.

## Title

Protocol Mirror — Did the trial publish what it registered? (WebMCP)

## Description

Did the trial publish what it registered? Your agent pulls ClinicalTrials.gov and PubMed, quotes exact spans. You decide.

Live app: https://protocol-mirror.vercel.app
Source (MIT): https://github.com/TanavG223/protocol-mirror

The loop: the page opens on a real pair — ACTT-1 (NCT04280705) and its NEJM report (PMID 32445440) — with the trial's ClinicalTrials.gov registration history. Seven WebMCP tools initially live on the page. The agent reads what was ORIGINALLY registered (a 7-point ordinal scale at Day 15, first registered 2020-02-20) against what was finally published (time to recovery, after changes in registration versions 9 and 14), quotes both spans with exact source locators, and stages a discrepancy proposal. Only a human decision registers the eighth tool, the one the agent uses to export the reviewed receipt — and a rejection with a reason, or a note to the agent, comes straight back through the audit state so the agent can revise.

Only primary outcome measures are compared across registration versions. A change is a registry fact, not a judgment; it may be legitimate and pre-specified elsewhere.

Benchmark: on 24 real NCT/PMID pairs, 48/48 live reads through the page's own WebMCP tools returned the requested record with non-empty evidence (172 outcomes, 106 abstract sections); two local models given the same evidence failed in opposite directions, which is the argument for keeping the decision human. Run-specific and abstract-only, not clinical validation.

Background: Chen et al., JAMA Network Open (2019) — 389 randomized trials sampled from PubMed and Embase, no restriction by journal: https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/

Protocol Mirror is a research transparency aid. It is not medical advice, a clinical decision system, or a finding of research misconduct.

Built for The WebMCP Challenge.

## Chapters

```text
0:00 A dated ACTT-1 registry change
0:20 Real records and seven WebMCP tools
0:36 Exact evidence and an agent proposal
0:50 An uncertain relationship, visibly grounded
1:03 Human feedback returns to the agent
1:16 Human acceptance unlocks the eighth tool
1:31 Stress test: 24 real pairs, opposite model bias
1:51 The authority boundary
```

## Upload settings

- Custom thumbnail: `docs/demo/title-card.png`
- Captions: upload `docs/demo/protocol-mirror-submission-captions.srt`, select English, then inspect all 24 cues in YouTube's editor
- Visibility: Public
- Audience: No, it is not made for kids
- Category: Science & Technology
- Language: English
- Synthetic media disclosure: narration uses a synthetic Kokoro-82M voice; answer YouTube's current disclosure prompt truthfully
- Music: none
