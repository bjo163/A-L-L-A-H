import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/routes/auth.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

let lookupUser = null;
let insertedSession = null;
const insertedAudit = [];
const defaultUser = {
  id: "operator-1",
  username: "operator",
  displayName: "Operator",
  status: "active",
  tier: "operator",
  sovereign: false,
  celestial: false,
  passwordHash: "password-hash",
  roles: [{ name: "Operator", slug: "operator", permissions: [] }],
};

function queryFor(value) {
  return {
    where() { return this; },
    whereIn() { return this; },
    select() { return this; },
    withGraphFetched() { return this; },
    first: async () => value,
    insert: async (row) => {
      if (row.tokenHash) {
        insertedSession = { id: "session-1", ...row };
        return insertedSession;
      }
      insertedAudit.push(row);
      return row;
    },
    then(resolve, reject) { return Promise.resolve(value ?? []).then(resolve, reject); },
  };
}

const dependencies = {
  "node:crypto": { createHash, randomBytes },
  "@empire/batteries-base": {
    AuditLogModel: { query: () => queryFor([]) },
    AuthSessionModel: { query: () => queryFor([]) },
    TenantMembershipModel: { query: () => queryFor([]) },
    TenantModel: { query: () => queryFor([]) },
    UserModel: { query: () => queryFor(lookupUser) },
    AuthService: {
      hasPermission: () => false,
      isSovereignAntiBypass: () => false,
      verifyPassword: async (password) => password === "correct-password",
    },
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
    body: undefined,
    headers: {},
    code(statusCode) { this.statusCode = statusCode; return this; },
    status(statusCode) { this.statusCode = statusCode; return this; },
    send(body) { this.body = body; return this; },
    header(name, value) { this.headers[name] = value; return this; },
  };
}

async function login(body) {
  let handler;
  let options;
  await authExports.authRoutes({
    post(path, routeOptions, routeHandler) {
      if (path === "/auth/login") { options = routeOptions; handler = routeHandler; }
    },
    get() {},
  });
  const response = reply();
  const result = await handler({ body, ip: "127.0.0.1" }, response);
  if (response.body === undefined) response.body = result;
  return { response, options };
}

test("login hides account state behind one generic credential failure", async () => {
  lookupUser = null;
  const unknown = await login({ username: "missing", password: "wrong" });
  lookupUser = { ...defaultUser, status: "inactive" };
  const inactive = await login({ username: "operator", password: "correct-password" });
  lookupUser = defaultUser;
  const badPassword = await login({ username: "operator", password: "wrong" });

  for (const result of [unknown, inactive, badPassword]) {
    assert.equal(result.response.statusCode, 401);
    assert.deepEqual(result.response.body, {
      status: "unauthorized",
      message: "Username atau password tidak valid.",
    });
  }
  assert.deepEqual(unknown.response.body, inactive.response.body);
  assert.deepEqual(inactive.response.body, badPassword.response.body);
});

test("remember login stores only a token hash and sends a strict HttpOnly cookie", async () => {
  lookupUser = defaultUser;
  insertedSession = null;
  const { response, options } = await login({
    username: "operator",
    password: "correct-password",
    rememberMe: true,
  });

  assert.equal(options.config.rateLimit.max, 5);
  assert.equal(options.config.rateLimit.timeWindow, "1 minute");
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "authenticated");
  assert.equal("token" in response.body, false);
  assert.match(response.headers["set-cookie"], /^empire_remember=[A-Za-z0-9_-]+; Path=\/; HttpOnly; SameSite=Strict; Max-Age=2592000$/);
  assert.ok(insertedSession);
  assert.match(insertedSession.tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(insertedSession.tokenHash, createHash("sha256").update(decodeURIComponent(response.headers["set-cookie"].split(";")[0].split("=")[1])).digest("hex"));
  assert.equal(Date.parse(insertedSession.expiresAt) - Date.now() > 29 * 24 * 60 * 60 * 1000, true);
  assert.equal(insertedAudit.some((entry) => entry.action === "LOGIN"), true);
});
