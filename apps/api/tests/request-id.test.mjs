import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import ts from "typescript";

const source = await readFile(new URL("../src/request-id.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
new Function("require", "exports", compiled)(createRequire(import.meta.url), exports);
const { createRequestId } = exports;

test("request IDs reuse bounded safe values for cross-system correlation", () => {
  assert.equal(createRequestId("edge-req_123.abc"), "edge-req_123.abc");
  assert.equal(createRequestId("x".repeat(128)), "x".repeat(128));
});

test("request IDs replace malformed, oversized, and multi-valued inputs", () => {
  for (const value of [undefined, "", "x".repeat(129), "bad value", "a\r\nb", ["first", "second"]]) {
    assert.match(createRequestId(value), /^[0-9a-f-]{36}$/i);
  }
});
