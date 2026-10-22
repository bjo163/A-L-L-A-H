import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const routeSource = await readFile(new URL("../src/routes/world-monitor.ts", import.meta.url), "utf8");
const compiledRoute = ts.transpileModule(
  routeSource.replace(/^import .*;\r?\n/gm, "").replace("export async function", "async function"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
).outputText;

function createRoute(checkDatabaseHealth, baseSnapshot, observations = []) {
  const load = new Function(
    "exports",
    "checkDatabaseHealth",
    "getWorldMonitoringSnapshot",
    "youtubeSentinelRepo",
    "scanYoutube",
    "generateBrowserAutomationSnippet",
    "refreshWorldMonitorSources",
    "WorldMonitorSourceRunModel",
    "WorldMonitorObservationModel",
    "getActiveWorldMonitorSources",
    "requireSession",
    "requirePermission",
    "requireTenant",
    "createYoutubeScanGate",
    `${compiledRoute}; return worldMonitorRoutes;`,
  );
  return load(
    {},
    checkDatabaseHealth,
    () => baseSnapshot,
    { getItems: () => [], getSummary: () => ({}), updateWorkflowStatus: () => null },
    async () => ({ scannedCount: 0, newItemsCount: 0, items: [], summary: {} }),
    () => "",
    async () => {},
    { query: () => ({ orderBy: () => ({ limit: async () => [] }) }) },
    { query: () => ({ where: ({ category }) => ({ orderBy: () => ({ limit: async () => observations.filter((item) => item.category === category) }) }) }) },
    () => [],
    async () => {},
    () => async () => {},
    async () => {},
    () => ({ acquire: () => ({ allowed: true, remaining: 4, retryAfterMs: 0, release() {} }) }),
  );
}

function createSnapshot() {
  return {
    status: "unavailable",
    timestamp: "old",
    globalAlertLevel: "unknown",
    averageGlobalLatencyMs: null,
    totalMonitoredNodes: 0,
    apiUptimeSeconds: null,
    databaseStatus: "unknown",
    regions: [],
    dnaSensors: [],
    telemetryFeeds: [],
  };
}

async function invoke(checkDatabaseHealth, observations = []) {
  let options;
  let handler;
  await createRoute(checkDatabaseHealth, createSnapshot(), observations)({
    get(path, routeOptions, routeHandler) {
      if (path === "/v1/world-monitor") {
        options = routeOptions;
        handler = routeHandler;
      }
    },
    post() {},
  });
  return { options, result: await handler() };
}


test("public World Monitor only returns aggregate service health, without audit records", async () => {
  const { options, result } = await invoke(async () => ({ ok: true }));
  assert.deepEqual(options.schema.security, []);
  assert.equal(result.status, "operational");
  assert.equal(result.databaseStatus, "available");
  assert.equal(result.globalAlertLevel, "green");
  assert.equal(result.totalMonitoredNodes, 0);
  assert.deepEqual(result.telemetryFeeds, []);
  assert.equal(typeof result.apiUptimeSeconds, "number");
  assert.equal("auditLogs" in result, false);
});

test("an unhealthy database degrades status; a failed health check stays unknown", async () => {
  const unhealthy = await invoke(async () => ({ ok: false }));
  assert.equal(unhealthy.result.status, "degraded");
  assert.equal(unhealthy.result.databaseStatus, "unavailable");
  assert.equal(unhealthy.result.globalAlertLevel, "yellow");

  const failed = await invoke(async () => { throw new Error("database probe failed"); });
  assert.equal(failed.result.status, "unavailable");
  assert.equal(failed.result.databaseStatus, "unknown");
  assert.equal(failed.result.globalAlertLevel, "unknown");
});

test("a critical observation sets red global alert even when the database is healthy", async () => {
  const now = new Date().toISOString();
  const { result } = await invoke(async () => ({ ok: true }), [{
    id: "quake-critical",
    externalId: "quake-critical",
    source: "test-seismic-feed",
    category: "earthquake",
    sourceTier: "primary",
    observedAt: now,
    fetchedAt: now,
    freshnessSeconds: 0,
    confidence: 1,
    status: "available",
    normalized: { mag: 8.1 },
  }]);

  assert.equal(result.databaseStatus, "available");
  assert.equal(result.alerts.some((alert) => alert.level === "critical"), true);
  assert.equal(result.globalAlertLevel, "red");
});

test("region, sensor, and activity values are not presented as live data without sources", async () => {
  assert.doesNotMatch(routeSource, /AuditLogModel|UserModel/);
  const engine = await readFile(new URL("../../../packages/batteries-world-monitor/src/engine.ts", import.meta.url), "utf8");
  assert.doesNotMatch(engine, /Math\.random|generateTelemetryFeeds/);
  assert.match(engine, /currentStatus: "unavailable"/);
  assert.match(engine, /observedEventsCount: null/);
  assert.match(engine, /latencyMs: null/);
  assert.match(engine, /heliogridLoadMw: null/);
  assert.match(engine, /telemetryFeeds: \[\]/);
});
