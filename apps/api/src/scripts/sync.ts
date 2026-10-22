import { preflightBaseModule, syncBaseModule } from "@empire/batteries-base";
import { initApiDatabase, checkDatabaseHealth } from "../db.js";
import { loadModulePlan } from "../module-runtime.js";

async function main() {
  console.log("⚡ [Batteries] Connecting to PostgreSQL...");
  const knex = initApiDatabase();
  try {
    const health = await checkDatabaseHealth();
    if (!health.ok) throw new Error(`Database connection failed: ${health.error ?? "unknown error"}`);
    const { enabled } = await loadModulePlan();

    if (process.argv.includes("--dry-run")) {
      const report = await preflightBaseModule(knex, enabled);
      console.log(JSON.stringify(report, null, 2));
      if (!report.ok) process.exitCode = 1;
      return;
    }

    console.log("🔄 [Batteries AutoSync] Synchronizing enabled module schemas and base records...");
    await syncBaseModule(knex, enabled);
    console.log("✅ Enabled module schema synchronized and base seed data verified.");
  } finally {
    await knex.destroy();
  }
}

main().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exitCode = 1;
});
