import { WorldMonitorAggregateModel, WorldMonitorObservationModel, WorldMonitorSourceRunModel } from "@empire/batteries-base";

type SourceSpec = { source: string; tier: "primary" | "fallback"; category: string; url: string; parse: (body: any) => Array<{ externalId?: string; observedAt: string; normalized: Record<string, unknown> }> };

const json = async (url: string): Promise<any> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
};

const now = () => new Date().toISOString();
const parseObservedAt = (value: unknown) => {
  if (typeof value !== "string") return now();
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`).toISOString();
};
export const parseOpenMeteo = (body: any) => [{ observedAt: parseObservedAt(body.current?.time), normalized: { latitude: body.latitude, longitude: body.longitude, ...body.current } }];
export const parseQuakes = (body: any) => (Array.isArray(body?.features) ? body.features : []).slice(0, 100).map((item: any) => ({ externalId: item.id, observedAt: item.properties?.time ? new Date(item.properties.time).toISOString() : now(), normalized: { ...item.properties, coordinates: item.geometry?.coordinates } }));
export const parseKp = (body: any) => {
  const row = Array.isArray(body) ? body.at(-1) : body;
  return [{ observedAt: parseObservedAt(row?.time_tag ?? row?.timeTag), normalized: { kp: Number(row?.kp_index ?? row?.estimated_kp ?? row?.Kp ?? Number.parseFloat(row?.kp) ?? NaN), kpKind: row?.kp_index !== undefined || row?.estimated_kp !== undefined ? "near-real-time estimate" : "reported", raw: row } }];
};

const globalPoints = [[51.5,-0.1,"london"],[40.7,-74,"new-york"],[35.7,139.7,"tokyo"],[-1.3,36.8,"nairobi"],[-23.5,-46.6,"sao-paulo"],[28.6,77.2,"delhi"],[-33.9,151.2,"sydney"],[64.1,-21.9,"reykjavik"]] as const;
const specs = (): SourceSpec[] => [
  ...globalPoints.map(([latitude, longitude, point]) => ({ source: `open-meteo-weather-${point}`, tier: "primary" as const, category: "weather", url: `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=GMT&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m`, parse: parseOpenMeteo })),
  ...globalPoints.map(([latitude, longitude, point]) => ({ source: `open-meteo-gfs-weather-${point}`, tier: "fallback" as const, category: "weather", url: `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=GMT&models=gfs_seamless&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,pressure_msl,wind_speed_10m`, parse: parseOpenMeteo })),
  ...globalPoints.map(([latitude, longitude, point]) => ({ source: `open-meteo-air-quality-cams-${point}`, tier: "primary" as const, category: "atmosphere", url: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&timezone=GMT&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,aerosol_optical_depth,dust`, parse: parseOpenMeteo })),
  { source: "usgs-earthquakes", tier: "primary", category: "earthquake", url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", parse: parseQuakes },
  { source: "usgs-fdsn-earthquakes", tier: "fallback", category: "earthquake", url: `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=100&orderby=time&starttime=${new Date(Date.now() - 86_400_000).toISOString()}`, parse: parseQuakes },
  { source: "noaa-swpc-kp-1m", tier: "primary", category: "space-weather", url: "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json", parse: parseKp },
  { source: "noaa-swpc-kp-final-fallback", tier: "fallback", category: "space-weather", url: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", parse: parseKp },
  { source: "gdacs-global-disasters", tier: "primary", category: "disaster", url: "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH", parse: (body: any) => (body?.features ?? body?.events ?? []).slice(0, 100).map((item: any) => ({ externalId: item.id ?? item.properties?.eventid ?? item.eventid, observedAt: parseObservedAt(item.properties?.datemodified ?? item.properties?.fromdate ?? item.datemodified ?? item.fromdate), normalized: item.properties ?? item })) },
];

export const getActiveWorldMonitorSources = () => specs().map(({ source }) => source);

export async function refreshWorldMonitorSources(): Promise<void> {
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
      try {
        const body = await json(spec.url);
        const records = spec.parse(body).filter((record) => record.normalized && Object.keys(record.normalized).length > 0);
        if (records.length === 0) throw new Error("Source returned no usable records");
        const maxAgeSeconds = spec.category === "weather" ? 3_600 : spec.category === "atmosphere" ? 10_800 : spec.category === "space-weather" ? 1_800 : spec.category === "disaster" ? 86_400 : Number.POSITIVE_INFINITY;
        let freshestAgeSeconds = Number.POSITIVE_INFINITY;
        for (const record of records) freshestAgeSeconds = Math.min(freshestAgeSeconds, Math.max(0, Math.floor((Date.now() - Date.parse(record.observedAt)) / 1000)));
        const stale = freshestAgeSeconds > maxAgeSeconds;
        for (const record of records) {
          const age = Math.max(0, Math.floor((Date.now() - Date.parse(record.observedAt)) / 1000));
          await (WorldMonitorObservationModel.query() as any).insert({ source: spec.source, sourceTier: spec.tier, category: spec.category, externalId: record.externalId ?? null, observedAt: record.observedAt, fetchedAt: now(), freshnessSeconds: age, confidence: spec.tier === "primary" ? 0.95 : 0.7, status: age > maxAgeSeconds ? "stale" : "available", normalized: record.normalized, payload: JSON.stringify(body) });
        }
        await (WorldMonitorSourceRunModel.query() as any).insert({ source: spec.source, category: spec.category, tier: spec.tier, startedAt, completedAt: now(), status: stale ? "stale" : "success", recordCount: records.length, durationMs: Date.now() - startedMs, metadata: { url: spec.url, maxAgeSeconds, freshestAgeSeconds } });
        const bucketStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
        await (WorldMonitorAggregateModel.query() as any).insert({ bucketStart, category: spec.category, source: spec.source, recordCount: records.length, summary: { tier: spec.tier } });
        if (!stale) { succeeded = true; break; }
      } catch (error) {
        await (WorldMonitorSourceRunModel.query() as any).insert({ source: spec.source, category: spec.category, tier: spec.tier, startedAt, completedAt: now(), status: "failed", recordCount: 0, durationMs: Date.now() - startedMs, error: error instanceof Error ? error.message : String(error), metadata: { url: spec.url } });
      }
    }
    if (!succeeded) continue;
  }
  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
  await (WorldMonitorObservationModel.query() as any).delete().where("fetched_at", "<", cutoff);
  await (WorldMonitorSourceRunModel.query() as any).delete().where("started_at", "<", cutoff);
  await (WorldMonitorAggregateModel.query() as any).delete().where("bucket_start", "<", cutoff);
}
