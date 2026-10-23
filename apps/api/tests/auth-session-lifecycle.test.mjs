import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/routes/auth.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

const rawToken = "valid-session-token";
const hash = (token) => createHash("sha256").update(token).digest("hex");
let sessions = [];
let user = { id: "operator-1", status: "active", roles: [] };
const queryTrace = [];

function sessionQuery() {
  const predicates = [];
  const builder = {
    where(column, operatorOrValues) {
      if (typeof column === "object") predicates.push(...Object.entries(column).map(([key, value]) => [key, "=", value]));
      else predicates.push([column, arguments[1], arguments[2]]);
      return this;
    },
    whereNull(column) { predicates.push([column, "null", null]); return this; },
    async first() {
      queryTrace.push(predicates);
      return sessions.find((session) => predicates.every(([column, operator, value]) => {
        const property = ({ token_hash: "tokenHash", revoked_at: "revokedAt", expires_at: "expiresAt" })[column] ?? column;
        if (operator === "null") return session[property] == null;
        if (operator === ">") return Date.parse(session[property]) > Date.parse(value);
        return session[property] === value;
      })) ?? null;
    },
  };
  return builder;
}

const dependencies = {
  "node:crypto": { createHash, randomBytes },
  "@empire/batteries-base": {
    AuditLogModel: {},
    AuthSessionModel: { query: sessionQuery },
    TenantMembershipModel: {},
    TenantModel: {},
    UserModel: { query: () => ({ findById() { return this; }, withGraphFetched() { return this; }, first: async () => user }) },
    AuthService: { hasPermission: () => false, isSovereignAntiBypass: () => false },
  },
  "../env.js": { env: { NODE_ENV: "test", CORS_ORIGIN: "http://localhost" } },
};
const authExports = {};
new Function("require", "exports", compiled)((specifier) => {
  assert.ok(dependencies[specifier], `Unexpected auth dependency: ${specifier}`);
  return dependencies[specifier];
}, authExports);

function reply() {
  return {
    statusCode: 200,
    headers: {},
    code(statusCode) { this.statusCode = statusCode; return this; },
    send(body) { this.body = body; return this; },
    header(name, value) { this.headers[name] = value; return this; },
  };
}

function makeSession(overrides = {}) {
  return {
    id: "session-1",
    tokenHash: hash(rawToken),
    userId: user.id,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  };
}

test("session guard enforces token hash, revocation, expiry, and active user", async () => {
  queryTrace.length = 0;
  sessions = [makeSession({ tokenHash: hash("different-token") })];
  let response = reply();
  await authExports.requireSession({ method: "GET", headers: { authorization: `Bearer ${rawToken}` } }, response);
  assert.equal(response.statusCode, 401, "a token must match its stored hash");

  sessions = [makeSession({ revokedAt: new Date().toISOString() })];
  response = reply();
  await authExports.requireSession({ method: "GET", headers: { authorization: `Bearer ${rawToken}` } }, response);
  assert.equal(response.statusCode, 401, "revoked sessions must be rejected");

  sessions = [makeSession({ expiresAt: new Date(Date.now() - 60_000).toISOString() })];
  response = reply();
  await authExports.requireSession({ method: "GET", headers: { authorization: `Bearer ${rawToken}` } }, response);
  assert.equal(response.statusCode, 401, "expired sessions must be rejected");

  sessions = [makeSession()];
  user = { id: "operator-1", status: "inactive", roles: [] };
  response = reply();
  await authExports.requireSession({ method: "GET", headers: { authorization: `Bearer ${rawToken}` } }, response);
  assert.equal(response.statusCode, 401, "sessions for inactive users must be rejected");
  assert.ok(queryTrace.every((predicates) => predicates.some(([column]) => column === "token_hash")));
  assert.ok(queryTrace.every((predicates) => predicates.some(([column, operator]) => column === "revoked_at" && operator === "null")));
  assert.ok(queryTrace.every((predicates) => predicates.some(([column, operator]) => column === "expires_at" && operator === ">")));
});

test("an expired remember cookie is cleared when its session is rejected", async () => {
  user = { id: "operator-1", status: "active", roles: [] };
  sessions = [makeSession({ expiresAt: new Date(Date.now() - 60_000).toISOString() })];
  const response = reply();
  await authExports.requireSession({ method: "GET", headers: { cookie: `empire_remember=${rawToken}` } }, response);
  assert.equal(response.statusCode, 401);
  assert.equal(response.headers["set-cookie"], "empire_remember=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
});
