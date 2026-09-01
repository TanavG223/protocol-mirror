import { readFile, writeFile } from "node:fs/promises";
import { summarizeRun } from "./grounding-score.mjs";

const input = process.argv[2];
if (!input) throw new Error("Usage: npm run benchmark:score -- <run.json>");
const artifact = JSON.parse(await readFile(input, "utf8"));
artifact.summary = summarizeRun(artifact.cases || []);
await writeFile(input, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(JSON.stringify(artifact.summary, null, 2));
