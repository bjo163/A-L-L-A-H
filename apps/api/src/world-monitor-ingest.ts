import { WorldMonitorAggregateModel, WorldMonitorObservationModel, WorldMonitorSourceRunModel } from "@empire/batteries-base";
import { getDatabase } from "./db.js";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";

type SourceSpec = { source: string; tier: "primary" | "fallback"; category: string; url: string; parse: (body: any) => Array<{ externalId?: string; observedAt: string; normalized: Record<string, unknown> }> };

const json = async (url: string): Promise<any> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
};

const now = () => new Date().toISOString();
/** Keep a single sanitized provider sample on its source-run row, never duplicate
 * the full response across every observation. Oversized or structurally hostile
 * payloads are omitted; normalized observation values remain independently stored. */
export const WORLD_MONITOR_RAW_PAYLOAD_MAX_BYTES = 64 * 1024;
const SENSITIVE_PAYLOAD_KEY = /(authorization|cookie|password|secret|token|api[_-]?key|e-?mail)/i;
const EMAIL_VALUE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
export function boundedWorldMonitorRawPayload(body: unknown) {
  let nodes = 0;
  const redact = (value: unknown, depth: number): unknown => {
    nodes += 1;
    if (nodes > 20_000 || depth > 20) throw new Error("payload_shape_limit");
    if (typeof value === "string") return value.replace(EMAIL_VALUE, "[redacted-email]");
    if (Array.isArray(value)) return value.slice(0, 2_000).map((item) => redact(item, depth + 1));
    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 2_000)) {
        result[key] = SENSITIVE_PAYLOAD_KEY.test(key) ? "[redacted]" : redact(item, depth + 1);
      }
      return result;
    }
    return value;
  };
  const original = JSON.stringify(body);
  const originalBytes = Buffer.byteLength(original ?? "null", "utf8");
  const sha256 = createHash("sha256").update(original ?? "null").digest("hex");
  try {
    const sanitized = redact(body, 0);
    const serialized = JSON.stringify(sanitized);
    const retainedBytes = Buffer.byteLength(serialized ?? "null", "utf8");
    if (retainedBytes > WORLD_MONITOR_RAW_PAYLOAD_MAX_BYTES) return { retained: false, reason: "size_limit", originalBytes, sha256 };
    return { retained: true, originalBytes, retainedBytes, sha256, payload: sanitized };
  } catch (error) {
    return { retained: false, reason: error instanceof Error ? error.message : "payload_shape_limit", originalBytes, sha256 };
  }
}

export const parseObservedAt = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) throw new Error("Source observation timestamp is missing");
  const input = value.trim();
  // Provider timestamps without an offset are UTC, but only accept an ISO date/time;
  // Date.parse alone accepts ambiguous strings and silently normalizes impossible dates.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?$/i.test(input)) throw new Error("Source observation timestamp is invalid");
  const timestamp = /(?:Z|[+-]\d\d:\d\d)$/i.test(input) ? input : `${input}Z`;
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) throw new Error("Source observation timestamp is invalid");
  if (parsed > Date.now() + 5 * 60 * 1000) throw new Error("Source observation timestamp is in the future");
  const result = new Date(parsed).toISOString();
  const datePrefix = input.slice(0, 10);
  if (new Date(`${datePrefix}T00:00:00Z`).toISOString().slice(0, 10) !== datePrefix) throw new Error("Source observation timestamp is invalid");
  return result;
};
const finiteInRange = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
export const parseOpenMeteo = (body: any) => {
  if (!body?.current || !finiteInRange(body.latitude, -90, 90) || !finiteInRange(body.longitude, -180, 180)) throw new Error("Open-Meteo payload is missing valid coordinates or current values");
  const current = body.current;
  const observedAt = parseObservedAt(current.time);
  const measurementRanges: Record<string, [number, number]> = { temperature_2m: [-100, 70], apparent_temperature: [-120, 80], relative_humidity_2m: [0, 100], precipitation: [0, 5000], weather_code: [0, 99], cloud_cover: [0, 100], pressure_msl: [800, 1200], wind_speed_10m: [0, 500], wind_direction_10m: [0, 360], pm10: [0, 5000], pm2_5: [0, 2000], carbon_monoxide: [0, 100000], nitrogen_dioxide: [0, 10000], ozone: [0, 10000], aerosol_optical_depth: [0, 10], dust: [0, 100000] };
  const measurements: Record<string, unknown> = {};
  for (const [key, range] of Object.entries(measurementRanges)) {
    if (current[key] !== undefined) {
      if (!finiteInRange(current[key], ...range)) throw new Error(`Open-Meteo measurement ${key} is outside its valid range`);
      measurements[key] = current[key];
    }
  }
  if (!Object.keys(measurements).length) throw new Error("Open-Meteo payload has no recognized numeric measurements");
  return [{ observedAt, normalized: { latitude: body.latitude, longitude: body.longitude, ...measurements } }];
};
export const parseQuakes = (body: any) => {
  if (!Array.isArray(body?.features)) throw new Error("USGS payload has no feature list");
  return body.features.slice(0, 100).map((item: any) => {
    const time = Number(item?.properties?.time);
    if (!Number.isFinite(time) || typeof item?.id !== "string" || !item.id || !Array.isArray(item?.geometry?.coordinates)) throw new Error("USGS event has an invalid ID, timestamp, or coordinates");
    // Apply the same future-clock-skew policy to numeric USGS epoch timestamps
    // as to ISO timestamps from other providers.
    const observedAt = parseObservedAt(new Date(time).toISOString());
    return { externalId: item.id, observedAt, normalized: { ...item.properties, coordinates: item.geometry.coordinates } };
  });
};
export const parseKp = (body: any) => {
  let row = Array.isArray(body) ? body.at(-1) : body;
  // NOAA's legacy product is tabular JSON: [header[], ...rows[]]. Select the
  // latest valid data row by its named columns rather than treating arrays as objects.
  if (Array.isArray(body) && Array.isArray(body[0])) {
    const headers = body[0].map((value: unknown) => String(value).trim().toLowerCase());
    const timeIndex = headers.indexOf("time_tag");
    const kpIndex = headers.indexOf("kp");
    const candidates = body.slice(1).filter((candidate: unknown) => Array.isArray(candidate) && candidate.length > Math.max(timeIndex, kpIndex));
    const latest = candidates.at(-1);
    if (timeIndex < 0 || kpIndex < 0 || !latest) throw new Error("NOAA Kp tabular payload has no valid latest row");
    row = { time_tag: String(latest[timeIndex]).replace(" ", "T"), kp: latest[kpIndex] };
  }
  if (!row || typeof row !== "object") throw new Error("NOAA Kp payload has no latest row");
  const rawKp = row.kp_index ?? row.estimated_kp ?? row.Kp ?? (typeof row.kp === "string" ? Number.parseFloat(row.kp) : row.kp);
  const kp = Number(rawKp);
  if (!Number.isFinite(kp) || kp < 0 || kp > 9) throw new Error("NOAA Kp value is invalid");
  return [{ observedAt: parseObservedAt(row.time_tag ?? row.timeTag), normalized: { kp, kpKind: row.kp_index !== undefined || row.estimated_kp !== undefined ? "near-real-time estimate" : "reported" } }];
};

export const parseDisasters = (body: any) => {
  const events = body?.features ?? body?.events;
  if (!Array.isArray(events)) throw new Error("GDACS payload has no event list");
  return events.slice(0, 100).map((item: any) => ({
    externalId: String(item.id ?? item.properties?.eventid ?? item.eventid ?? ""),
    observedAt: parseObservedAt(item.properties?.datemodified ?? item.properties?.fromdate ?? item.datemodified ?? item.fromdate),
    normalized: item.properties ?? item,
  })).filter((item: any) => item.externalId && item.normalized && typeof item.normalized === "object");
};

export const worldMonitorObservationIdentity = (source: string, record: { externalId?: string; observedAt: string; normalized: Record<string, unknown> }) => ({
  source,
  externalId: record.externalId ?? createHash("sha256").update(JSON.stringify(record.normalized)).digest("hex"),
  observedAt: record.observedAt,
});

const globalPoints = [[51.5,-0.1,"london"],[40.7,-74,"new-york"],[35.7,139.7,"tokyo"],[-1.3,36.8,"nairobi"],[-23.5,-46.6,"sao-paulo"],[28.6,77.2,"delhi"],[-33.9,151.2,"sydney"],[64.1,-21.9,"reykjavik"]] as const;
const specs = (): SourceSpec[] => [
  ...globalPoints.map(([latitude, longitude, point]) => ({ source: `open-meteo-weather-${point}`, tier: "primary" as const, category: "weather", url: `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=GMT&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m`, parse: parseOpenMeteo })),
  ...globalPoints.map(([latitude, longitude, point]) => ({ source: `open-meteo-gfs-weather-${point}`, tier: "fallback" as const, category: "weather", url: `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=GMT&models=gfs_seamless&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,pressure_msl,wind_speed_10m`, parse: parseOpenMeteo })),
  ...globalPoints.map(([latitude, longitude, point]) => ({ source: `open-meteo-air-quality-cams-${point}`, tier: "primary" as const, category: "atmosphere", url: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&timezone=GMT&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,aerosol_optical_depth,dust`, parse: parseOpenMeteo })),
  { source: "usgs-earthquakes", tier: "primary", category: "earthquake", url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", parse: parseQuakes },
  { source: "usgs-fdsn-earthquakes", tier: "fallback", category: "earthquake", url: `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=100&orderby=time&starttime=${new Date(Date.now() - 86_400_000).toISOString()}`, parse: parseQuakes },
  { source: "noaa-swpc-kp-1m", tier: "primary", category: "space-weather", url: "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json", parse: parseKp },
  { source: "noaa-swpc-kp-final-fallback", tier: "fallback", category: "space-weather", url: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", parse: parseKp },
  { source: "gdacs-global-disasters", tier: "primary", category: "disaster", url: "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH", parse: parseDisasters },
];

export const getActiveWorldMonitorSourceDetails = () => specs().map(({ source, category, tier }) => ({ source, category, tier }));
export const getActiveWorldMonitorSources = () => getActiveWorldMonitorSourceDetails().map(({ source }) => source);

export type WorldMonitorRefreshResult = { jobId: string; status: "completed" | "skipped"; reason?: "lease_held"; startedAt: string; finishedAt: string };

export async function tryAcquireWorldMonitorIngestionLease(database: any, connection: any): Promise<boolean> {
  const query = database.raw("SELECT pg_try_advisory_lock(hashtext(?)) AS acquired", ["empire:world-monitor:ingestion"]).connection(connection);
  const result = await database.client.runner(query).run();
  const value = result?.rows?.[0]?.acquired ?? result?.[0]?.acquired;
  return value === true || value === "t" || value === 1;
}

export async function releaseWorldMonitorIngestionLease(database: any, connection: any): Promise<void> {
  const query = database.raw("SELECT pg_advisory_unlock(hashtext(?))", ["empire:world-monitor:ingestion"]).connection(connection);
  await database.client.runner(query).run();
}

export async function refreshWorldMonitorSources(): Promise<WorldMonitorRefreshResult> {
  const jobId = randomUUID();
  const startedAt = now();
  const database = getDatabase();
  const connection = await database.client.acquireConnection();
  let acquired = false;
  try {
    // Session-scoped PostgreSQL try-lock coordinates all API replicas and releases
    // automatically if the owning process/connection dies. Contenders skip instead
    // of queueing a duplicate full provider poll behind the active worker.
    acquired = await tryAcquireWorldMonitorIngestionLease(database, connection);
    if (!acquired) return { jobId, status: "skipped", reason: "lease_held", startedAt, finishedAt: now() };
    await refreshWorldMonitorSourcesUnlocked(jobId);
    return { jobId, status: "completed", startedAt, finishedAt: now() };
  } finally {
    try {
      if (acquired) {
        await releaseWorldMonitorIngestionLease(database, connection);
      }
    } finally {
      await database.client.releaseConnection(connection);
    }
  }
}

async function refreshWorldMonitorSourcesUnlocked(jobId: string): Promise<void> {
  const grouped = new Map<string, SourceSpec[]>();
  for (const spec of specs()) {
    const point = spec.source.match(/-(london|new-york|tokyo|nairobi|sao-paulo|delhi|sydney|reykjavik)$/)?.[1] ?? "global";
    const key = `${spec.category}:${point}`;
    grouped.set(key, [...(grouped.get(key) ?? []), spec]);
  }
  for (const candidates of grouped.values()) {
    let succeeded = false;
    for (const spec of candidates) {
      const startedAt = now();
      const startedMs = Date.now();
      let failureKind: "parse" | null = null;
      try {
        const body = await json(spec.url);
        let parsedRecords;
        try {
          parsedRecords = spec.parse(body);
        } catch (error) {
          failureKind = "parse";
          throw error;
        }
        const records = parsedRecords.filter((record) => record.normalized && Object.keys(record.normalized).length > 0);
        const rawPayloadRetention = boundedWorldMonitorRawPayload(body);
        const maxAgeSeconds = spec.category === "weather" ? 3_600 : spec.category === "atmosphere" ? 10_800 : spec.category === "space-weather" ? 1_800 : spec.category === "disaster" ? 86_400 : Number.POSITIVE_INFINITY;
        let freshestAgeSeconds = Number.POSITIVE_INFINITY;
        for (const record of records) freshestAgeSeconds = Math.min(freshestAgeSeconds, Math.max(0, Math.floor((Date.now() - Date.parse(record.observedAt)) / 1000)));
        const stale = records.length > 0 && freshestAgeSeconds > maxAgeSeconds;
        for (const record of records) {
          const age = Math.max(0, Math.floor((Date.now() - Date.parse(record.observedAt)) / 1000));
          const identity = worldMonitorObservationIdentity(spec.source, record);
          const observation = { source: spec.source, sourceTier: spec.tier, category: spec.category, externalId: identity.externalId, observedAt: record.observedAt, fetchedAt: now(), freshnessSeconds: age, confidence: spec.tier === "primary" ? 0.95 : 0.7, status: age > maxAgeSeconds ? "stale" : "available", normalized: record.normalized, payload: null };
          // Knex conflict targets are physical PostgreSQL column names; model attribute names are camelCase.
          await (WorldMonitorObservationModel.query() as any).insert(observation).onConflict(["source", "external_id", "observed_at"]).merge(observation);
        }
        await (WorldMonitorSourceRunModel.query() as any).insert({ source: spec.source, category: spec.category, tier: spec.tier, startedAt, completedAt: now(), status: records.length === 0 ? "empty" : stale ? "stale" : "success", recordCount: records.length, durationMs: Date.now() - startedMs, metadata: { jobId, url: spec.url, maxAgeSeconds, freshestAgeSeconds: records.length > 0 ? freshestAgeSeconds : null, rawPayloadRetention } });
        const bucketStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
        await (WorldMonitorAggregateModel.query() as any).insert({ bucketStart, category: spec.category, source: spec.source, recordCount: records.length, summary: { tier: spec.tier } });
        if (!stale) { succeeded = true; break; }
      } catch (error) {
        await (WorldMonitorSourceRunModel.query() as any).insert({ source: spec.source, category: spec.category, tier: spec.tier, startedAt, completedAt: now(), status: "failed", recordCount: 0, durationMs: Date.now() - startedMs, error: error instanceof Error ? error.message : String(error), metadata: { jobId, url: spec.url, ...(failureKind ? { failureKind } : {}) } });
      }
    }
    if (!succeeded) continue;
  }
  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
  await (WorldMonitorObservationModel.query() as any).delete().where("fetched_at", "<", cutoff);
  await (WorldMonitorSourceRunModel.query() as any).delete().where("started_at", "<", cutoff);
  await (WorldMonitorAggregateModel.query() as any).delete().where("bucket_start", "<", cutoff);
}
