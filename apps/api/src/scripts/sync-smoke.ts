import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import knexFactory from "knex";
import { BatteriesModel, preflightModels, type FieldDefinition, syncModelsSafely } from "@empire/batteries";
import {
  getModuleSchemaStatus,
  LexiconModel,
  MODULE_UPGRADE_RULES,
  preflightBaseModule,
  syncBaseModule,
} from "@empire/batteries-base";
import { loadModulePlan } from "../module-runtime.js";

function assertDisposableSyncDatabase() {
  const inputUrl = process.env.DATABASE_URL;
  if (process.env.GITHUB_ACTIONS !== "true" || process.env.EOL_SYNC_TEST_DATABASE !== "1" || !inputUrl) {
    throw new Error("Schema sync smoke tests may run only in the dedicated GitHub Actions service job.");
  }

  const parsedUrl = new URL(inputUrl);
  if (
    !["postgres:", "postgresql:"].includes(parsedUrl.protocol) ||
    !["127.0.0.1", "localhost"].includes(parsedUrl.hostname) ||
    parsedUrl.port !== "5432" ||
    parsedUrl.pathname !== "/eol_sync_test" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error("Refusing schema sync smoke tests outside disposable eol_sync_test on localhost:5432.");
  }
}

class SyncProbeModel extends BatteriesModel {
  static override tableName = "batteries_sync_probe";
  static override fields: Record<string, FieldDefinition> = {
    name: { type: "string", required: true },
  };
}

async function main() {
  assertDisposableSyncDatabase();
  const { env } = await import("../env.js");
  const admin = knexFactory({ client: "pg", connection: env.DATABASE_URL, pool: { min: 1, max: 2 } });
  const schema = `batteries_smoke_${randomUUID().replaceAll("-", "")}`;
  let scoped: ReturnType<typeof knexFactory> | undefined;
  const previousOwnerPassword = process.env.EMPIRE_OWNER_PASSWORD;
  const previousArchitectPassword = process.env.EMPIRE_ARCHITECT_PASSWORD;
  process.env.EMPIRE_OWNER_PASSWORD = randomBytes(32).toString("base64url");
  process.env.EMPIRE_ARCHITECT_PASSWORD = randomBytes(32).toString("base64url");

  try {
    await admin.raw("CREATE SCHEMA ??", [schema]);
    scoped = knexFactory({
      client: "pg",
      connection: env.DATABASE_URL,
      searchPath: [schema],
      pool: { min: 1, max: 4 },
    });
    const { enabled } = await loadModulePlan();
    const kernel = enabled.filter((module) => module.id === "kernel");
    assert.equal(kernel.length, 1, "kernel must be active");

    const initial = await preflightBaseModule(scoped, kernel);
    assert.equal(initial.ok, true);
    assert.ok(initial.schema.models.some((item) => item.state === "safe_changes"));
    assert.equal(await scoped.schema.hasTable("users"), false, "preflight must not write schema changes");
    delete process.env.EMPIRE_OWNER_PASSWORD;
    delete process.env.EMPIRE_ARCHITECT_PASSWORD;
    await assert.rejects(syncBaseModule(scoped, kernel), /Set EMPIRE_OWNER_PASSWORD/);
    assert.equal(await scoped.schema.hasTable("users"), false, "failed bootstrap must roll back table creation");
    assert.equal(await scoped.schema.hasTable("lexicons"), false, "failed bootstrap must roll back seed tables");
    process.env.EMPIRE_OWNER_PASSWORD = randomBytes(32).toString("base64url");
    process.env.EMPIRE_ARCHITECT_PASSWORD = randomBytes(32).toString("base64url");
    await syncBaseModule(scoped, kernel);
    assert.equal(await scoped.schema.hasTable("users"), true);
    assert.equal(await scoped.schema.hasTable("research_runs"), false, "disabled module tables must not install");
    assert.equal(await scoped.schema.hasTable("change_requests"), false, "disabled module tables must not install");

    const statuses = await getModuleSchemaStatus(scoped, kernel);
    assert.deepEqual(statuses.map((item) => item.state), ["current"]);
    const { enabled: fullPlan } = await loadModulePlan();
    await syncBaseModule(scoped, fullPlan);
    assert.equal(await scoped.schema.hasTable("research_runs"), true);
    assert.equal(await scoped.schema.hasTable("change_requests"), true);

    const lexicon = await scoped(LexiconModel.tableName).first("code");
    assert.ok(lexicon?.code);
    await scoped(LexiconModel.tableName).where({ code: lexicon.code }).update({ wisdom: "smoke-test editorial edit" });
    const beforeCounts = {
      users: await scoped("users").count<{ count: string }[]>("id as count").first(),
      lexicons: await scoped("lexicons").count<{ count: string }[]>("id as count").first(),
      roles: await scoped("roles").count<{ count: string }[]>("id as count").first(),
    };
    await Promise.all([syncBaseModule(scoped, fullPlan), syncBaseModule(scoped, fullPlan)]);
    const afterCounts = {
      users: await scoped("users").count<{ count: string }[]>("id as count").first(),
      lexicons: await scoped("lexicons").count<{ count: string }[]>("id as count").first(),
      roles: await scoped("roles").count<{ count: string }[]>("id as count").first(),
    };
    assert.deepEqual(afterCounts, beforeCounts, "concurrent restart must not duplicate seed records");
    assert.equal(
      (await scoped("lexicons").where({ code: lexicon.code }).first())?.wisdom,
      "smoke-test editorial edit",
      "seed sync must preserve edits",
    );
    assert.ok((await getModuleSchemaStatus(scoped, fullPlan)).every((item) => item.state === "current"));

    const firstSync = await syncModelsSafely(scoped, [SyncProbeModel]);
    assert.deepEqual(firstSync.createdTables, [SyncProbeModel.tableName]);
    SyncProbeModel.fields = {
      name: { type: "string", required: true, index: true },
      optionalNote: { type: "text", nullable: true },
    };
    const additive = await syncModelsSafely(scoped, [SyncProbeModel]);
    assert.deepEqual(additive.addedColumns, [{ table: SyncProbeModel.tableName, column: "optional_note" }]);
    assert.ok(additive.createdIndexes.some((item) => item.columns.join(",") === "name"));
    const firstProbeId = randomUUID();
    const duplicateProbeId = randomUUID();
    await scoped(SyncProbeModel.tableName).insert([
      { id: firstProbeId, name: "existing", optional_note: "same" },
      { id: duplicateProbeId, name: "existing", optional_note: "same" },
    ]);
    SyncProbeModel.uniqueConstraints = [["name", "optionalNote"]];
    const duplicateReport = await preflightModels(scoped, [SyncProbeModel]);
    assert.equal(duplicateReport.ok, false, "preflight must block unique constraints that conflict with existing data");
    await assert.rejects(syncModelsSafely(scoped, [SyncProbeModel]), /unique index.*duplicate values exist/);
    await scoped(SyncProbeModel.tableName).where({ id: duplicateProbeId }).delete();
    const uniqueSync = await syncModelsSafely(scoped, [SyncProbeModel]);
    assert.ok(uniqueSync.createdIndexes.some((item) => item.unique && item.columns.join(",") === "name,optional_note"));
    SyncProbeModel.fields = {
      ...SyncProbeModel.fields,
      unsafeRequired: { type: "string", required: true },
    };
    const modelBlock = await preflightModels(scoped, [SyncProbeModel]);
    assert.equal(modelBlock.ok, false, "required column without a default must be blocked on populated tables");
    assert.equal(await scoped.schema.hasColumn(SyncProbeModel.tableName, "unsafe_required"), false);

    const firstRuleId = "smoke-kernel-0.1.0-to-0.2.0";
    MODULE_UPGRADE_RULES[firstRuleId] = {
      id: firstRuleId,
      moduleId: "kernel",
      fromVersion: "0.1.0",
      toVersion: "0.2.0",
      review: { decision: "APPROVED", reviewer: "smoke-test", approvedAt: new Date().toISOString(), reference: "test:sync-smoke" },
      preflight: async (transaction) => ({
        ok: Boolean(await transaction(SyncProbeModel.tableName).where({ id: firstProbeId, name: "existing" }).first()),
      }),
      apply: async (transaction) => {
        await transaction(SyncProbeModel.tableName).where({ id: firstProbeId }).update({ name: "upgraded" });
      },
      verify: async (transaction) => ({
        ok: Boolean(await transaction(SyncProbeModel.tableName).where({ id: firstProbeId, name: "upgraded" }).first()),
      }),
    };
    const upgradedKernel = {
      ...kernel[0],
      version: "0.2.0",
      upgrades: [firstRuleId],
    };
    await syncBaseModule(scoped, [upgradedKernel]);
    assert.equal((await scoped(SyncProbeModel.tableName).where({ id: firstProbeId }).first())?.name, "upgraded");
    assert.deepEqual((await getModuleSchemaStatus(scoped, [upgradedKernel])).map((item) => item.state), ["current"]);

    const failingRuleId = "smoke-kernel-0.2.0-to-0.3.0";
    MODULE_UPGRADE_RULES[failingRuleId] = {
      id: failingRuleId,
      moduleId: "kernel",
      fromVersion: "0.2.0",
      toVersion: "0.3.0",
      review: { decision: "APPROVED", reviewer: "smoke-test", approvedAt: new Date().toISOString(), reference: "test:sync-smoke" },
      preflight: async () => ({ ok: true }),
      apply: async (transaction) => {
        await transaction(SyncProbeModel.tableName).where({ id: firstProbeId }).update({ name: "must-rollback" });
      },
      verify: async () => ({ ok: false, reason: "smoke rollback check" }),
    };
    await assert.rejects(
      syncBaseModule(scoped, [{ ...upgradedKernel, version: "0.3.0", upgrades: [failingRuleId] }]),
      /Upgrade verification smoke-kernel-0.2.0-to-0.3.0 failed/,
    );
    assert.equal((await scoped(SyncProbeModel.tableName).where({ id: firstProbeId }).first())?.name, "upgraded", "failed upgrade must roll back data");
    assert.deepEqual((await getModuleSchemaStatus(scoped, [upgradedKernel])).map((item) => item.state), ["current"]);

    console.log("PASS: dry-run, atomic install rollback, module allowlist, journal, additive column, blocked drift, versioned upgrade/rollback, concurrent/idempotent seeds, and edit preservation.");
  } finally {
    try {
      await scoped?.destroy();
    } finally {
      try {
        await admin.raw("DROP SCHEMA IF EXISTS ?? CASCADE", [schema]);
      } finally {
        await admin.destroy();
        if (previousOwnerPassword === undefined) delete process.env.EMPIRE_OWNER_PASSWORD;
        else process.env.EMPIRE_OWNER_PASSWORD = previousOwnerPassword;
        if (previousArchitectPassword === undefined) delete process.env.EMPIRE_ARCHITECT_PASSWORD;
        else process.env.EMPIRE_ARCHITECT_PASSWORD = previousArchitectPassword;
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error("Batteries schema smoke failed:", error);
  process.exitCode = 1;
});
