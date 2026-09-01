<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Protocol Mirror context routing

For any non-trivial product, benchmark, security, release, or submission change, start with `.agent/README.md`. It is a small task router, not another source of truth: read only the canonical files it points to for the work in scope.

Preserve the product's central authority invariant: agents may retrieve, inspect, cite, stage, focus, and export reviewed work, but no agent-callable tool may accept or reject a proposal. Do not claim clinical validation, universal hallucination rates, or automatic misconduct detection.

After a change, follow `.agent/sop/change-and-verify.md`. Update `.agent/` only when its routing, stable architecture summary, or SOP genuinely changes; put detailed evidence in the existing canonical benchmark and release documents.
