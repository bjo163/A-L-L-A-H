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
    assert.ok(specifier in dependencies, `Unexpected dependency: ${specifier}`);
    return dependencies[specifier];
  }, module);
  return module.exports;
}

const apiContractSource = await readFile(new URL("../../../packages/api-contract/src/index.ts", import.meta.url), "utf8");
const apiContract = loadTs(compileTs(apiContractSource), { "node:crypto": require("node:crypto") });
const validateCollectionCreate = new Ajv({ strict: false, validateFormats: false }).compile(apiContract.MOONWITNESS_COLLECTION_CREATE_SCHEMA);
const validateStoryCreate = new Ajv({ strict: false, validateFormats: false }).compile(apiContract.MOONWITNESS_STORY_CREATE_SCHEMA);
const modelStub = class BatteriesModel {};

const models = {};
for (const file of ["moonwitness-collection.model.ts", "moonwitness-story.model.ts", "moonwitness-story-tag.model.ts", "tag.model.ts"]) {
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

test("the eight universe collection seeds stay private drafts and use a tenant-scoped conflict key", async () => {
  const seedSource = await readFile(new URL("../../../packages/batteries-base/src/moonwitness-seed.ts", import.meta.url), "utf8");
  let nextId = 0;
  const { MOONWITNESS_COLLECTION_SEEDS, seedMoonwitnessCollections } = loadTs(compileTs(seedSource), {
    "@empire/batteries": { uuidv7: () => `id-${++nextId}` },
  });
  const calls = [];
  const fakeKnex = (table) => ({
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
  });
  assert.equal(route.isEditorialTransitionAllowed("story", "draft", "in_review"), true);
  assert.equal(route.isEditorialTransitionAllowed("story", "draft", "published"), false);
  assert.equal(route.isEditorialTransitionAllowed("story", "published", "draft"), false);
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
  };
  const route = loadTs(compileTs(routeSource), deps);
  const handlers = new Map();
  await route.moonwitnessPublicStoryRoutes({ get(path, ...args) { handlers.set(path, args.at(-1)); } });
  const handler = handlers.get("/v1/public/moonwitness/stories");

  collections = [];
  stories = [];
  assert.deepEqual(await handler({ query: {} }), { items: [] });
  assert.equal(storyCalls.length, 0, "no visible collections must return an empty public listing");

  collectionCalls.length = 0;
  storyCalls.length = 0;
  collections = [{ id: "collection-1", slug: "series", title: "Series", status: "published", visibility: "public" }];
  stories = [
    { id: "public-1", collectionId: "collection-1", slug: "public", title: "Public story", body: "Body", editorialState: "published", classification: "public", visibility: "public", tenantId: "private-tenant", authorId: "private-author" },
    { id: "private-1", collectionId: "collection-1", slug: "private", title: "Private story", body: "Secret", editorialState: "draft", classification: "internal", visibility: "private", tenantId: "private-tenant", authorId: "private-author" },
  ];
  const result = await handler({ query: {} });
  assert.deepEqual(result.items.map(({ id }) => id), ["public-1"]);
  assert.deepEqual(storyCalls.find(([kind]) => kind === "where"), ["where", { editorial_state: "published", classification: "public", visibility: "public" }]);
  assert.ok(!("tenantId" in result.items[0]) && !("authorId" in result.items[0]));
});
