import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const routeSource = await readFile(new URL("../src/routes/world-monitor.ts", import.meta.url), "utf8");
const compiledRoute = ts.transpileModule(
  routeSource.replace(/^import .*;\r?\n/gm, "").replace("export async function", "async function"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
).outputText;

function createRoute(checkDatabaseHealth, baseSnapshot, observations = [], runs = [], sourceDetails = []) {
  const load = new Function(
    "exports",
    "checkDatabaseHealth",
    "getWorldMonitoringSnapshot",
    "youtubeSentinelRepo",
    "scanYoutube",
    "generateBrowserAutomationSnippet",
    "WorldMonitorSourceRunModel",
    "WorldMonitorObservationModel",
    "getActiveWorldMonitorSourceDetails",
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
    { query: () => ({ orderBy: () => ({ limit: async () => runs }) }) },
    { query: () => ({ where: ({ category }) => ({ orderBy: () => ({ limit: async () => observations.filter((item) => item.category === category) }) }) }) },
    () => sourceDetails,
    () => sourceDetails.map(({ source }) => source),
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
    ingestionStatus: "unknown",
    freshnessStatus: "unknown",
    coverageStatus: "unknown",
    hazardAlertLevel: "unknown",
    regions: [],
    dnaSensors: [],
    telemetryFeeds: [],
  };
}

async function invoke(checkDatabaseHealth, observations = [], runs = [], sourceDetails = []) {
  let options;
  let handler;
  await createRoute(checkDatabaseHealth, createSnapshot(), observations, runs, sourceDetails)({
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


test("healthy database with no observations reports unknown data coverage, not green", async () => {
  const { options, result } = await invoke(async () => ({ ok: true }));
  assert.deepEqual(options.schema.security, []);
  assert.equal(result.status, "operational");
  assert.equal(result.databaseStatus, "available");
  assert.equal(result.globalAlertLevel, "unknown");
  assert.equal(result.ingestionStatus, "unknown");
  assert.equal(result.freshnessStatus, "unknown");
  assert.equal(result.coverageStatus, "unknown");
  assert.equal(result.hazardAlertLevel, "unknown");
  assert.equal(result.totalMonitoredNodes, 0);
  assert.deepEqual(result.telemetryFeeds, []);
  assert.equal(typeof result.apiUptimeSeconds, "number");
  assert.equal("auditLogs" in result, false);
});

test("configured sources with no ingestion history are exposed as unknown coverage", async () => {
  const load = new Function(
    "exports", "checkDatabaseHealth", "getWorldMonitoringSnapshot", "youtubeSentinelRepo", "scanYoutube", "generateBrowserAutomationSnippet", "WorldMonitorSourceRunModel", "WorldMonitorObservationModel", "getActiveWorldMonitorSourceDetails", "getActiveWorldMonitorSources", "requireSession", "requirePermission", "requireTenant", "createYoutubeScanGate",
    `${compiledRoute}; return worldMonitorRoutes;`,
  );
  let handler;
  await load({}, async () => ({ ok: true }), createSnapshot, { getItems: () => [], getSummary: () => ({}), updateWorkflowStatus: () => null }, async () => ({ scannedCount: 0, newItemsCount: 0, items: [], summary: {} }), () => "", { query: () => ({ orderBy: () => ({ limit: async () => [] }) }) }, { query: () => ({ where: () => ({ orderBy: () => ({ limit: async () => [] }) }) }) }, () => [{ source: "source-a", category: "weather", tier: "primary" }], () => ["source-a"], async () => {}, () => async () => {}, async () => {}, () => ({ acquire: () => ({ allowed: true, remaining: 4, retryAfterMs: 0, release() {} }) }))({
    get(path, _options, fn) { if (path === "/v1/world-monitor") handler = fn; }, post() {},
  });
  const result = await handler();
  assert.doesNotMatch(routeSource, /refreshWorldMonitorSources/);
  assert.equal(result.sources[0].status, "unknown");
  assert.equal(result.coverageStatus, "unknown");
  assert.equal(result.globalAlertLevel, "unknown");
});

test("source health exposes actual attempt, success, freshness, coverage and fallback states", async () => {
  const now = new Date().toISOString();
  const { result } = await invoke(async () => ({ ok: true }), [{
    id: "weather-1", source: "open-meteo-weather-london", category: "weather", observedAt: now,
    status: "available", freshnessSeconds: 0,
  }, {
    id: "weather-fallback-1", source: "open-meteo-gfs-weather-london", category: "weather", observedAt: now,
    status: "available", freshnessSeconds: 0,
  }], [
    { source: "open-meteo-weather-london", category: "weather", tier: "primary", status: "failed", startedAt: now, completedAt: now, recordCount: 0, durationMs: 40, metadata: { failureKind: "parse" } },
    { source: "open-meteo-gfs-weather-london", category: "weather", tier: "fallback", status: "success", startedAt: now, completedAt: now, recordCount: 1, durationMs: 60, metadata: { maxAgeSeconds: 3600 } },
  ], [
    { source: "open-meteo-weather-london", category: "weather", tier: "primary" },
    { source: "open-meteo-gfs-weather-london", category: "weather", tier: "fallback" },
  ]);
  const primary = result.sources.find((source) => source.source === "open-meteo-weather-london");
  const fallback = result.sources.find((source) => source.source === "open-meteo-gfs-weather-london");
  assert.equal(primary.lastAttemptAt, now);
  assert.equal(primary.lastSuccessAt, null);
  assert.equal(primary.failureStreak, 1);
  assert.equal(primary.parseErrors, 1);
  assert.equal(primary.coverageStatus, "healthy");
  assert.equal(fallback.lastSuccessAt, now);
  assert.equal(fallback.fetchedPoints, 1);
  assert.equal(fallback.fallbackActivated, true);
  assert.equal(fallback.freshnessSlaSeconds, 3600);
  assert.equal(fallback.coverageStatus, "healthy");
  assert.equal(fallback.coverage, null);
});

test("a successful provider response with zero records is empty, not failed or healthy coverage", async () => {
  const now = new Date().toISOString();
  const { result } = await invoke(async () => ({ ok: true }), [], [
    { source: "gdacs-global-disasters", category: "disaster", tier: "primary", status: "empty", startedAt: now, completedAt: now, recordCount: 0, durationMs: 12, metadata: { maxAgeSeconds: 86400 } },
  ], [{ source: "gdacs-global-disasters", category: "disaster", tier: "primary" }]);
  const source = result.sources.find((item) => item.source === "gdacs-global-disasters");

  assert.equal(source.status, "empty");
  assert.equal(source.records, 0);
  assert.equal(source.lastSuccessAt, now);
  assert.equal(source.coverage, null);
  assert.equal(source.coverageStatus, "unknown");
  assert.equal(result.ingestionStatus, "healthy");
  assert.equal(result.coverageStatus, "unknown");
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
