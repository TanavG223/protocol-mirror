# Third-party rights review

Checked on 2026-08-31 in the Codex in-app browser. This is a practical release gate, not legal advice.

## Current Kokoro narration

The benchmark-forward candidate replaces the unresolved ElevenLabs Free-plan output with a locally generated `af_heart` voice from [`hexgrad/Kokoro-82M`](https://huggingface.co/hexgrad/Kokoro-82M). The official model card was checked on 2026-09-01 and labels the model and weights Apache-2.0, explicitly describes production deployment, and states that its training audio was permissive or non-copyrighted. Exact model identity, displayed model hash, package version, voice, rates, and processing are recorded in `docs/demo/KOKORO_NARRATION_PROVENANCE.md`.

This resolves the identified ElevenLabs account-tier problem for the current local candidate. It does not replace the project owner's duty to listen to and approve the complete output, answer YouTube's synthetic-media prompt truthfully, or obtain legal advice if desired.

## Preserved ElevenLabs technical candidate

Current official sources:

- Terms of Service (non-EEA), last updated 31 March 2026: https://elevenlabs.io/terms-of-use
- Pricing: https://elevenlabs.io/pricing
- Voice Library Addendum, last updated 6 March 2026: https://elevenlabs.io/vla

The Terms state that a Free User “may only use the Services for non-commercial purposes,” while a Paid User “may use the Services for commercial purposes,” subject to the Terms and Prohibited Use Policy. The pricing page lists 10,000 monthly credits for Free and first lists “Commercial License” under Starter. The authenticated generation session displayed exactly 10,000 credits before generation, which strongly indicates Free-plan generation.

The hackathon offers cash prizes and requires entrants to grant promotional usage rights. Whether that particular use is legally “commercial” is not determined here. The conservative release decision is therefore:

- Do not upload or submit the preserved ElevenLabs candidate as rights-cleared.
- If using ElevenLabs, move to a plan explicitly including a commercial license and regenerate the narration after the paid plan becomes active. Do not assume an upgrade retroactively licenses an earlier Free-plan output.
- Alternatively, replace the narration with an owner-recorded track whose rights are unambiguous.
- Re-run every media checksum and continuity check after replacement.

The Voice Library Addendum says outputs generated before a shared voice model is removed continue to exist and remain available for use, but all use remains subject to the main Terms. It does not override the Free User non-commercial restriction.

## Other media

- Music: none.
- Interface visuals and overlays: created for Protocol Mirror.
- Thumbnail: created for Protocol Mirror.
- Clinical-trial demo records: fictional and labeled; live adapters retrieve bounded public metadata from ClinicalTrials.gov and PubMed.
- Open-source dependencies: governed by their tracked licenses and lockfile; the project repository uses MIT.
