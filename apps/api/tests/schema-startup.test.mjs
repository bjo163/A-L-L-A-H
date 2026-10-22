import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  }
});
