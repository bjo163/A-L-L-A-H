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
  // Data, scanning, review, and scheduling endpoints stay behind runtime guards;
  // the invalid public browser snippet endpoint has been retired.
  const publicRoutes = serverSource.match(/const publicRoutes = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? "";
  for (const route of [
    "/v1/world-monitor/youtube",
    "/v1/world-monitor/youtube/scan",
    "/v1/world-monitor/youtube/action",
    "/v1/world-monitor/youtube/schedule",
  ]) assert.doesNotMatch(publicRoutes, new RegExp(`"${route.replaceAll("/", "\\/")}"`));
  assert.doesNotMatch(worldMonitorSource, /\/v1\/world-monitor\/youtube\/snippet|generateBrowserAutomationSnippet/);
  assert.doesNotMatch(serverSource, /world-monitor\/youtube\/snippet/);
  assert.match(worldMonitorSource, /preHandler: \[requireSession, requirePermission\("sentinel:read"\)\]/);
  assert.match(worldMonitorSource, /preHandler: \[requireSession, requirePermission\("sentinel:scan"\)\]/);
  assert.match(worldMonitorSource, /preHandler: \[requireSession, requirePermission\("sentinel:review"\)\]/);
  assert.match(worldMonitorSource, /contextual review rationale of at least 20 characters is required/);
  assert.match(worldMonitorSource, /traceable external action reference is required/);
  assert.match(worldMonitorSource, /Explicit human attestation of the completed external action is required/);
  assert.match(worldMonitorSource, /traceable public evidence reference is required for human review/);
  assert.match(worldMonitorSource, /A report requires a prior human review and a different reporting reviewer/);
  assert.match(worldMonitorSource, /Only a previously attested report can be retracted/);
  assert.match(worldMonitorSource, /Only an existing human review can be retracted/);
  assert.match(worldMonitorSource, /history: \[\.\.\.history, event as unknown as Record<string, unknown>\]/);
  assert.match(worldMonitorSource, /previousStatus === body\.action && lastEvent\?\.actorId === actorId/);
  assert.match(worldMonitorSource, /externalActionAttested: true/);
  assert.match(worldMonitorSource, /body\.action === "REVIEW_RETRACTED" \|\| body\.action === "REPORT_RETRACTED" \? "PENDING_REVIEW"/);
  assert.match(worldMonitorSource, /body\.action === "REPORT_FILED" && row\.direction === "POSITIVE"/);
  assert.match(worldMonitorSource, /body\.action === "SHARED_VIA_DAKWAH" && row\.direction !== "POSITIVE"/);
  assert.match(worldMonitorSource, /where\(\{ id: row\.id, review_revision: currentRevision \}\)/);
  assert.match(worldMonitorSource, /reviewEvidence, actionEvidence, reviewRevision: currentRevision \+ 1/);
  assert.match(worldMonitorSource, /getDatabase\(\)\.transaction\(async \(trx\) => \{/);
  assert.match(worldMonitorSource, /AuditLogModel\.query\(trx\).*insert/);
  assert.match(worldMonitorSource, /YOUTUBE_SENTINEL_\$\{body\.action\}/);
  assert.ok(worldMonitorSource.indexOf("AuditLogModel.query(trx)") < worldMonitorSource.indexOf("youtubeSentinelRepo.updateWorkflowStatus(row.id"));
  assert.match(worldMonitorSource, /where\(\{ id: body\.id \}\)\.first\(\)/);
  assert.doesNotMatch(worldMonitorSource, /where\(\{ id: body\.id \}\)\.orWhere\(\{ video_id: body\.id \}\)/);
  assert.match(worldMonitorSource, /ALLOWED_YOUTUBE_WORKFLOW_ACTIONS\[previousStatus\]\?\.includes\(body\.action\)/);
  assert.match(worldMonitorSource, /Workflow transition .* is not allowed/);
  assert.match(worldMonitorSource, /youtubeSentinelRepo\.upsertItem\(updated\)/);
  assert.match(worldMonitorSource, /Sentinel review storage is unavailable; action was not applied/);
  assert.match(worldMonitorSource, /Sentinel review action could not be saved; action was not applied/);
  assert.ok(worldMonitorSource.indexOf(".patch({ workflowStatus: effectiveStatus") < worldMonitorSource.indexOf("youtubeSentinelRepo.updateWorkflowStatus(row.id"));
  assert.match(worldMonitorSource, /preHandler: \[requireSession, requirePermission\("sentinel:schedule"\)\]/);

  // Verify non-AI and Tauhid taxonomy presence
  assert.match(worldMonitorSource, /youtubeSentinelRepo/);
  assert.match(worldMonitorSource, /scanYoutube/);
  assert.match(worldMonitorSource, /SIHIR_PELET/);
  assert.match(worldMonitorSource, /DUKUN_RAMALAN/);
  assert.match(worldMonitorSource, /PESUGIHAN_TUMBAL/);
  assert.match(worldMonitorSource, /KHODAM_JIN/);
  assert.match(worldMonitorSource, /BENDA_KERAMAT_JIMAT/);
  assert.match(worldMonitorSource, /KUBURAN_SESAJEN/);
  assert.match(worldMonitorSource, /DAKWAH_REFUTATION/);
});

test("YouTube scan contract bounds operator input and rejects submitted items", async () => {
  const worldMonitorSource = await readFile(new URL("../src/routes/world-monitor.ts", import.meta.url), "utf8");
  const scanRoute = worldMonitorSource.match(
    /app\.post\(\s*"\/v1\/world-monitor\/youtube\/scan",([\s\S]*?)preHandler:/,
  )?.[1];

  assert.ok(scanRoute, "scan route schema should be present");
  assert.match(scanRoute, /additionalProperties:\s*false/);
  assert.match(scanRoute, /query:\s*\{\s*type:\s*"string",\s*minLength:\s*1,\s*maxLength:\s*200\s*\}/);
  assert.match(scanRoute, /limit:\s*\{\s*type:\s*"integer",\s*minimum:\s*1,\s*maximum:\s*50\s*\}/);
  assert.doesNotMatch(scanRoute, /items\s*:/);
});
