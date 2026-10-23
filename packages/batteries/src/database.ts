import knex, { type Knex } from "knex";
import { Model } from "objection";
import type { DatabaseConfig } from "./types.js";

let knexInstance: Knex | null = null;

export function createDatabase(config: DatabaseConfig): Knex {
  if (knexInstance) {
    return knexInstance;
  }

  const knexConfig: Knex.Config = {
    client: config.client ?? "pg",
    connection: config.connection,
    pool: {
      min: config.pool?.min ?? 2,
      max: config.pool?.max ?? 10,
    },
    debug: config.debug ?? false,
  };

  knexInstance = knex(knexConfig);

  // Bind Objection Model to Knex instance
  Model.knex(knexInstance);

  return knexInstance;
}

export function getDatabase(): Knex {
  if (!knexInstance) {
    throw new Error("Database has not been initialized. Call createDatabase(config) first.");
  }
  return knexInstance;
}

export async function closeDatabase(): Promise<void> {
  if (knexInstance) {
    await knexInstance.destroy();
    knexInstance = null;
    Model.knex(null as unknown as Knex);
  }
}

export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const db = getDatabase();
  const start = Date.now();
  try {
    await db.raw("SELECT 1");
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, latencyMs: Date.now() - start, error: message };
  }
}
