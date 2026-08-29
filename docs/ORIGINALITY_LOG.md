# Originality and provenance log

## Project identity

- Working title: Protocol Mirror
- Repository created: 2026-08-29
- Core concept: a human–agent workbench for comparing registered clinical-trial outcomes with published outcomes
- Signature interaction: evidence threads plus a staged review queue where agents propose and humans decide

## Source and dependency provenance

- WebMCP API contract and TypeScript declarations: W3C WebMCP work and `webmcp-types`
- Trial source: ClinicalTrials.gov API v2
- Publication source: NCBI PubMed E-utilities
- Framework: Next.js / React
- Validation: Zod
- XML parsing: fast-xml-parser
- Tests: Vitest

No source code from another hackathon entry was copied. The fictional demonstration trial, publication, outcome descriptions, mappings, and visual design were authored specifically for this project. Reused third-party packages retain their own licenses.

## Claim ledger

Claims allowed now:

- The production build compiles.
- The deterministic adapter suite contains 10 passing tests.
- The page registers WebMCP tools when `document.modelContext` is available.
- Agent writes create staged proposals only.

Claims not yet allowed:

- Clinical or research-integrity accuracy
- Validated detection of outcome switching
- Performance on a representative trial corpus
- Successful deployment or compatibility in every browser
