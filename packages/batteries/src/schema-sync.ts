import type { Knex } from "knex";
import type { BatteriesModel } from "./base-model.js";
import type { FieldDefinition } from "./types.js";

export interface SchemaSyncResult {
  createdTables: string[];
  addedColumns: Array<{ table: string; column: string }>;
  createdIndexes: Array<{ table: string; columns: string[]; unique: boolean }>;
  createdForeignKeys: Array<{ table: string; columns: string[]; referencedTable: string; referencedColumns: string[] }>;
  unchangedTables: string[];
}

export interface SchemaPreflightReport {
  ok: boolean;
  models: Array<{
    table: string;
    state: "current" | "safe_changes" | "blocked";
    operations: string[];
    blockers: string[];
  }>;
}

const postgresTypes: Record<FieldDefinition["type"], string[]> = {
  string: ["character varying"],
  text: ["text"],
  integer: ["integer"],
  bigint: ["bigint"],
  boolean: ["boolean"],
  jsonb: ["jsonb"],
  timestamp: ["timestamp with time zone"],
  uuid: ["uuid"],
  float: ["real", "double precision"],
  decimal: ["numeric"],
};

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

async function getIndexes(knex: Knex | Knex.Transaction, schema: string, table: string) {
  const result = await knex.raw(
    `SELECT i.indisunique AS unique, array_agg(a.attname::text ORDER BY key.ordinality) AS columns
     FROM pg_catalog.pg_index i
     JOIN pg_catalog.pg_class t ON t.oid = i.indrelid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
     CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS key(attnum, ordinality)
     JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = key.attnum
     WHERE n.nspname = ? AND t.relname = ? AND i.indisvalid
     GROUP BY i.indexrelid, i.indisunique, i.indnatts
     HAVING count(*) = i.indnatts`,
    [schema, table],
  );
  return result.rows as Array<{ unique: boolean; columns: string[] }>;
}

async function getForeignKeys(knex: Knex | Knex.Transaction, schema: string, table: string) {
  const result = await knex.raw(
    `SELECT con.conname AS constraint_name,
            source.relname AS source_table,
            target.relname AS referenced_table,
            array_agg(source_att.attname::text ORDER BY key.ordinality) AS source_columns,
            array_agg(target_att.attname::text ORDER BY key.ordinality) AS referenced_columns,
            con.confdeltype::text AS delete_action
     FROM pg_catalog.pg_constraint con
     JOIN pg_catalog.pg_class source ON source.oid = con.conrelid
     JOIN pg_catalog.pg_namespace source_ns ON source_ns.oid = source.relnamespace
     JOIN pg_catalog.pg_class target ON target.oid = con.confrelid
     CROSS JOIN LATERAL unnest(con.conkey, con.confkey) WITH ORDINALITY AS key(source_attnum, target_attnum, ordinality)
     JOIN pg_catalog.pg_attribute source_att ON source_att.attrelid = source.oid AND source_att.attnum = key.source_attnum
     JOIN pg_catalog.pg_attribute target_att ON target_att.attrelid = target.oid AND target_att.attnum = key.target_attnum
     WHERE con.contype = 'f' AND source_ns.nspname = ? AND source.relname = ?
     GROUP BY con.oid, source.relname, target.relname, con.confdeltype`,
    [schema, table],
  );
  return result.rows as Array<{
    constraint_name: string;
    source_table: string;
    source_columns: string[];
    referenced_table: string;
    referenced_columns: string[];
    delete_action: string;
  }>;
}

function postgresDeleteAction(action?: "CASCADE" | "SET NULL" | "RESTRICT") {
  switch (action) {
    case "CASCADE": return "c";
    case "SET NULL": return "n";
    case "RESTRICT": return "r";
    default: return "a";
  }
}

function requiredIndexes(model: typeof BatteriesModel) {
  const requirements = new Map<string, { columns: string[]; unique: boolean }>();
  for (const [fieldName, field] of Object.entries(model.fields)) {
    if (!field.index && !field.unique) continue;
    const columns = [camelToSnake(fieldName)];
    requirements.set(columns.join(","), { columns, unique: Boolean(field.unique) });
  }
  for (const fields of model.uniqueConstraints) {
    const columns = fields.map(camelToSnake);
    requirements.set(columns.join(","), { columns, unique: true });
  }
  return [...requirements.values()];
}

export function declaredForeignKeys(model: typeof BatteriesModel) {
  const singleColumn = Object.entries(model.fields).flatMap(([fieldName, field]) => field.references ? [{
    columns: [camelToSnake(fieldName)],
    referencedTable: field.references.table,
    referencedColumns: [field.references.column],
    onDelete: field.references.onDelete,
  }] : []);
  const composite = model.foreignConstraints.map((constraint) => ({
    columns: constraint.columns.map(camelToSnake),
    referencedTable: constraint.references.table,
    referencedColumns: constraint.references.columns.map(camelToSnake),
    onDelete: constraint.references.onDelete,
  }));
  return [...singleColumn, ...composite];
}

export function addDeclaredForeignKeys(
  table: Knex.CreateTableBuilder | Knex.AlterTableBuilder,
  foreignKeys: ReturnType<typeof declaredForeignKeys>,
) {
  for (const foreignKey of foreignKeys) {
    const foreign = table.foreign(foreignKey.columns)
      .references(foreignKey.referencedColumns)
      .inTable(foreignKey.referencedTable);
    if (foreignKey.onDelete) foreign.onDelete(foreignKey.onDelete);
  }
}

function isSameColumns(left: string[], right: string[]) {
  return left.length === right.length && left.every((column, index) => column === right[index]);
}

function applyColumnType(
  table: Knex.CreateTableBuilder | Knex.AlterTableBuilder,
  colName: string,
  field: FieldDefinition,
  options: { allowNotNull: boolean },
): Knex.ColumnBuilder {
  let builder: Knex.ColumnBuilder;
  switch (field.type) {
    case "string": builder = table.string(colName); break;
    case "text": builder = table.text(colName); break;
    case "integer": builder = table.integer(colName); break;
    case "bigint": builder = table.bigInteger(colName); break;
    case "boolean": builder = table.boolean(colName); break;
    case "jsonb": builder = table.jsonb(colName); break;
    case "timestamp": builder = table.timestamp(colName, { useTz: true }); break;
    case "uuid": builder = table.uuid(colName); break;
    case "float": builder = table.float(colName); break;
    case "decimal": builder = table.decimal(colName, 20, 4); break;
    default: throw new Error(`Unsupported schema field type: ${String(field.type)}`);
  }

  // Existing populated tables receive nullable columns unless an explicit DB default
  // makes the new required column safe to backfill atomically.
  if (field.required && (options.allowNotNull || field.defaultTo !== undefined)) {
    builder.notNullable();
  } else {
    builder.nullable();
  }
  if (field.defaultTo !== undefined) builder.defaultTo(field.defaultTo);
  if (field.unique) builder.unique();
  if (field.index) builder.index();
  if (field.references) {
    const foreign = builder.references(field.references.column).inTable(field.references.table);
    if (field.references.onDelete) foreign.onDelete(field.references.onDelete);
  }
  return builder;
}

export async function preflightModels(
  knex: Knex | Knex.Transaction,
  models: Array<typeof BatteriesModel>,
): Promise<SchemaPreflightReport> {
  const report: SchemaPreflightReport = { ok: true, models: [] };
  const schemaResult = await knex.raw("SELECT current_schema() AS schema_name");
  const schemaName = schemaResult.rows[0]?.schema_name as string | undefined;
  if (!schemaName) throw new Error("Unable to determine the active PostgreSQL schema for Batteries preflight.");
  const modelByTable = new Map(models.filter((model) => model.tableName).map((model) => [model.tableName, model]));

  for (const model of models) {
    const table = model.tableName;
    if (!table) continue;
    const entry: SchemaPreflightReport["models"][number] = {
      table,
      state: "current",
      operations: [],
      blockers: [],
    };
    for (const fields of model.uniqueConstraints) {
      if (!fields.length || new Set(fields).size !== fields.length || fields.some((field) => !(field in model.fields))) {
        entry.blockers.push("model declares an invalid composite unique constraint");
      }
    }
    for (const constraint of model.foreignConstraints) {
      if (!constraint.columns.length || constraint.columns.length !== constraint.references.columns.length ||
        new Set(constraint.columns).size !== constraint.columns.length ||
        constraint.columns.some((field) => !(field in model.fields)) ||
        !constraint.references.table || constraint.references.columns.some((column) => !column)) {
        entry.blockers.push("model declares an invalid composite foreign key");
      }
    }
    if (!(await knex.schema.hasTable(table))) {
      if (entry.blockers.length) {
        entry.state = "blocked";
        report.ok = false;
      } else {
        entry.state = "safe_changes";
        entry.operations.push("create_table");
      }
      report.models.push(entry);
      continue;
    }

    const rows = await knex("information_schema.columns")
      .select("column_name", "is_nullable", "data_type")
      .where({ table_name: table, table_schema: schemaName });
    const columns = new Map<string, { is_nullable: string; data_type: string }>(
      rows.map((row: { column_name: string; is_nullable: string; data_type: string }) => [row.column_name, row]),
    );
    if (!columns.has("id")) {
      entry.blockers.push("table is missing the Batteries id primary-key column");
    } else {
      if (columns.get("id")?.data_type !== "uuid") entry.blockers.push("id primary key must use PostgreSQL uuid");
      const pk = await knex.raw(
        `SELECT 1 FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema AND tc.table_name = kcu.table_name
         WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = ? AND tc.table_name = ? AND kcu.column_name = 'id'`,
        [schemaName, table],
      );
      if (!pk.rows.length) entry.blockers.push("id column is not the primary key");
    }

    const hasRows = Boolean(await knex(table).first("id"));
    for (const [fieldName, field] of Object.entries(model.fields)) {
      const column = camelToSnake(fieldName);
      const existing = columns.get(column);
      if (!existing) {
        if (field.required && field.defaultTo === undefined && hasRows) {
          entry.blockers.push(`${column} is required but has no default for existing rows`);
        } else {
          entry.operations.push(`add_column:${column}`);
        }
        continue;
      }
      if (!postgresTypes[field.type].includes(existing.data_type)) {
        entry.blockers.push(`${column} expects ${field.type}, database has ${existing.data_type}`);
      }
      if (field.required && existing.is_nullable === "YES") {
        entry.blockers.push(`${column} requires a reviewed null backfill before NOT NULL can be enforced`);
      }
    }
    const indexes = await getIndexes(knex, schemaName, table);
    for (const requirement of requiredIndexes(model)) {
      const found = indexes.some((index) =>
        index.columns.length === requirement.columns.length &&
        index.columns.every((column, position) => column === requirement.columns[position]) &&
        (!requirement.unique || index.unique),
      );
      if (found) continue;
      const missingColumn = requirement.columns.find((column) => !columns.has(column));
      if (missingColumn) continue; // The new column will receive its declared field index during sync.
      if (requirement.unique) {
        const duplicateQuery = knex(table)
          .select(requirement.columns)
          .groupBy(requirement.columns)
          .havingRaw("count(*) > 1");
        for (const column of requirement.columns) duplicateQuery.whereNotNull(column);
        const duplicate = await duplicateQuery.first();
        if (duplicate) {
          entry.blockers.push(`unique index on (${requirement.columns.join(", ")}) would fail because duplicate values exist`);
          continue;
        }
      }
      entry.operations.push(`${requirement.unique ? "create_unique_index" : "create_index"}:${requirement.columns.join(",")}`);
    }
    const foreignKeys = await getForeignKeys(knex, schemaName, table);
    for (const reference of declaredForeignKeys(model)) {
      if (reference.columns.some((column) => !columns.has(column))) continue;
      const targetExists = await knex.schema.hasTable(reference.referencedTable);
      if (!targetExists) {
        entry.blockers.push(`${reference.columns.join(", ")} references missing table ${reference.referencedTable}`);
        continue;
      }
      const targetIndexes = await getIndexes(knex, schemaName, reference.referencedTable);
      const targetModel = modelByTable.get(reference.referencedTable);
      const targetUniqueWillExist = targetModel && requiredIndexes(targetModel).some((index) =>
        index.unique && isSameColumns(index.columns, reference.referencedColumns));
      const targetPrimaryKeyWillExist = isSameColumns(reference.referencedColumns, ["id"]);
      if (!targetIndexes.some((index) => index.unique && isSameColumns(index.columns, reference.referencedColumns)) &&
        !targetUniqueWillExist && !targetPrimaryKeyWillExist) {
        entry.blockers.push(`${reference.referencedTable} must have a unique key on (${reference.referencedColumns.join(", ")}) before it can be referenced`);
        continue;
      }
      const matching = foreignKeys.find((key) => isSameColumns(key.source_columns, reference.columns));
      const expectedDelete = postgresDeleteAction(reference.onDelete);
      if (matching) {
        if (matching.referenced_table !== reference.referencedTable || !isSameColumns(matching.referenced_columns, reference.referencedColumns) || matching.delete_action !== expectedDelete) {
          entry.blockers.push(`(${reference.columns.join(", ")}) has a foreign key that conflicts with its declared reference`);
        }
        continue;
      }
      const orphanQuery = knex({ source: table }).leftJoin({ target: reference.referencedTable }, (join) => {
        for (let index = 0; index < reference.columns.length; index += 1) {
          join.on(`source.${reference.columns[index]}`, `target.${reference.referencedColumns[index]}`);
        }
      });
      for (let index = 0; index < reference.columns.length; index += 1) {
        orphanQuery.whereNotNull(`source.${reference.columns[index]}`);
      }
      const orphan = await orphanQuery.whereNull(`target.${reference.referencedColumns[0]}`).first(`source.${reference.columns[0]}`);
      if (orphan) {
        entry.blockers.push(`(${reference.columns.join(", ")}) contains values with no match in ${reference.referencedTable}(${reference.referencedColumns.join(", ")})`);
      } else {
        entry.operations.push(`create_foreign_key:(${reference.columns.join(", ")})->${reference.referencedTable}(${reference.referencedColumns.join(", ")})`);
      }
    }
    for (const [column, nullable] of [["created_at", false], ["updated_at", false], ...(model.hasSoftDelete ? [["deleted_at", true]] : [])] as Array<[string, boolean]>) {
      const existing = columns.get(column);
      if (!existing) {
        entry.operations.push(`add_core_column:${column}`);
      } else if (existing.data_type !== "timestamp with time zone") {
        entry.blockers.push(`${column} must use timestamp with time zone`);
      } else if (!nullable && existing.is_nullable === "YES") {
        entry.blockers.push(`${column} must be NOT NULL`);
      }
    }
    if (entry.blockers.length) {
      entry.state = "blocked";
      report.ok = false;
    } else if (entry.operations.length) {
      entry.state = "safe_changes";
    }
    report.models.push(entry);
  }
  return report;
}

async function syncModelsUnlocked(
  knex: Knex | Knex.Transaction,
  models: Array<typeof BatteriesModel>,
): Promise<SchemaSyncResult> {
  const preflight = await preflightModels(knex, models);
  const blockers = preflight.models.flatMap((model) =>
    model.blockers.map((blocker) => `${model.table}: ${blocker}`),
  );
  if (blockers.length) throw new Error(`Batteries schema preflight blocked sync: ${blockers.join("; ")}`);

  const result: SchemaSyncResult = {
    createdTables: [],
    addedColumns: [],
    createdIndexes: [],
    createdForeignKeys: [],
    unchangedTables: [],
  };

  // Model order is significant: callers must supply dependencies before dependants.
  for (const model of models) {
    const tableName = model.tableName;
    if (!tableName) continue;
    const exists = await knex.schema.hasTable(tableName);

    if (!exists) {
      await knex.schema.createTable(tableName, (table) => {
        table.uuid("id").primary();
        for (const [fieldName, fieldDef] of Object.entries(model.fields)) {
          applyColumnType(table, camelToSnake(fieldName), fieldDef, { allowNotNull: true });
        }
        for (const fields of model.uniqueConstraints) table.unique(fields.map(camelToSnake));
        addDeclaredForeignKeys(table, declaredForeignKeys(model));
        table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        if (model.hasSoftDelete) {
          table.timestamp("deleted_at", { useTz: true }).nullable();
          table.index(["deleted_at"]);
        }
      });
      result.createdTables.push(tableName);
      continue;
    }
    const changeMarker = result.addedColumns.length + result.createdIndexes.length + result.createdForeignKeys.length;

    const schemaRow = await knex.raw("SELECT current_schema() AS schema_name");
    const schemaName = schemaRow.rows[0]?.schema_name as string | undefined;
    if (!schemaName) throw new Error("Unable to determine the active PostgreSQL schema for Batteries sync.");
    const actualColumns = await knex("information_schema.columns")
      .select("column_name", "is_nullable", "data_type")
      .where({ table_name: tableName, table_schema: schemaName });
    const byName = new Map<string, { column_name: string; is_nullable: string; data_type: string }>(
      actualColumns.map((row: { column_name: string; is_nullable: string; data_type: string }) => [row.column_name, row]),
    );
    if (!byName.has("id")) {
      throw new Error(`Schema drift at ${tableName}.id: existing table has no Batteries primary key column.`);
    }
    const primaryKey = await knex.raw(
      `SELECT 1 FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
        AND tc.table_name = kcu.table_name
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = ? AND tc.table_name = ? AND kcu.column_name = 'id'`,
      [schemaName, tableName],
    );
    if (!primaryKey.rows.length) {
      throw new Error(`Schema drift at ${tableName}.id: existing id column is not the table primary key.`);
    }
    const missing = Object.entries(model.fields)
      .map(([fieldName, def]) => ({ column: camelToSnake(fieldName), def }))
      .filter(({ column }) => !byName.has(column));

    for (const { column, def } of missing) {
      const hasRows = await knex(tableName).first("id");
      if (def.required && def.defaultTo === undefined && hasRows) {
        throw new Error(
          `Cannot add required column ${tableName}.${column} to a populated table without a database default. Add a reviewed backfill rule to the module schema before retrying.`,
        );
      }
      await knex.schema.alterTable(tableName, (table) => {
        applyColumnType(table, column, def, { allowNotNull: !hasRows });
      });
      result.addedColumns.push({ table: tableName, column });
    }

    // Detect unsafe drift. Automatic sync only creates tables and adds missing columns;
    // it never silently changes types, nullability, constraints, or deletes data.
    for (const [fieldName, def] of Object.entries(model.fields)) {
      const column = camelToSnake(fieldName);
      const existing = byName.get(column) as
        | { column_name: string; is_nullable: string; data_type: string }
        | undefined;
      if (existing && !postgresTypes[def.type].includes(existing.data_type)) {
        throw new Error(
          `Schema drift at ${tableName}.${column}: model expects ${def.type}, database has ${existing.data_type}. Define a reviewed module upgrade rule before retrying.`,
        );
      }
      if (existing && def.required && existing.is_nullable === "YES") {
        throw new Error(
          `Schema drift at ${tableName}.${column}: model requires NOT NULL but database permits NULL. A reviewed data backfill is required before tightening this constraint.`,
        );
      }
    }
    const existingNames = new Set(byName.keys());
    const missingCoreColumns = ["created_at", "updated_at", ...(model.hasSoftDelete ? ["deleted_at"] : [])]
      .filter((column) => !existingNames.has(column));
    if (missingCoreColumns.length) {
      await knex.schema.alterTable(tableName, (table) => {
        if (missingCoreColumns.includes("created_at")) table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        if (missingCoreColumns.includes("updated_at")) table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        if (missingCoreColumns.includes("deleted_at")) table.timestamp("deleted_at", { useTz: true }).nullable();
      });
      for (const column of missingCoreColumns) result.addedColumns.push({ table: tableName, column });
    }

    const indexes = await getIndexes(knex, schemaName!, tableName);
    const missingIndexes = requiredIndexes(model).filter((requirement) => !indexes.some((index) =>
      index.columns.length === requirement.columns.length &&
      index.columns.every((column, position) => column === requirement.columns[position]) &&
      (!requirement.unique || index.unique),
    ));
    for (const requirement of missingIndexes) {
      await knex.schema.alterTable(tableName, (table) => {
        if (requirement.unique) table.unique(requirement.columns);
        else table.index(requirement.columns);
      });
      result.createdIndexes.push({ table: tableName, columns: requirement.columns, unique: requirement.unique });
    }

    const foreignKeys = await getForeignKeys(knex, schemaName!, tableName);
    for (const reference of declaredForeignKeys(model)) {
      if (foreignKeys.some((key) => isSameColumns(key.source_columns, reference.columns))) continue;
      await knex.schema.alterTable(tableName, (table) => {
        addDeclaredForeignKeys(table, [reference]);
      });
      result.createdForeignKeys.push({
        table: tableName,
        columns: reference.columns,
        referencedTable: reference.referencedTable,
        referencedColumns: reference.referencedColumns,
      });
    }
    const changeCount = result.addedColumns.length + result.createdIndexes.length + result.createdForeignKeys.length;
    if (changeCount === changeMarker) result.unchangedTables.push(tableName);
  }
  return result;
}

/**
 * Odoo-style additive schema synchronization. The caller owns the surrounding
 * transaction and PostgreSQL advisory lock when syncing a group of modules.
 */
export async function syncModels(
  knex: Knex,
  models: Array<typeof BatteriesModel>,
): Promise<SchemaSyncResult> {
  return syncModelsUnlocked(knex, models);
}

/** Serialize schema sync across API replicas and roll back partial schema changes. */
export async function syncModelsSafely(
  knex: Knex,
  models: Array<typeof BatteriesModel>,
  lockKey = "empire:batteries:schema-sync",
): Promise<SchemaSyncResult> {
  return knex.transaction(async (trx) => {
    await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [lockKey]);
    return syncModelsUnlocked(trx, models);
  });
}
