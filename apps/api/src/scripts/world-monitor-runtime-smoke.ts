import { getDatabase, closeDatabase } from "@empire/batteries";
import { syncBaseModule } from "@empire/batteries-base";
import { loadModulePlan } from "../module-runtime.js";
import { refreshWorldMonitorSources } from "../world-monitor-ingest.js";
import { env } from "../env.js";
import { initApiDatabase } from "../db.js";

const main = async () => {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required for World Monitor runtime smoke test");
  initApiDatabase();
  const plan = await loadModulePlan();
  await syncBaseModule(getDatabase(), plan.enabled);
  await refreshWorldMonitorSources();
  const db = getDatabase();
  const counts = {
    observations: await db("world_monitor_observations").count<{ count: string }>("id as count").first(),
    sourceRuns: await db("world_monitor_source_runs").count<{ count: string }>("id as count").first(),
    aggregates: await db("world_monitor_aggregates").count<{ count: string }>("id as count").first(),
  };
  const categories = await db("world_monitor_observations").select("category").count<{ category: string; count: string }[]>({ count: "id" }).groupBy("category");
  console.log(JSON.stringify({ counts, categories }));
  if (Number(counts.observations?.count ?? 0) < 1 || Number(counts.sourceRuns?.count ?? 0) < 1 || Number(counts.aggregates?.count ?? 0) < 1) {
    throw new Error("World Monitor runtime smoke test did not produce all expected records");
  }
  const categoryCounts = new Map(categories.map((row) => [row.category, Number(row.count)]));
  for (const category of ["weather", "atmosphere", "earthquake", "space-weather", "disaster"]) {
    if (!categoryCounts.get(category)) throw new Error(`World Monitor runtime smoke test produced no ${category} observations`);
  }
  await closeDatabase();
};

main().catch(async (error) => { console.error(error); await closeDatabase(); process.exitCode = 1; });
