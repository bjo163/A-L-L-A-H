import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function compileTs(source) {
  return ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
}
function loadTs(source, dependencies = {}) {
  const module = { exports: {} };
  new Function("exports", "require", "module", source)(module.exports, (specifier) => {
    assert.ok(specifier in dependencies, `Unexpected dependency: ${specifier}`);
    return dependencies[specifier];
  }, module);
  return module.exports;
}

const dtoSource = await readFile(new URL("../../../packages/api-contract/src/moonwitness-public.ts", import.meta.url), "utf8");
const dto = loadTs(compileTs(dtoSource));
const routeSource = await readFile(new URL("../src/routes/moonwitness-public.ts", import.meta.url), "utf8");

test("public projections use allowlisted fields and require public publication snapshots", () => {
  const routes = loadTs(compileTs(routeSource), {
    fastify: {},
    "@empire/batteries": { getDatabase: () => () => ({}) },
    "@empire/api-contract": dto,
  });
  const collection = routes.projectPublicCollection({ id: "private-id", tenantId: "tenant-secret", slug: "moonwitness", title: "Moonwitness", language: "en", ownerId: "secret" });
  assert.deepEqual(collection, { slug: "moonwitness", title: "Moonwitness", language: "en" });
  const story = routes.projectPublicStory({ snapshot: { slug: "story-one", title: "Story", synopsis: null, body: "Published", classification: "public", visibility: "public", tenantId: "secret", storyId: "secret" }, publishedAt: "2026-10-20T12:00:00.000Z", collectionSlug: "moonwitness", collectionTitle: "Moonwitness", language: "en", tenantId: "secret" });
  assert.deepEqual(Object.keys(story).sort(), ["body", "collection", "publishedAt", "slug", "synopsis", "title"]);
  assert.deepEqual(Object.keys(story.collection).sort(), ["language", "slug", "title"]);
  assert.equal(routes.projectPublicStory({ snapshot: { classification: "internal", visibility: "public", title: "Hidden", body: "Draft" }, publishedAt: "2026-10-20T12:00:00.000Z" }), null);
  assert.equal(routes.projectPublicStory({ snapshot: { classification: "public", visibility: "unlisted", title: "Hidden", body: "Draft" }, publishedAt: "2026-10-20T12:00:00.000Z" }), null);
});

test("public routes are anonymous GETs, and guessed draft story slugs receive the same 404", async () => {
  const routes = loadTs(compileTs(routeSource), {
    fastify: {},
    "@empire/batteries": { getDatabase: () => () => emptyQuery() },
    "@empire/api-contract": dto,
  });
  const registered = [];
  await routes.moonwitnessPublicApiRoutes({ get(path, options, handler) { registered.push({ path, options, handler }); } });
  assert.ok(registered.length >= 11);
  assert.ok(registered.every((route) => route.options.schema.security.length === 0));
  assert.ok(registered.every((route) => route.path.startsWith("/v1/public/moonwitness/")));
  const detail = registered.find((route) => route.path.endsWith("/collections/:collectionSlug/stories/:storySlug"));
  const reply = { code(status) { this.statusCode = status; return this; }, send(body) { this.body = body; return body; } };
  const response = await detail.handler({ params: { collectionSlug: "moonwitness", storySlug: "unpublished-draft" } }, reply);
  assert.equal(reply.statusCode, 404);
  assert.deepEqual(response, { status: "not_found", message: "Konten publik tidak ditemukan." });
  const signals = registered.find((route) => route.path === "/v1/public/moonwitness/signals/:signalId");
  const guessedSignal = await signals.handler({ params: { signalId: "00000000-0000-4000-8000-000000000001" } }, reply);
  assert.equal(reply.statusCode, 503);
  assert.deepEqual(guessedSignal, { status: "publication_unavailable", message: "Public Signal reads await a reviewed, immutable Signal publication workflow." });
});

function emptyQuery() {
  const query = {
    join() { return this; }, where() { return this; }, whereRaw() { return this; }, select() { return this; },
    orderBy() { return this; }, orderByRaw() { return this; }, limit() { return this; }, offset() { return this; },
    clone() { return emptyQuery(); }, async first() { return null; },
    then(resolve, reject) { return Promise.resolve([]).then(resolve, reject); },
  };
  return query;
}
