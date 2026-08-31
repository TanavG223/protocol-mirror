# YouTube upload metadata

## Final local master — pending regeneration

- File: `docs/demo/protocol-mirror-final-demo.mp4`
- Status: the tracked 30 fps/Reed version is superseded and must not be uploaded
- Target: H.264, 1280×720, constant 60 fps, AAC stereo at 48 kHz
- Narration: owner-approved ElevenLabs generation following `docs/demo/ELEVENLABS_VOICE_DIRECTION.md`
- Music: none
- Current visual preview: 89.65 seconds, 5,379 frames, constant 60 fps, 31,900,676 bytes; no black segment of 0.4 seconds or longer and no silence of 1.5 seconds or longer at the tested thresholds
- Thumbnail SHA-256: `f2c30941c47ae9e920933a7e35a1920165f8fa8224cec63ba2a303b26fa4a7bf`

The preview checks confirm visual timing, codec, cadence, and continuity properties; they do not validate the pending ElevenLabs narration. After generation, refresh every checksum and media measurement, then have the project owner watch the complete master with sound and watch the processed public YouTube upload end to end before using its URL in the entry.

## Title

Protocol Mirror — Human-Agent Clinical-Trial Transparency with WebMCP

## Description

AI assembles evidence. A human decides.

Protocol Mirror explores a harder WebMCP question: how should humans and agents work together when the agent is useful but should not have final authority? It is a WebMCP-native clinical-trial transparency workspace where an agent reads exact source evidence, stages a structured comparison, and hands the final decision to a human reviewer.

Live app: https://protocol-mirror.vercel.app

Public source (MIT): https://github.com/TanavG223/protocol-mirror

Background evidence cited in the narration: Chen et al., JAMA Network Open (2019): https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/

The demo shows the permanent production deployment, six initial typed WebMCP tools, an evidence-linked agent proposal, a human-only accept/reject checkpoint, and the dynamic seventh tool that exports only reviewed decisions with exact source locators. The application also exposes bounded live-source adapters for ClinicalTrials.gov and PubMed.

Protocol Mirror is a research-transparency aid. It is not medical advice, a clinical decision system, a finding of research misconduct, or a clinically validated detector.

Built for The WebMCP Challenge.

## Upload settings

- Custom thumbnail: `docs/demo/title-card.png`
- Visibility: Public
- Audience: No, it is not made for kids
- Category: Science & Technology
- Language: English
- Synthetic media disclosure: narration uses a synthetic ElevenLabs voice; answer YouTube's current disclosure prompt truthfully
- Music: none
