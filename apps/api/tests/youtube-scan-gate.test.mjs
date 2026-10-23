import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/youtube-scan-gate.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
new Function("exports", "module", compiled)(module.exports, module);
const { createYoutubeScanGate } = module.exports;

test("YouTube scan gate enforces a per-operator rolling window with retry time", () => {
  let now = 1_000;
  const gate = createYoutubeScanGate({ maxRequests: 2, windowMs: 10_000, maxConcurrent: 2, now: () => now });

  for (let index = 0; index < 2; index += 1) {
    const lease = gate.acquire("operator-a");
    assert.equal(lease.allowed, true);
    lease.release();
  }

  const limited = gate.acquire("operator-a");
  assert.equal(limited.allowed, false);
  assert.equal(limited.reason, "rate_limit");
  assert.equal(limited.remaining, 0);
  assert.equal(limited.retryAfterMs, 10_000);

  now += 10_001;
  const afterWindow = gate.acquire("operator-a");
  assert.equal(afterWindow.allowed, true);
  afterWindow.release();
});

test("YouTube scan gate bounds per-operator and global concurrent crawls", () => {
  const gate = createYoutubeScanGate({ maxRequests: 5, windowMs: 60_000, maxConcurrent: 1 });
  const first = gate.acquire("operator-a");
  assert.equal(first.allowed, true);
  const sameOperator = gate.acquire("operator-a");
  assert.equal(sameOperator.allowed, false);
  assert.equal(sameOperator.reason, "operator_concurrency");
  const otherOperator = gate.acquire("operator-b");
  assert.equal(otherOperator.allowed, false);
  assert.equal(otherOperator.reason, "global_concurrency");
  first.release();
  first.release();
  assert.equal(gate.activeCount, 0);

  const next = gate.acquire("operator-b");
  assert.equal(next.allowed, true);
  next.release();
});

test("YouTube scan gate shares capacity between operator requests and scheduled sweeps", () => {
  const gate = createYoutubeScanGate({ maxRequests: 5, windowMs: 60_000, maxConcurrent: 3 });
  const manual = gate.acquire("operator-a");
  const scheduled = gate.acquire("scheduler", "scheduled");
  assert.equal(manual.allowed, true);
  assert.equal(scheduled.allowed, true);
  const secondManual = gate.acquire("operator-b");
  assert.equal(secondManual.allowed, true);
  assert.equal(gate.acquire("scheduler-2", "scheduled").reason, "operator_concurrency");
  assert.equal(gate.acquire("operator-c").reason, "global_concurrency");
  manual.release();
  secondManual.release();
  scheduled.release();
});

test("YouTube scan gate prunes expired identities and fails closed for missing identity", () => {
  let now = 0;
  const gate = createYoutubeScanGate({ maxRequests: 1, windowMs: 1_000, maxTrackedOperators: 1, now: () => now });
  assert.equal(gate.acquire("").reason, "identity_unavailable");
  const first = gate.acquire("operator-a");
  first.release();
  assert.equal(gate.trackedOperatorCount, 1);
  assert.equal(gate.acquire("operator-b").allowed, false);

  now = 1_001;
  const replacement = gate.acquire("operator-b");
  assert.equal(replacement.allowed, true);
  assert.equal(gate.trackedOperatorCount, 1);
  replacement.release();
});

test("scan route distinguishes quota and shared-capacity rejections after authorization", async () => {
  const route = await readFile(new URL("../src/routes/world-monitor.ts", import.meta.url), "utf8");
  const scan = route.slice(route.indexOf('"/v1/world-monitor/youtube/scan"'), route.indexOf('"/v1/world-monitor/youtube/action"'));

  assert.match(scan, /preHandler:\s*\[requireSession,\s*requirePermission\("sentinel:scan"\)\]/);
  assert.match(scan, /youtubeScanGate\.acquire\(request\.authUser\?\.id/);
  assert.match(scan, /\.header\("retry-after"/);
  assert.match(scan, /\.code\(temporarilyBusy \? 503 : 429\)/);
  assert.match(scan, /lease\.release\(\)/);
});
