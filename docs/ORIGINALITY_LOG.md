# Originality and provenance log

## Project identity

- Working title: Protocol Mirror
- Repository created: 2026-08-29
- Core concept: a human–agent workbench for comparing registered clinical-trial outcomes with published outcomes
- Signature interaction: exact source spans plus an evidence-bound review queue where agents propose and humans decide

## Source and dependency provenance

- WebMCP API contract and TypeScript declarations: W3C WebMCP work and `webmcp-types`
- Trial source: ClinicalTrials.gov API v2
- Publication source: NCBI PubMed E-utilities
- Framework: Next.js / React
- Validation: Zod
- XML parsing: fast-xml-parser
- State-linked motion: GSAP
- Tests: Vitest

No source code from another hackathon entry was copied. The fictional demonstration trial, publication, outcome descriptions, mappings, and visual design were authored specifically for this project. Reused third-party packages retain their own licenses.

## Claim ledger

Claims allowed now:

- The production build compiles.
- The current deterministic contract suite contains 75 passing tests, including registration-history parsing, the word-level span difference, the real-world grounding scorer, and tracked-artifact integrity.
- A reproducible 24-pair benchmark records 48 successful live WebMCP source reads and two blinded local-model runs with opposite directional biases.
- The page registers WebMCP tools when `document.modelContext` is available, falling back to `navigator.modelContext`; the Codex in-app browser exposed the expected initial tool surface, both live adapters returned public source records, and the reviewed decision exposed the gated receipt tool during verification of the earlier flow on 2026-08-30/31.
- A real ClinicalTrials.gov/PubMed pair can be promoted to the reviewable case from either the agent side or a human-side loader; `scripts/webmcp-smoke.mjs` drove that full loop through `document.modelContext.getTools()`/`executeTool()` in Google Chrome 152.0.7977.65 with `--enable-features=WebMCPTesting` on 2026-09-01, against both a local production build and the public deployment.
- `get_registry_history` reads the public ClinicalTrials.gov registration-version list through a bounded server route and reports the originally registered primary outcomes and the versions in which they changed; `scripts/webmcp-smoke.mjs` drove that loop end to end against a local production build and against https://protocol-mirror.vercel.app in Google Chrome 152.0.7977.65 on 2026-09-02 (commits d77e447 through 74622c3).
- Agent writes create staged proposals only.
- A reviewer's rejection reason and free-text note are readable by the agent through `get_audit_state`.
- Live-source reads expose loading, success, failure, and recovery to the human reviewer without converting source data or errors into reviewed findings.
- The public challenge source is available at `https://github.com/TanavG223/protocol-mirror` under MIT terms.

- On 2026-09-02 the Codex/ChatGPT desktop in-app browser (site tools enabled) ran this loop end to end: the real ACTT-1 case loaded automatically, the registration history showed 25 versions with the three dated changes, the tool count went from seven to eight after a human decision, the rejection reason reached the agent, the agent revised and re-proposed, the receipt carried live-source provenance with a `history/0…` locator, and the case survived a reload. (reported by Codex; recorded in docs/BROWSER_VERIFICATION.md)

Claims not yet allowed:

- Clinical or research-integrity accuracy
- Validated detection of outcome switching
- Performance on a representative clinical corpus beyond the documented 24-pair, abstract-limited grounding benchmark
- Compatibility in every browser
