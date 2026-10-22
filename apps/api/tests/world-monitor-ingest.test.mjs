import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/world-monitor-ingest.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ""), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const loadParsers = new Function("exports", `${compiled}; return { parseOpenMeteo, parseKp };`);
const parsers = loadParsers({});

test("ingest parsers reject empty and malformed payloads without creating records", () => {
  assert.match(source, /Array\.isArray\(body\?\.features\)/);
  assert.match(source, /body\.current\?\.time/);
  assert.match(source, /filter\(\(record\) => record\.normalized/);
});

test("ingest uses bounded network timeout and records failed source runs", () => {
  assert.match(source, /AbortSignal\.timeout\(12_000\)/);
  assert.match(source, /status: \"failed\"/);
  assert.match(source, /fallback/);
});

test("Open-Meteo endpoints request GMT and normalize timestamps independently of host timezone", () => {
  assert.match(source, /timezone=GMT/);
  assert.match(source, /\$\{value\}Z/);
  assert.match(source, /parseObservedAt\(body\.current\?\.time\)/);
});

test("source parsers preserve UTC time and use NOAA one-minute estimated Kp", () => {
  const weather = parsers.parseOpenMeteo({ latitude: 51.5, longitude: -0.1, current: { time: "2026-10-22T04:45", temperature_2m: 10.3 } })[0];
  assert.equal(weather.observedAt, "2026-10-22T04:45:00.000Z");
  const kp = parsers.parseKp([{ time_tag: "2026-10-22T04:46:00", kp_index: 2, estimated_kp: 2.33, kp: "2P" }])[0];
  assert.equal(kp.observedAt, "2026-10-22T04:46:00.000Z");
  assert.equal(kp.normalized.kp, 2);
  assert.equal(kp.normalized.kpKind, "near-real-time estimate");
});

test("retention removes old observations, runs, and aggregates", () => {
  assert.match(source, /world-monitor-aggregates|WorldMonitorAggregateModel/);
  assert.match(source, /90 \* 86_400_000/);
  assert.match(source, /where\("fetched_at", "<", cutoff\)/);
});
