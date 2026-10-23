import type { Knex } from "@empire/batteries";

const guardedTables = ["moonwitness_content_revisions", "moonwitness_publications"] as const;
const rejectionFunction = "moonwitness_reject_append_only_mutation";

/** Install PostgreSQL guards that make revision and publication ledgers append-only. */
export async function installMoonwitnessAppendOnlyGuards(knex: Pick<Knex, "raw">): Promise<void> {
  const schema = (await knex.raw("SELECT current_schema() AS schema_name")).rows[0]?.schema_name as string | undefined;
  if (!schema) throw new Error("Cannot install MOONWITNESS append-only guards without a current schema.");

  await knex.raw(
    `CREATE OR REPLACE FUNCTION ??() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'MOONWITNESS append-only ledger %.% cannot be mutated', TG_TABLE_SCHEMA, TG_TABLE_NAME
        USING ERRCODE = '55000';
    END;
    $$`,
    [`${schema}.${rejectionFunction}`],
  );

  for (const table of guardedTables) {
    const rowTrigger = `${table}_append_only_row_guard`;
    const truncateTrigger = `${table}_append_only_truncate_guard`;
    const existing = await knex.raw(
      `SELECT tg.tgname FROM pg_trigger tg
        JOIN pg_class rel ON rel.oid = tg.tgrelid
        JOIN pg_namespace ns ON ns.oid = rel.relnamespace
       WHERE ns.nspname = ? AND rel.relname = ? AND tg.tgname IN (?, ?) AND NOT tg.tgisinternal`,
      [schema, table, rowTrigger, truncateTrigger],
    );
    const names = new Set((existing.rows as Array<{ tgname: string }>).map((row) => row.tgname));
    const qualifiedTable = `${schema}.${table}`;
    const qualifiedFunction = `${schema}.${rejectionFunction}`;
    if (!names.has(rowTrigger)) {
      await knex.raw("CREATE TRIGGER ?? BEFORE UPDATE OR DELETE ON ?? FOR EACH ROW EXECUTE FUNCTION ??()", [rowTrigger, qualifiedTable, qualifiedFunction]);
    }
    if (!names.has(truncateTrigger)) {
      await knex.raw("CREATE TRIGGER ?? BEFORE TRUNCATE ON ?? FOR EACH STATEMENT EXECUTE FUNCTION ??()", [truncateTrigger, qualifiedTable, qualifiedFunction]);
    }
  }
}

/** Rollback removes only the guards; it deliberately preserves all ledger rows. */
export async function rollbackMoonwitnessAppendOnlyGuards(knex: Pick<Knex, "raw">): Promise<void> {
  const schema = (await knex.raw("SELECT current_schema() AS schema_name")).rows[0]?.schema_name as string | undefined;
  if (!schema) throw new Error("Cannot remove MOONWITNESS append-only guards without a current schema.");
  for (const table of guardedTables) {
    await knex.raw("DROP TRIGGER IF EXISTS ?? ON ??", [`${table}_append_only_row_guard`, `${schema}.${table}`]);
    await knex.raw("DROP TRIGGER IF EXISTS ?? ON ??", [`${table}_append_only_truncate_guard`, `${schema}.${table}`]);
  }
  await knex.raw("DROP FUNCTION IF EXISTS ??()", [`${schema}.${rejectionFunction}`]);
}
