# Submission release runbook

This runbook starts from a clean, CI-verified `main` branch.

## 1. Claim the permanent deployment

This step changes external state and requires the project owner's explicit confirmation at action time.

1. Import `https://github.com/TanavG223/protocol-mirror` into Vercel.
2. Keep the detected Next.js defaults. The current application requires no environment variables.
3. Deploy the `main` branch and record the permanent HTTPS URL.
4. Do not describe the app as deployed until the URL passes the checks below.

## 2. Verify the deployed build

- Home page returns HTTP 200 over HTTPS.
- Header shows **WebMCP connected** in the Codex in-app browser.
- Exactly six tools exist initially; the export tool appears as the seventh only after a human decision.
- Stage, focus, accept, undo, re-accept, and export complete without console errors.
- The receipt excludes staged proposals.
- Invalid live-source identifiers return the documented structured 400 response.
- CSP, anti-framing, MIME-sniffing, referrer, and permissions headers remain present.
- A 390-pixel viewport has no horizontal overflow.

Record the URL and verification date in `README.md`, `docs/SUBMISSION_DRAFT.md`, and `docs/BROWSER_VERIFICATION.md`, then run `npm run check`, commit, push, and wait for green CI.

## 3. Record and publish the demo

1. Follow `docs/DEMO_SCRIPT.md` against the verified permanent URL.
2. Export at 1080p when practical and confirm the final runtime is under three minutes.
3. Watch the complete upload with sound before making it public or unlisted as allowed by the rules.
4. Put the live app and public repository links in the video description.
5. Replace the pending demo-video line in `docs/SUBMISSION_DRAFT.md` with the final URL.

## 4. Complete the Devpost entry

- Paste the narrative from `docs/SUBMISSION_DRAFT.md` and preserve its truthful-claim guardrail.
- Add all five files from `docs/screenshots/` in narrative order.
- Put the permanent app URL in **Try it out** and repeat the public source URL in the description.
- Add the public video URL and repository license URL.
- Re-open the official rules immediately before submission and verify the displayed deadline, eligibility, required fields, public-access requirements, and video limit.

## 5. Freeze and archive evidence

- Run `npm ci`, `npm run check`, and `npm audit --omit=dev --audit-level=high` from a clean checkout.
- Confirm GitHub Actions is green for the submitted commit and the working tree is clean.
- Save the submitted Devpost URL, live URL, video URL, commit SHA, and a screenshot of the final confirmation page.
- Avoid post-deadline deployment or repository changes unless the official rules explicitly allow them.
