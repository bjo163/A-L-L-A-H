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

  // Only the read-only snippet is public. Data, scanning, review, and scheduling
  // endpoints must stay behind their runtime session and permission guards.
  const publicRoutes = serverSource.match(/const publicRoutes = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? "";
  for (const route of [
    "/v1/world-monitor/youtube",
    "/v1/world-monitor/youtube/scan",
    "/v1/world-monitor/youtube/action",
    "/v1/world-monitor/youtube/schedule",
  ]) assert.doesNotMatch(publicRoutes, new RegExp(`"${route.replaceAll("/", "\\/")}"`));
  assert.match(serverSource, /"\/v1\/world-monitor\/youtube\/snippet"/);
  assert.match(worldMonitorSource, /preHandler: \[requireSession, requirePermission\("sentinel:read"\)\]/);
  assert.match(worldMonitorSource, /preHandler: \[requireSession, requirePermission\("sentinel:scan"\)\]/);
  assert.match(worldMonitorSource, /preHandler: \[requireSession, requirePermission\("sentinel:review"\)\]/);
  assert.match(worldMonitorSource, /factual review rationale of at least 20 characters is required/);
  assert.match(worldMonitorSource, /traceable external action reference is required/);
  assert.match(worldMonitorSource, /where\(\{ id: row\.id, review_revision: currentRevision \}\)/);
  assert.match(worldMonitorSource, /reviewEvidence, actionEvidence, reviewRevision: currentRevision \+ 1/);
  assert.match(worldMonitorSource, /preHandler: \[requireSession, requirePermission\("sentinel:schedule"\)\]/);

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
