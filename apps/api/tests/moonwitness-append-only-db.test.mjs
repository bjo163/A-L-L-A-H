import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import knexFactory from "knex";
import { BatteriesModel, syncModels, uuidv7 } from "@empire/batteries";
import {
  MoonwitnessCollectionModel, MoonwitnessContentRevisionModel, MoonwitnessPublicationModel,
  MoonwitnessStoryModel, TenantMembershipModel, TenantModel, UserModel,
  installMoonwitnessAppendOnlyGuards, rollbackMoonwitnessAppendOnlyGuards,
} from "@empire/batteries-base";

const databaseUrl = process.env.EOL_TEST_DATABASE_URL;
test("MOONWITNESS revisions and publications reject update, delete, and truncate, with reversible guards", { skip: !databaseUrl }, async () => {
  const parsedUrl = new URL(databaseUrl);
  assert.equal(parsedUrl.hostname, "127.0.0.1", "integration must use local disposable PostgreSQL");
  assert.equal(parsedUrl.pathname, "/eol_issue18_test", "only the named disposable integration database is accepted");

  const admin = knexFactory({ client: "pg", connection: databaseUrl, pool: { min: 0, max: 1 } });
  const schema = `issue21_${randomUUID().replaceAll("-", "")}`;
  await admin.schema.createSchema(schema);
  const db = knexFactory({ client: "pg", connection: databaseUrl, searchPath: [schema], pool: { min: 0, max: 4 } });
  BatteriesModel.knex(db);
  const models = [TenantModel, UserModel, TenantMembershipModel, MoonwitnessCollectionModel, MoonwitnessStoryModel, MoonwitnessContentRevisionModel, MoonwitnessPublicationModel];
  try {
    await syncModels(db, models);
    const tenantId = uuidv7(); const userId = uuidv7(); const collectionId = uuidv7(); const storyId = uuidv7();
    const revisionId = uuidv7(); const publicationId = uuidv7();
    await db("tenants").insert({ id: tenantId, slug: `issue21-${tenantId}`, display_name: "Test", status: "active" });
    await db("users").insert({ id: userId, username: `issue21-${userId}`, email: `${userId}@example.invalid`, password_hash: "test", display_name: "Test", status: "active" });
    await db("tenant_memberships").insert({ id: uuidv7(), tenant_id: tenantId, user_id: userId, role: "member", status: "active" });
    await db("moonwitness_collections").insert({ id: collectionId, tenant_id: tenantId, owner_id: userId, slug: "series", title: "Series", theme: "moonwitness", language: "en", status: "draft", visibility: "private" });
    await db("moonwitness_stories").insert({ id: storyId, tenant_id: tenantId, collection_id: collectionId, author_id: userId, slug: "story", title: "Story", body: "Draft", editorial_state: "draft", classification: "internal", visibility: "private", revision: 1 });
    await db("moonwitness_content_revisions").insert({ id: revisionId, tenant_id: tenantId, story_id: storyId, revision: 1, actor_id: userId, reason: "initial", snapshot: { body: "draft" }, sha256: "a".repeat(64), provenance: {} });
    await db("moonwitness_publications").insert({ id: publicationId, tenant_id: tenantId, story_id: storyId, revision_id: revisionId, publisher_id: userId, snapshot: { body: "published" }, sha256: "b".repeat(64), published_at: new Date() });

    await installMoonwitnessAppendOnlyGuards(db);
    await installMoonwitnessAppendOnlyGuards(db);
    for (const [table, id] of [["moonwitness_content_revisions", revisionId], ["moonwitness_publications", publicationId]]) {
      await assert.rejects(db(table).where({ id }).update({ sha256: "c".repeat(64) }), (error) => error.code === "55000");
      await assert.rejects(db(table).where({ id }).delete(), (error) => error.code === "55000");
      await assert.rejects(db.raw(`TRUNCATE TABLE "${schema}"."${table}"`), (error) => error.code === "55000");
    }
    await db("moonwitness_content_revisions").insert({ id: uuidv7(), tenant_id: tenantId, story_id: storyId, revision: 2, actor_id: userId, reason: "append", snapshot: { body: "updated draft" }, sha256: "d".repeat(64), provenance: {} });

    await rollbackMoonwitnessAppendOnlyGuards(db);
    await db("moonwitness_content_revisions").where({ id: revisionId }).update({ reason: "after rollback" });
    assert.equal((await db("moonwitness_content_revisions").where({ id: revisionId }).first()).reason, "after rollback");
    assert.equal(await db("moonwitness_publications").where({ id: publicationId }).count({ total: "id" }).first().then((row) => Number(row.total)), 1);
  } finally {
    await db.destroy();
    BatteriesModel.knex(null);
    await admin.schema.dropSchemaIfExists(schema, true);
    await admin.destroy();
  }
});
