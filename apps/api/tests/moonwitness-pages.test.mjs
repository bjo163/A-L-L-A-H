import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import Ajv from "ajv";
import ts from "typescript";

const require = createRequire(import.meta.url);
function compile(source) { return ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText; }
function load(source, dependencies) { const module = { exports: {} }; new Function("exports", "require", "module", source)(module.exports, (key) => dependencies[key], module); return module.exports; }

test("episode, scene, and page models enforce stable tenant-scoped sequence keys", async () => {
  const stub = class BatteriesModel {};
  const models = {};
  for (const file of ["moonwitness-episode.model.ts", "moonwitness-scene.model.ts", "moonwitness-comic-page.model.ts"]) {
    const source = await readFile(new URL(`../../../packages/batteries-base/src/models/${file}`, import.meta.url), "utf8");
    Object.assign(models, load(compile(source), { "@empire/batteries": { BatteriesModel: stub } }));
  }
  for (const [Model, parent, table] of [
    [models.MoonwitnessEpisodeModel, "storyId", "moonwitness_stories"],
    [models.MoonwitnessSceneModel, "episodeId", "moonwitness_episodes"],
    [models.MoonwitnessComicPageModel, "sceneId", "moonwitness_scenes"],
  ]) {
    assert.ok(Model.uniqueConstraints.some((key) => key.join(",") === `tenantId,${parent},sequence`));
    assert.ok(Model.foreignConstraints.some((key) => key.columns.join(",") === `tenantId,${parent}` && key.references.table === table));
  }
  assert.equal(models.MoonwitnessComicPageModel.fields.altText.required, true);
  assert.equal(models.MoonwitnessComicPageModel.fields.assetUrl.required, true);
});

test("page contracts require safe asset references, alt text, and complete unique ordering", async () => {
  const source = await readFile(new URL("../../../packages/api-contract/src/index.ts", import.meta.url), "utf8");
  const contract = load(compile(source), { "node:crypto": require("node:crypto") });
  const ajv = new Ajv({ strict: false, validateFormats: false });
  const page = ajv.compile(contract.MOONWITNESS_COMIC_PAGE_CREATE_SCHEMA);
  const order = ajv.compile(contract.MOONWITNESS_PAGE_ORDER_SCHEMA);
  assert.equal(page({ assetUrl: "https://assets.example/page.webp", altText: "Panel description" }), true);
  assert.equal(page({ assetUrl: "https://assets.example/page.webp" }), false);
  assert.equal(order({ orderedIds: ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"] }), true);
  assert.equal(order({ orderedIds: ["11111111-1111-4111-8111-111111111111", "11111111-1111-4111-8111-111111111111"] }), false);
});

test("page creation and reorder stay tenant scoped, serialized, and transactional", async () => {
  const route = await readFile(new URL("../src/routes/moonwitness-editorial.ts", import.meta.url), "utf8");
  assert.match(route, /where\(\{ id: sceneId, tenant_id: request\.tenantId! \}\)\.forUpdate\(\)\.first\(\)/);
  assert.match(route, /where\(\{ tenant_id: request\.tenantId!, scene_id: sceneId \}\)/);
  assert.match(route, /getDatabase\(\)\.transaction\(async \(trx\) => \{/);
  assert.match(route, /sequence: -\(index \+ 1\)/, "temporary disjoint sequence prevents unique-key conflicts during swaps");
  assert.match(route, /orderedIds\.length \|\| ids\.some/);
  assert.match(route, /!\/\^\(https:\\\/\\\/\|\\\/\)\[\^\\s\]\+\$\/i\.test\(body\.assetUrl\)/, "unsafe page schemes are rejected");
});
