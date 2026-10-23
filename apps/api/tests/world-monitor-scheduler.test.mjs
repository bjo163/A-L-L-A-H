import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/world-monitor-scheduler.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ""), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;

test("scheduler clamps interval to 5-15 minutes and prevents overlapping runs", async () => {
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  let tick = () => {};
  let cleared = false;
  let release;
  let calls = 0;
  globalThis.setInterval = (callback, ms) => { assert.equal(ms, 900_000); tick = callback; return { unref() {} }; };
  globalThis.clearInterval = () => { cleared = true; };
  try {
    const load = new Function("exports", "refreshWorldMonitorSources", `${compiled}; return { startWorldMonitorScheduler, triggerManualWorldMonitorRefresh };`);
    const scheduler = load({}, () => { calls += 1; return new Promise((resolve) => { release = resolve; }); });
    const start = scheduler.startWorldMonitorScheduler;
    const stop = start(undefined, "99999999");
    await Promise.resolve();
    assert.equal(calls, 1);
    tick();
    assert.equal(calls, 1);
    release();
    await new Promise((resolve) => setImmediate(resolve));
    tick();
    assert.equal(calls, 2);
    stop();
    assert.equal(cleared, true);
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  }
});

test("manual refresh uses the same distributed ingestion entrypoint and returns its job outcome", async () => {
  const load = new Function("exports", "refreshWorldMonitorSources", `${compiled}; return triggerManualWorldMonitorRefresh;`);
  const result = { jobId: "job-test", status: "skipped", reason: "lease_held", startedAt: "start", finishedAt: "finish" };
  let calls = 0;
  const refresh = load({}, async () => { calls += 1; return result; });
  assert.equal(await refresh(), result);
  assert.equal(calls, 1);
});
