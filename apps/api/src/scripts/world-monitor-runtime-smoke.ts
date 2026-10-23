import { getDatabase, closeDatabase } from "@empire/batteries";
import { syncBaseModule, WorldMonitorAggregateModel, WorldMonitorObservationModel, WorldMonitorSourceRunModel } from "@empire/batteries-base";
import { loadModulePlan } from "../module-runtime.js";
import { refreshWorldMonitorSources } from "../world-monitor-ingest.js";
import { env } from "../env.js";
import { initApiDatabase } from "../db.js";
import { readFile } from "node:fs/promises";

const fixtureMode = process.argv.includes("--fixtures");
const liveMode = process.argv.includes("--live");
// Keep fixture event time constant across the two poll cycles so the second one
// is a true replay instead of an artificial new observation minute.
const fixtureTimestamp = new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();
const readFixture = async (name: string) => JSON.parse(await readFile(new URL(`../../tests/fixtures/world-monitor/${name}.json`, import.meta.url), "utf8"));
const freshFixture = (body: any, url: URL) => {
  const value = structuredClone(body);
  const current = fixtureTimestamp;
  if ((url.hostname === "api.open-meteo.com" || url.hostname === "air-quality-api.open-meteo.com") && Number.isFinite(Date.parse(value.current?.time))) value.current.time = current.slice(0, 19);
  else if (url.hostname === "earthquake.usgs.gov" && Array.isArray(value.features?.[0]?.geometry?.coordinates) && value.features[0].geometry.coordinates.length >= 3) value.features[0].properties.time = 1792644360000;
  else if (url.hostname === "services.swpc.noaa.gov" && Array.isArray(value) && value[0]?.time_tag) value[0].time_tag = current.slice(0, 19);
  else if (url.hostname === "www.gdacs.org" && value.features?.[0]?.properties?.fromdate) value.features[0].properties.fromdate = current;
  return value;
};

const installFixtureFetch = () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  globalThis.fetch = async (input, init) => {
    const requestUrl = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    if (!init?.signal || new Headers(init.headers).get("accept") !== "application/json") throw new Error("Provider request omitted its timeout or JSON accept header");
    requestCount += 1;
    let fixtureName: string;
    if (requestUrl.hostname === "air-quality-api.open-meteo.com") fixtureName = "open-meteo-air-quality";
    else if (requestUrl.hostname === "api.open-meteo.com") {
      const fallback = requestUrl.searchParams.get("models") === "gfs_seamless";
      const londonPrimary = !fallback && requestUrl.searchParams.get("latitude") === "51.5" && requestUrl.searchParams.get("longitude") === "-0.1";
      fixtureName = londonPrimary ? "open-meteo-malformed" : "open-meteo-weather";
    } else if (requestUrl.hostname === "earthquake.usgs.gov") fixtureName = requestUrl.pathname.includes("/summary/") ? "usgs-malformed" : "usgs-earthquakes";
    else if (requestUrl.hostname === "services.swpc.noaa.gov") fixtureName = requestUrl.pathname.endsWith("1m.json") ? "noaa-kp-malformed" : "noaa-kp-reported";
    else if (requestUrl.hostname === "www.gdacs.org") fixtureName = "gdacs-disasters";
    else throw new Error("Fixture smoke refused unrecognized network target: " + requestUrl.host);
    const body = await readFixture(fixtureName);
    return new Response(JSON.stringify(freshFixture(body, requestUrl)), { status: 200, headers: { "content-type": "application/json" } });
  };
  return { restore: () => { globalThis.fetch = originalFetch; }, requestCount: () => requestCount };
};

const main = async () => {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required for World Monitor runtime smoke test");
  if (fixtureMode && !/^postgres(?:ql)?:\/\/(?:[^@/]+@)?(?:127\.0\.0\.1|localhost):\d+\/eol_sync_test(?:\?|$)/i.test(env.DATABASE_URL)) {
    throw new Error("--fixtures is restricted to the local disposable eol_sync_test database at 127.0.0.1 or localhost");
  }
  if (!fixtureMode && !liveMode) throw new Error("Choose --fixtures for sanitized offline providers or explicitly opt in to live calls with --live");
  initApiDatabase();
  const plan = await loadModulePlan();
  await syncBaseModule(getDatabase(), plan.enabled);
  const db = getDatabase();
  const retentionSource = "issue-58-retention-fixture";
  if (fixtureMode) {
    const oldDate = new Date(Date.now() - 91 * 86_400_000).toISOString();
    await (WorldMonitorObservationModel.query() as any).insert({ source: retentionSource, sourceTier: "primary", category: "weather", externalId: retentionSource, observedAt: oldDate, fetchedAt: oldDate, status: "available", normalized: {}, payload: {} });
    await (WorldMonitorSourceRunModel.query() as any).insert({ source: retentionSource, category: "weather", tier: "primary", startedAt: oldDate, completedAt: oldDate, status: "success", recordCount: 0, durationMs: 0, metadata: {} });
    await (WorldMonitorAggregateModel.query() as any).insert({ bucketStart: oldDate, category: "weather", source: retentionSource, recordCount: 0, summary: {} });
  }
  const fixtureFetch = fixtureMode ? installFixtureFetch() : null;
  let firstPollCounts: { observations: number; sourceRuns: number } | null = null;
  const countRows = async (table: string) => Number((await db(table).count<{ count: string }>("id as count").first())?.count ?? 0);
  try {
    await refreshWorldMonitorSources();
    if (fixtureMode) {
      firstPollCounts = {
        observations: await countRows("world_monitor_observations"),
        sourceRuns: await countRows("world_monitor_source_runs"),
      };
      await refreshWorldMonitorSources(); // replay identical identities through PostgreSQL ON CONFLICT
    }
  } finally { fixtureFetch?.restore(); }
  const counts = {
    observations: await db("world_monitor_observations").count<{ count: string }>("id as count").first(),
    sourceRuns: await db("world_monitor_source_runs").count<{ count: string }>("id as count").first(),
    aggregates: await db("world_monitor_aggregates").count<{ count: string }>("id as count").first(),
  };
  const categories = await db("world_monitor_observations").select("category").count<{ category: string; count: string }[]>({ count: "id" }).groupBy("category");
  const categoryRuns = await db("world_monitor_source_runs").select("source", "category", "status", "record_count").orderBy("completed_at", "desc");
  console.log(JSON.stringify({ counts, categories, latestCategoryRuns: categoryRuns.slice(0, 30) }));
  if (Number(counts.observations?.count ?? 0) < 1 || Number(counts.sourceRuns?.count ?? 0) < 1 || Number(counts.aggregates?.count ?? 0) < 1) {
    throw new Error("World Monitor runtime smoke test did not produce all expected records");
  }
  const categoryCounts = new Map(categories.map((row) => [row.category, Number(row.count)]));
  for (const category of ["weather", "atmosphere", "earthquake", "space-weather", "disaster"]) {
    const hasObservations = Boolean(categoryCounts.get(category));
    const hasSuccessfulOrEmptyRun = categoryRuns.some((run) => run.category === category && ["success", "stale", "empty"].includes(run.status));
    if (!hasObservations && !hasSuccessfulOrEmptyRun) throw new Error(`World Monitor runtime smoke test produced neither observations nor a valid empty provider run for ${category}`);
  }
  if (fixtureMode) {
    if (!fixtureFetch || fixtureFetch.requestCount() < 40) throw new Error("Fixture runtime smoke did not exercise the provider and fallback request matrix twice");
    if (!firstPollCounts || Number(counts.observations?.count ?? 0) !== firstPollCounts.observations) {
      throw new Error("Replaying identical provider fixtures increased the unique observation count");
    }
    if (Number(counts.sourceRuns?.count ?? 0) <= firstPollCounts.sourceRuns) {
      throw new Error("Replaying provider fixtures did not preserve a new source-run audit record");
    }
    const hasRun = (source: string, status: string) => categoryRuns.some((run) => run.source === source && run.status === status);
    for (const [source, status] of [
      ["open-meteo-weather-london", "failed"], ["open-meteo-gfs-weather-london", "success"],
      ["usgs-earthquakes", "failed"], ["usgs-fdsn-earthquakes", "success"],
      ["noaa-swpc-kp-1m", "failed"], ["noaa-swpc-kp-final-fallback", "success"],
    ]) if (!hasRun(source, status)) throw new Error(`Fixture runtime smoke missed expected ${status} run for ${source}`);
    const fallbackSources = ["open-meteo-gfs-weather-london", "usgs-fdsn-earthquakes", "noaa-swpc-kp-final-fallback"];
    const fallbackObservations = await (WorldMonitorObservationModel.query() as any).whereIn("source", fallbackSources);
    if (fallbackObservations.length < 3 || fallbackObservations.some((item: any) => !item.sourceTier || item.payload !== null)) throw new Error("Fixture runtime smoke did not keep observation payloads absent with fallback provenance intact");
    const fallbackRuns = await (WorldMonitorSourceRunModel.query() as any).whereIn("source", fallbackSources).where({ status: "success" });
    if (fallbackRuns.length < 3 || fallbackRuns.some((run: any) => run.metadata?.rawPayloadRetention?.retained !== true || !run.metadata?.rawPayloadRetention?.payload)) throw new Error("Fixture runtime smoke did not retain one bounded sanitized sample per successful fallback run");
    const quakeIdentityCount = await db("world_monitor_observations").where({ source: "usgs-fdsn-earthquakes", external_id: "fixture-usgs-001" }).count<{ count: string }>("id as count").first();
    if (Number(quakeIdentityCount?.count) !== 1) throw new Error("Repeated fixture polling did not upsert the stable USGS observation identity");
    const retainedObservations = await db("world_monitor_observations").where({ source: retentionSource }).count<{ count: string }>("id as count").first();
    const retainedRuns = await db("world_monitor_source_runs").where({ source: retentionSource }).count<{ count: string }>("id as count").first();
    const retainedAggregates = await db("world_monitor_aggregates").where({ source: retentionSource }).count<{ count: string }>("id as count").first();
    if (Number(retainedObservations?.count) + Number(retainedRuns?.count) + Number(retainedAggregates?.count) !== 0) throw new Error("Fixture runtime smoke did not prune the aged retention sentinels");
    console.log(JSON.stringify({ fixtureMode: true, fakeProviderRequests: fixtureFetch.requestCount(), firstPollObservationCount: firstPollCounts.observations, replayObservationCount: Number(counts.observations?.count), firstPollSourceRunCount: firstPollCounts.sourceRuns, replaySourceRunCount: Number(counts.sourceRuns?.count), fallbackProvenanceCount: fallbackObservations.length, boundedRunPayloads: fallbackRuns.length, stableObservationUpserts: Number(quakeIdentityCount?.count), retentionSentinelsRemoved: true }));
  }
  await closeDatabase();
};

main().catch(async (error) => { console.error(error); await closeDatabase(); process.exitCode = 1; });
