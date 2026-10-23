import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/routes/research-audit.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
new Function("exports", "require", "module", compiled)(module.exports, createRequire(import.meta.url), module);
const { researchEvidenceAuditPayload } = module.exports;

test("research evidence audit metadata excludes citation URLs and their credentials", () => {
  const secretUrl = "https://reader:password@example.org/source?access_token=secret";
  const payload = researchEvidenceAuditPayload({
    researchRunId: "run-1",
    sourceFamily: "other",
    classification: "PERSONAL_TESTIMONY",
    contentHash: "a".repeat(64),
    tenantId: "tenant-1",
    sourceUri: secretUrl,
  });

  assert.equal(JSON.stringify(payload).includes(secretUrl), false);
  assert.equal(JSON.stringify(payload).includes("access_token"), false);
  assert.deepEqual(Object.keys(payload).sort(), ["classification", "contentHash", "researchRunId", "sourceFamily", "tenantId"]);
});
