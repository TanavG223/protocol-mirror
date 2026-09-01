# SOP: maintain the agent context system

The `.agent` directory should reduce context cost and repeated discovery. It must not become a second, stale documentation tree.

## Update triggers

- Update `system/architecture.md` only when a stable runtime surface, tool lifecycle, trust invariant, or claim boundary changes.
- Update `tasks/submission-readiness.md` when the authoritative packet, proven deliverables, proof sequence, or owner gates change.
- Add an SOP only after a repeatable process or a validated failure pattern exists.
- Update `README.md` when task routing or canonical ownership changes.

## Rules

1. Prefer pointers to canonical files over copied implementation detail or metrics.
2. Keep each file short enough to read completely in one pass.
3. Never store credentials, personal Devpost answers, raw benchmark dumps, generated build output, or media binaries here.
4. Never describe planned work as completed. Link to the evidence that proves completion.
5. Remove obsolete routing instead of keeping historical branches. Detailed history belongs in Git and the release evidence documents.
6. After editing, verify every referenced path exists and run `git diff --check`.
