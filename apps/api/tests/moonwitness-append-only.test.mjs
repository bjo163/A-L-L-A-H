import assert from "node:assert/strict";
import { test } from "node:test";
import { installMoonwitnessAppendOnlyGuards, rollbackMoonwitnessAppendOnlyGuards } from "@empire/batteries-base";

test("append-only migration installs idempotent row and truncate guards and has a non-destructive rollback", async () => {
  const calls = [];
  const triggerNames = new Map();
  const knex = { async raw(sql, bindings = []) {
    calls.push({ sql, bindings });
    if (sql.includes("SELECT current_schema()")) return { rows: [{ schema_name: "test_schema" }] };
    if (sql.includes("SELECT tg.tgname")) return { rows: (triggerNames.get(bindings[1]) ?? []).map((tgname) => ({ tgname })) };
    if (sql.startsWith("CREATE TRIGGER")) {
      const table = bindings[1].split(".").at(-1);
      triggerNames.set(table, [...(triggerNames.get(table) ?? []), bindings[0]]);
    }
    return { rows: [] };
  } };

  await installMoonwitnessAppendOnlyGuards(knex);
  const firstCreationCount = calls.filter((call) => call.sql.startsWith("CREATE TRIGGER")).length;
  assert.equal(firstCreationCount, 4);
  assert.ok(calls.some((call) => call.sql.includes("ERRCODE = '55000'")));
  await installMoonwitnessAppendOnlyGuards(knex);
  assert.equal(calls.filter((call) => call.sql.startsWith("CREATE TRIGGER")).length, firstCreationCount);

  const beforeRollback = calls.length;
  await rollbackMoonwitnessAppendOnlyGuards(knex);
  const rollbackCalls = calls.slice(beforeRollback);
  assert.equal(rollbackCalls.filter((call) => call.sql.startsWith("DROP TRIGGER IF EXISTS")).length, 4);
  assert.ok(rollbackCalls.some((call) => call.sql.startsWith("DROP FUNCTION IF EXISTS")));
  assert.ok(rollbackCalls.every((call) => !call.sql.includes("DELETE") && !call.sql.includes("TRUNCATE")));
});
