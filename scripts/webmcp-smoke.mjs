#!/usr/bin/env node
// End-to-end smoke test of the WebMCP surface in a real Chromium build.
//
// Launches Google Chrome headless with the WebMCP testing feature enabled, drives the page's own
// tools through document.modelContext.getTools()/executeTool() (the in-page agent path from the
// W3C draft), performs the human click through the DOM, and asserts the full collaboration loop:
//
//   6 tools registered → live records fetched → human promotes the real pair → agent reads state,
//   quotes spans, stages a proposal, requests review → human clicks Accept → 7 tools →
//   export_review_receipt reports live_sources → human clicks Undo → 6 tools.
//
// Usage: node scripts/webmcp-smoke.mjs [--url=http://127.0.0.1:4180] [--chrome=/path/to/chrome]
// Requires Google Chrome 152 or newer. No npm dependency: it speaks the DevTools protocol over
// Node's built-in WebSocket.

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
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
  "--enable-features=WebMCPTesting", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--window-size=1280,900", "about:blank",
], { stdio: "ignore" });

let ws;
let nextId = 0;
const pending = new Map();
const events = [];

async function connect() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json());
      ws = new WebSocket(version.webSocketDebuggerUrl);
      await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
      ws.onmessage = (message) => {
        const payload = JSON.parse(message.data);
        if (payload.id && pending.has(payload.id)) {
          const { resolve, reject } = pending.get(payload.id);
          pending.delete(payload.id);
          if (payload.error) reject(new Error(payload.error.message));
          else resolve(payload.result);
        } else if (payload.method) {
          events.push(payload);
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

async function waitFor(expression, description, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(expression)) return;
    await sleep(150);
  }
  fail(`Timed out waiting for ${description}`);
}

// The page exposes its tools; this script calls them exactly as an in-page agent would.
const agent = `
  (async () => {
    const context = document.modelContext;
    const tools = await context.getTools();
    const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
    const unwrap = (value) => {
      if (typeof value === "string") {
        try { return unwrap(JSON.parse(value)); } catch { return value; }
      }
      if (value && Array.isArray(value.content)) {
        const text = value.content.map((part) => part.text ?? "").join("");
        try { return JSON.parse(text); } catch { return text; }
      }
      return value;
    };
    window.__pm = {
      names: tools.map((tool) => tool.name).sort(),
      // Chromium's current build exchanges tool input and output as JSON strings, while the
      // draft specification passes objects. Try the object form first and fall back to strings.
      call: async (name, input = {}) => {
        const tool = byName[name] ?? (await context.getTools()).find((candidate) => candidate.name === name);
        if (!tool) throw new Error("tool not registered: " + name);
        let raw;
        try {
          raw = await context.executeTool(tool, input);
          window.__pm.mode = "object";
        } catch (error) {
          if (!/parse input/i.test(String(error))) throw error;
          raw = await context.executeTool(tool, JSON.stringify(input));
          window.__pm.mode = "json-string";
        }
        return unwrap(raw);
      },
      refresh: async () => { const latest = await context.getTools(); return latest.map((tool) => tool.name).sort(); },
    };
    return window.__pm.names;
  })()
`;

const clickText = (text) => `(() => { const button = [...document.querySelectorAll("button")].find((candidate) => candidate.textContent.trim().startsWith(${JSON.stringify(text)})); if (!button) return false; button.click(); return true; })()`;
const badgeText = `document.querySelector(".connection-badge")?.textContent.trim()`;

try {
  await connect();
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  session = (await send("Target.attachToTarget", { targetId, flatten: true })).sessionId;
  await send("Runtime.enable", {}, session);
  await send("Page.enable", {}, session);
  await send("Page.navigate", { url: `${baseUrl}/` }, session);
  await waitFor(`document.querySelector(".connection-badge.connected") !== null`, "the WebMCP connected badge");

  const names = await evaluate(agent);
  log(`registered tools: ${names.join(", ")}`);
  const expectedInitial = ["get_audit_state", "get_evidence_spans", "get_live_clinical_trial", "get_live_pubmed_article", "propose_outcome_mapping", "request_human_review"];
  if (JSON.stringify(names) !== JSON.stringify(expectedInitial)) fail(`expected the six initial tools, got ${names.join(", ")}`);
  if (!(await evaluate(badgeText)).includes("6 tools")) fail("badge does not report 6 tools");

  const trial = await evaluate(`window.__pm.call("get_live_clinical_trial", { nctId: ${JSON.stringify(nctId)} })`);
  const article = await evaluate(`window.__pm.call("get_live_pubmed_article", { pmid: ${JSON.stringify(pmid)} })`);
  if (trial?.data?.nctId !== nctId) fail(`live trial read did not return ${nctId}`);
  if (article?.data?.pmid !== pmid) fail(`live article read did not return PMID ${pmid}`);
  log(`live reads ok (${await evaluate("window.__pm.mode")} input mode): ${trial.data.outcomes.length} outcomes, ${article.data.abstractSections.length} abstract sections`);

  const hinted = await evaluate(`window.__pm.call("get_audit_state")`);
  if (hinted.activeCase !== "demo" || !hinted.intake) fail("get_audit_state should still report the demo case with an intake hint before the human promotes the pair");

  await waitFor(clickText("Review this pair"), "the Review this pair button");
  await waitFor(`[...document.querySelectorAll('section[aria-labelledby="registered-title"] .outcome-list h4')].some((node) => node.textContent.includes("Time to Recovery"))`, "the real registry outcomes to render");
  log("human promoted the live pair; registry column shows the real primary outcome");

  const state = await evaluate(`window.__pm.call("get_audit_state")`);
  if (state.activeCase !== "live" || state.pair.nctId !== nctId) fail("get_audit_state does not report the live pair as the active case");
  const registryId = state.registryOutcomes[0].id;
  const methods = state.publicationOutcomes.find((outcome) => /METHODS/i.test(outcome.title)) ?? state.publicationOutcomes[0];
  const evidenceIds = [`ev-${registryId}`, `ev-${methods.id}`];
  const spans = await evaluate(`window.__pm.call("get_evidence_spans", { evidenceIds: ${JSON.stringify(evidenceIds)} })`);
  if (spans.evidence.length !== 2 || spans.provenance !== "live") fail("get_evidence_spans did not return two live spans");
  log(`evidence spans ok: ${spans.evidence.map((span) => span.locator).join(" | ")}`);

  const proposal = await evaluate(`window.__pm.call("propose_outcome_mapping", ${JSON.stringify({
    registryOutcomeId: registryId, publicationOutcomeId: methods.id, discrepancy: "uncertain",
    rationale: "The registered primary outcome and the abstract's methods statement describe the same recovery endpoint; the reviewer must confirm the definitions match.",
    evidenceIds, confidence: 0.72,
  })})`);
  if (proposal.status !== "staged_for_human_review") fail("propose_outcome_mapping did not stage");
  const review = await evaluate(`window.__pm.call("request_human_review", { mappingId: ${JSON.stringify(proposal.mapping.id)} })`);
  if (review.decisionAuthority !== "human_reviewer_only") fail("request_human_review did not return human_reviewer_only");
  if ((await evaluate(`window.__pm.refresh()`)).includes("export_review_receipt")) fail("the receipt tool must not exist before a human decision");
  log(`proposal ${proposal.mapping.id} staged and focused; no accept/reject tool exists for the agent`);

  await waitFor(`(() => { const accept = document.querySelector(".review-card.active .review-actions .accept"); if (!accept || accept.disabled) return false; accept.click(); return true; })()`, "an enabled Accept button on the active proposal");
  await waitFor(`${badgeText}.includes("7 tools")`, "the badge to report 7 tools");
  const afterAccept = await evaluate(`window.__pm.refresh()`);
  if (!afterAccept.includes("export_review_receipt")) fail("export_review_receipt was not registered after the human decision");
  const receipt = await evaluate(`window.__pm.call("export_review_receipt")`);
  if (receipt.generatedFrom !== "live_sources") fail(`receipt generatedFrom is ${receipt.generatedFrom}`);
  if (receipt.reviewedMappings.length !== 1 || receipt.evidence.length !== 2) fail("receipt should contain exactly the accepted mapping and its two spans");
  log(`receipt ok: ${receipt.generatedFrom}; locators ${receipt.evidence.map((span) => span.locator).join(" | ")}`);

  await waitFor(clickText("Undo last decision"), "the Undo button");
  await waitFor(`${badgeText}.includes("6 tools")`, "the badge to return to 6 tools");
  if ((await evaluate(`window.__pm.refresh()`)).includes("export_review_receipt")) fail("the receipt tool should disappear after undo");
  log("undo removed the receipt tool; surface back to 6 tools");

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
