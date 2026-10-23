import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import Ajv from "ajv";
import ts from "typescript";

const contractSource = await readFile(new URL("../../../packages/api-contract/src/index.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(contractSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const contractModule = { exports: {} };
new Function("exports", "require", "module", compiled)(contractModule.exports, createRequire(import.meta.url), contractModule);
const { RESEARCH_EVIDENCE_REQUEST_SCHEMA } = contractModule.exports;
const validateEvidence = new Ajv({ strict: false, validateFormats: false }).compile(RESEARCH_EVIDENCE_REQUEST_SCHEMA);

const evidence = () => ({
  title: "Edition record",
  source: { sourceId: "edition-1", familyId: "quran", url: "https://example.org/edition", license: "metadata-only" },
  classification: "SCRIPTURE_TEXT",
  excerpt: "A short attributed excerpt.",
  provenance: { sourceId: "edition-1", collectedAt: "2026-10-23T00:00:00Z", method: "manual-reference" },
});

test("research evidence contract accepts a source-attributed citation record", () => {
  assert.equal(validateEvidence(evidence()), true);
});

test("research evidence contract rejects unsupported citation families and missing license metadata", () => {
  const unsupportedFamily = evidence();
  unsupportedFamily.source.familyId = "unregistered-scripture";
  assert.equal(validateEvidence(unsupportedFamily), false);

  const missingLicense = evidence();
  delete missingLicense.source.license;
  assert.equal(validateEvidence(missingLicense), false);
});

test("research evidence contract rejects extra fields that could imply unreviewed citation metadata", () => {
  const fabricatedEdition = evidence();
  fabricatedEdition.source.authority = "approved-canon";
  assert.equal(validateEvidence(fabricatedEdition), false);
});
