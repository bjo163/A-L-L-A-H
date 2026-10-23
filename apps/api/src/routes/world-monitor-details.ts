import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";
import { getDatabase } from "@empire/batteries";
import { env } from "../env.js";
import { requirePermission, requireSession } from "./auth.js";
import {
  WORLD_MONITOR_ALERT_PAGE_SCHEMA,
  WORLD_MONITOR_HISTORY_PAGE_SCHEMA,
  WORLD_MONITOR_OBSERVATION_PAGE_SCHEMA,
  type WorldMonitorAlertPageItem,
  type WorldMonitorHistoryPageItem,
  type WorldMonitorObservationPageItem,
  type WorldMonitorPage,
} from "@empire/api-contract/world-monitor-details";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;
const MAX_WINDOW_MS = 30 * 86_400_000;
const DEFAULT_WINDOW_MS = 7 * 86_400_000;
const MAX_RESPONSE_BYTES = 64 * 1024;
const CURSOR_VERSION = 1;

type Feed = "observations" | "alerts" | "history";
type Filters = { category: string | null; source: string | null; from: string; to: string };
type Cursor = { v: 1; feed: Feed; filters: Filters; observedAt?: string; id?: string; bucket?: string };
type Query = { limit?: number; category?: string; source?: string; from?: string; to?: string; cursor?: string };
type ObservationRow = {
  id: string; source: string; category: string; source_tier: string; observed_at: Date | string;
  fetched_at: Date | string; freshness_seconds: number | null; confidence: number | null;
  status: string; normalized: Record<string, unknown> | null;
};
type HistoryRow = { bucket: Date | string; count: string | number };

function signingKey() {
  if (env.FILE_STORAGE_SIGNING_SECRET.length < 32) throw new Error("World Monitor cursor signing is unavailable.");
  return createHash("sha256").update(env.FILE_STORAGE_SIGNING_SECRET).digest();
}

function sealCursor(cursor: Cursor) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", signingKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(cursor)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

function openCursor(value: string, feed: Feed): Cursor {
  if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid cursor.");
  const bytes = Buffer.from(value, "base64url");
  if (bytes.length < 30) throw new Error("Invalid cursor.");
  const decipher = createDecipheriv("aes-256-gcm", signingKey(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  const decoded = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
  const cursor = JSON.parse(decoded) as Cursor;
  if (cursor.v !== CURSOR_VERSION || cursor.feed !== feed || !cursor.filters || typeof cursor.filters.from !== "string" || typeof cursor.filters.to !== "string") throw new Error("Invalid cursor.");
  if (feed === "history" ? !cursor.bucket : !cursor.observedAt || !cursor.id) throw new Error("Invalid cursor.");
  return cursor;
}

function parseDate(value: string | undefined, label: string): number | null {
  if (value === undefined) return null;
  if (value.length > 32 || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value)) throw new Error(`Invalid ${label} timestamp.`);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 19) !== value.slice(0, 19)) throw new Error(`Invalid ${label} timestamp.`);
  return parsed;
}

function resolveFilters(query: Query, feed: Feed, cursor: Cursor | null): Filters {
  const requestedCategory = query.category ?? null;
  const requestedSource = query.source ?? null;
  if (cursor && (requestedCategory !== null && requestedCategory !== cursor.filters.category || requestedSource !== null && requestedSource !== cursor.filters.source)) throw new Error("Cursor does not match filters.");
  const fromMs = parseDate(query.from, "from");
  const toMs = parseDate(query.to, "to");
  const filters = cursor?.filters ?? {
    category: requestedCategory,
    source: requestedSource,
    from: new Date(fromMs ?? Date.now() - DEFAULT_WINDOW_MS).toISOString(),
    to: new Date(toMs ?? Date.now()).toISOString(),
  };
  if (fromMs !== null && new Date(fromMs).toISOString() !== filters.from || toMs !== null && new Date(toMs).toISOString() !== filters.to) throw new Error("Cursor does not match date range.");
  const low = Date.parse(filters.from), high = Date.parse(filters.to);
  if (!Number.isFinite(low) || !Number.isFinite(high) || low >= high || high > Date.now() || high - low > MAX_WINDOW_MS) throw new Error("Date range must be ordered, no longer than 30 days, and not in the future.");
  if (feed === "history" && high - low > MAX_WINDOW_MS) throw new Error("History range exceeds 30 days.");
  return filters;
}

function queryFor(filters: Filters) {
  const db = getDatabase();
  const query = db("world_monitor_observations")
    .where("observed_at", ">=", filters.from)
    .andWhere("observed_at", "<=", filters.to);
  if (filters.category) query.andWhere("category", filters.category);
  if (filters.source) query.andWhere("source", filters.source);
  return query;
}

function iso(value: Date | string) { return value instanceof Date ? value.toISOString() : new Date(value).toISOString(); }
function safeString(value: unknown, maxLength: number) { return String(value ?? "").slice(0, maxLength); }
function pageSize(query: Query) {
  const limit = query.limit ?? DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) throw new Error("limit must be an integer from 1 to 100.");
  return limit;
}

function withHeaders(reply: FastifyReply) {
  reply.header("cache-control", "private, no-store").header("x-content-type-options", "nosniff");
}

function sendPage<T>(reply: FastifyReply, items: T[], nextCursor: string | null) {
  const result: WorldMonitorPage<T> = { schemaVersion: "1", items, nextCursor };
  if (Buffer.byteLength(JSON.stringify(result), "utf8") > MAX_RESPONSE_BYTES) {
    return reply.code(500).send({ status: "response_budget_exceeded" });
  }
  return reply.send(result);
}

function replyWithError(reply: FastifyReply, error: unknown) {
  withHeaders(reply);
  if (error instanceof Error && error.message === "World Monitor cursor signing is unavailable.") return reply.code(503).send({ status: "cursor_unavailable" });
  return reply.code(400).send({ status: "invalid_request", message: error instanceof Error ? error.message : "Invalid request." });
}

function eventAlerts(row: ObservationRow): WorldMonitorAlertPageItem[] {
  const value = row.normalized ?? {};
  const result: WorldMonitorAlertPageItem[] = [];
  const add = (kind: WorldMonitorAlertPageItem["kind"], category: string, amount: number, advisory: number, critical: number, unit: string) => {
    if (!Number.isFinite(amount) || amount < advisory) return;
    result.push({
      category: safeString(category, 64), source: safeString(row.source, 160), kind,
      level: amount >= critical ? "critical" : "advisory", observedAt: iso(row.observed_at),
      value: `${amount.toFixed(1)}${unit}`.slice(0, 48),
    });
  };
  const number = (key: string) => typeof value[key] === "number" ? value[key] as number : Number.NaN;
  if (row.category === "atmosphere") {
    add("pm25", "atmosphere", number("pm2_5"), Number(process.env.WM_PM25_ADVISORY ?? 55), Number(process.env.WM_PM25_CRITICAL ?? 150), " µg/m³");
  } else if (row.category === "space-weather") {
    add("geomagnetic", "space-weather", number("kp"), Number(process.env.WM_KP_ADVISORY ?? 5), Number(process.env.WM_KP_CRITICAL ?? 7), " Kp");
  } else if (row.category === "earthquake") {
    add("earthquake", "earthquake", number("mag"), Number(process.env.WM_QUAKE_ADVISORY ?? 5), Number(process.env.WM_QUAKE_CRITICAL ?? 7), " Mw");
  } else if (row.category === "disaster") {
    const alertlevel = typeof value.alertlevel === "string" ? value.alertlevel.toLowerCase() : "";
    if (alertlevel === "orange" || alertlevel === "red") result.push({
      category: "disaster", source: safeString(row.source, 160), kind: "disaster",
      level: alertlevel === "red" ? "critical" : "advisory", observedAt: iso(row.observed_at), value: alertlevel.toUpperCase(),
    });
  }
  return result;
}

const querySchema = {
  type: "object", additionalProperties: false,
  properties: {
    limit: { type: "integer", minimum: 1, maximum: MAX_PAGE_SIZE },
    category: { type: "string", minLength: 1, maxLength: 64 },
    source: { type: "string", minLength: 1, maxLength: 160 },
    from: { type: "string", maxLength: 32 }, to: { type: "string", maxLength: 32 },
    cursor: { type: "string", maxLength: 512 },
  },
} as const;

function commonOptions(summary: string, responseSchema: object) {
  return {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    preHandler: [requireSession, requirePermission("world-monitor:read")],
    schema: { tags: ["System"], summary, security: [{ bearerAuth: [] }], querystring: querySchema, response: { 200: responseSchema } },
  };
}

export async function worldMonitorDetailsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: Query }>("/v1/world-monitor/observations", commonOptions("Read a bounded page of system-wide World Monitor observations", WORLD_MONITOR_OBSERVATION_PAGE_SCHEMA), async (request, reply) => {
    try {
      withHeaders(reply);
      const limit = pageSize(request.query);
      const cursor = request.query.cursor ? openCursor(request.query.cursor, "observations") : null;
      const filters = resolveFilters(request.query, "observations", cursor);
      const query = queryFor(filters).select("id", "source", "category", "source_tier", "observed_at", "fetched_at", "freshness_seconds", "confidence", "status")
        .orderBy([{ column: "observed_at", order: "desc" }, { column: "id", order: "desc" }]);
      if (cursor?.observedAt && cursor.id) query.andWhere(function () {
        this.where("observed_at", "<", cursor.observedAt!).orWhere(function () { this.where("observed_at", cursor.observedAt!).andWhere("id", "<", cursor.id!); });
      });
      const rows = await query.limit(limit + 1) as ObservationRow[];
      const hasMore = rows.length > limit;
      const selected = rows.slice(0, limit);
      const items: WorldMonitorObservationPageItem[] = selected.map((row) => ({
        category: safeString(row.category, 64), source: safeString(row.source, 160), sourceTier: safeString(row.source_tier, 32),
        observedAt: iso(row.observed_at), fetchedAt: iso(row.fetched_at), status: safeString(row.status, 24),
        freshnessSeconds: Number.isFinite(row.freshness_seconds) ? Math.max(0, row.freshness_seconds!) : null,
        confidence: Number.isFinite(row.confidence) ? Math.max(0, Math.min(1, row.confidence!)) : null,
      }));
      const last = selected.at(-1);
      const next = hasMore && last ? sealCursor({ v: 1, feed: "observations", filters, observedAt: iso(last.observed_at), id: last.id }) : null;
      return sendPage(reply, items, next);
    } catch (error) { return replyWithError(reply, error); }
  });

  app.get<{ Querystring: Query }>("/v1/world-monitor/alerts", commonOptions("Read derived hazard alerts from a bounded observation page", WORLD_MONITOR_ALERT_PAGE_SCHEMA), async (request, reply) => {
    try {
      withHeaders(reply);
      const limit = pageSize(request.query);
      const cursor = request.query.cursor ? openCursor(request.query.cursor, "alerts") : null;
      const filters = resolveFilters(request.query, "alerts", cursor);
      const query = queryFor(filters).select("id", "source", "category", "observed_at", "normalized")
        .orderBy([{ column: "observed_at", order: "desc" }, { column: "id", order: "desc" }]);
      if (cursor?.observedAt && cursor.id) query.andWhere(function () {
        this.where("observed_at", "<", cursor.observedAt!).orWhere(function () { this.where("observed_at", cursor.observedAt!).andWhere("id", "<", cursor.id!); });
      });
      const rows = await query.limit(limit + 1) as ObservationRow[];
      const hasMore = rows.length > limit;
      const selected = rows.slice(0, limit);
      const items = selected.flatMap(eventAlerts);
      const last = selected.at(-1);
      const next = hasMore && last ? sealCursor({ v: 1, feed: "alerts", filters, observedAt: iso(last.observed_at), id: last.id }) : null;
      return sendPage(reply, items, next);
    } catch (error) { return replyWithError(reply, error); }
  });

  app.get<{ Querystring: Query }>("/v1/world-monitor/history", commonOptions("Read bounded hourly aggregate history", WORLD_MONITOR_HISTORY_PAGE_SCHEMA), async (request, reply) => {
    try {
      withHeaders(reply);
      const limit = pageSize(request.query);
      const cursor = request.query.cursor ? openCursor(request.query.cursor, "history") : null;
      const filters = resolveFilters(request.query, "history", cursor);
      const db = getDatabase();
      const query = queryFor(filters).select(db.raw("date_trunc('hour', observed_at) AS bucket")).count({ count: "id" })
        .groupBy("bucket").orderBy("bucket", "desc");
      if (cursor?.bucket) query.havingRaw("date_trunc('hour', observed_at) < ?", [cursor.bucket]);
      const rows = await query.limit(limit + 1) as HistoryRow[];
      const hasMore = rows.length > limit;
      const selected = rows.slice(0, limit);
      // This table stores time-series observations, including sources whose IDs
      // are synthetic hashes. Label the aggregate as samples; it is not an event count.
      const items: WorldMonitorHistoryPageItem[] = selected.map((row) => ({
        bucket: iso(row.bucket), metric: "observation_samples", observationCount: Math.max(0, Number(row.count) || 0),
      }));
      const last = selected.at(-1);
      const next = hasMore && last ? sealCursor({ v: 1, feed: "history", filters, bucket: iso(last.bucket) }) : null;
      return sendPage(reply, items, next);
    } catch (error) { return replyWithError(reply, error); }
  });
}
