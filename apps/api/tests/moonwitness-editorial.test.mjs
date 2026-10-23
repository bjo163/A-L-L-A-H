import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import Ajv from "ajv";
import ts from "typescript";

const require = createRequire(import.meta.url);
function compileTs(source) {
  return ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
}

function loadTs(source, dependencies = {}) {
  const module = { exports: {} };
  new Function("exports", "require", "module", source)(module.exports, (specifier) => {
    if (specifier === "node:crypto") return require("node:crypto");
    assert.ok(specifier in dependencies, `Unexpected dependency: ${specifier}`);
    return dependencies[specifier];
  }, module);
  return module.exports;
}

const apiContractSource = await readFile(new URL("../../../packages/api-contract/src/index.ts", import.meta.url), "utf8");
const apiContract = loadTs(compileTs(apiContractSource), { "node:crypto": require("node:crypto"), "./moonwitness-public.js": {} });
const validateCollectionCreate = new Ajv({ strict: false, validateFormats: false }).compile(apiContract.MOONWITNESS_COLLECTION_CREATE_SCHEMA);
const validateStoryCreate = new Ajv({ strict: false, validateFormats: false }).compile(apiContract.MOONWITNESS_STORY_CREATE_SCHEMA);
const modelStub = class BatteriesModel {};

const models = {};
for (const file of ["moonwitness-collection.model.ts", "moonwitness-story.model.ts", "moonwitness-story-tag.model.ts", "moonwitness-content-revision.model.ts", "moonwitness-publication.model.ts", "tag.model.ts"]) {
  const source = await readFile(new URL(`../../../packages/batteries-base/src/models/${file}`, import.meta.url), "utf8");
  Object.assign(models, loadTs(compileTs(source), { "@empire/batteries": { BatteriesModel: modelStub } }));
}

test("editorial DTOs reject client-controlled ownership/publication fields", () => {
  const collection = { slug: "moonwitness", title: "Moonwitness", ownerId: "attacker", status: "published", visibility: "public" };
  assert.equal(validateCollectionCreate(collection), false);
  delete collection.ownerId;
  delete collection.status;
  delete collection.visibility;
  assert.equal(validateCollectionCreate(collection), true);

  const story = { collectionId: "11111111-1111-4111-8111-111111111111", slug: "first-story", title: "First", body: "Draft", authorId: "attacker", editorialState: "published" };
  assert.equal(validateStoryCreate(story), false);
  delete story.authorId;
  delete story.editorialState;
  assert.equal(validateStoryCreate(story), true);
});

test("Collection, Story, author, owner, and tags have tenant-scoped database keys", () => {
  const { MoonwitnessCollectionModel, MoonwitnessStoryModel, MoonwitnessStoryTagModel, TagModel } = models;
  assert.ok(MoonwitnessCollectionModel.uniqueConstraints.some((fields) => fields.join(",") === "tenantId,slug"));
  assert.ok(MoonwitnessCollectionModel.foreignConstraints.some((key) => key.columns.join(",") === "tenantId,ownerId" && key.references.table === "tenant_memberships"));
  assert.ok(MoonwitnessStoryModel.uniqueConstraints.some((fields) => fields.join(",") === "tenantId,collectionId,slug"));
  assert.ok(MoonwitnessStoryModel.foreignConstraints.some((key) => key.columns.join(",") === "tenantId,collectionId" && key.references.table === "moonwitness_collections"));
  assert.ok(MoonwitnessStoryModel.foreignConstraints.some((key) => key.columns.join(",") === "tenantId,authorId" && key.references.table === "tenant_memberships"));
  assert.ok(MoonwitnessStoryTagModel.foreignConstraints.every((key) => key.columns[0] === "tenantId"));
  assert.ok(TagModel.uniqueConstraints.some((fields) => fields.join(",") === "tenantId,id"));
});

test("content revisions and publications are append-oriented tenant-scoped snapshots", () => {
  const { MoonwitnessContentRevisionModel, MoonwitnessPublicationModel } = models;
  assert.equal(MoonwitnessContentRevisionModel.tableName, "moonwitness_content_revisions");
  assert.ok(MoonwitnessContentRevisionModel.uniqueConstraints.some((fields) => fields.join(",") === "tenantId,storyId,revision"));
  assert.ok(MoonwitnessContentRevisionModel.foreignConstraints.every((key) => key.columns[0] === "tenantId"));
  for (const key of ["snapshot", "sha256", "actorId", "reason", "provenance"]) assert.ok(MoonwitnessContentRevisionModel.fields[key]);
  assert.equal(MoonwitnessPublicationModel.tableName, "moonwitness_publications");
  assert.ok(MoonwitnessPublicationModel.foreignConstraints.every((key) => key.columns[0] === "tenantId"));
  for (const key of ["revisionId", "snapshot", "sha256", "publisherId", "publishedAt"]) assert.ok(MoonwitnessPublicationModel.fields[key]);
});

test("the eight universe collection seeds stay private drafts and use a tenant-scoped conflict key", async () => {
  const seedSource = await readFile(new URL("../../../packages/batteries-base/src/moonwitness-seed.ts", import.meta.url), "utf8");
  let nextId = 0;
  const { MOONWITNESS_COLLECTION_SEEDS, seedMoonwitnessCollections } = loadTs(compileTs(seedSource), {
    "@empire/batteries": { uuidv7: () => `id-${++nextId}` },
  });
  const calls = [];
  const fakeKnex = (table) => ({
    where() { return this; },
    async first() { return null; },
    async update() { return 0; },
    insert(rows) {
      const call = { table, rows, conflictColumns: null, ignored: false };
      calls.push(call);
      return { onConflict(columns) { call.conflictColumns = columns; return { ignore() { call.ignored = true; } }; } };
    },
  });
  await seedMoonwitnessCollections(fakeKnex, "tenant-a", "owner-a");
  await seedMoonwitnessCollections(fakeKnex, "tenant-a", "owner-a");
  assert.equal(MOONWITNESS_COLLECTION_SEEDS.length, 8);
  assert.deepEqual(calls.map((call) => call.rows.length), [8, 8]);
  for (const call of calls) {
    assert.equal(call.table, "moonwitness_collections");
    assert.deepEqual(call.conflictColumns, ["tenant_id", "slug"]);
    assert.equal(call.ignored, true);
    assert.ok(call.rows.every((row) => row.tenant_id === "tenant-a" && row.owner_id === "owner-a" && row.status === "draft" && row.visibility === "private"));
    assert.ok(call.rows.every((row) => !("episodeCount" in row) && !("storyCount" in row)));
  }
});

test("editorial state transitions require the reviewed forward path", async () => {
  const source = await readFile(new URL("../src/routes/moonwitness-editorial.ts", import.meta.url), "utf8");
  const route = loadTs(compileTs(source), {
    "@empire/batteries-base": {}, "@empire/batteries": {}, "@empire/api-contract": {},
    "./auth.js": {}, "./tenant-context.js": {},
    "./moonwitness-public.js": { moonwitnessPublicApiRoutes: async () => {} },
    "../moonwitness-publishing-worker.js": { startMoonwitnessPublishingWorker: () => () => {} },
  });
  assert.equal(route.isEditorialTransitionAllowed("story", "draft", "in_review"), true);
  assert.equal(route.isEditorialTransitionAllowed("story", "draft", "published"), false);
  assert.equal(route.isEditorialTransitionAllowed("story", "published", "draft"), false);
  assert.equal(route.isEditorialTransitionAllowed("story", "in_review", "changes_requested"), true);
  assert.equal(route.isEditorialTransitionAllowed("story", "in_review", "approved"), true);
  assert.equal(route.isEditorialTransitionAllowed("story", "approved", "scheduled"), true);
  assert.equal(route.isEditorialTransitionAllowed("story", "scheduled", "published"), false);
  assert.equal(route.isEditorialTransitionAllowed("story", "published", "approved"), true);
  assert.equal(route.isEditorialTransitionAllowed("story", "archived", "draft"), true);
  assert.equal(route.isEditorialTransitionAllowed("collection", "draft", "published"), true);
  assert.equal(route.isEditorialTransitionAllowed("collection", "archived", "published"), false);
});

test("collection creation binds owner and status to server defaults", async () => {
  const source = await readFile(new URL("../src/routes/moonwitness-editorial.ts", import.meta.url), "utf8");
  let inserted;
  const dependencies = {
    "@empire/batteries-base": {
      AuthService: { hasPermission: () => false },
      MoonwitnessCollectionModel: { query: () => ({ insert: async (row) => { inserted = row; return { id: "collection-1", ...row }; } }) },
      MoonwitnessStoryModel: {}, MoonwitnessStoryTagModel: {}, TagModel: {},
    },
    "@empire/batteries": { getDatabase: () => { throw new Error("unexpected database transaction"); } },
    "@empire/api-contract": {},
    "./auth.js": { requirePermission: () => async () => {}, requireSession: async () => {} },
    "./tenant-context.js": { requireTenant: async () => {} },
    "./moonwitness-public.js": { moonwitnessPublicApiRoutes: async () => {} },
    "../moonwitness-publishing-worker.js": { startMoonwitnessPublishingWorker: () => () => {} },
  };
  const route = loadTs(compileTs(source), dependencies);
  let handler;
  await route.moonwitnessEditorialRoutes({ addHook() {}, get() {}, patch() {}, post(path, _options, callback) { if (path === "/v1/moonwitness/collections") handler = callback; } });
  const response = { code(code) { this.statusCode = code; return this; }, send(body) { this.body = body; return this; } };
  await handler({
    body: { slug: "series", title: "Series", ownerId: "attacker", status: "published", visibility: "public" },
    tenantId: "tenant-a", authUser: { id: "member-a" },
  }, response);
  assert.equal(response.statusCode, 201);
  assert.equal(inserted.tenantId, "tenant-a");
  assert.equal(inserted.ownerId, "member-a");
  assert.equal(inserted.status, "draft");
  assert.equal(inserted.visibility, "private");
  assert.equal("ownerId" in response.body && response.body.ownerId, "member-a");
});

function builder(rows, calls) {
  const value = {
    where(...args) { calls.push(["where", ...args]); return this; },
    whereIn(...args) { calls.push(["whereIn", ...args]); return this; },
    select(...args) { calls.push(["select", ...args]); return this; },
    orderBy(...args) { calls.push(["orderBy", ...args]); return this; },
    limit(...args) { calls.push(["limit", ...args]); return this; },
    then(resolve, reject) { return Promise.resolve(rows).then(resolve, reject); },
  };
  return value;
}

test("public projection requires published public collection and story states", async () => {
  const routeSource = await readFile(new URL("../src/routes/moonwitness-editorial.ts", import.meta.url), "utf8");
  let collections = [];
  let stories = [];
  const collectionCalls = [];
  const storyCalls = [];
  const deps = {
    "@empire/batteries-base": {
      AuthService: { hasPermission: () => false },
      MoonwitnessCollectionModel: { query: () => builder(collections, collectionCalls) },
      MoonwitnessStoryModel: { query: () => builder(stories, storyCalls) },
      MoonwitnessStoryTagModel: {}, TagModel: {},
    },
    "@empire/batteries": { getDatabase: () => { throw new Error("database must not be used by public projection tests"); } },
    "@empire/api-contract": {},
    "./auth.js": { requirePermission: () => async () => {}, requireSession: async () => {} },
    "./tenant-context.js": { requireTenant: async () => {} },
    "./moonwitness-public.js": { moonwitnessPublicApiRoutes: async () => {} },
    "../moonwitness-publishing-worker.js": { startMoonwitnessPublishingWorker: () => () => {} },
  };
  const route = loadTs(compileTs(routeSource), deps);
  assert.equal(route.isPublicEditorialProjection({ status: "published", visibility: "public" }, { editorialState: "published", classification: "public", visibility: "public" }), true);
  assert.equal(route.isPublicEditorialProjection({ status: "draft", visibility: "public" }, { editorialState: "published", classification: "public", visibility: "public" }), false);
  assert.equal(route.isPublicEditorialProjection({ status: "published", visibility: "public" }, { editorialState: "published", classification: "internal", visibility: "public" }), false);
});
