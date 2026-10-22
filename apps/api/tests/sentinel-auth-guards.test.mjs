import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/routes/auth.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

let sessionAvailable = true;
const user = { id: "user-1", status: "active", permissions: [] };
function queryFor(value) {
  return {
    where() { return this; },
    whereNull() { return this; },
    withGraphFetched() { return this; },
    findById() { return this; },
    async first() { return value; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}
const dependencies = {
  "node:crypto": { createHash, randomBytes },
  "@empire/batteries-base": {
    AuditLogModel: {},
    AuthSessionModel: { query: () => queryFor(sessionAvailable ? { userId: user.id } : null) },
    TenantMembershipModel: {},
    TenantModel: {},
    UserModel: { query: () => queryFor(user) },
    AuthService: { hasPermission: (entity, slug) => entity.permissions.includes(slug) },
  },
  "../env.js": { env: { NODE_ENV: "test", CORS_ORIGIN: "http://localhost" } },
};
const authExports = {};
new Function("require", "exports", compiled)((specifier) => {
  assert.ok(dependencies[specifier], `Unexpected auth dependency ${specifier}`);
  return dependencies[specifier];
}, authExports);

function reply() {
  return {
    statusCode: 200,
    body: undefined,
    code(statusCode) { this.statusCode = statusCode; return this; },
    send(body) { this.body = body; return this; },
  };
}

test("Sentinel runtime guards reject anonymous, invalid, and unauthorized requests", async () => {
  const noSessionReply = reply();
  await authExports.requireSession({ method: "POST", headers: {} }, noSessionReply);
  assert.equal(noSessionReply.statusCode, 401);

  sessionAvailable = false;
  const expiredReply = reply();
  await authExports.requireSession({ method: "POST", headers: { authorization: "Bearer expired-token" } }, expiredReply);
  assert.equal(expiredReply.statusCode, 401);

  sessionAvailable = true;
  const request = { method: "POST", headers: { authorization: "Bearer valid-token" } };
  const sessionReply = reply();
  await authExports.requireSession(request, sessionReply);
  assert.equal(sessionReply.statusCode, 200, JSON.stringify(sessionReply.body));

  const deniedReply = reply();
  await authExports.requirePermission("sentinel:scan")(request, deniedReply);
  assert.equal(deniedReply.statusCode, 403);

  user.permissions.push("sentinel:scan");
  const allowedReply = reply();
  await authExports.requirePermission("sentinel:scan")(request, allowedReply);
  assert.equal(allowedReply.statusCode, 200);
});
