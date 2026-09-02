#!/usr/bin/env node
// End-to-end smoke test of the WebMCP surface in a real Chromium build.
//
// Launches Google Chrome headless with the WebMCP testing feature enabled, drives the page's own
// tools through document.modelContext.getTools()/executeTool() (the in-page agent path from the
// W3C draft), performs every human action through the DOM, and asserts the full collaboration loop:
//
//   7 tools registered → the page opens on a real trial (ACTT-1) with its registration history →
//   human returns to the demonstration case → agent fetches trial, publication and registration
//   history → human promotes the real pair → original primary outcome is present → agent reads
//   state, quotes spans, stages a proposal, requests review → human clicks Accept → 8 tools →
//   export_review_receipt reports live_sources → Undo → 7 tools → human rejects with a reason the
//   agent can read → human sends a note → reload keeps the session → Clear session resets →
//   ?nct=&pmid= deep link loads a pair.
//
// Usage: node scripts/webmcp-smoke.mjs [--url=http://127.0.0.1:4180] [--chrome=/path/to/chrome] [--port=9333] [--screenshots=dir]
// Requires Google Chrome 152 or newer. No npm dependency: it speaks the DevTools protocol over
// Node's built-in WebSocket. Chromium's in-page executeTool passes tool input as JSON strings and
// the script tolerates both that and the object form from the draft specification.

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || "true"];
}));
const baseUrl = (args.url ?? "http://127.0.0.1:4180").replace(/\/$/, "");
const chromePath = args.chrome ?? process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = Number(args.port ?? 9333);
const nctId = args.nct ?? "NCT04280705";
const pmid = args.pmid ?? "32445440";

const log = (message) => console.log(`[smoke] ${message}`);
const fail = (message) => { throw new Error(message); };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const profile = mkdtempSync(join(tmpdir(), "protocol-mirror-smoke-"));
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--enable-features=WebMCPTesting", "--force-prefers-reduced-motion", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--window-size=1280,900", "about:blank",
], { stdio: "ignore" });

let ws;
let nextId = 0;
const pending = new Map();
const pageErrors = [];

async function connect() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json());
      ws = new WebSocket(version.webSocketDebuggerUrl);
      await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
      ws.onmessage = (message) => {
        const payload = JSON.parse(message.data);
        // Any uncaught page exception (a hydration mismatch, a render error) fails the run at the end.
        if (payload.method === "Runtime.exceptionThrown") pageErrors.push(payload.params.exceptionDetails.exception?.description ?? payload.params.exceptionDetails.text ?? "unknown exception");
        if (payload.method === "Runtime.consoleAPICalled" && payload.params.type === "error") pageErrors.push(`console.error: ${payload.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ")}`);
        if (payload.id && pending.has(payload.id)) {
          const { resolve, reject } = pending.get(payload.id);
          pending.delete(payload.id);
          if (payload.error) reject(new Error(payload.error.message));
          else resolve(payload.result);
        }
      };
      return;
    } catch {
      await sleep(200);
    }
  }
  fail(`Chrome did not expose the DevTools endpoint on port ${port}`);
}

function send(method, params = {}, sessionId) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

let session;
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, session);
  if (result.exceptionDetails) fail(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(expression, description, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(expression)) return;
    await sleep(150);
  }
  fail(`Timed out waiting for ${description}`);
}

const shotDir = args.screenshots;
if (shotDir) mkdirSync(shotDir, { recursive: true });
async function snap(name, viewportHeight = 900, width = 1280) {
  if (!shotDir) return;
  await send("Emulation.setDeviceMetricsOverride", { width, height: viewportHeight, deviceScaleFactor: 1, mobile: width < 700 }, session);
  await sleep(700);
  const { data } = await send("Page.captureScreenshot", { format: "png" }, session);
  writeFileSync(join(shotDir, `${name}.png`), Buffer.from(data, "base64"));
  log(`screenshot ${name}.png`);
}
const desktop = () => send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, session);

// The page exposes its tools; this script calls them exactly as an in-page agent would.
const agent = `
  (async () => {
    const context = document.modelContext;
    const unwrap = (value) => {
      if (typeof value === "string") { try { return unwrap(JSON.parse(value)); } catch { return value; } }
      if (value && Array.isArray(value.content)) {
        const text = value.content.map((part) => part.text ?? "").join("");
        try { return JSON.parse(text); } catch { return text; }
      }
      return value;
    };
    window.__pm = {
      names: async () => (await context.getTools()).map((tool) => tool.name).sort(),
      call: async (name, input = {}) => {
        const tool = (await context.getTools()).find((candidate) => candidate.name === name);
        if (!tool) throw new Error("tool not registered: " + name);
        let raw;
        try { raw = await context.executeTool(tool, input); window.__pm.mode = "object"; }
        catch (error) {
          if (!/parse input/i.test(String(error))) throw error;
          raw = await context.executeTool(tool, JSON.stringify(input)); window.__pm.mode = "json-string";
        }
        return unwrap(raw);
      },
    };
    return window.__pm.names();
  })()
`;

const clickText = (text) => `(() => { const button = [...document.querySelectorAll("button")].find((candidate) => candidate.textContent.trim().startsWith(${JSON.stringify(text)}) && !candidate.disabled); if (!button) return false; button.click(); return true; })()`;
const setValue = (selector, value) => `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true })); return true; })()`;
const badgeText = `document.querySelector(".connection-badge")?.textContent.trim()`;
const registryColumnHas = (text) => `[...document.querySelectorAll('section[aria-labelledby="registered-title"] .outcome-list h4')].some((node) => node.textContent.includes(${JSON.stringify(text)}))`;
const passportIsLive = `document.querySelector(".case-passport.live") !== null`;

const expectedInitial = ["get_audit_state", "get_evidence_spans", "get_live_clinical_trial", "get_live_pubmed_article", "get_registry_history", "propose_outcome_mapping", "request_human_review"];

async function openPage(url) {
  await send("Page.navigate", { url }, session);
  await waitFor(`document.querySelector(".connection-badge.connected") !== null`, "the WebMCP connected badge");
  const names = await evaluate(agent);
  if (JSON.stringify(names) !== JSON.stringify(expectedInitial)) fail(`expected the seven initial tools, got ${names.join(", ")}`);
  return names;
}

try {
  await connect();
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  session = (await send("Target.attachToTarget", { targetId, flatten: true })).sessionId;
  await send("Runtime.enable", {}, session);
  await send("Page.enable", {}, session);
  await desktop();

  // 1. First visit: seven tools, and the page opens on a real trial with its registration history.
  const names = await openPage(`${baseUrl}/`);
  log(`registered tools: ${names.join(", ")}`);
  if (!(await evaluate(badgeText)).includes("7 tools")) fail("badge does not report 7 tools");
  await waitFor(passportIsLive, "the default real trial (ACTT-1) to load", 30000);
  const opening = await evaluate(`window.__pm.call("get_audit_state")`);
  if (opening.activeCase !== "live" || opening.pair.nctId !== nctId) fail(`expected the page to open on ${nctId}, got ${JSON.stringify(opening.pair)}`);
  if (!opening.registryHistory?.primaryOutcomeChanged) fail("the default ACTT-1 case should carry a registration history with a primary-outcome change");
  if (opening.registryOutcomes[0]?.id !== "registry-original-primary-1") fail("the original primary outcome should be listed first for ACTT-1");
  log(`opened on ${nctId}: ${opening.registryHistory.totalVersions} registration versions, primary outcome changed in v${opening.registryHistory.firstPrimaryChange.version} (${opening.registryHistory.firstPrimaryChange.date})`);
  await evaluate("window.scrollTo(0, 0)");
  await snap("01-hero-connected", 720);
  await snap("05-mobile", 844, 390);
  await desktop();

  // 2. Human returns to the demonstration case.
  await waitFor(clickText("Return to demonstration case"), "the Return to demonstration case button");
  await waitFor(`!(${passportIsLive})`, "the demonstration case to be active again");
  const demo = await evaluate(`window.__pm.call("get_audit_state")`);
  if (demo.activeCase !== "demo") fail("get_audit_state should report the demo case after returning");

  // 3. Agent path: fetch both records and the registration history, then the human promotes the pair.
  const trial = await evaluate(`window.__pm.call("get_live_clinical_trial", { nctId: ${JSON.stringify(nctId)} })`);
  const article = await evaluate(`window.__pm.call("get_live_pubmed_article", { pmid: ${JSON.stringify(pmid)} })`);
  const history = await evaluate(`window.__pm.call("get_registry_history", { nctId: ${JSON.stringify(nctId)} })`);
  if (trial?.data?.nctId !== nctId) fail(`live trial read did not return ${nctId}`);
  if (article?.data?.pmid !== pmid) fail(`live article read did not return PMID ${pmid}`);
  if (!history?.data?.primaryOutcomeChanged || !history.data.firstPrimaryChange) fail("get_registry_history did not report the ACTT-1 primary-outcome change");
  log(`live reads ok (${await evaluate("window.__pm.mode")} input mode): ${trial.data.outcomes.length} outcomes, ${article.data.abstractSections.length} abstract sections, history v${history.data.firstPrimaryChange.version} "${history.data.firstPrimaryChange.from[0]}" → "${history.data.firstPrimaryChange.to[0]}"`);
  const hinted = await evaluate(`window.__pm.call("get_audit_state")`);
  if (hinted.activeCase !== "demo" || !hinted.intake) fail("get_audit_state should still report the demo case with an intake hint before the human promotes the pair");
  await waitFor(clickText("Review this pair"), "the Review this pair button");
  await waitFor(registryColumnHas("7-point ordinal scale"), "the original primary outcome to render in the registry column");
  if (!(await evaluate(registryColumnHas("Time to Recovery")))) fail("the current primary outcome should also render");
  log("human promoted the live pair; original and current primary outcomes are both listed");
  await evaluate(`document.getElementById("workspace-title")?.scrollIntoView({ block: "start", behavior: "instant" })`);
  await snap("02-live-pair-comparison", 900);

  // 4. Agent investigates and proposes; human review is requested.
  const state = await evaluate(`window.__pm.call("get_audit_state")`);
  if (state.activeCase !== "live" || state.pair.nctId !== nctId) fail("get_audit_state does not report the live pair as the active case");
  const original = state.registryOutcomes.find((outcome) => outcome.id === "registry-original-primary-1") ?? state.registryOutcomes[0];
  const results = state.publicationOutcomes.find((outcome) => /RESULTS/i.test(outcome.title)) ?? state.publicationOutcomes[0];
  const evidenceIds = [`ev-${original.id}`, `ev-${results.id}`];
  const spans = await evaluate(`window.__pm.call("get_evidence_spans", { evidenceIds: ${JSON.stringify(evidenceIds)} })`);
  if (spans.evidence.length !== 2 || spans.provenance !== "live") fail("get_evidence_spans did not return two live spans");
  log(`evidence spans ok: ${spans.evidence.map((span) => span.locator).join(" | ")}`);
  const proposal = await evaluate(`window.__pm.call("propose_outcome_mapping", ${JSON.stringify({
    registryOutcomeId: original.id, publicationOutcomeId: results.id, discrepancy: "uncertain",
    rationale: "The originally registered primary outcome was a 7-point ordinal scale at day 15; the abstract reports time to recovery as primary. The reviewer must decide whether the original endpoint is reported at all.",
    evidenceIds, confidence: 0.66,
  })})`);
  if (proposal.status !== "staged_for_human_review") fail("propose_outcome_mapping did not stage");
  const review = await evaluate(`window.__pm.call("request_human_review", { mappingId: ${JSON.stringify(proposal.mapping.id)} })`);
  if (review.decisionAuthority !== "human_reviewer_only") fail("request_human_review did not return human_reviewer_only");
  if ((await evaluate(`window.__pm.names()`)).includes("export_review_receipt")) fail("the receipt tool must not exist before a human decision");
  log(`proposal ${proposal.mapping.id} staged and focused; no accept/reject tool exists for the agent`);
  await snap("03-review-queue-live-proposal", 900);
  await evaluate(`document.querySelector("#evidence-drawer")?.scrollIntoView({ block: "start", behavior: "instant" })`);
  await snap("06-evidence-drawer", 900);

  // 5. Human accepts: the eighth tool appears; the receipt is live-sourced; Undo removes it.
  await waitFor(`(() => { const accept = document.querySelector(".review-card.active .review-actions .accept"); if (!accept || accept.disabled) return false; accept.click(); return true; })()`, "an enabled Accept button on the active proposal");
  await waitFor(`${badgeText}.includes("8 tools")`, "the badge to report 8 tools");
  if (!(await evaluate(`window.__pm.names()`)).includes("export_review_receipt")) fail("export_review_receipt was not registered after the human decision");
  const receipt = await evaluate(`window.__pm.call("export_review_receipt")`);
  if (receipt.generatedFrom !== "live_sources") fail(`receipt generatedFrom is ${receipt.generatedFrom}`);
  if (receipt.reviewedMappings.length !== 1 || receipt.evidence.length !== 2) fail("receipt should contain exactly the accepted mapping and its two spans");
  if (!receipt.evidence.some((span) => span.locator.startsWith("history/0."))) fail("the receipt should cite the original registration version");
  log(`receipt ok: ${receipt.generatedFrom}; locators ${receipt.evidence.map((span) => span.locator).join(" | ")}`);
  await evaluate("window.scrollTo(0, 0)");
  await snap("04-seven-tools-after-decision", 720);
  await evaluate(`document.querySelector(".activity-log")?.scrollIntoView({ block: "start", behavior: "instant" })`);
  await snap("05-session-log", 900);
  await evaluate(`document.querySelector(".reality-check")?.scrollIntoView({ block: "start", behavior: "instant" })`);
  await snap("07-benchmark", 900);
  await waitFor(clickText("Undo last decision"), "the Undo button");
  await waitFor(`${badgeText}.includes("7 tools")`, "the badge to return to 7 tools");
  if ((await evaluate(`window.__pm.names()`)).includes("export_review_receipt")) fail("the receipt tool should disappear after undo");
  log("undo removed the receipt tool; surface back to 7 tools");

  // 6. Human rejects with a reason the agent can read.
  await waitFor(`(() => { const reject = document.querySelector(".review-card.active .review-actions .reject"); if (!reject || reject.disabled) return false; reject.click(); return true; })()`, "an enabled Reject button on the active proposal");
  await waitFor(`document.querySelector(".reject-form select") !== null`, "the reject reason form");
  if (!(await evaluate(setValue(".reject-form select", "Not a real discrepancy")))) fail("could not choose a reject reason");
  if (!(await evaluate(setValue(".reject-form input", "the abstract reports the original scale only as a secondary analysis")))) fail("could not type the reject detail");
  await waitFor(clickText("Confirm reject"), "the Confirm reject button");
  await waitFor(`${badgeText}.includes("8 tools")`, "the badge to report 8 tools after the rejection");
  const afterReject = await evaluate(`window.__pm.call("get_audit_state")`);
  const feedback = afterReject.reviewerFeedback?.[0];
  if (!feedback || !/Not a real discrepancy: the abstract reports/.test(feedback.reviewerNote)) fail(`reviewer feedback missing: ${JSON.stringify(afterReject.reviewerFeedback)}`);
  log(`rejection reason readable by the agent: "${feedback.reviewerNote}"`);
  await waitFor(clickText("Undo last decision"), "the Undo button after rejection");
  await waitFor(`${badgeText}.includes("7 tools")`, "the badge to return to 7 tools after undoing the rejection");

  // 7. Human sends a note to the agent.
  if (!(await evaluate(setValue(".agent-note-form input", "Compare the original primary outcome against the RESULTS section, not METHODS.")))) fail("could not type the note");
  await waitFor(clickText("Send to agent"), "the Send to agent button");
  const noted = await evaluate(`window.__pm.call("get_audit_state")`);
  if (!noted.reviewerNotes?.some((entry) => entry.note.startsWith("Compare the original primary outcome"))) fail("the reviewer note did not reach get_audit_state");
  log("reviewer note readable by the agent through get_audit_state.reviewerNotes");

  // 8. Reload keeps the case, the staged proposal and the note; Clear session resets everything.
  await send("Page.reload", {}, session);
  await waitFor(`document.querySelector(".connection-badge.connected") !== null`, "the badge after reload");
  await evaluate(agent);
  await waitFor(passportIsLive, "the live pair to be restored after reload");
  const restored = await evaluate(`window.__pm.call("get_audit_state")`);
  if (restored.activeCase !== "live" || restored.mappings.length !== 1 || restored.mappings[0].status !== "staged" || !restored.reviewerNotes?.length) fail(`session was not restored: ${JSON.stringify({ activeCase: restored.activeCase, mappings: restored.mappings.length })}`);
  log("reload restored the live case, the staged proposal and the reviewer note");
  await waitFor(clickText("Clear session"), "the Clear session button");
  await waitFor(`!(${passportIsLive})`, "the demonstration case after clearing the session");
  const cleared = await evaluate(`window.__pm.call("get_audit_state")`);
  if (cleared.activeCase !== "demo" || cleared.mappings.length !== 0) fail("Clear session did not reset the case");

  // 9. Deep link: ?nct=&pmid= loads a real pair directly.
  await openPage(`${baseUrl}/?nct=${nctId}&pmid=${pmid}`);
  await waitFor(passportIsLive, "the deep-linked pair to load", 30000);
  const linked = await evaluate(`window.__pm.call("get_audit_state")`);
  if (linked.activeCase !== "live" || linked.pair.nctId !== nctId || linked.pair.pmid !== pmid) fail("the deep link did not load the requested pair");
  log("deep link loaded the requested pair");

  if (pageErrors.length > 0) fail(`the page raised ${pageErrors.length} uncaught error(s) during the run: ${pageErrors.map((text) => text.split("\n")[0].slice(0, 200)).join(" | ")}`);
  log("no uncaught page errors or console.error calls during the run");
  console.log("WEBMCP_SMOKE=PASS");
} catch (error) {
  console.error(`WEBMCP_SMOKE=FAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill("SIGTERM");
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
