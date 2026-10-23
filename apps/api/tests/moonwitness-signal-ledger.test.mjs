import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import Ajv from "ajv";
import ts from "typescript";

const require = createRequire(import.meta.url);
const compile = (source) => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
function load(source, dependencies) {
  const module = { exports: {} };
  new Function("exports", "require", "module", source)(module.exports, (specifier) => {
    assert.ok(specifier in dependencies, `Unexpected dependency: ${specifier}`);
    return dependencies[specifier];
  }, module);
  return module.exports;
}

const apiContractSource = await readFile(new URL("../../../packages/api-contract/src/index.ts", import.meta.url), "utf8");
const contract = load(compile(apiContractSource), { "node:crypto": require("node:crypto"), "./moonwitness-public.js": {} });
const ajv = new Ajv({ strict: false, validateFormats: false });
const characterCreate = ajv.compile(contract.MOONWITNESS_CHARACTER_CREATE_SCHEMA);
const signalCreate = ajv.compile(contract.MOONWITNESS_SIGNAL_CREATE_SCHEMA);
const Model = class BatteriesModel {};
const characterModelSource = await readFile(new URL("../../../packages/batteries-base/src/models/moonwitness-character.model.ts", import.meta.url), "utf8");
const signalModelSource = await readFile(new URL("../../../packages/batteries-base/src/models/moonwitness-signal.model.ts", import.meta.url), "utf8");
const models = {
  ...load(compile(characterModelSource), { "@empire/batteries": { BatteriesModel: Model } }),
  ...load(compile(signalModelSource), { "@empire/batteries": { BatteriesModel: Model } }),
};
const routeSource = await readFile(new URL("../src/routes/moonwitness-signal-ledger.ts", import.meta.url), "utf8");

test("Character and Signal contracts reject permission-bearing or sensitive-location input", () => {
  const fictional = { slug: "moon-guide", displayName: "Moon Guide", kind: "fictional" };
  assert.equal(characterCreate(fictional), true);
  assert.equal(characterCreate({ ...fictional, permissions: ["admin"] }), false);
  assert.equal(characterCreate({ ...fictional, kind: "real_contributor" }), true); // handler enforces explicit consent
  const safeSignal = { title: "Observation", body: "A clearly labelled claim.", contentCategory: "empirical_claim", sensitiveLocation: true, locationDisclosure: "none" };
  assert.equal(signalCreate(safeSignal), true);
  assert.equal(signalCreate({ ...safeSignal, exactCoordinates: [0, 0] }), false);
  assert.equal(signalCreate({ ...safeSignal, locationDisclosure: "exact" }), false);
  assert.equal(signalCreate({ ...safeSignal, verified: true }), false);
});

test("tenant-safe model keys and non-authoritative classification fields are explicit", () => {
  const { MoonwitnessCharacterModel, MoonwitnessSignalModel } = models;
  assert.ok(MoonwitnessCharacterModel.uniqueConstraints.some((key) => key.join(",") === "tenantId,id"));
  assert.ok(MoonwitnessCharacterModel.foreignConstraints.every((key) => key.columns[0] === "tenantId"));
  assert.ok(MoonwitnessCharacterModel.fields.kind);
  assert.ok(MoonwitnessCharacterModel.fields.consentStatus);
  assert.ok(MoonwitnessSignalModel.uniqueConstraints.some((key) => key.join(",") === "tenantId,id"));
  assert.ok(MoonwitnessSignalModel.foreignConstraints.every((key) => key.columns[0] === "tenantId"));
  assert.ok(MoonwitnessSignalModel.fields.contentCategory);
  assert.ok(MoonwitnessSignalModel.fields.editorialClassification);
  assert.ok(MoonwitnessSignalModel.fields.sourceMetadata);
  assert.ok(!("permissions" in MoonwitnessCharacterModel.fields));
  assert.ok(!("verificationStatus" in MoonwitnessSignalModel.fields));
});

test("real contributor consent, testimony consent, and sensitive-location safeguards are enforced", () => {
  const routes = load(compile(routeSource), {
    "@empire/batteries-base": {}, "@empire/api-contract": {},
    "./auth.js": { requirePermission: () => async () => {}, requireSession: async () => {} },
    "./tenant-context.js": { requireTenant: async () => {} },
  });
  assert.equal(routes.isValidRealContributorConsent({ kind: "real_contributor" }), false);
  assert.equal(routes.isValidRealContributorConsent({ kind: "real_contributor", consentStatus: "granted", consentScope: "Use as a credited interviewee", consentCapturedAt: "2026-10-23T00:00:00Z" }), true);
  assert.equal(routes.isValidRealContributorConsent({ kind: "fictional" }), true);
  assert.equal(routes.isSafeSignalLocation({ sensitiveLocation: true, locationDisclosure: "exact", locationLabel: "Home" }), false);
  assert.equal(routes.isSafeSignalLocation({ sensitiveLocation: true, locationDisclosure: "none" }), true);
  assert.equal(routes.isSafeSignalLocation({ sensitiveLocation: true, locationDisclosure: "generalized", locationLabel: "North district" }), false);
  assert.equal(routes.isValidTestimonyConsent({ contentCategory: "user_testimony" }), true); // remains private/pending until explicit grant
  assert.equal(routes.isValidTestimonyConsent({ contentCategory: "user_testimony", testimonyConsentStatus: "granted", testimonyConsentScope: "Publish anonymized excerpt", testimonyConsentCapturedAt: "2026-10-23T00:00:00Z" }), true);
  assert.equal(routes.isValidTestimonyConsent({ contentCategory: "user_testimony", testimonyConsentStatus: "granted" }), false);
});

test("signal creation binds tenant and human author, keeps testimony private, and stores source and time labels", async () => {
  let inserted;
  const deps = {
    "@empire/batteries-base": {
      MoonwitnessCharacterModel: { query: () => ({ where() { return this; }, first: async () => null }) },
      MoonwitnessSignalModel: { query: () => ({ insert: async (row) => { inserted = row; return { id: "signal-1", ...row }; } }) },
    },
    "@empire/api-contract": {},
    "./auth.js": { requirePermission: () => async () => {}, requireSession: async () => {} },
    "./tenant-context.js": { requireTenant: async () => {} },
  };
  const routes = load(compile(routeSource), deps);
  let handler;
  await routes.moonwitnessSignalLedgerRoutes({ addHook() {}, get() {}, patch(path, _opts, cb) { if (path.endsWith("/:id")) return; }, post(path, _opts, cb) { if (path === "/v1/moonwitness/signals") handler = cb; } });
  const reply = { code(code) { this.statusCode = code; return this; }, send(body) { this.body = body; return this; } };
  const result = await handler({ tenantId: "tenant-a", authUser: { id: "member-a" }, body: { title: "Testimony", body: "A personal account.", contentCategory: "user_testimony", claimedAt: "2026-10-22T10:00:00Z", observedAt: "2026-10-22T10:01:00Z", editorialClassification: "confidential", sourceMetadata: { sourceName: "Interview" } } }, reply);
  assert.equal(reply.statusCode, 201);
  assert.equal(reply.body.tenantId, "tenant-a");
  assert.equal(inserted.authorId, "member-a");
  assert.equal(inserted.privacyStatus, "private");
  assert.equal(inserted.testimonyConsentStatus, "pending");
  assert.equal(inserted.editorialClassification, "confidential");
  assert.equal(inserted.sourceMetadata.sourceName, "Interview");
  assert.equal(inserted.claimedAt, "2026-10-22T10:00:00Z");
  assert.equal(inserted.observedAt, "2026-10-22T10:01:00Z");
  assert.ok(!("verified" in inserted));
});

test("partial signal edits preserve the existing editorial/source metadata", async () => {
  const current = { id: "signal-1", tenantId: "tenant-a", contentCategory: "empirical_claim", editorialClassification: "internal", sourceMetadata: { sourceName: "Archive" }, evidenceLinks: [{ label: "Record", url: "https://example.test/evidence" }], sensitiveLocation: false, locationDisclosure: "none", locationLabel: null, testimonyConsentStatus: "not_applicable" };
  let patch;
  const deps = {
    "@empire/batteries-base": { MoonwitnessCharacterModel: {}, MoonwitnessSignalModel: { query: () => ({ where() { return this; }, first: async () => current, patch: async (value) => { patch = value; return 1; } }) } },
    "@empire/api-contract": {}, "./auth.js": { requirePermission: () => async () => {}, requireSession: async () => {} }, "./tenant-context.js": { requireTenant: async () => {} },
  };
  const routes = load(compile(routeSource), deps);
  let handler;
  await routes.moonwitnessSignalLedgerRoutes({ addHook() {}, get() {}, post() {}, patch(path, _opts, cb) { if (path.endsWith("/:id")) handler = cb; } });
  const reply = { code(code) { this.statusCode = code; return this; }, send(body) { this.body = body; return this; } };
  await handler({ params: { id: "11111111-1111-4111-8111-111111111111" }, tenantId: "tenant-a", body: { editorialClassification: "restricted" } }, reply);
  assert.deepEqual(patch, { editorialClassification: "restricted" });
  assert.deepEqual(current.sourceMetadata, { sourceName: "Archive" });
  assert.deepEqual(current.evidenceLinks, [{ label: "Record", url: "https://example.test/evidence" }]);
});
