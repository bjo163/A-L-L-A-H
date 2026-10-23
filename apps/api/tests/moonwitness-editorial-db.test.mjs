import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import knexFactory from "knex";
import { BatteriesModel, syncModels, uuidv7 } from "@empire/batteries";
import {
  MoonwitnessCollectionModel, MoonwitnessStoryModel, MoonwitnessStoryTagModel,
  TagModel, TenantMembershipModel, TenantModel, UserModel,
  seedMoonwitnessCollections,
} from "@empire/batteries-base";

const databaseUrl = process.env.EOL_TEST_DATABASE_URL;
test("Moonwitness schema enforces tenant FKs and seed idempotency in disposable PostgreSQL", { skip: !databaseUrl }, async () => {
  const parsedUrl = new URL(databaseUrl);
  assert.equal(parsedUrl.pathname, "/eol_issue18_test", "only the disposable issue-18 database is accepted");
  assert.equal(parsedUrl.hostname, "127.0.0.1", "database integration must use the local disposable container");

  const admin = knexFactory({ client: "pg", connection: databaseUrl, pool: { min: 0, max: 1 } });
  const schema = `issue18_${randomUUID().replaceAll("-", "")}`;
  await admin.schema.createSchema(schema);
  const db = knexFactory({ client: "pg", connection: databaseUrl, searchPath: [schema], pool: { min: 0, max: 4 } });
  BatteriesModel.knex(db);
  try {
    await syncModels(db, [TenantModel, UserModel, TenantMembershipModel, TagModel, MoonwitnessCollectionModel, MoonwitnessStoryModel, MoonwitnessStoryTagModel]);
    const report = await (await import("@empire/batteries")).preflightModels(db, [TenantModel, UserModel, TenantMembershipModel, TagModel, MoonwitnessCollectionModel, MoonwitnessStoryModel, MoonwitnessStoryTagModel]);
    assert.equal(report.ok, true, JSON.stringify(report.models.flatMap(({ table, blockers }) => blockers.map((blocker) => `${table}: ${blocker}`))));

    const tenantA = uuidv7(); const tenantB = uuidv7();
    const userA = uuidv7(); const userB = uuidv7();
    await db("tenants").insert([
      { id: tenantA, slug: `issue18-a-${tenantA}`, display_name: "Tenant A", status: "active" },
      { id: tenantB, slug: `issue18-b-${tenantB}`, display_name: "Tenant B", status: "active" },
    ]);
    await db("users").insert([
      { id: userA, username: `issue18-a-${userA}`, email: `${userA}@example.invalid`, password_hash: "test", display_name: "A", status: "active" },
      { id: userB, username: `issue18-b-${userB}`, email: `${userB}@example.invalid`, password_hash: "test", display_name: "B", status: "active" },
    ]);
    await db("tenant_memberships").insert([
      { id: uuidv7(), tenant_id: tenantA, user_id: userA, role: "member", status: "active" },
      { id: uuidv7(), tenant_id: tenantB, user_id: userB, role: "member", status: "active" },
    ]);
    const tagA = uuidv7();
    await db("tags").insert({ id: tagA, tenant_id: tenantA, slug: "issue18-tag", name: "Tag A" });
    const collectionA = uuidv7();
    await db("moonwitness_collections").insert({ id: collectionA, tenant_id: tenantA, owner_id: userA, slug: "tenant-a-series", title: "Tenant A", theme: "moonwitness", language: "id", status: "draft", visibility: "private" });
    const storyA = uuidv7();
    await db("moonwitness_stories").insert({ id: storyA, tenant_id: tenantA, collection_id: collectionA, author_id: userA, slug: "draft-story", title: "Draft", body: "Draft body", editorial_state: "draft", classification: "internal", visibility: "private", revision: 1 });
    await db("moonwitness_story_tags").insert({ id: uuidv7(), tenant_id: tenantA, story_id: storyA, tag_id: tagA });

    await assert.rejects(db("moonwitness_stories").insert({ id: uuidv7(), tenant_id: tenantB, collection_id: collectionA, author_id: userB, slug: "cross-tenant", title: "Invalid", body: "Invalid", editorial_state: "draft", classification: "internal", visibility: "private", revision: 1 }), (error) => error.code === "23503");
    await assert.rejects(db("moonwitness_collections").insert({ id: uuidv7(), tenant_id: tenantB, owner_id: userA, slug: "wrong-owner", title: "Invalid", theme: "moonwitness", language: "id", status: "draft", visibility: "private" }), (error) => error.code === "23503");
    await assert.rejects(db("moonwitness_story_tags").insert({ id: uuidv7(), tenant_id: tenantB, story_id: storyA, tag_id: tagA }), (error) => error.code === "23503");
    await assert.rejects(db("moonwitness_stories").insert({ id: uuidv7(), tenant_id: tenantA, collection_id: collectionA, author_id: userB, slug: "wrong-author", title: "Invalid", body: "Invalid", editorial_state: "draft", classification: "internal", visibility: "private", revision: 1 }), (error) => error.code === "23503");
    await assert.rejects(db("moonwitness_collections").insert({ id: uuidv7(), tenant_id: tenantA, owner_id: userA, slug: "tenant-a-series", title: "Duplicate", theme: "moonwitness", language: "id", status: "draft", visibility: "private" }), (error) => error.code === "23505");

    const legacyZillId = uuidv7();
    await db("moonwitness_collections").insert({ id: legacyZillId, tenant_id: tenantA, owner_id: userA, slug: "ziil", title: "ZILL", theme: "moonwitness", language: "id", status: "draft", visibility: "private" });
    await seedMoonwitnessCollections(db, tenantA, userA);
    await seedMoonwitnessCollections(db, tenantA, userA);
    const seeds = await db("moonwitness_collections").where({ tenant_id: tenantA }).whereIn("slug", ["moonwitness", "the-batteries", "npd-team", "allah-promise", "moonridley", "zill", "pendeta-online", "sinterclass"]);
    assert.equal(seeds.length, 8);
    assert.equal(seeds.filter((row) => row.slug === "zill").length, 1);
    assert.equal(seeds.find((row) => row.slug === "zill").id, legacyZillId);
    assert.ok(seeds.every((row) => row.status === "draft" && row.visibility === "private"));
    assert.equal(await db("moonwitness_stories").where({ tenant_id: tenantA, editorial_state: "published", classification: "public", visibility: "public" }).count("id as count").first().then((row) => Number(row.count)), 0);
  } finally {
    await db.destroy();
    BatteriesModel.knex(null);
    await admin.schema.dropSchemaIfExists(schema, true);
    await admin.destroy();
  }
});
