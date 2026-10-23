import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import knex from "knex";
import { BatteriesModel, addDeclaredForeignKeys, declaredForeignKeys } from "@empire/batteries";
import { resolveModuleModels } from "@empire/batteries-base";

test("kernel provisioning creates referenced tables before their dependants", async () => {
  const kernel = JSON.parse(await readFile(new URL("../../../modules/kernel/manifest.json", import.meta.url), "utf8"));
  const [{ models }] = resolveModuleModels([kernel]);
  const positions = new Map(models.map((model, index) => [model.tableName, index]));
  for (const [index, model] of models.entries()) {
    for (const field of Object.values(model.fields)) {
      if (!field.references || field.references.table === model.tableName) continue;
      assert.ok(positions.get(field.references.table) < index,
        `${field.references.table} must exist before ${model.tableName}`);
    }
    for (const constraint of model.foreignConstraints) {
      if (constraint.references.table === model.tableName) continue;
      assert.ok(positions.get(constraint.references.table) < index,
        `${constraint.references.table} must exist before ${model.tableName}`);
    }
  }
});

test("composite foreign keys compile with matching tenant and parent keys", () => {
  class StoryModel extends BatteriesModel {}
  StoryModel.tableName = "stories";
  StoryModel.fields = {
    tenantId: { type: "uuid", required: true },
    collectionId: { type: "uuid", required: true },
  };
  StoryModel.foreignConstraints = [{
    columns: ["tenantId", "collectionId"],
    references: { table: "collections", columns: ["tenantId", "id"], onDelete: "CASCADE" },
  }];

  const db = knex({ client: "pg" });
  try {
    const foreignKeys = declaredForeignKeys(StoryModel);
    assert.deepEqual(foreignKeys, [{
      columns: ["tenant_id", "collection_id"],
      referencedTable: "collections",
      referencedColumns: ["tenant_id", "id"],
      onDelete: "CASCADE",
    }]);
    const statements = db.schema.createTable("stories", (table) => {
      table.uuid("tenant_id").notNullable();
      table.uuid("collection_id").notNullable();
      addDeclaredForeignKeys(table, foreignKeys);
    }).toSQL();
    assert.match(statements.map(({ sql }) => sql).join("; "), /FOREIGN KEY \("tenant_id", "collection_id"\) REFERENCES "collections" \("tenant_id", "id"\) ON DELETE CASCADE/i);
  } finally {
    void db.destroy();
  }
});
