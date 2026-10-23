import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { readFile as realReadFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/routes/document-storage.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

const tenantA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const docAId = "11111111-1111-4111-8111-111111111111";
const docBId = "22222222-2222-4222-8222-222222222222";
const forgedDocId = "33333333-3333-4333-8333-333333333333";
const fileAId = "aaaaaaaa-1111-4111-8111-111111111111";
const fileBId = "bbbbbbbb-2222-4222-8222-222222222222";
const secret = "test-only-signing-secret-that-is-long-enough";
const documents = [
  { id: docAId, tenantId: tenantA, status: "active", storageProvider: "local-private", storageKey: `${tenantA}/${fileAId}`, classification: "internal", sizeBytes: 1, sha256: createHash("sha256").update("a").digest("hex"), fileName: "a.txt", mediaType: "text/plain" },
  { id: docBId, tenantId: tenantB, status: "active", storageProvider: "local-private", storageKey: `${tenantB}/${fileBId}`, classification: "internal", sizeBytes: 1, sha256: createHash("sha256").update("b").digest("hex"), fileName: "b.txt", mediaType: "text/plain" },
  { id: forgedDocId, tenantId: tenantA, status: "active", storageProvider: "local-private", storageKey: `${tenantB}/${fileBId}`, classification: "internal", sizeBytes: 1, sha256: createHash("sha256").update("b").digest("hex"), fileName: "forged.txt", mediaType: "text/plain" },
];
const documentQueries = [];
let fileReadCount = 0;

const dependencies = {
  "node:crypto": { createHash, createHmac, randomUUID, timingSafeEqual },
  "node:fs/promises": {
    mkdir: async () => {},
    readFile: async (...args) => { fileReadCount += 1; return realReadFile(...args); },
    rm: async () => {},
    writeFile: async () => {},
  },
  "node:path": { dirname, resolve, sep },
  "@empire/batteries": { getDatabase: () => { throw new Error("DB should not be used in signed-link authorization tests"); } },
  "@empire/batteries-base": {
    AuditLogModel: {},
    DocumentModel: {
      query() {
        const builder = {
          criteria: {},
          where(criteria) { Object.assign(this.criteria, criteria); return this; },
          async first() {
            documentQueries.push({ ...this.criteria });
            const aliases = { storage_provider: "storageProvider", tenant_id: "tenantId" };
            return documents.find((doc) => Object.entries(this.criteria).every(([key, value]) => doc[aliases[key] ?? key] === value)) ?? null;
          },
        };
        return builder;
      },
    },
  },
  "../env.js": { env: { FILE_STORAGE_DIR: "C:/temporary-private-files", FILE_STORAGE_SIGNING_SECRET: secret } },
  "./auth.js": { requirePermission: () => async () => {}, requireSession: async () => {} },
  "./tenant-context.js": { requireTenant: async () => {} },
};
const exports = {};
new Function("require", "exports", compiled)((specifier) => {
  assert.ok(dependencies[specifier], `Unexpected document storage dependency: ${specifier}`);
  return dependencies[specifier];
}, exports);

function reply() {
  return {
    statusCode: 200,
    headers: {},
    code(statusCode) { this.statusCode = statusCode; return this; },
    send(body) { this.body = body; return this; },
    type(value) { this.headers["content-type"] = value; return this; },
    header(name, value) { this.headers[name] = value; return this; },
  };
}

async function routes() {
  const handlers = new Map();
  await exports.documentStorageRoutes({
    post(path, options, handler) { handlers.set(`POST ${path}`, { options, handler }); },
    get(path, options, handler) { handlers.set(`GET ${path}`, { options, handler }); },
  });
  return handlers;
}

test("tenant A cannot mint a download link for tenant B's document", async () => {
  documentQueries.length = 0;
  const route = (await routes()).get("POST /v1/documents/:id/download-link");
  const response = reply();
  const result = await route.handler({
    params: { id: docBId },
    tenantId: tenantA,
    authUser: { sovereign: true },
  }, response);

  assert.equal(response.statusCode, 404);
  assert.equal(result, response);
  assert.deepEqual(documentQueries.at(-1), { id: docBId, tenant_id: tenantA, status: "active" });
});

test("tenant A cannot mint a link for its document when the storage key belongs to tenant B", async () => {
  documentQueries.length = 0;
  const route = (await routes()).get("POST /v1/documents/:id/download-link");
  const response = reply();
  await route.handler({ params: { id: forgedDocId }, tenantId: tenantA, authUser: { sovereign: true } }, response);

  assert.equal(response.statusCode, 409);
  assert.deepEqual(documentQueries.at(-1), { id: forgedDocId, tenant_id: tenantA, status: "active" });
});

test("a tenant A signed URL cannot be changed to retrieve tenant B's document", async () => {
  documentQueries.length = 0;
  fileReadCount = 0;
  const route = (await routes()).get("GET /v1/documents/:id/content");
  const expires = String(Math.floor(Date.now() / 1000) + 300);
  const storageKey = `${tenantA}/${fileAId}`;
  const signature = createHmac("sha256", secret)
    .update(`${tenantA}:${docAId}:${expires}:${storageKey}:internal`)
    .digest("hex");
  const response = reply();
  await route.handler({ params: { id: docBId }, query: { expires, signature } }, response);

  assert.equal(response.statusCode, 401);
  assert.equal(fileReadCount, 0, "invalid cross-document signatures must be rejected before file access");
  assert.deepEqual(documentQueries.at(-1), { id: docBId, status: "active", storage_provider: "local-private" });
});

test("signed downloads reject a tenant A document that points at tenant B's storage key", async () => {
  documentQueries.length = 0;
  fileReadCount = 0;
  const handler = (await routes()).get("GET /v1/documents/:id/content").handler;
  const expires = String(Math.floor(Date.now() / 1000) + 300);
  const signature = createHmac("sha256", secret)
    .update(`${tenantA}:${forgedDocId}:${expires}:${tenantB}/${fileBId}:internal`)
    .digest("hex");
  const response = reply();
  await handler({ params: { id: forgedDocId }, query: { expires, signature } }, response);

  assert.equal(response.statusCode, 404);
  assert.equal(fileReadCount, 0, "tenant-mismatched storage keys must be rejected before file access");
});
