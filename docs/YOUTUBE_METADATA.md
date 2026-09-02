# YouTube upload metadata

## Final local candidate

- File: `docs/demo/protocol-mirror-submission-demo.mp4`
- Status: **do not upload** until the project owner watches and explicitly approves the complete master with sound
- SHA-256: `237762f907b27f9be1e6a4bb88f94f483f5f2190903c3984371839f8583a89ff`
- Duration: 113.300000 seconds
- Video: H.264, 1920×1080, constant 60 fps, 6,798 frames
- Audio: AAC stereo, 48 kHz, integrated −16.4 LUFS, true peak −4.2 dBTP
- Narration: locally generated Kokoro-82M v1.0 `af_heart`; model-card license provenance and exact settings in `docs/demo/KOKORO_NARRATION_PROVENANCE.md`
- Music: none
- File size: 104,644,963 bytes
- Automated continuity checks: no black segment of 0.4 seconds or longer; no silence of 1.5 seconds or longer below −40 dB; no variable-frame-rate cadence
- Thumbnail SHA-256: `f2c30941c47ae9e920933a7e35a1920165f8fa8224cec63ba2a303b26fa4a7bf`

These checks confirm timing, codec, cadence, continuity, captions, representative frames, and measured audio properties; they do not replace human editorial review. The project owner must watch and approve the complete local candidate with sound, then watch the processed public YouTube upload end to end before using its URL in the entry.

This candidate includes the 24-pair real-world stress-test panel and supersedes the preserved 1:29 technical master for submission.

This file currently describes the **narrated slideshow fallback**: still frames with animated overlays and synthetic narration, not a screen recording. If a live screen recording of the real-pair loop replaces it, keep the title and description below and re-time the chapters against the new cut.

## Title

Protocol Mirror — Did the trial publish what it registered? (WebMCP)

## Description

Did the trial publish what it registered? Your agent pulls ClinicalTrials.gov and PubMed, quotes exact spans. You decide.

Live app: https://protocol-mirror.vercel.app
Source (MIT): https://github.com/TanavG223/protocol-mirror

The loop: the agent loads a real ClinicalTrials.gov record and its PubMed publication through WebMCP tools on the page, quotes the registered and reported text with exact source locators, and stages a discrepancy proposal — then a human accepts or rejects it, and only that decision registers the seventh tool the agent uses to export the reviewed receipt.

Benchmark: on 24 real NCT/PMID pairs, 48/48 live reads through the page's own WebMCP tools returned the requested record with non-empty evidence (172 outcomes, 106 abstract sections); two local models given the same evidence failed in opposite directions, which is the argument for keeping the decision human. Run-specific and abstract-only, not clinical validation.

Background: Chen et al., JAMA Network Open (2019) — 389 randomized trials sampled from PubMed and Embase, no restriction by journal: https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/

Protocol Mirror is a research transparency aid. It is not medical advice, a clinical decision system, or a finding of research misconduct.

Built for The WebMCP Challenge.

## Chapters

Timestamps are placeholders until the live recording is cut; replace each one with the real time and keep the first chapter at 0:00 so YouTube renders the list.

```text
0:00 The question: did the trial publish what it registered?
0:00 Live records: ClinicalTrials.gov and PubMed through WebMCP tools
0:00 Exact evidence: quotes and source locators
0:00 The agent proposes — and cannot decide
0:00 The human decides
0:00 The seventh tool appears
0:00 Undo takes it away again
0:00 Stress test: 24 real pairs, opposite model bias
```

## Upload settings

- Custom thumbnail: `docs/demo/title-card.png`
- Captions: upload `docs/demo/protocol-mirror-submission-captions.srt`, select English, then inspect all 23 cues in YouTube's editor
- Visibility: Public
- Audience: No, it is not made for kids
- Category: Science & Technology
- Language: English
- Synthetic media disclosure: narration uses a synthetic Kokoro-82M voice; answer YouTube's current disclosure prompt truthfully
- Music: none
