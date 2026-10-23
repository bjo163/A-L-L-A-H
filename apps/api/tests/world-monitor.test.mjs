import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import { readFile } from "node:fs/promises";

const routeSource = await readFile(new URL("../src/routes/world-monitor.ts", import.meta.url), "utf8");
const contractSource = await readFile(new URL("../../../packages/api-contract/src/index.ts", import.meta.url), "utf8");
const publicSummarySchemaSource = contractSource.match(/export const WORLD_MONITOR_PUBLIC_SUMMARY_SCHEMA = (\{[\s\S]*?\n\} as const);/)?.[1];
const publicSummarySchema = Function(`return (${publicSummarySchemaSource.replace(/ as const$/, "")});`)();
const compiledRoute = ts.transpileModule(
  routeSource.replace(/^import .*;\r?\n/gm, "").replace("export async function", "async function"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
).outputText;

function createRoute(checkDatabaseHealth, baseSnapshot, observations = [], runs = [], sourceDetails = [], sideEffects = {}) {
  const runQuery = {
    orderBy() { return this; },
    limit: async () => runs,
    insert() { sideEffects.writes = (sideEffects.writes ?? 0) + 1; return this; },
    update() { sideEffects.writes = (sideEffects.writes ?? 0) + 1; return this; },
    delete() { sideEffects.writes = (sideEffects.writes ?? 0) + 1; return this; },
  };
  const observationQuery = (criteria) => {
    const query = {
      orderBy() { return this; },
      limit: async (limit) => observations.filter((item) => Object.entries(criteria).every(([key, value]) => item[key] === value)).slice(0, limit),
      insert() { sideEffects.writes = (sideEffects.writes ?? 0) + 1; return this; },
      update() { sideEffects.writes = (sideEffects.writes ?? 0) + 1; return this; },
      delete() { sideEffects.writes = (sideEffects.writes ?? 0) + 1; return this; },
    };
    return query;
  };
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
    "WORLD_MONITOR_PUBLIC_SUMMARY_SCHEMA",
    "triggerManualWorldMonitorRefresh",
    `${compiledRoute}; return worldMonitorRoutes;`,
  );
  return load(
    {},
    checkDatabaseHealth,
    () => baseSnapshot,
    { getItems: () => [], getSummary: () => ({}), updateWorkflowStatus: () => null },
    async () => ({ scannedCount: 0, newItemsCount: 0, items: [], summary: {} }),
    () => "",
    { query: () => runQuery },
    { query: () => ({ where: observationQuery }) },
    () => sourceDetails,
    () => sourceDetails.map(({ source }) => source),
    async () => {},
    () => async () => {},
    async () => {},
    () => ({ acquire: () => ({ allowed: true, remaining: 4, retryAfterMs: 0, release() {} }) }),
    publicSummarySchema,
    async () => { sideEffects.refreshes = (sideEffects.refreshes ?? 0) + 1; },
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
  const responseHeaders = {};
  await createRoute(checkDatabaseHealth, createSnapshot(), observations, runs, sourceDetails)({
    get(path, routeOptions, routeHandler) {
      if (path === "/v1/world-monitor") {
        options = routeOptions;
        handler = routeHandler;
      }
    },
    post() {},
  });
  const call = () => handler({}, { header(name, value) { responseHeaders[name.toLowerCase()] = value; return this; } });
  return { options, result: await call(), handler: call, responseHeaders };
}

async function registerRoutes(overrides = {}) {
  const routes = { get: new Map(), post: new Map() };
  const checkDatabaseHealth = overrides.checkDatabaseHealth ?? (async () => ({ ok: true }));
  const app = {
    get(path, options, handler) { routes.get.set(path, { options, handler }); },
    post(path, options, handler) { routes.post.set(path, { options, handler }); },
  };
  const route = createRoute(
    checkDatabaseHealth,
    createSnapshot(),
    overrides.observations ?? [],
    overrides.runs ?? [],
    overrides.sourceDetails ?? [],
  );
  await route(app);
  return routes;
}


test("healthy database with no observations reports unknown data coverage, not green", async () => {
  const { options, result, responseHeaders } = await invoke(async () => ({ ok: true }));
  const routes = await registerRoutes();
  const refresh = routes.post.get("/v1/world-monitor/refresh");
  assert.ok(refresh);
  assert.equal(refresh.options.preHandler.length, 2);
  assert.deepEqual(options.schema.security, []);
  assert.equal(options.config.rateLimit.max, 120);
  assert.equal(options.config.rateLimit.timeWindow, "1 minute");
  assert.equal(options.config.rateLimit.keyGenerator({ ip: "203.0.113.4" }), "203.0.113.4");
  assert.equal(options.schema.response[200], publicSummarySchema);
  assert.equal(responseHeaders["cache-control"], "public, max-age=15, stale-while-revalidate=30");
  assert.ok(Buffer.byteLength(JSON.stringify(result), "utf8") <= 16 * 1024);
  assert.equal(result.status, "operational");
  assert.equal(result.databaseStatus, "available");
  assert.equal(result.globalAlertLevel, "unknown");
  assert.equal(result.ingestionStatus, "unknown");
  assert.equal(result.freshnessStatus, "unknown");
  assert.equal(result.coverageStatus, "unknown");
  assert.equal(result.hazardAlertLevel, "unknown");
  assert.equal(result.observationCount, 0);
  assert.equal(result.alertCount, 0);
  assert.equal(result.schemaVersion, "2");
  assert.equal(result.apiHealth, "healthy");
  assert.equal(result.databaseHealth, "healthy");
  assert.equal(result.ingestionHealth, "unknown");
  assert.equal(result.coverageHealth, "unknown");
  assert.equal(result.dataFreshness, "unknown");
  assert.equal(result.coverageDenominator, 0);
  assert.equal("auditLogs" in result, false);
});

test("100 concurrent public summary GETs perform no writes, source refreshes, or provider requests", async () => {
  const sideEffects = { writes: 0, refreshes: 0, providerRequests: 0 };
  let healthChecks = 0;
  let handler;
  const route = createRoute(async () => { healthChecks += 1; return { ok: true }; }, createSnapshot(), [], [], [], sideEffects);
  await route({
    get(path, _options, routeHandler) { if (path === "/v1/world-monitor") handler = routeHandler; },
    post() {},
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { sideEffects.providerRequests += 1; throw new Error("unexpected provider request from GET"); };
  try {
    await Promise.all(Array.from({ length: 100 }, () => handler({}, { header() { return this; } })));
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(healthChecks, 100);
  assert.equal(sideEffects.writes, 0);
  assert.equal(sideEffects.refreshes, 0);
  assert.equal(sideEffects.providerRequests, 0);
});

test("configured sources with no ingestion history are exposed as unknown coverage", async () => {
  const load = new Function(
    "exports", "checkDatabaseHealth", "getWorldMonitoringSnapshot", "youtubeSentinelRepo", "scanYoutube", "generateBrowserAutomationSnippet", "WorldMonitorSourceRunModel", "WorldMonitorObservationModel", "getActiveWorldMonitorSourceDetails", "getActiveWorldMonitorSources", "requireSession", "requirePermission", "requireTenant", "createYoutubeScanGate", "WORLD_MONITOR_PUBLIC_SUMMARY_SCHEMA",
    `${compiledRoute}; return worldMonitorRoutes;`,
  );
  let handler;
  const runQuery = { orderBy() { return this; }, limit: async () => [] };
  const observationQuery = { orderBy() { return this; }, limit: async () => [] };
  await load({}, async () => ({ ok: true }), createSnapshot, { getItems: () => [], getSummary: () => ({}), updateWorkflowStatus: () => null }, async () => ({ scannedCount: 0, newItemsCount: 0, items: [], summary: {} }), () => "", { query: () => runQuery }, { query: () => ({ where: () => observationQuery }) }, () => [{ source: "source-a", category: "weather", tier: "primary" }], () => ["source-a"], async () => {}, () => async () => {}, async () => {}, () => ({ acquire: () => ({ allowed: true, remaining: 4, retryAfterMs: 0, release() {} }) }), publicSummarySchema)({
    get(path, _options, fn) { if (path === "/v1/world-monitor") handler = fn; }, post() {},
  });
  const result = await handler({}, { header() { return this; } });
  assert.equal(result.sources[0].status, "unknown");
  assert.equal("source" in result.sources[0], false);
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
  const weather = result.sources.find((source) => source.category === "weather");
  assert.equal(weather.lastAttemptAt, now);
  assert.equal(weather.lastSuccessAt, now);
  assert.equal(weather.recordCount, 1);
  assert.equal(weather.fallbackActive, true);
  assert.equal(weather.configuredSourceCount, 2);
  assert.equal(weather.sourcesWithRecordsCount, 1);
  assert.equal(result.coverageNumerator, 1);
  assert.equal(result.coverageDenominator, 2);
  assert.equal(weather.freshnessSlaSeconds, 3600);
  assert.equal("source" in weather, false);
});

test("all configured providers failed: API and database remain healthy while ingestion is unavailable", async () => {
  const now = new Date().toISOString();
  const { result } = await invoke(async () => ({ ok: true }), [], [
    { source: "feed-a", category: "weather", tier: "primary", status: "failed", startedAt: now, completedAt: now, recordCount: 0, metadata: {} },
    { source: "feed-b", category: "weather", tier: "primary", status: "failed", startedAt: now, completedAt: now, recordCount: 0, metadata: {} },
  ], [
    { source: "feed-a", category: "weather", tier: "primary" },
    { source: "feed-b", category: "weather", tier: "primary" },
  ]);
  assert.equal(result.apiHealth, "healthy");
  assert.equal(result.databaseHealth, "healthy");
  assert.equal(result.ingestionHealth, "unavailable");
  assert.equal(result.coverageHealth, "unavailable");
  assert.equal(result.globalAlertLevel, "yellow");
  assert.equal(result.coverageNumerator, 0);
  assert.equal(result.coverageDenominator, 2);
});

test("mixed fresh and stale observations make freshness degraded and publish source denominator", async () => {
  const now = Date.now();
  const { result } = await invoke(async () => ({ ok: true }), [
    { id: "fresh", source: "feed-a", category: "weather", observedAt: new Date(now).toISOString(), status: "available" },
    { id: "stale", source: "feed-b", category: "weather", observedAt: new Date(now - 4_000_000).toISOString(), status: "available" },
  ], [
    { source: "feed-a", category: "weather", tier: "primary", status: "success", startedAt: new Date(now).toISOString(), completedAt: new Date(now).toISOString(), recordCount: 1, metadata: {} },
    { source: "feed-b", category: "weather", tier: "primary", status: "success", startedAt: new Date(now).toISOString(), completedAt: new Date(now).toISOString(), recordCount: 1, metadata: {} },
  ], [
    { source: "feed-a", category: "weather", tier: "primary" },
    { source: "feed-b", category: "weather", tier: "primary" },
  ]);
  assert.equal(result.dataFreshness, "degraded");
  assert.equal(result.coverageNumerator, 2);
  assert.equal(result.coverageDenominator, 2);
  assert.equal(result.sources[0].configuredSourceCount, 2);
});

test("a successful provider response with zero records is empty, not failed or healthy coverage", async () => {
  const now = new Date().toISOString();
  const { result } = await invoke(async () => ({ ok: true }), [], [
    { source: "gdacs-global-disasters", category: "disaster", tier: "primary", status: "empty", startedAt: now, completedAt: now, recordCount: 0, durationMs: 12, metadata: { maxAgeSeconds: 86400 } },
  ], [{ source: "gdacs-global-disasters", category: "disaster", tier: "primary" }]);
  const source = result.sources.find((item) => item.category === "disaster");

  assert.equal(source.status, "empty");
  assert.equal(source.recordCount, 0);
  assert.equal(source.lastSuccessAt, now);
  assert.equal(source.freshnessSlaSeconds, 86400);
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
  }], [], [{ source: "test-seismic-feed", category: "earthquake", tier: "primary" }]);

  assert.equal(result.databaseStatus, "available");
  assert.equal(result.alertCount, 1);
  assert.equal(result.globalAlertLevel, "red");
});

test("repeated samples share one time-bounded event and keep critical hazard through DB degradation", async () => {
  const now = new Date().toISOString();
  let databaseAvailable = true;
  const observations = ["sample-a", "sample-b"].map((id) => ({
    id, externalId: "quake-event-42", source: "test-seismic-feed", category: "earthquake",
    observedAt: now, fetchedAt: now, status: "available", normalized: { mag: 8.1 },
  }));
  const { result, handler } = await invoke(async () => ({ ok: databaseAvailable }), observations, [], [{ source: "test-seismic-feed", category: "earthquake", tier: "primary" }]);
  assert.equal(result.alertCount, 1);
  assert.equal("alerts" in result, false);

  const repeated = await handler();
  assert.equal(repeated.alertCount, 1);

  databaseAvailable = false;
  const degraded = await handler();
  assert.equal(degraded.databaseStatus, "unavailable");
  assert.equal(degraded.alertCount, 1);
  assert.equal(degraded.globalAlertLevel, "red");
});

test("a severity escalation updates the same event identity", async () => {
  const now = new Date().toISOString();
  const observation = {
    id: "quake-sample", externalId: "quake-event-99", source: "test-seismic-feed", category: "earthquake",
    observedAt: now, fetchedAt: now, status: "available", normalized: { mag: 5.5 },
  };
  const { result, handler } = await invoke(async () => ({ ok: true }), [observation], [], [{ source: "test-seismic-feed", category: "earthquake", tier: "primary" }]);
  assert.equal(result.alertCount, 1);
  observation.normalized.mag = 7.2;
  const escalated = await handler();
  assert.equal(escalated.alertCount, 1);
  assert.equal(escalated.hazardAlertLevel, "red");
});

test("hazards emit a resolved lifecycle after their observation-based TTL", async () => {
  const previousTtl = process.env.WM_HAZARD_TTL_EARTHQUAKE_SECONDS;
  process.env.WM_HAZARD_TTL_EARTHQUAKE_SECONDS = "0.03";
  try {
    const now = new Date().toISOString();
    const observation = {
      id: "expiring-quake", externalId: "quake-expiring", source: "test-seismic-feed", category: "earthquake",
      observedAt: now, fetchedAt: now, status: "available", normalized: { mag: 7.2 },
    };
    const { result, handler } = await invoke(async () => ({ ok: true }), [observation], [], [{ source: "test-seismic-feed", category: "earthquake", tier: "primary" }]);
    const eventId = "quake-expiring-quake";
    assert.equal(result.alertCount, 1);
    await new Promise((resolve) => setTimeout(resolve, 60));
    const expired = await handler();
    assert.equal(expired.alertCount, 0);
    assert.equal(expired.hazardAlertLevel, "green");
  } finally {
    if (previousTtl === undefined) delete process.env.WM_HAZARD_TTL_EARTHQUAKE_SECONDS;
    else process.env.WM_HAZARD_TTL_EARTHQUAKE_SECONDS = previousTtl;
  }
});

test("region, sensor, and activity values are not presented as live data without sources", async () => {
  const engine = await readFile(new URL("../../../packages/batteries-world-monitor/src/engine.ts", import.meta.url), "utf8");
  assert.doesNotMatch(engine, /Math\.random|generateTelemetryFeeds/);
  assert.match(engine, /currentStatus: "unavailable"/);
  assert.match(engine, /observedEventsCount: null/);
  assert.match(engine, /latencyMs: null/);
  assert.match(engine, /heliogridLoadMw: null/);
  assert.match(engine, /telemetryFeeds: \[\]/);
});

test("anonymous summary is allowlisted and bounded when the database contains high volume and secret fields", async () => {
  const now = new Date().toISOString();
  const rows = Array.from({ length: 10_000 }, (_, index) => ({
    id: `db-${index}`, externalId: `provider-${index}`, source: `source-${index % 6}`, category: ["weather", "atmosphere", "earthquake", "space-weather", "disaster"][index % 5],
    observedAt: now, fetchedAt: now, status: "available", normalized: { mag: 4, privateUrl: "https://private.example", apiKey: "secret" },
    rawPayload: { secret: true }, operatorNotes: "sensitive", tenantId: "tenant-secret", stack: "stack-secret",
  }));
  const { result } = await invoke(async () => ({ ok: true }), rows, [], Array.from({ length: 140 }, (_, index) => ({ source: `source-${index}`, category: "weather", tier: "primary" })));
  assert.equal(result.schemaVersion, "2");
  assert.equal(result.observationCount, 6);
  assert.equal(result.sources.length <= 5, true);
  assert.equal("observations" in result, false);
  assert.equal("alerts" in result, false);
  assert.equal("regions" in result, false);
  assert.equal(JSON.stringify(result).includes("secret"), false);
  assert.equal(JSON.stringify(result).includes("provider-"), false);
  assert.equal(JSON.stringify(result).includes("source-0"), false);
  assert.equal(JSON.stringify(result).includes("private.example"), false);
});

test("public summary has short cache headers and stays under the JSON byte ceiling for large source registries", async () => {
  const sourceDetails = Array.from({ length: 500 }, (_, index) => ({
    source: `source-${index}`,
    category: `category-${String(index).padStart(3, "0")}-${"x".repeat(54)}`,
    tier: "primary",
  }));
  const first = await invoke(async () => ({ ok: true }), [], [], sourceDetails);
  const second = await invoke(async () => ({ ok: true }), [], [], sourceDetails.slice().reverse());
  assert.equal(first.responseHeaders["cache-control"], "public, max-age=15, stale-while-revalidate=30");
  assert.ok(Buffer.byteLength(JSON.stringify(first.result), "utf8") <= 16 * 1024);
  assert.ok(first.result.sources.length < 100, "oversized aggregate should deterministically trim source summaries");
  assert.ok(first.result.history.length <= 168);
  assert.deepEqual(first.result.sources, second.result.sources, "large registry output should be stable across repeated reads");
});
