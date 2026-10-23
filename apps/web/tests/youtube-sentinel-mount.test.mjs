import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(new URL("../src/YoutubeSentinelView.tsx", import.meta.url), "utf8");

test("YouTube Sentinel catalog mount and retry never initiate scans", () => {
  const fetchStart = source.indexOf("async function fetchCatalog()");
  const fetchEnd = source.indexOf("useEffect(() => {", fetchStart);
  const fetchCatalog = source.slice(fetchStart, fetchEnd);
  const initialEffect = source.slice(fetchEnd, source.indexOf("// Show temporary toast", fetchEnd));

  assert.notEqual(fetchStart, -1);
  assert.doesNotMatch(fetchCatalog, /worldMonitorYoutubeScan|handleScan\(|runAutoScan/);
  assert.match(fetchCatalog, /setCatalogError\(/);
  assert.match(initialEffect, /void fetchCatalog\(\)/);
  assert.doesNotMatch(initialEffect, /worldMonitorYoutubeScan|handleScan\(|runAutoScan/);
  assert.match(source, /if \(!permissions\.scan\) return;/);
  assert.match(source, /Katalog Sentinel kosong/);
  assert.match(source, /Coba lagi/);
});

test("an empty live scan is reported as no results, not an evaluation", () => {
  assert.match(source, /res\.scannedCount === 0 \|\| res\.crawlerMode === "no_results"/);
  assert.match(source, /Tidak ada hasil pemindaian dari/);
});
