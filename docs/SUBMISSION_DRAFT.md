# Devpost submission draft

> The canonical form-ready packet is now `devpost-submission.md` in the repository root. This file remains the concise narrative source.

## Project name

Protocol Mirror

## Tagline

AI can surface the discrepancy. Only a human can decide what it means.

## One-sentence summary

Protocol Mirror is a WebMCP-native review workspace where an agent compares registered clinical-trial outcomes with published reports, stages evidence-linked discrepancies, and hands every conclusion to a human reviewer.

## Inspiration

Clinical-trial registries capture what researchers planned to measure; publications capture what readers ultimately see. Comparing those records is valuable but slow, detail-heavy work. A generic AI summary can make the problem worse by collapsing uncertainty and citations into one confident paragraph. We wanted an agent to help with the tedious comparison while making its limits more visible—not less.

## Evidence of need

A 2019 cross-sectional study of 389 trials published in high-impact journals found that 130 had at least one primary-outcome change between registration and publication. Of those 130 trials, 66 involved a registered primary outcome that was not reported or was omitted. Protocol Mirror does not assume that every change is improper; it makes the comparison and its evidence reviewable. [Chen et al., *JAMA Network Open*](https://pmc.ncbi.nlm.nih.gov/articles/PMC6646984/)

## What it does

Protocol Mirror places registered and reported outcomes side by side. Through WebMCP, an agent can read stable outcome IDs, retrieve exact evidence spans, stage a mapping or non-match, and focus the relevant review card. The focus request moves keyboard focus to the review region, keeping the agent's handoff perceivable for keyboard and assistive-technology users. Every proposal includes a discrepancy category, rationale, evidence IDs, and confidence.

The agent cannot accept or reject its own conclusion. A person reviews the source spans in the same interface and makes the decision. Only reviewed decisions appear in the exportable audit receipt, and that export capability is registered dynamically after a human decision exists.

The current app ships with a deterministic fictional case so the core demo never depends on network availability. Validated server adapters also retrieve normalized outcomes from ClinicalTrials.gov and structured abstract sections from PubMed.

## How we built it

- Next.js 16 and React 19 for the application and server routes
- Browser-native WebMCP tools registered through `document.modelContext`
- Live ClinicalTrials.gov and PubMed reads exposed as bounded, untrusted-content WebMCP tools
- Narrow JSON schemas, `readOnlyHint`, `untrustedContentHint`, and abort-signal lifecycle management
- Zod validation for ClinicalTrials.gov records and stable error envelopes
- `fast-xml-parser` for PubMed XML
- GSAP for short, state-linked interface transitions with a complete reduced-motion opt-out
- Vitest contract tests and a GitHub Actions verification workflow
- A custom responsive “forensic editorial” interface with evidence threads, visible human checkpoints, focus states, and reduced-motion support

## WebMCP leverage

WebMCP is the coordination layer, not an add-on. The agent and reviewer operate on the same live audit state. Tools expose semantic outcome IDs and evidence locators instead of forcing brittle page scraping. Agent writes are deliberately limited to staged proposals. Tool availability changes with application state: the reviewed-receipt export is absent initially and appears only after human-reviewed work exists.

## Challenges

The hardest design problem was authority, not extraction. A tool that lets an agent directly label an outcome as “switched” would be easy to demo and unsafe to trust. We split the workflow into atomic read, propose, focus, decide, and export steps. We also treat all registry and publication text as untrusted content and require cited evidence to belong to the selected outcomes.

PubMed abstracts do not provide a canonical outcome schema, so the live adapter preserves structured sections without pretending they are already normalized outcomes. That limitation is part of the product contract.

## Accomplishments

- A complete human–agent review loop exercised through real tool calls in the Codex WebMCP browser
- Dynamic tool registration verified in the live page
- Deterministic offline demonstration data plus bounded live-source adapters
- Evidence-side validation that rejects cross-record IDs, unrelated citations, duplicates, and unknown evidence
- Restrictive production response headers, bounded upstream payloads, and entity-safe XML parsing
- 30 passing deterministic tests, clean lint and TypeScript checks, and a successful production build
- A production-mode Codex-browser rehearsal at desktop and 390-pixel mobile widths with no horizontal overflow or browser errors

## What we learned

Agent-native interfaces become more useful when tools reflect the authority model of the domain. “Can call a function” should not mean “can make the final decision.” WebMCP lets the page publish exactly the capabilities that are safe and relevant at each moment while keeping the human and agent grounded in the same evidence.

## What’s next

- Add a reviewer-approved workflow for turning PubMed sections into candidate reported outcomes
- Persist signed, versioned receipts across sessions
- Evaluate agreement and review time on a preregistered public benchmark
- Support version comparison for registry records updated after study completion

## Required links

- Source: https://github.com/TanavG223/protocol-mirror
- Public repository mirror for the Try it out field: https://github.com/TanavG223/protocol-mirror
- License: https://github.com/TanavG223/protocol-mirror/blob/main/LICENSE
- Live app: https://protocol-mirror.vercel.app
- Demo video: 1:19.61 narrated local master complete; public YouTube upload pending

## Screenshot assets

- `docs/screenshots/01-hero.jpg` — case context, connected WebMCP state, and comparison entry point
- `docs/screenshots/02-comparison.jpg` — registered and reported outcomes linked across the evidence spine
- `docs/screenshots/03-review-queue.jpg` — staged proposals and the human-only accept/reject checkpoint
- `docs/screenshots/04-evidence-drawer.jpg` — agent rationale beside exact source spans and locators
- `docs/screenshots/05-mobile.jpg` — mobile hero, connected WebMCP state, and stacked case metadata
- `docs/screenshots/06-agent-reviewed.png` — public deployment after agent staging and human acceptance, with the seven-tool badge and exact evidence visible

## Truthful-claim guardrail

Do not describe Protocol Mirror as clinically validated, as an automatic detector of research misconduct, or as having measured accuracy. Current evidence supports implementation and contract-test claims only.
