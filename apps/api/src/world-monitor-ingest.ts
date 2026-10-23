import { WorldMonitorAggregateModel, WorldMonitorObservationModel, WorldMonitorSourceRunModel } from "@empire/batteries-base";
import { getDatabase } from "./db.js";
import { createHash } from "node:crypto";

type SourceSpec = { source: string; tier: "primary" | "fallback"; category: string; url: string; parse: (body: any) => Array<{ externalId?: string; observedAt: string; normalized: Record<string, unknown> }> };

const json = async (url: string): Promise<any> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
};

const now = () => new Date().toISOString();
export const parseObservedAt = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) throw new Error("Source observation timestamp is missing");
  const timestamp = /[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`;
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) throw new Error("Source observation timestamp is invalid");
  return new Date(parsed).toISOString();
};
export const parseOpenMeteo = (body: any) => {
  if (!body?.current || !Number.isFinite(Number(body.latitude)) || !Number.isFinite(Number(body.longitude))) throw new Error("Open-Meteo payload is missing coordinates or current values");
  return [{ observedAt: parseObservedAt(body.current.time), normalized: { latitude: Number(body.latitude), longitude: Number(body.longitude), ...body.current } }];
};
export const parseQuakes = (body: any) => {
  if (!Array.isArray(body?.features)) throw new Error("USGS payload has no feature list");
  return body.features.slice(0, 100).map((item: any) => {
    const time = Number(item?.properties?.time);
    if (!Number.isFinite(time) || typeof item?.id !== "string" || !item.id || !Array.isArray(item?.geometry?.coordinates)) throw new Error("USGS event has an invalid ID, timestamp, or coordinates");
    return { externalId: item.id, observedAt: new Date(time).toISOString(), normalized: { ...item.properties, coordinates: item.geometry.coordinates } };
  });
};
export const parseKp = (body: any) => {
  const row = Array.isArray(body) ? body.at(-1) : body;
  if (!row || typeof row !== "object") throw new Error("NOAA Kp payload has no latest row");
  const rawKp = row.kp_index ?? row.estimated_kp ?? row.Kp ?? (typeof row.kp === "string" ? Number.parseFloat(row.kp) : row.kp);
  const kp = Number(rawKp);
  if (!Number.isFinite(kp) || kp < 0 || kp > 9) throw new Error("NOAA Kp value is invalid");
  return [{ observedAt: parseObservedAt(row.time_tag ?? row.timeTag), normalized: { kp, kpKind: row.kp_index !== undefined || row.estimated_kp !== undefined ? "near-real-time estimate" : "reported", raw: row } }];
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

export async function refreshWorldMonitorSources(): Promise<void> {
  const database = getDatabase();
  const connection = await database.client.acquireConnection();
  try {
    const lockQuery = database.raw("SELECT pg_advisory_lock(hashtext(?))", ["empire:world-monitor:ingestion"]).connection(connection);
    await database.client.runner(lockQuery).run();
    await refreshWorldMonitorSourcesUnlocked();
  } finally {
    try {
      const unlockQuery = database.raw("SELECT pg_advisory_unlock(hashtext(?))", ["empire:world-monitor:ingestion"]).connection(connection);
      await database.client.runner(unlockQuery).run();
    } finally {
      await database.client.releaseConnection(connection);
    }
  }
}

async function refreshWorldMonitorSourcesUnlocked(): Promise<void> {
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
        const maxAgeSeconds = spec.category === "weather" ? 3_600 : spec.category === "atmosphere" ? 10_800 : spec.category === "space-weather" ? 1_800 : spec.category === "disaster" ? 86_400 : Number.POSITIVE_INFINITY;
        let freshestAgeSeconds = Number.POSITIVE_INFINITY;
        for (const record of records) freshestAgeSeconds = Math.min(freshestAgeSeconds, Math.max(0, Math.floor((Date.now() - Date.parse(record.observedAt)) / 1000)));
        const stale = records.length > 0 && freshestAgeSeconds > maxAgeSeconds;
        for (const record of records) {
          const age = Math.max(0, Math.floor((Date.now() - Date.parse(record.observedAt)) / 1000));
          const identity = worldMonitorObservationIdentity(spec.source, record);
          const observation = { source: spec.source, sourceTier: spec.tier, category: spec.category, externalId: identity.externalId, observedAt: record.observedAt, fetchedAt: now(), freshnessSeconds: age, confidence: spec.tier === "primary" ? 0.95 : 0.7, status: age > maxAgeSeconds ? "stale" : "available", normalized: record.normalized, payload: body };
          // Knex conflict targets are physical PostgreSQL column names; model attribute names are camelCase.
          await (WorldMonitorObservationModel.query() as any).insert(observation).onConflict(["source", "external_id", "observed_at"]).merge(observation);
        }
        await (WorldMonitorSourceRunModel.query() as any).insert({ source: spec.source, category: spec.category, tier: spec.tier, startedAt, completedAt: now(), status: records.length === 0 ? "empty" : stale ? "stale" : "success", recordCount: records.length, durationMs: Date.now() - startedMs, metadata: { url: spec.url, maxAgeSeconds, freshestAgeSeconds: records.length > 0 ? freshestAgeSeconds : null } });
        const bucketStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
        await (WorldMonitorAggregateModel.query() as any).insert({ bucketStart, category: spec.category, source: spec.source, recordCount: records.length, summary: { tier: spec.tier } });
        if (!stale) { succeeded = true; break; }
      } catch (error) {
        await (WorldMonitorSourceRunModel.query() as any).insert({ source: spec.source, category: spec.category, tier: spec.tier, startedAt, completedAt: now(), status: "failed", recordCount: 0, durationMs: Date.now() - startedMs, error: error instanceof Error ? error.message : String(error), metadata: { url: spec.url, ...(failureKind ? { failureKind } : {}) } });
      }
    }
    if (!succeeded) continue;
  }
  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
  await (WorldMonitorObservationModel.query() as any).delete().where("fetched_at", "<", cutoff);
  await (WorldMonitorSourceRunModel.query() as any).delete().where("started_at", "<", cutoff);
  await (WorldMonitorAggregateModel.query() as any).delete().where("bucket_start", "<", cutoff);
}
