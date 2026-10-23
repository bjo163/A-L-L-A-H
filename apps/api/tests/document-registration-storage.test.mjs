import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/routes/work.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

const project = { id: "11111111-1111-4111-8111-111111111111", tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
const insertedDocuments = [];
let projectQueries = 0;
const dependencies = {
  "@empire/batteries-base": {
    AuditLogModel: { query: () => ({ insert: async () => ({}) }) },
    DocumentModel: { query: () => ({ insert: async (row) => { insertedDocuments.push(row); return { id: "doc-1", ...row }; } }) },
    ProjectModel: { query: () => ({ where() { return this; }, first: async () => { projectQueries += 1; return project; } }) },
    ResearchRunModel: {}, TaskModel: {}, TenantMembershipModel: {}, WorkspaceModel: {}, YoutubeSentinelPartnerLinkModel: {},
  },
  "./auth.js": { requirePermission: () => async () => {}, requireSession: async () => {} },
  "./tenant-context.js": { requireTenant: async () => {} },
};
const exports = {};
new Function("require", "exports", compiled)((specifier) => {
  assert.ok(dependencies[specifier], `Unexpected work route dependency: ${specifier}`);
  return dependencies[specifier];
}, exports);

function reply() {
  return {
    statusCode: 200,
    code(statusCode) { this.statusCode = statusCode; return this; },
    send(body) { this.body = body; return this; },
  };
}

async function documentRegistrationHandler() {
  let handler;
  await exports.workRoutes({
    addHook() {},
    get() {},
    post(path, _options, routeHandler) { if (path === "/v1/documents") handler = routeHandler; },
    patch() {},
    delete() {},
  });
  assert.equal(typeof handler, "function");
  return handler;
}

function body(storageProvider, storageKey) {
  return {
    projectId: project.id,
    title: "Private report",
    fileName: "report.txt",
    storageProvider,
    storageKey,
    mediaType: "text/plain",
    sizeBytes: 1,
    sha256: "a".repeat(64),
  };
}

test("document registration accepts only the pending storage pair", async () => {
  insertedDocuments.length = 0;
  projectQueries = 0;
  const handler = await documentRegistrationHandler();
  const response = reply();
  const result = await handler({
    body: body("pending", "pending"),
    tenantId: project.tenantId,
    authUser: { id: "operator-1" },
    ip: "127.0.0.1",
  }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(result, response);
  assert.equal(insertedDocuments[0].storageProvider, "pending");
  assert.equal(insertedDocuments[0].storageKey, "pending");
  assert.equal(insertedDocuments.length, 1);
});

test("document registration rejects forged or mismatched storage metadata before querying projects", async () => {
  insertedDocuments.length = 0;
  projectQueries = 0;
  const handler = await documentRegistrationHandler();
  const attempts = [
    body("local-private", `${project.tenantId}/22222222-2222-4222-8222-222222222222`),
    body("pending", `${project.tenantId}/22222222-2222-4222-8222-222222222222`),
    body("local-private", "pending"),
    body("external", "provider-key"),
  ];

  for (const requestBody of attempts) {
    const response = reply();
    await handler({
      body: requestBody,
      tenantId: project.tenantId,
      authUser: { id: "operator-1" },
      ip: "127.0.0.1",
    }, response);
    assert.equal(response.statusCode, 400);
  }

  assert.equal(projectQueries, 0, "invalid storage pointers must be rejected before database lookups");
  assert.equal(insertedDocuments.length, 0, "invalid storage pointers must never persist");
});
