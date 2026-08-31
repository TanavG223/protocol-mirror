# ElevenLabs voice direction

## Delivery

- Warm, grounded, and quietly confident.
- Natural American English; medium pace, roughly 150 to 160 spoken words per minute.
- Editorial documentary tone rather than an advertisement or synthetic assistant.
- Let the two opening questions breathe. Give the central line, “AI assembles evidence. A human decides,” a short pause on each side.
- Slight emphasis on “cannot,” “only reviewed work,” and “never have final authority.”
- Keep technical names clear: pronounce WebMCP as “Web M C P,” ClinicalTrials.gov as “Clinical Trials dot gov,” and PubMed as “Pub Med.”
- Avoid exaggerated enthusiasm, vocal fry, whispering, trailer-style bass, and audible smile on every sentence.

## Generation gate

The owner must listen to the complete generated narration before it is used in the release render. The final render script requires the approved audio through `ELEVENLABS_AUDIO`; it refuses to silently fall back to the macOS draft voice.

## Selected candidate

- Voice: `Chris - Charming, Down-to-Earth`
- Model: Eleven Multilingual v2
- Speed: 1.00
- Stability: 0.50
- Similarity: 0.75
- Style exaggeration: 0.00
- Speaker boost: enabled
- Source duration: 93.753438 seconds
- Release tempo: `VOICE_TEMPO=1.055`, shortening the source by about 5.2 percent without removing narration
