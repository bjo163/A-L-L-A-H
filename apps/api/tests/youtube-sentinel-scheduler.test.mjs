import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

async function loadValidator() {
  const source = await readFile(new URL("../src/youtube-sentinel-scheduler.ts", import.meta.url), "utf8");
  const javascript = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const module = { exports: {} };
  new Function("require", "module", "exports", javascript)(() => ({}), module, module.exports);
  return module.exports.validateScheduledYoutubeSweepInput;
}

test("scheduled YouTube sweep input is bounded and normalized", async () => {
  const validate = await loadValidator();
  assert.deepEqual(validate(["  Pesugihan   uang  "], 4), { queries: ["Pesugihan uang"], limitPerQuery: 4 });
  assert.throws(() => validate([]), /must contain 1-6 queries/);
  assert.throws(() => validate(Array.from({ length: 7 }, (_, index) => `query ${index}`)), /must contain 1-6 queries/);
  assert.throws(() => validate(["same", " SAME "]), /must be unique/);
  assert.throws(() => validate(["x".repeat(201)]), /1-200 characters/);
  assert.throws(() => validate(["query"], 0), /1-10 per query/);
  assert.throws(() => validate(["query"], 11), /1-10 per query/);
});

test("YouTube Sentinel 12-hour scheduler is registered and configured with proper defaults", async () => {
  const schedulerSource = await readFile(new URL("../src/youtube-sentinel-scheduler.ts", import.meta.url), "utf8");
  const serverSource = await readFile(new URL("../src/server.ts", import.meta.url), "utf8");

  // Verify scheduler definitions
  assert.match(schedulerSource, /TWELVE_HOURS_MS = 12 \* 60 \* 60 \* 1000/);
  assert.match(schedulerSource, /startYoutubeSentinelScheduler/);
  assert.match(schedulerSource, /executeScheduledYoutubeSweep/);
  assert.match(schedulerSource, /sortBy:\s*"upload_date"/);
  assert.match(schedulerSource, /triggeredBy:\s*"scheduler_12h"/);
  assert.match(schedulerSource, /youtubeScanGate\.acquire\("youtube-scheduler",\s*"scheduled"\)/);
  assert.match(schedulerSource, /lease\.release\(\)/);

  // Verify server startup hooks
  assert.match(serverSource, /startYoutubeSentinelScheduler/);
  assert.match(serverSource, /stopYoutubeSentinelScheduler/);

  // Verify default syirik & occultism query coverage
  assert.match(schedulerSource, /pesugihan uang gaib/);
  assert.match(schedulerSource, /dukun santet/);
  assert.match(schedulerSource, /jimat pelet/);
  assert.match(schedulerSource, /khodam pendamping/);
  assert.match(schedulerSource, /larung sesaji/);
});
