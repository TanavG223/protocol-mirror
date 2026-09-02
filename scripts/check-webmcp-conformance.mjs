import { readFile } from "node:fs/promises";
import ts from "typescript";

const expectedTools = [
  "export_review_receipt",
  "get_audit_state",
  "get_evidence_spans",
  "get_live_clinical_trial",
  "get_live_pubmed_article",
  "propose_outcome_mapping",
  "request_human_review",
];

const readOnlyTools = new Set([
  "export_review_receipt",
  "get_audit_state",
  "get_evidence_spans",
  "get_live_clinical_trial",
  "get_live_pubmed_article",
]);

const untrustedOutputTools = new Set(readOnlyTools);
const sourcePaths = ["src/app/workspace.tsx", "src/lib/webmcp-tools.ts", "src/lib/case-tools.ts"];
// workspace.tsx registers tools from three effects: pair-independent tools (live readers, audit
// state, review focus), pair-bound tools (evidence spans, proposals) that re-register when the
// active case changes, and the reviewed-receipt tool that exists only after a human decision.
const expectedRegistrationCallSites = 3;

function fail(message) {
  throw new Error(`WEBMCP_CONFORMANCE_FAIL: ${message}`);
}

function propertyName(property) {
  if (!property?.name) return null;
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) || ts.isNumericLiteral(property.name)) return property.name.text;
  return null;
}

function property(object, name) {
  if (!object || !ts.isObjectLiteralExpression(object)) return null;
  return object.properties.find((candidate) => propertyName(candidate) === name) ?? null;
}

function initializer(object, name) {
  const candidate = property(object, name);
  return candidate && ts.isPropertyAssignment(candidate) ? candidate.initializer : null;
}

function stringValue(node) {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;
}

function booleanValue(node) {
  if (node?.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node?.kind === ts.SyntaxKind.FalseKeyword) return false;
  return null;
}

function parseAnnotations(object) {
  const annotationNode = initializer(object, "annotations");
  if (!annotationNode || !ts.isObjectLiteralExpression(annotationNode)) return {};
  return {
    readOnlyHint: booleanValue(initializer(annotationNode, "readOnlyHint")),
    untrustedContentHint: booleanValue(initializer(annotationNode, "untrustedContentHint")),
  };
}

function parseParameters(object) {
  const schema = initializer(object, "inputSchema");
  const properties = schema && ts.isObjectLiteralExpression(schema) ? initializer(schema, "properties") : null;
  if (!properties || !ts.isObjectLiteralExpression(properties)) return [];
  return properties.properties.flatMap((candidate) => {
    if (!ts.isPropertyAssignment(candidate) || !ts.isObjectLiteralExpression(candidate.initializer)) return [];
    const name = propertyName(candidate);
    const description = stringValue(initializer(candidate.initializer, "description"));
    return name ? [{ name, description: description ?? "" }] : [];
  });
}

const definitions = new Map();
let registrationCalls = 0;

for (const sourcePath of sourcePaths) {
  const sourceText = await readFile(sourcePath, "utf8");
  const sourceFile = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, sourcePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const name = stringValue(initializer(node, "name"));
      const description = stringValue(initializer(node, "description"));
      if (name && description && property(node, "inputSchema") && property(node, "execute")) {
        if (definitions.has(name)) fail(`duplicate tool definition: ${name}`);
        definitions.set(name, {
          name,
          description,
          parameters: parseParameters(node),
          annotations: parseAnnotations(node),
          sourcePath,
        });
      }
    }

    if (sourcePath === "src/app/workspace.tsx" && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "registerTool") {
      registrationCalls += 1;
      const options = node.arguments[1];
      if (!options || !ts.isObjectLiteralExpression(options) || !property(options, "signal")) fail(`registerTool call ${registrationCalls} is missing AbortSignal lifecycle cleanup`);
      if (property(options, "exposedTo")) fail(`registerTool call ${registrationCalls} broadens cross-origin exposure`);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

const actualTools = [...definitions.keys()].sort();
if (JSON.stringify(actualTools) !== JSON.stringify(expectedTools)) fail(`expected tools ${expectedTools.join(", ")}; found ${actualTools.join(", ")}`);
if (registrationCalls !== expectedRegistrationCallSites) fail(`expected ${expectedRegistrationCallSites} registration call sites (one per registration effect); found ${registrationCalls}`);

for (const tool of definitions.values()) {
  if (!/^[A-Za-z0-9_.-]{1,128}$/.test(tool.name)) fail(`${tool.name} violates the specification name grammar`);
  if (tool.name.length > 30) fail(`${tool.name} exceeds the 30-character security-guidance budget`);
  if (tool.description.length > 500) fail(`${tool.name} description is ${tool.description.length} characters; budget is 500`);
  for (const parameter of tool.parameters) {
    if (parameter.name.length > 30) fail(`${tool.name}.${parameter.name} exceeds the 30-character name budget`);
    if (parameter.description.length > 150) fail(`${tool.name}.${parameter.name} description is ${parameter.description.length} characters; budget is 150`);
  }
  if (readOnlyTools.has(tool.name) && tool.annotations.readOnlyHint !== true) fail(`${tool.name} must declare readOnlyHint`);
  if (untrustedOutputTools.has(tool.name) && tool.annotations.untrustedContentHint !== true) fail(`${tool.name} must declare untrustedContentHint`);
  if (!readOnlyTools.has(tool.name) && tool.annotations.readOnlyHint === true) fail(`${tool.name} changes visible state and must not declare readOnlyHint`);
}

const maxName = Math.max(...[...definitions.values()].map((tool) => tool.name.length));
const maxDescription = Math.max(...[...definitions.values()].map((tool) => tool.description.length));
const allParameters = [...definitions.values()].flatMap((tool) => tool.parameters);
const maxParameterName = Math.max(...allParameters.map((parameter) => parameter.name.length));
const maxParameterDescription = Math.max(...allParameters.map((parameter) => parameter.description.length));

console.log("WEBMCP_CONFORMANCE=PASS");
console.log(`TOOL_DEFINITIONS=${definitions.size}`);
console.log(`REGISTRATION_CALL_SITES=${registrationCalls}`);
console.log(`MAX_TOOL_NAME_CHARS=${maxName}/30`);
console.log(`MAX_TOOL_DESCRIPTION_CHARS=${maxDescription}/500`);
console.log(`MAX_PARAMETER_NAME_CHARS=${maxParameterName}/30`);
console.log(`MAX_PARAMETER_DESCRIPTION_CHARS=${maxParameterDescription}/150`);
