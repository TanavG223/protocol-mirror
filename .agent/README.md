# Protocol Mirror agent context index

This directory is a selective context router for coding agents. It keeps stable product invariants and repeatable procedures easy to find without loading every release document, raw benchmark run, or media artifact into the active context.

## Start here by task

| Task | Read first | Then inspect |
| --- | --- | --- |
| Product behavior or architecture | `system/architecture.md` | The specific files under `src/` named there |
| WebMCP tool or authority-boundary change | `system/architecture.md` | `src/app/workspace.tsx`, `src/lib/webmcp-tools.ts`, `src/lib/proposal-validation.ts`, and their tests |
| Bug fix, dependency, or refactor | `sop/change-and-verify.md` | The failing path and its nearest tests |
| Real-world benchmark work | `../benchmarks/README.md` | Manifest, scorer, runner, then only the necessary raw run |
| Security change or review | `../docs/SECURITY_MODEL.md` | `../docs/SECURITY_REVIEW.md`, headers, adapters, and validation code |
| Hackathon submission or release | `tasks/submission-readiness.md` | Official snapshot, scorecard, runbook, and form-ready draft |
| Demo video or screenshots | `tasks/submission-readiness.md` | Benchmark recut storyboard, YouTube metadata, and release manifest |
| Update this context system | `sop/update-context.md` | The canonical document whose routing changed |

## Canonical sources

- Product usage and architecture overview: `../README.md`
- Runtime contracts: `../src/lib/contracts.ts`
- WebMCP registration and shared UI state: `../src/app/workspace.tsx`
- Live-source tool definitions: `../src/lib/webmcp-tools.ts`
- Official challenge snapshot: `../docs/OFFICIAL_REQUIREMENTS_SNAPSHOT.md`
- Full product verification: `../docs/BROWSER_VERIFICATION.md`
- Benchmark definitions and limitations: `../benchmarks/README.md`
- Submission copy: `../devpost-submission.md`
- Release gates: `../docs/RELEASE_RUNBOOK.md`

## Context hygiene

1. Treat current files, `git status`, the running build, and official challenge sources as authoritative; this index can drift.
2. Load the minimum routed documents needed for the current task. Do not preload raw model outputs or large media files.
3. Search with `rg` before opening broad files. Read full instruction and contract files once selected.
4. Never compress requirements, schemas, IDs, citations, security evidence, benchmark metrics, credentials, or submission claims.
5. Store detailed proof in the canonical evidence documents. Keep `.agent/` concise, stable, and human-readable.
