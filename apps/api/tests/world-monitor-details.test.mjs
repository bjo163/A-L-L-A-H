import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import ts from "typescript";

const routeSource = await readFile(new URL("../src/routes/world-monitor-details.ts", import.meta.url), "utf8");
const compiledRoute = ts.transpileModule(
  routeSource.replace(/^import \{[\s\S]*?\} from .*;\r?\n/gm, "").replace(/^import .*;\r?\n/gm, "").replace("export async function", "async function"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
).outputText;
const schemas = { observations: {}, alerts: {}, history: {} };

class Query {
  constructor(rows, historyMode = false) { this.rows = rows; this.historyMode = historyMode; this.ops = []; this.logic = "and"; this.max = Infinity; this.bucketCursor = null; }
  where(column, operator, value) {
    if (typeof column === "function") {
      const group = new Query(this.rows); column.call(group);
      this.add((row) => group.matches(row));
    } else this.add((row) => compare(row[column], operator, value));
    return this;
  }
  andWhere(...args) { this.logic = "and"; return this.where(...args); }
  orWhere(...args) { this.logic = "or"; return this.where(...args); }
  add(predicate) { this.ops.push({ predicate, logic: this.logic }); this.logic = "and"; }
  matches(row) { return this.ops.reduce((ok, item, index) => index === 0 ? item.predicate(row) : item.logic === "or" ? ok || item.predicate(row) : ok && item.predicate(row), true); }
  select(...fields) { if (fields.flat().some((field) => typeof field === "string" && field.includes("date_trunc"))) this.historyMode = true; return this; }
  count() { this.historyMode = true; return this; }
  groupBy() { return this; }
  orderBy(order) { this.order = order; return this; }
  havingRaw(_sql, [bucket]) { this.bucketCursor = new Date(bucket).getTime(); return this; }
  limit(max) { this.max = max; return this.execute(); }
  execute() {
    let rows = this.rows.filter((row) => this.matches(row));
    if (this.historyMode) {
      const buckets = new Map();
      for (const row of rows) {
        const time = new Date(row.observed_at).getTime();
        const bucket = new Date(Math.floor(time / 3_600_000) * 3_600_000).toISOString();
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
      }
      rows = [...buckets].map(([bucket, count]) => ({ bucket, count })).filter((row) => this.bucketCursor === null || Date.parse(row.bucket) < this.bucketCursor);
      rows.sort((a, b) => Date.parse(b.bucket) - Date.parse(a.bucket));
    } else {
      rows.sort((a, b) => Date.parse(b.observed_at) - Date.parse(a.observed_at) || b.id.localeCompare(a.id));
    }
    return Promise.resolve(rows.slice(0, this.max));
  }
}
function compare(left, operator, right) {
  if (operator === "<") return left < right;
  if (operator === ">=") return new Date(left).getTime() >= new Date(right).getTime();
  if (operator === "<=") return new Date(left).getTime() <= new Date(right).getTime();
  return left === right;
}

function createRoutes(rows) {
  let permission;
  const routeDefs = new Map();
  const load = new Function(
    "exports", "createCipheriv", "createDecipheriv", "createHash", "randomBytes", "getDatabase", "env", "requirePermission", "requireSession",
    "WORLD_MONITOR_OBSERVATION_PAGE_SCHEMA", "WORLD_MONITOR_ALERT_PAGE_SCHEMA", "WORLD_MONITOR_HISTORY_PAGE_SCHEMA",
    `${compiledRoute}; return worldMonitorDetailsRoutes;`,
  );
  const register = load(
    {}, createCipheriv, createDecipheriv, createHash, randomBytes,
    () => { const db = (table) => { assert.equal(table, "world_monitor_observations"); return new Query(rows); }; db.raw = (sql) => sql; return db; },
    { FILE_STORAGE_SIGNING_SECRET: "test-secret-that-is-long-enough-for-aes-cursor" },
    (slug) => { permission = slug; return async () => {}; }, async () => {},
    schemas.observations, schemas.alerts, schemas.history,
  );
  register({ get(path, options, handler) { routeDefs.set(path, { options, handler }); } });
  return { routeDefs, get permission() { return permission; } };
}

function observation(id, observedAt, normalized = {}) {
  return { id, source: "usgs-test", category: "earthquake", source_tier: "primary", observed_at: observedAt,
    fetched_at: observedAt, freshness_seconds: 1, confidence: 0.9, status: "available", normalized,
    payload: { secret: "never serialize" } };
}
const dates = ["2026-10-22T10:00:00.000Z", "2026-10-22T09:00:00.000Z", "2026-10-22T08:00:00.000Z"];

test("details feeds require the dedicated permission and cap requests", async () => {
  const { routeDefs, permission } = createRoutes([]);
  assert.equal(permission, "world-monitor:read");
  for (const path of ["/v1/world-monitor/observations", "/v1/world-monitor/alerts", "/v1/world-monitor/history"]) {
    const route = routeDefs.get(path);
    assert.ok(route);
    assert.equal(route.options.config.rateLimit.max, 60);
    assert.equal(route.options.preHandler.length, 2);
  }
});

test("observation pages use deterministic cursors and return only allowlisted DTO fields", async () => {
  const { routeDefs } = createRoutes(dates.map((date, index) => observation(`id-${index}`, date)));
  const route = routeDefs.get("/v1/world-monitor/observations");
  const reply = () => ({ headers: {}, header(name, value) { this.headers[name] = value; return this; }, code(value) { this.statusCode = value; return this; }, send(value) { this.body = value; return value; } });
  const firstReply = reply();
  const first = await route.handler({ query: { limit: 1 } }, firstReply);
  assert.equal(first.items.length, 1);
  assert.equal(first.items[0].observedAt, dates[0]);
  assert.equal("id" in first.items[0], false);
  assert.equal("payload" in first.items[0], false);
  assert.equal(firstReply.headers["cache-control"], "private, no-store");
  assert.ok(first.nextCursor);
  const second = await route.handler({ query: { limit: 1, cursor: first.nextCursor } }, reply());
  assert.equal(second.items[0].observedAt, dates[1]);
  assert.notEqual(second.nextCursor, first.nextCursor);
});

test("alerts derive only bounded severity data and history pages aggregate hourly", async () => {
  const rows = [
    observation("quake-a", dates[0], { mag: 7.2, pm2_5: 220, kp: 8.2, alertlevel: "red", location: "private location", apiKey: "private" }),
    observation("quake-b", dates[1], { mag: 4.1 }),
  ];
  const { routeDefs } = createRoutes(rows);
  const reply = () => ({ headers: {}, header(name, value) { this.headers[name] = value; return this; }, code(value) { this.statusCode = value; return this; }, send(value) { this.body = value; return value; } });
  const alerts = await routeDefs.get("/v1/world-monitor/alerts").handler({ query: { limit: 1 } }, reply());
  assert.equal(alerts.items.length, 1);
  assert.equal(alerts.items[0].level, "critical");
  assert.equal(alerts.items[0].kind, "earthquake");
  assert.equal(JSON.stringify(alerts).includes("private"), false);
  const history = await routeDefs.get("/v1/world-monitor/history").handler({ query: { limit: 1 } }, reply());
  assert.equal(history.items.length, 1);
  assert.equal(history.items[0].count, 1);
  assert.ok(history.nextCursor);
});

test("date ranges and cursors are rejected when invalid or changed across pages", async () => {
  const { routeDefs } = createRoutes(dates.map((date, index) => observation(`id-${index}`, date)));
  const route = routeDefs.get("/v1/world-monitor/observations");
  const reply = () => ({ headers: {}, header(name, value) { this.headers[name] = value; return this; }, code(value) { this.statusCode = value; return this; }, send(value) { this.body = value; return value; } });
  const invalidRange = reply();
  await route.handler({ query: { from: "2026-01-01T00:00:00Z", to: "2026-10-22T00:00:00Z" } }, invalidRange);
  assert.equal(invalidRange.statusCode, 400);
  const first = await route.handler({ query: { limit: 1 } }, reply());
  const changed = reply();
  await route.handler({ query: { limit: 1, cursor: first.nextCursor, source: "other" } }, changed);
  assert.equal(changed.statusCode, 400);
});
