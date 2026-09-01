# SOP: change and verify Protocol Mirror

Use this procedure for any non-trivial product or release change.

## 1. Establish current truth

- Run `git status --short` and preserve unrelated user changes.
- Read `.agent/README.md`, then only the routed canonical documents for the task.
- Reproduce the actual runtime or failing behavior before editing when applicable.
- If a fact can drift—rules, deployment, dependency advisories, or a public API—verify it through the permitted current source.

## 2. Define the invariant and evidence

- State the behavior that must remain true.
- Identify the code path, test, browser state, or artifact that would prove the change.
- For WebMCP changes, explicitly check the human-only decision boundary and six-to-seven tool lifecycle.
- For benchmark changes, protect raw outputs, exact identifiers, locators, quotes, and run-specific limitations.

## 3. Make the smallest complete change

- Modify the real implementation, not a parallel mock.
- Add or update deterministic tests for the behavior and failure path.
- Keep UI feedback visible to both agent and reviewer; preserve reduced-motion and keyboard behavior.
- Do not broaden clinical, accuracy, security, deployment, or submission claims beyond evidence.

## 4. Verify proportionally

1. Run the nearest targeted tests while iterating.
2. Run `git diff --check` and inspect the full diff.
3. Run `npm run check`.
4. For release-impacting work, commit locally and run `npm run preflight:product` on the clean exact commit.
5. Restart the production server and verify the affected path in the Codex in-app browser. Check console logs and responsive overflow when UI changed.

## 5. Update proof and handoff

- Update the canonical verification, release, benchmark, or submission document only when its evidence changed.
- Update `.agent/` only if stable routing, architecture, an active task, or this SOP changed.
- Report the exact commit, tests run, browser evidence, remaining limitations, and any external owner gate.
- Never push, deploy, upload, or submit without the authorization required by `../tasks/submission-readiness.md`.
