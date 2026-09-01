# Official WebMCP Challenge requirements snapshot

Checked again on 2026-09-01 at 13:54 UTC through the authenticated Devpost Hackathons integration. The live overview, formal rules, submission requirements and field schema, judging criteria, key dates, prizes, and both host announcements were retrieved with `data_completeness: complete`. The account is registered for The WebMCP Challenge, submissions are open, and the authenticated project list contains no Protocol Mirror project.

Sources:

- Challenge overview: https://webmcp.devpost.com/
- Official rules: https://webmcp.devpost.com/rules
- Submission resources and FAQs: https://webmcp.devpost.com/resources

The official rules hosted on Devpost prevail if anything below changes or conflicts with this snapshot or other event-page copy.

## Current schedule

- Registration and submission close September 3, 2026 at 1:00 PM Pacific Time, displayed by Devpost as 4:00 PM EDT for this account locale.
- Judging is scheduled from September 4, 2026 at 10:00 AM Pacific Time through September 21, 2026 at 5:00 PM Pacific Time.
- Winners are scheduled to be announced on or around September 23, 2026 at 2:00 PM Pacific Time.

## Eligibility snapshot

- Individuals must be above the age of majority in their country of residence and reside where OpenAI API access is supported.
- Teams must consist of eligible individuals; eligible organizations must be organized or incorporated in supported countries and appoint an eligible representative.
- The official rules exclude listed jurisdictions and conflict categories. Eligibility must be checked against the current official rules before the owner acknowledges or enters.
- Registration remains confirmed for the authenticated account, and submissions remain open.

## Project requirements relevant to Protocol Mirror

- Build a WebMCP-powered web application where people and agents interact, collaborate, and create together.
- The project must run consistently as depicted in its description and video.
- A project must be new during the submission period or clearly document meaningful WebMCP work added during the period. Protocol Mirror's public commit history begins during the displayed submission period.
- Third-party SDKs, APIs, data, and assets must be used under their applicable terms and licenses.
- The working project must remain available free of charge and without restriction for judging through the end of the judging period.

## Required entry materials

- A working live URL judges can access in ChatGPT's in-app browser or a WebMCP-enabled Chrome build.
- A text description explaining why the use case fits WebMCP, how it improves the user experience, what people and agents can do together, and how WebMCP was implemented.
- A public GitHub, GitLab, or Bitbucket repository containing all required source, assets, and functional instructions.
- A detectable open-source license visible in the repository's top-level presentation.
- A publicly visible YouTube demo shorter than three minutes, with audio explaining the project and its WebMCP usage.
- English entry materials, or English translations when another language is used.
- Testing access and any necessary credentials; Protocol Mirror is intentionally public and requires no credentials.

The live form currently requires Submitter Type (`28249`), country or countries of residence (`28250`), App Status (`28252`), live URL (`28254`), public repository URL (`28256`), tested agents or clients (`28257`), AI tools used (`28258`), learning level (`28259`), and whether the entrant gained career-relevant AI value (`28260`). Organization name (`28251`), Existing-project extension explanation (`28253`), and private testing instructions (`28255`) are conditional or optional fields.

The demo must not use copyrighted music, third-party trademarks, or other protected material without permission. The Protocol Mirror recording plan uses spoken narration and the project's own interface only.

## Judging criteria

The four Stage 2 criteria are equally weighted on a five-point scale:

1. **WebMCP Leverage** — non-trivial, skillful use of the WebMCP capability surface.
2. **Execution** — a coherent, complete working product rather than only a technical proof of concept.
3. **Potential Impact** — a credible case for a specific audience and real problem supported by what is demonstrated.
4. **Creativity & Ambition** — a novel concept that differs meaningfully from existing ideas.

The tie-break begins with WebMCP Leverage, then proceeds through the remaining criteria in the listed order. Stage 1 is a pass/fail check for theme viability and reasonable use of the required capability.

Participant count is not a submission count, and unreleased entries cannot be evaluated. The official integration reports no competition tracks.

## Prize snapshot

Ten winners receive $3,500 cash each ($35,000 total) plus the sponsor benefits listed on Devpost. Prize and tax eligibility remain governed by the official rules.

## Current evidence and gaps

| Requirement | Evidence | Status |
| --- | --- | --- |
| New or meaningfully extended project during the event period | Public Git history begins 2026-08-29, but the owner must attest New versus Existing and originality | Owner confirmation required |
| Non-trivial WebMCP implementation | Six initial state-aware tools, dynamic seventh receipt tool, schemas, authority boundary, live public-source and review rehearsal | Ready |
| Public source and functional instructions | Public repository, README, lockfile, CI | Ready |
| Detectable open-source license | GitHub API reports MIT; top-level `LICENSE` is tracked | Ready |
| Screenshots | Seven production-mode desktop/mobile assets, including permanent seven-tool reviewed state and the benchmark panel | Ready |
| Text description | Root `devpost-submission.md` packet | Ready |
| Working live URL | `https://protocol-mirror.vercel.app`; six-before/seven-after tool lifecycle and live source reads verified in Codex browser | Ready |
| Public YouTube demo under three minutes with audio | Verified 1:53.30 benchmark-forward constant-60-fps local candidate uses documented Apache-2.0 Kokoro-82M narration and has aligned captions; owner watch and public upload remain | Missing |
| Devpost registration | Authenticated integration reported `registered` and `submissions_open` on 2026-09-01 at 13:54 UTC | Ready |
| Devpost project/form access | Authenticated list contained three unrelated projects and no Protocol Mirror project; creation and final field review remain | Missing |

The latest host announcement warns that the project, video, repository, team, and entry should be treated as frozen at the deadline. The official rules permit only narrowly authorized corrections after the period. Final text, images, URLs, teammate membership, and the processed YouTube video therefore need end-to-end review before the deadline.

## Final revalidation

Immediately before entry, re-open both source pages, confirm the account is registered and eligible, confirm the displayed deadline and fields, exercise the permanent live URL, watch the complete public video with audio, and save the final Devpost confirmation receipt.
