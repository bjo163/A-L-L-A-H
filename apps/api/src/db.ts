import {
  createDatabase,
  checkDatabaseHealth,
  closeDatabase,
  getDatabase,
  preflightModels,
} from "@empire/batteries";
import type { BatteriesModel } from "@empire/batteries";
import { getModuleSchemaStatus, type SchemaModuleManifest } from "@empire/batteries-base";
import { env } from "./env.js";

export function initApiDatabase() {
  return createDatabase({
    client: "pg",
    connection: env.DATABASE_URL,
    pool: { min: 2, max: 10 },
  });
}

export async function checkDatabaseSchema(
  models: Array<typeof BatteriesModel>,
  modules: readonly SchemaModuleManifest[],
): Promise<{
  ok: boolean;
  missingTables: string[];
  modules: Awaited<ReturnType<typeof getModuleSchemaStatus>>;
  pendingOperations: string[];
  blockers: string[];
}> {
  const database = getDatabase();
  const missingTables: string[] = [];
  for (const model of models) {
    if (model.tableName && !(await database.schema.hasTable(model.tableName))) {
      missingTables.push(model.tableName);
    }
  }
  const moduleStatus = await getModuleSchemaStatus(database, modules);
  const preflight = await preflightModels(database, models);
  const pendingOperations = preflight.models.flatMap((item) =>
    item.operations.map((operation) => `${item.table}:${operation}`),
  );
  const blockers = preflight.models.flatMap((item) =>
    item.blockers.map((blocker) => `${item.table}:${blocker}`),
  );
  return {
    ok: missingTables.length === 0 && preflight.ok && pendingOperations.length === 0 &&
      moduleStatus.every((module) => module.state === "current"),
    missingTables,
    modules: moduleStatus,
    pendingOperations,
    blockers,
  };
}

export { checkDatabaseHealth, closeDatabase, getDatabase };
