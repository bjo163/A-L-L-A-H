import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import knexFactory from "knex";
import Fastify from "fastify";
import ts from "typescript";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { BatteriesModel, syncModels, uuidv7 } from "@empire/batteries";
import {
  MoonwitnessCollectionModel, MoonwitnessStoryModel, MoonwitnessStoryTagModel,
  MoonwitnessEpisodeModel, MoonwitnessSceneModel, MoonwitnessComicPageModel,
  TagModel, TenantMembershipModel, TenantModel, UserModel,
} from "@empire/batteries-base";

const databaseUrl = process.env.EOL_TEST_DATABASE_URL;
test("Moonwitness pages create, list, reorder transactionally, and stay private to their tenant", { skip: !databaseUrl }, async () => {
  const parsedUrl = new URL(databaseUrl);
  assert.equal(parsedUrl.hostname, "127.0.0.1", "integration must use local disposable PostgreSQL");
  assert.equal(parsedUrl.pathname, "/eol_issue18_test", "only the named disposable integration database is accepted");

  const admin = knexFactory({ client: "pg", connection: databaseUrl, pool: { min: 0, max: 1 } });
  const schema = `issue19_${randomUUID().replaceAll("-", "")}`;
  await admin.schema.createSchema(schema);
  const db = knexFactory({ client: "pg", connection: databaseUrl, searchPath: [schema], pool: { min: 0, max: 4 } });
  BatteriesModel.knex(db);
  const schemaModels = [TenantModel, UserModel, TenantMembershipModel, TagModel, MoonwitnessCollectionModel, MoonwitnessStoryModel, MoonwitnessStoryTagModel, MoonwitnessEpisodeModel, MoonwitnessSceneModel, MoonwitnessComicPageModel];
  try {
    await syncModels(db, schemaModels);
    const { preflightModels } = await import("@empire/batteries");
    const report = await preflightModels(db, schemaModels);
    assert.equal(report.ok, true, JSON.stringify(report.models.flatMap(({ table, blockers }) => blockers.map((blocker) => `${table}: ${blocker}`))));

    const tenantA = uuidv7(); const tenantB = uuidv7(); const authorA = uuidv7(); const authorB = uuidv7();
    await db("tenants").insert([
      { id: tenantA, slug: `issue19-a-${tenantA}`, display_name: "Tenant A", status: "active" },
      { id: tenantB, slug: `issue19-b-${tenantB}`, display_name: "Tenant B", status: "active" },
    ]);
    await db("users").insert([
      { id: authorA, username: `issue19-a-${authorA}`, email: `${authorA}@example.invalid`, password_hash: "test", display_name: "Author A", status: "active" },
      { id: authorB, username: `issue19-b-${authorB}`, email: `${authorB}@example.invalid`, password_hash: "test", display_name: "Author B", status: "active" },
    ]);
    await db("tenant_memberships").insert([
      { id: uuidv7(), tenant_id: tenantA, user_id: authorA, role: "member", status: "active" },
      { id: uuidv7(), tenant_id: tenantB, user_id: authorB, role: "member", status: "active" },
    ]);
    const collectionId = uuidv7(); const storyId = uuidv7();
    await db("moonwitness_collections").insert({ id: collectionId, tenant_id: tenantA, owner_id: authorA, slug: "private-series", title: "Private series", theme: "moonwitness", language: "id", status: "draft", visibility: "private" });
    await db("moonwitness_stories").insert({ id: storyId, tenant_id: tenantA, collection_id: collectionId, author_id: authorA, slug: "private-story", title: "Private story", body: "Unpublished story body", editorial_state: "draft", classification: "internal", visibility: "private", revision: 1 });

    // Load the real route handlers with real database models and replace only the
    // outer auth middleware so tenant A/B contexts can be selected in this test.
    const require = createRequire(import.meta.url);
    const contractsText = await readFile(new URL("../../../packages/api-contract/src/index.ts", import.meta.url), "utf8");
    const contractsModule = { exports: {} };
    new Function("exports", "require", "module", ts.transpileModule(contractsText, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText)(contractsModule.exports, require, contractsModule);
    const routeText = await readFile(new URL("../src/routes/moonwitness-editorial.ts", import.meta.url), "utf8");
    const routeModule = { exports: {} };
    const dependencies = {
      "@empire/batteries-base": {
        AuthService: { hasPermission: () => false }, MoonwitnessCollectionModel, MoonwitnessStoryModel, MoonwitnessStoryTagModel,
        MoonwitnessEpisodeModel, MoonwitnessSceneModel, MoonwitnessComicPageModel, TagModel,
      },
      "@empire/batteries": { getDatabase: () => db },
      "@empire/api-contract": contractsModule.exports,
      "./auth.js": {
        requirePermission: () => async () => {},
        requireSession: async (request) => { request.authUser = { id: request.headers["x-test-user"] }; },
      },
      "./tenant-context.js": { requireTenant: async (request) => { request.tenantId = request.headers["x-test-tenant"]; } },
    };
    new Function("exports", "require", "module", ts.transpileModule(routeText, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText)(routeModule.exports, (key) => dependencies[key], routeModule);
    const app = Fastify();
    await routeModule.exports.moonwitnessEditorialRoutes(app);
    await routeModule.exports.moonwitnessPublicStoryRoutes(app);
    await app.ready();
    const headersA = { "x-test-tenant": tenantA, "x-test-user": authorA };
    const headersB = { "x-test-tenant": tenantB, "x-test-user": authorB };
    try {
      const episode = await app.inject({ method: "POST", url: `/v1/moonwitness/stories/${storyId}/episodes`, headers: headersA, payload: { slug: "episode-one", title: "Episode One" } });
      assert.equal(episode.statusCode, 201, episode.body);
      const episodeId = episode.json().id;
      const scene = await app.inject({ method: "POST", url: `/v1/moonwitness/episodes/${episodeId}/scenes`, headers: headersA, payload: { slug: "scene-one", title: "Scene One" } });
      assert.equal(scene.statusCode, 201, scene.body);
      const sceneId = scene.json().id;
      const first = await app.inject({ method: "POST", url: `/v1/moonwitness/scenes/${sceneId}/pages`, headers: headersA, payload: { assetUrl: "/assets/page-a.webp", altText: "First panel" } });
      const second = await app.inject({ method: "POST", url: `/v1/moonwitness/scenes/${sceneId}/pages`, headers: headersA, payload: { assetUrl: "https://assets.example/page-b.webp", altText: "Second panel" } });
      assert.equal(first.statusCode, 201, first.body); assert.equal(second.statusCode, 201, second.body);
      const idA = first.json().id; const idB = second.json().id;

      const initial = await app.inject({ method: "GET", url: `/v1/moonwitness/scenes/${sceneId}/pages`, headers: headersA });
      assert.equal(initial.statusCode, 200); assert.deepEqual(initial.json().map((page) => page.id), [idA, idB]);
      const reordered = await app.inject({ method: "PATCH", url: `/v1/moonwitness/scenes/${sceneId}/pages/order`, headers: headersA, payload: { orderedIds: [idB, idA] } });
      assert.equal(reordered.statusCode, 200, reordered.body); assert.deepEqual(reordered.json().map((page) => page.id), [idB, idA]);
      assert.deepEqual(reordered.json().map((page) => page.sequence), [1, 2]);

      const tenantBRead = await app.inject({ method: "GET", url: `/v1/moonwitness/scenes/${sceneId}/pages`, headers: headersB });
      assert.equal(tenantBRead.statusCode, 404);
      const tenantBMutation = await app.inject({ method: "PATCH", url: `/v1/moonwitness/scenes/${sceneId}/pages/order`, headers: headersB, payload: { orderedIds: [idA, idB] } });
      assert.equal(tenantBMutation.statusCode, 404);
      const afterDeniedMutation = await app.inject({ method: "GET", url: `/v1/moonwitness/scenes/${sceneId}/pages`, headers: headersA });
      assert.deepEqual(afterDeniedMutation.json().map((page) => page.id), [idB, idA]);
      const publicStories = await app.inject({ method: "GET", url: "/v1/public/moonwitness/stories" });
      assert.equal(publicStories.statusCode, 200); assert.deepEqual(publicStories.json(), { items: [] });
      await assert.rejects(db("moonwitness_comic_pages").insert({ id: uuidv7(), tenant_id: tenantB, scene_id: sceneId, sequence: 3, asset_url: "/assets/leak.webp", alt_text: "Invalid cross tenant page", status: "draft" }), (error) => error.code === "23503");
    } finally {
      await app.close();
    }
  } finally {
    await db.destroy();
    BatteriesModel.knex(null);
    await admin.schema.dropSchemaIfExists(schema, true);
    await admin.destroy();
  }
});
