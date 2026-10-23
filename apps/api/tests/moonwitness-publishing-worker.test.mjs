import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = await readFile(new URL("../src/moonwitness-publishing-worker.ts", import.meta.url), "utf8");
function loadWorker(state) {
  const module = { exports: {} };
  const compile = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const deps = {
    "@empire/batteries": { getDatabase: () => ({ transaction: (callback) => callback({}) }) },
    "@empire/batteries-base": {},
  };
  class Query {
    constructor(kind) { this.kind = kind; this.filters = {}; }
    where(...args) { if (args.length === 1) Object.assign(this.filters, args[0]); else this.filters[args[0]] = args[2]; return this; }
    whereRaw() { return this; } whereNotNull() { return this; } orderBy() { return this; }
    forUpdate() { return this; } skipLocked() { return this; } limit() { return this; } select() { return this; }
    async first() {
      if (this.kind === "audit") return this.filters.action === "MOONWITNESS_STORY_SCHEDULED" ? state.scheduleEvent : state.approvalEvent;
      if (this.kind === "revision") return state.approvedRevision;
      if (this.kind === "collection") return state.collection;
      if (this.kind === "membership") return { status: "active" };
      if (this.kind === "publication") return null;
      return null;
    }
    async insert(row) { if (this.kind === "publication") state.publications.push(row); else if (this.kind === "audit") state.auditEntries.push(row); return row; }
    then(resolve, reject) {
      const rows = this.kind === "story" ? (state.story.editorialState === "scheduled" ? [state.story] : []) : this.kind === "tags" ? state.tags : [];
      return Promise.resolve(rows).then(resolve, reject);
    }
  }
  const models = {
    AuditLogModel: { query: () => new Query("audit") },
    MoonwitnessCollectionModel: { query: () => new Query("collection") },
    MoonwitnessContentRevisionModel: { query: () => new Query("revision") },
    MoonwitnessPublicationModel: { query: () => new Query("publication") },
    MoonwitnessStoryModel: { query: () => new Query("story") },
    MoonwitnessStoryTagModel: { query: () => new Query("tags") },
    TenantMembershipModel: { query: () => new Query("membership") },
  };
  Object.assign(deps["@empire/batteries-base"], models);
  new Function("exports", "require", "module", compile)(module.exports, (id) => {
    assert.ok(id in deps, `Unexpected dependency: ${id}`);
    return deps[id];
  }, module);
  return module.exports;
}

function fixture({ matching = true } = {}) {
  const snapshot = { storyId: "story-1", collectionId: "collection-1", slug: "story", title: "Approved title", synopsis: null, body: "Approved body", classification: "public", visibility: "public", tagIds: ["tag-1"] };
  const state = {
    story: { id: "story-1", tenantId: "tenant-1", collectionId: "collection-1", slug: "story", title: "Approved title", synopsis: null, body: "Approved body", classification: "public", visibility: "public", editorialState: "scheduled", scheduledAt: new Date("2026-10-23T00:00:00.000Z"), $query() { return { patch: async (fields) => Object.assign(state.story, fields) }; } },
    scheduleEvent: { userId: "publisher-1", payload: { approvedRevisionId: "revision-1", scheduledAt: "2026-10-23T00:00:00.000Z" } }, approvalEvent: { userId: "reviewer-1", payload: { revisionId: "revision-1" } },
    approvedRevision: { id: "revision-1", revision: 2, sha256: "abc", snapshot },
    collection: { status: "published", visibility: "public" }, tags: [{ tagId: "tag-1" }], publications: [], auditEntries: [],
  };
  if (!matching) state.story.body = "Changed after approval";
  return state;
}

test("due publication is idempotent and publishes the immutable approved snapshot", async () => {
  const state = fixture();
  const { publishDueMoonwitnessStories } = loadWorker(state);
  assert.deepEqual(await publishDueMoonwitnessStories(new Date("2026-10-24T00:00:00.000Z")), { published: 1, blocked: 0 });
  assert.equal(state.story.editorialState, "published");
  assert.equal(state.publications.length, 1);
  assert.equal(state.publications[0].revisionId, "revision-1");
  assert.equal(state.publications[0].snapshot.body, "Approved body");
  assert.equal(state.publications[0].publishedAt.toISOString(), "2026-10-24T00:00:00.000Z");
  assert.deepEqual(await publishDueMoonwitnessStories(new Date("2026-10-25T00:00:00.000Z")), { published: 0, blocked: 0 });
  assert.equal(state.publications.length, 1);
});

test("worker blocks a scheduled story whose content no longer matches approval", async () => {
  const state = fixture({ matching: false });
  const { publishDueMoonwitnessStories } = loadWorker(state);
  assert.deepEqual(await publishDueMoonwitnessStories(new Date("2026-10-24T00:00:00.000Z")), { published: 0, blocked: 1 });
  assert.equal(state.story.editorialState, "approved");
  assert.equal(state.story.scheduledAt, null);
  assert.equal(state.publications.length, 0);
  assert.equal(state.auditEntries[0].action, "MOONWITNESS_SCHEDULED_PUBLICATION_BLOCKED");
});
