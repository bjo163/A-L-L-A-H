import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/routes/auth.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const operator = {
  id: "test-operator", username: "operator", displayName: "Disposable Operator", status: "active",
  tier: "operator", sovereign: false, celestial: false, passwordHash: "stubbed-hash", roles: [],
};

function createAuth(envOverrides = {}, { user = operator, session = null } = {}) {
  const env = { NODE_ENV: "test", CORS_ORIGIN: "http://localhost", ...envOverrides };
  let insertedSession;
  if (session && !session.$query) session.$query = () => ({ patch: async (fields) => Object.assign(session, fields) });
  const query = (value, sessionQuery = false) => ({
    where(column, operator, expected) {
      if (!sessionQuery) return this;
      if (typeof column === "object") {
        for (const [key, target] of Object.entries(column)) {
          const field = ({ token_hash: "tokenHash", revoked_at: "revokedAt" })[key] ?? key;
          if (value?.[field] !== target) value = null;
        }
      } else {
        const field = ({ expires_at: "expiresAt" })[column] ?? column;
        if (operator === ">" && !(Date.parse(value?.[field] ?? "") > Date.parse(expected))) value = null;
      }
      return this;
    }, whereIn() { return this; },
    whereNull(column) { if (sessionQuery && value?.[({ revoked_at: "revokedAt" })[column] ?? column] != null) value = null; return this; }, select() { return this; },
    withGraphFetched() { return this; }, findById() { return this; },
    first: async () => value,
    insert: async (row) => { if (row.tokenHash) insertedSession = { id: "test-session", ...row }; return insertedSession ?? row; },
    then(resolve, reject) { return Promise.resolve(value ?? []).then(resolve, reject); },
    patch: async (fields) => { if (sessionQuery && value) Object.assign(value, fields); return 1; },
  });
  const dependencies = {
    "node:crypto": { createHash, randomBytes },
    "@empire/batteries-base": {
      AuditLogModel: { query: () => query([]) },
      AuthSessionModel: { query: () => query(session, true) },
      TenantMembershipModel: { query: () => query([]) },
      TenantModel: { query: () => query([]) },
      UserModel: { query: () => query(user) },
      AuthService: { hasPermission: () => false, isSovereignAntiBypass: () => false, verifyPassword: async (password) => password === "stubbed-password" },
    },
    "../env.js": { env },
  };
  const authExports = {};
  new Function("require", "exports", compiled)((specifier) => {
    assert.ok(dependencies[specifier], `Unexpected auth dependency: ${specifier}`);
    return dependencies[specifier];
  }, authExports);
  return { authExports, env, get insertedSession() { return insertedSession; } };
}

async function createApp(environment, options) {
  const auth = createAuth(environment, options);
  const app = Fastify({ logger: false });
  await app.register(rateLimit, { max: 600, timeWindow: "1 minute" });
  await auth.authExports.authRoutes(app);
  return { app, env: auth.env, authExports: auth.authExports, get insertedSession() { return auth.insertedSession; } };
}

test("login rate limit returns 429 after five attempts from one client", async () => {
  const { app } = await createApp({ NODE_ENV: "test" }, { user: null });
  try {
    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await app.inject({ method: "POST", url: "/auth/login", payload: { username: "unknown", password: "wrong" }, remoteAddress: "127.0.0.1" });
      statuses.push(response.statusCode);
      if (attempt < 5) assert.equal(response.json().message, "Username atau password tidak valid.");
    }
    assert.deepEqual(statuses, [401, 401, 401, 401, 401, 429]);
  } finally { await app.close(); }
});

test("remember cookies keep strict attributes and only become Secure in production", async () => {
  for (const [nodeEnv, secure] of [["production", true], ["development", false]]) {
    const created = await createApp({ NODE_ENV: nodeEnv });
    const { app } = created;
    try {
      const response = await app.inject({ method: "POST", url: "/auth/login", payload: { username: "operator", password: "stubbed-password", rememberMe: true } });
      const cookie = response.headers["set-cookie"];
      assert.equal(response.statusCode, 200);
      assert.doesNotMatch(response.body, /"token"/);
      assert.match(cookie, /^empire_remember=[A-Za-z0-9_-]+; Path=\/; HttpOnly; SameSite=Strict; Max-Age=2592000/);
      assert.equal(cookie.includes("; Secure"), secure);
      assert.ok(created.insertedSession);
      assert.equal(created.insertedSession.tokenHash, createHash("sha256").update(decodeURIComponent(cookie.split(";")[0].split("=")[1])).digest("hex"));
    } finally { await app.close(); }
  }
});

test("expired remember cookie clearing also includes Secure in production", async () => {
  const { authExports } = createAuth({ NODE_ENV: "production" }, { session: null });
  const reply = {
    statusCode: 200, headers: {},
    code(status) { this.statusCode = status; return this; },
    send(body) { this.body = body; return this; },
    header(name, value) { this.headers[name] = value; return this; },
  };
  await authExports.requireSession({ method: "GET", headers: { cookie: "empire_remember=expired-token" } }, reply);
  assert.equal(reply.statusCode, 401);
  assert.equal(reply.headers["set-cookie"], "empire_remember=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure");
});

test("expired and revoked sessions fail closed, and logout revokes the active session", async () => {
  const token = "valid-session-token";
  const baseSession = {
    id: "session-1", userId: operator.id, tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 60_000).toISOString(), revokedAt: null,
  };
  for (const invalidSession of [
    { ...baseSession, expiresAt: new Date(Date.now() - 60_000).toISOString() },
    { ...baseSession, revokedAt: new Date().toISOString() },
  ]) {
    const { authExports } = createAuth({}, { session: invalidSession });
    const denied = {
      statusCode: 200,
      code(statusCode) { this.statusCode = statusCode; return this; },
      send(body) { this.body = body; return this; },
      header() { return this; },
    };
    await authExports.requireSession({ method: "GET", headers: { authorization: `Bearer ${token}` } }, denied);
    assert.equal(denied.statusCode, 401);
  }

  const activeSession = { ...baseSession };
  const { app } = await createApp({}, { session: activeSession });
  try {
    const logout = await app.inject({ method: "POST", url: "/auth/logout", headers: { authorization: `Bearer ${token}` } });
    assert.equal(logout.statusCode, 200);
    assert.ok(activeSession.revokedAt);
    const refresh = await app.inject({ method: "GET", url: "/auth/session", headers: { authorization: `Bearer ${token}` } });
    assert.equal(refresh.statusCode, 401);
  } finally { await app.close(); }
});
