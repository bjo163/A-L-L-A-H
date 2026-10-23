import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = await readFile(new URL("../src/routes/moonwitness-editorial.ts", import.meta.url), "utf8");
function compileTs(input) { return ts.transpileModule(input, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText; }
function loadTs(input, dependencies) {
  const module = { exports: {} };
  new Function("exports", "require", "module", compileTs(input))(module.exports, (id) => {
    if (id === "node:crypto") return require("node:crypto");
    assert.ok(id in dependencies, `Unexpected dependency: ${id}`);
    return dependencies[id];
  }, module);
  return module.exports;
}

function createScenario({ approvedBody = "Approved content", stateName = "approved" } = {}) {
  const state = {
    story: { id: "11111111-1111-4111-8111-111111111111", tenantId: "22222222-2222-4222-8222-222222222222", collectionId: "33333333-3333-4333-8333-333333333333", authorId: "44444444-4444-4444-8444-444444444444", slug: "story", title: "Story", synopsis: null, body: approvedBody, editorialState: stateName, classification: "public", visibility: "public", revision: 3, scheduledAt: null,
      $query() { return { patchAndFetch: async (patch) => Object.assign(state.story, patch) }; } },
    collection: { status: "published", visibility: "public" },
    approvedRevision: { id: "55555555-5555-4555-8555-555555555555", revision: 2, sha256: "digest", snapshot: { storyId: "11111111-1111-4111-8111-111111111111", collectionId: "33333333-3333-4333-8333-333333333333", slug: "story", title: "Story", synopsis: null, body: "Approved content", classification: "public", visibility: "public", tagIds: ["tag-1"] } },
    auditEntries: [], revisions: [], publications: [{ id: "published-snapshot-1", revisionId: "revision-approved", snapshot: { body: "Approved content" } }],
    tags: [{ tagId: "tag-1" }],
  };
  class Builder {
    constructor(kind) { this.kind = kind; this.filters = {}; }
    where(...args) { if (args.length === 1) Object.assign(this.filters, args[0]); else this.filters[args[0]] = args[2]; return this; }
    whereRaw() { return this; } orderBy() { return this; } forUpdate() { return this; } select() { return this; }
    async first() {
      if (this.kind === "story") return state.story;
      if (this.kind === "collection") return state.collection;
      if (this.kind === "revision") return state.approvedRevision;
      if (this.kind === "audit" && this.filters.action === "MOONWITNESS_REVISION_APPROVED") return { userId: "reviewer-1", payload: { revisionId: state.approvedRevision.id } };
      return null;
    }
    async patchAndFetch(patch) { return Object.assign(state.story, patch); }
    async insert(row) {
      if (this.kind === "revision") { const created = { id: `revision-new-${state.revisions.length + 1}`, ...row }; state.revisions.push(created); return created; }
      if (this.kind === "audit") { state.auditEntries.push(row); return row; }
      if (this.kind === "tags") { state.tags.push(...row.map((tagId) => ({ tagId }))); return row; }
      return row;
    }
    async delete() { return 0; }
    then(resolve, reject) { return Promise.resolve(this.kind === "tags" ? state.tags : []).then(resolve, reject); }
  }
  const models = {
    AuthService: { hasPermission: (_user, permission) => ["moonwitness:publish", "moonwitness:review"].includes(permission) },
    AuditLogModel: { query: () => new Builder("audit") },
    MoonwitnessCollectionModel: { query: () => new Builder("collection") },
    MoonwitnessStoryModel: { query: () => new Builder("story") },
    MoonwitnessStoryTagModel: { query: () => new Builder("tags") },
    MoonwitnessContentRevisionModel: { query: () => new Builder("revision") },
    MoonwitnessPublicationModel: { query: () => new Builder("publication") },
    MoonwitnessEpisodeModel: {}, MoonwitnessSceneModel: {}, MoonwitnessComicPageModel: {}, TagModel: {},
  };
  const dependencies = {
    "@empire/batteries-base": models,
    "@empire/batteries": { getDatabase: () => ({ transaction: (callback) => callback({}) }) },
    "@empire/api-contract": {},
    "./auth.js": { requirePermission: () => async () => {}, requireSession: async () => {} },
    "./tenant-context.js": { requireTenant: async () => {} },
    "./moonwitness-public.js": { moonwitnessPublicApiRoutes: async () => {} },
    "../moonwitness-publishing-worker.js": { startMoonwitnessPublishingWorker: () => () => {} },
  };
  return { state, route: loadTs(source, dependencies) };
}

async function handlersFor(route) {
  const handlers = new Map();
  await route.moonwitnessEditorialRoutes({
    addHook() {}, get() {}, post(path, _options, handler) { handlers.set(`POST ${path}`, handler); },
    patch(path, _options, handler) { handlers.set(`PATCH ${path}`, handler); },
  });
  return handlers;
}
const reply = () => ({ code(statusCode) { this.statusCode = statusCode; return this; }, send(body) { this.body = body; return this; } });

test("only the approved public snapshot can be scheduled and scheduling records actor, reason, and reviewed revision", async () => {
  const { state, route } = createScenario(); const handlers = await handlersFor(route);
  const response = reply(); const scheduledAt = new Date(Date.now() + 60_000).toISOString();
  const result = await handlers.get("PATCH /v1/moonwitness/stories/:id")({
    params: { id: state.story.id }, tenantId: state.story.tenantId, ip: "127.0.0.1", authUser: { id: "publisher-1" },
    body: { editorialState: "scheduled", scheduledAt, reason: "Ready for launch" },
  }, response);
  assert.equal(response.statusCode, undefined);
  assert.equal(result.editorialState, "scheduled");
  assert.equal(new Date(result.scheduledAt).toISOString(), scheduledAt);
  const event = state.auditEntries.find((item) => item.action === "MOONWITNESS_STORY_SCHEDULED");
  assert.equal(event.userId, "publisher-1");
  assert.equal(event.payload.reason, "Ready for launch");
  assert.equal(event.payload.approvedRevisionId, "55555555-5555-4555-8555-555555555555");
  assert.equal(state.publications.length, 1);
});

test("stale approval cannot be scheduled; scheduled stories cannot be published early", async () => {
  const stale = createScenario({ approvedBody: "Changed after approval" }); const staleHandlers = await handlersFor(stale.route); const staleReply = reply();
  await staleHandlers.get("PATCH /v1/moonwitness/stories/:id")({
    params: { id: stale.state.story.id }, tenantId: stale.state.story.tenantId, ip: "127.0.0.1", authUser: { id: "publisher-1" },
    body: { editorialState: "scheduled", scheduledAt: new Date(Date.now() + 60_000).toISOString(), reason: "Schedule stale content" },
  }, staleReply);
  assert.equal(staleReply.statusCode, 409);
  assert.equal(stale.state.story.editorialState, "approved");
  assert.equal(stale.state.auditEntries.length, 0);

  const scheduled = createScenario({ stateName: "scheduled" }); const scheduledHandlers = await handlersFor(scheduled.route); const earlyReply = reply();
  await scheduledHandlers.get("PATCH /v1/moonwitness/stories/:id")({
    params: { id: scheduled.state.story.id }, tenantId: scheduled.state.story.tenantId, ip: "127.0.0.1", authUser: { id: "publisher-1" },
    body: { editorialState: "published", reason: "Try early release" },
  }, earlyReply);
  assert.equal(earlyReply.statusCode, 409);
  assert.equal(scheduled.state.story.editorialState, "scheduled");
});

test("unpublish and restore audit the human actor and reason while retaining earlier publication snapshots", async () => {
  const { state, route } = createScenario({ stateName: "published" }); const handlers = await handlersFor(route);
  const before = structuredClone(state.publications); const request = { params: { id: state.story.id }, tenantId: state.story.tenantId, ip: "127.0.0.1", authUser: { id: "publisher-1" } };
  const unpublishReply = reply();
  await handlers.get("PATCH /v1/moonwitness/stories/:id")({ ...request, body: { editorialState: "approved", reason: "Withdraw pending correction" } }, unpublishReply);
  assert.equal(state.story.editorialState, "approved");
  const unpublishEvent = state.auditEntries.find((item) => item.action === "MOONWITNESS_STORY_UNPUBLISHED");
  assert.equal(unpublishEvent.userId, "publisher-1");
  assert.equal(unpublishEvent.payload.reason, "Withdraw pending correction");

  await handlers.get("POST /v1/moonwitness/stories/:id/restore")({ ...request, body: { revisionId: "55555555-5555-4555-8555-555555555555", reason: "Restore reviewed baseline" } }, reply());
  assert.equal(state.story.editorialState, "draft");
  const restoreEvent = state.auditEntries.find((item) => item.action === "MOONWITNESS_REVISION_RESTORED");
  assert.equal(restoreEvent.userId, "publisher-1");
  assert.equal(restoreEvent.payload.reason, "Restore reviewed baseline");
  assert.deepEqual(state.publications, before);
});
