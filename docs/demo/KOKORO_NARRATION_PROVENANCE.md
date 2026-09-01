# Kokoro narration provenance

The benchmark-forward local candidate uses the `af_heart` voice from [`hexgrad/Kokoro-82M`](https://huggingface.co/hexgrad/Kokoro-82M), model release v1.0, through `kokoro==0.9.4`.

The official model card was checked on 2026-09-01. It labels the model and weights Apache-2.0, describes the weights as suitable for production deployment, and states that the training audio was permissive or non-copyrighted. The model's displayed SHA-256 is `496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4`.

Generation settings:

- source text: `docs/demo/BENCHMARK_RECUT_NARRATION.txt`
- language: American English (`lang_code="a"`)
- voice: `af_heart`
- synthesis speed: `1.04`
- rendered source rate: 24 kHz mono PCM
- release tempo adjustment: `1.095`
- release processing: high/low-pass filtering, gentle compression, EBU R128 loudness normalization, 48 kHz stereo AAC

This provenance replaces the unresolved ElevenLabs Free-plan rights path for the benchmark-forward local candidate. It records the model-card evidence consulted; it is not legal advice. The project owner must still listen to and approve the complete narration and final video before upload.
