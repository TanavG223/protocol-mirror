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

## Title

Protocol Mirror — Human-Agent Clinical-Trial Transparency with WebMCP

## Description

AI assembles evidence. A human decides.

Protocol Mirror uses WebMCP for a complete collaboration loop: an agent retrieves records, compares outcomes, cites exact evidence, stages a structured proposal, and focuses the reviewer. A human adjudicates the consequential claim, then the agent can export only the reviewed result.

Live app: https://protocol-mirror.vercel.app

Public source (MIT): https://github.com/TanavG223/protocol-mirror

Background evidence cited in the narration: Chen et al., JAMA Network Open (2019): https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/

The demo shows the Protocol Mirror interface, a 24-pair real-world stress test with 48/48 live WebMCP source reads, six initial typed WebMCP tools, an evidence-linked agent proposal, a human-only accept/reject checkpoint, and the dynamic seventh tool that exports only reviewed decisions with exact source locators. The application also exposes bounded live-source adapters for ClinicalTrials.gov and PubMed.

The two benchmark runs showed opposite directional bias under the same blinded exact-evidence task. These results are specific to the named models, prompt, source snapshots, and run; they are not a universal hallucination rate or clinical-accuracy claim.

Protocol Mirror is a research-transparency aid. It is not medical advice, a clinical decision system, a finding of research misconduct, or a clinically validated detector.

Built for The WebMCP Challenge.

## Upload settings

- Custom thumbnail: `docs/demo/title-card.png`
- Captions: upload `docs/demo/protocol-mirror-submission-captions.srt`, select English, then inspect all 23 cues in YouTube's editor
- Visibility: Public
- Audience: No, it is not made for kids
- Category: Science & Technology
- Language: English
- Synthetic media disclosure: narration uses a synthetic Kokoro-82M voice; answer YouTube's current disclosure prompt truthfully
- Music: none
