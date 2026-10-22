import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("YouTube Tauhid Sentinel routes are registered with correct contracts", async () => {
  const worldMonitorSource = await readFile(new URL("../src/routes/world-monitor.ts", import.meta.url), "utf8");
  const serverSource = await readFile(new URL("../src/server.ts", import.meta.url), "utf8");

  // Verify YouTube routes in world-monitor.ts
  assert.match(worldMonitorSource, /\/v1\/world-monitor\/youtube/);
  assert.match(worldMonitorSource, /\/v1\/world-monitor\/youtube\/scan/);
  assert.match(worldMonitorSource, /\/v1\/world-monitor\/youtube\/action/);
  assert.match(worldMonitorSource, /\/v1\/world-monitor\/youtube\/snippet/);

  // Verify YouTube routes in server.ts publicRoutes
  assert.match(serverSource, /"\/v1\/world-monitor\/youtube"/);
  assert.match(serverSource, /"\/v1\/world-monitor\/youtube\/scan"/);
  assert.match(serverSource, /"\/v1\/world-monitor\/youtube\/action"/);
  assert.match(serverSource, /"\/v1\/world-monitor\/youtube\/snippet"/);

  // Verify non-AI and Tauhid taxonomy presence
  assert.match(worldMonitorSource, /youtubeSentinelRepo/);
  assert.match(worldMonitorSource, /scanYoutube/);
  assert.match(worldMonitorSource, /generateBrowserAutomationSnippet/);
  assert.match(worldMonitorSource, /SIHIR_PELET/);
  assert.match(worldMonitorSource, /DUKUN_RAMALAN/);
  assert.match(worldMonitorSource, /PESUGIHAN_TUMBAL/);
  assert.match(worldMonitorSource, /KHODAM_JIN/);
  assert.match(worldMonitorSource, /BENDA_KERAMAT_JIMAT/);
  assert.match(worldMonitorSource, /KUBURAN_SESAJEN/);
  assert.match(worldMonitorSource, /DAKWAH_REFUTATION/);
});
