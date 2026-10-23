import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/youtube-sentinel-storage.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ""), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const normalize = new Function("exports", `${compiled}; return exports.normalizeWorkflowActionEvidence;`)({});

test("persisted workflow evidence is validated and allowlisted before DTO mapping", () => {
  const mapped = normalize({
    reference: "https://youtube.com/report/123",
    attestedBy: "reviewer-2",
    attestedAt: "2026-10-23T00:00:00.000Z",
    privateNote: "must not leak",
    history: [
      {
        action: "REPORT_RETRACTED",
        previousStatus: "REPORT_FILED",
        actorId: "reviewer-2",
        occurredAt: "2026-10-23T00:00:00.000Z",
        externalActionReference: "https://youtube.com/correction/123",
        externalActionAttested: true,
        privateNote: "must not leak",
      },
      { action: "unknown", previousStatus: "REPORT_FILED", actorId: "x", occurredAt: "now" },
      { action: "REPORT_FILED", previousStatus: "VERIFIED_SYIRIK", actorId: 1, occurredAt: "now" },
    ],
  });
  assert.equal(mapped.history.length, 1);
  assert.equal(mapped.history[0].action, "REPORT_RETRACTED");
  assert.equal(mapped.history[0].externalActionAttested, true);
  assert.equal("privateNote" in mapped, false);
  assert.equal("privateNote" in mapped.history[0], false);
  assert.equal(normalize(null), null);
});
