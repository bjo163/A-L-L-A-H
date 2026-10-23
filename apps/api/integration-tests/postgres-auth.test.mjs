import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import knexFactory from "knex";
import { createHash } from "node:crypto";

const inputUrl = process.env.DATABASE_URL;
if (process.env.GITHUB_ACTIONS !== "true" || process.env.EOL_AUTH_TEST_DATABASE !== "1" || !inputUrl) {
  throw new Error("PostgreSQL auth integration tests must run only in the dedicated GitHub Actions service job.");
}
const parsedUrl = new URL(inputUrl);
if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol) || !["127.0.0.1", "localhost"].includes(parsedUrl.hostname) || parsedUrl.pathname !== "/eol_auth_test") {
  throw new Error("Refusing auth integration tests outside the disposable eol_auth_test service database.");
}

const schemaName = `auth_it_${process.pid}_${Date.now()}`;
const admin = knexFactory({ client: "pg", connection: inputUrl, pool: { min: 0, max: 1 } });
await admin.raw("CREATE SCHEMA ??", [schemaName]);
parsedUrl.searchParams.set("options", `-c search_path=${schemaName}`);
process.env.DATABASE_URL = parsedUrl.toString();

const [{ initApiDatabase, closeDatabase }, { requireSession, requirePermission }, { resolveRequestTenant, requireTenant }] = await Promise.all([
  import("../src/db.js"),
  import("../src/routes/auth.js"),
  import("../src/routes/tenant-context.js"),
]);
const db = initApiDatabase();

const userA = "aaaaaaaa-0000-4000-8000-000000000001";
const userB = "bbbbbbbb-0000-4000-8000-000000000002";
const userInactive = "cccccccc-0000-4000-8000-000000000003";
const tenantA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const roleId = "dddddddd-0000-4000-8000-000000000004";
const permissionReadId = "eeeeeeee-0000-4000-8000-000000000005";
const permissionWriteId = "ffffffff-0000-4000-8000-000000000006";
const sessionActive = "11111111-0000-4111-8111-000000000011";
const sessionRevoked = "22222222-0000-4222-8222-000000000022";
const sessionExpired = "33333333-0000-4333-8333-000000000033";
const sessionInactiveUser = "44444444-0000-4444-8444-000000000044";
const token = (label) => `integration-${label}-token`;
const tokenHash = (value) => createHash("sha256").update(value).digest("hex");
const now = new Date().toISOString();

function reply() {
  return {
    statusCode: 200,
    body: undefined,
    code(statusCode) { this.statusCode = statusCode; return this; },
    send(body) { this.body = body; return this; },
  };
}

before(async () => {
  const tableStatements = [
    `CREATE TABLE users (
      id uuid PRIMARY KEY, username text NOT NULL, email text NOT NULL,
      password_hash text NOT NULL, display_name text NOT NULL, sovereign boolean NOT NULL DEFAULT false,
      celestial boolean NOT NULL DEFAULT false, tier text NOT NULL DEFAULT 'mortal', status text NOT NULL DEFAULT 'active',
      metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
    )`,
    `CREATE TABLE auth_sessions (
      id uuid PRIMARY KEY, user_id uuid NOT NULL, token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
      revoked_at timestamptz, ip_address text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
    )`,
    `CREATE TABLE tenants (
      id uuid PRIMARY KEY, slug text NOT NULL UNIQUE, display_name text NOT NULL, status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
    )`,
    `CREATE TABLE tenant_memberships (
      id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL, role text NOT NULL, status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
    )`,
    `CREATE TABLE roles (
      id uuid PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE, description text,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
    )`,
    `CREATE TABLE permissions (
      id uuid PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE, description text,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
    )`,
    `CREATE TABLE user_roles (
      id uuid PRIMARY KEY, user_id uuid NOT NULL, role_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
    )`,
    `CREATE TABLE role_permissions (
      id uuid PRIMARY KEY, role_id uuid NOT NULL, permission_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
    )`,
  ];
  for (const statement of tableStatements) await db.raw(statement);

  await db("users").insert([
    { id: userA, username: "operator-a", email: "operator-a@example.invalid", password_hash: "unused", display_name: "Operator A", status: "active", created_at: now, updated_at: now },
    { id: userB, username: "operator-b", email: "operator-b@example.invalid", password_hash: "unused", display_name: "Operator B", status: "active", created_at: now, updated_at: now },
    { id: userInactive, username: "operator-inactive", email: "inactive@example.invalid", password_hash: "unused", display_name: "Inactive", status: "inactive", created_at: now, updated_at: now },
  ]);
  await db("tenants").insert([
    { id: tenantA, slug: "tenant-a", display_name: "Tenant A", status: "active" },
    { id: tenantB, slug: "tenant-b", display_name: "Tenant B", status: "active" },
  ]);
  await db("tenant_memberships").insert([
    { id: "aaaaaaaa-1111-4111-8111-111111111111", tenant_id: tenantA, user_id: userA, role: "member", status: "active" },
    { id: "bbbbbbbb-2222-4222-8222-222222222222", tenant_id: tenantB, user_id: userB, role: "member", status: "active" },
  ]);
  await db("roles").insert({ id: roleId, name: "Reader", slug: "integration-reader", description: null });
  await db("permissions").insert([
    { id: permissionReadId, name: "Work read", slug: "work:read", description: null },
    { id: permissionWriteId, name: "Work write", slug: "work:write", description: null },
  ]);
  await db("user_roles").insert({ id: "cccccccc-1111-4111-8111-111111111111", user_id: userA, role_id: roleId });
  await db("role_permissions").insert({ id: "dddddddd-1111-4111-8111-111111111111", role_id: roleId, permission_id: permissionReadId });
  await db("auth_sessions").insert([
    { id: sessionActive, user_id: userA, token_hash: tokenHash(token("active")), expires_at: new Date(Date.now() + 60_000).toISOString() },
    { id: sessionRevoked, user_id: userA, token_hash: tokenHash(token("revoked")), expires_at: new Date(Date.now() + 60_000).toISOString(), revoked_at: now },
    { id: sessionExpired, user_id: userA, token_hash: tokenHash(token("expired")), expires_at: new Date(Date.now() - 60_000).toISOString() },
    { id: sessionInactiveUser, user_id: userInactive, token_hash: tokenHash(token("inactive-user")), expires_at: new Date(Date.now() + 60_000).toISOString() },
  ]);
});

after(async () => {
  await closeDatabase();
  await admin.raw("DROP SCHEMA IF EXISTS ?? CASCADE", [schemaName]);
  await admin.destroy();
});

test("PostgreSQL-backed session guard enforces hash, revoke, expiry, account status, and RBAC", async () => {
  const activeRequest = { method: "GET", headers: { authorization: `Bearer ${token("active")}` } };
  const activeReply = reply();
  await requireSession(activeRequest, activeReply);
  assert.equal(activeReply.statusCode, 200);
  assert.equal(activeRequest.authUser.id, userA);
  assert.equal(activeRequest.authSession.id, sessionActive);

  const readReply = reply();
  await requirePermission("work:read")(activeRequest, readReply);
  assert.equal(readReply.statusCode, 200);
  const writeReply = reply();
  await requirePermission("work:write")(activeRequest, writeReply);
  assert.equal(writeReply.statusCode, 403);

  for (const invalidToken of [token("revoked"), token("expired"), token("unknown"), token("inactive-user")]) {
    const response = reply();
    await requireSession({ method: "GET", headers: { authorization: `Bearer ${invalidToken}` } }, response);
    assert.equal(response.statusCode, 401, `${invalidToken} must be rejected`);
  }
});

test("PostgreSQL-backed tenant resolution denies a user from tenant A access to tenant B", async () => {
  const request = { method: "GET", headers: {}, authUser: { id: userA } };
  assert.deepEqual(await resolveRequestTenant(request), { tenantId: tenantA });
  assert.deepEqual(await resolveRequestTenant({ ...request, headers: { "x-tenant-id": tenantA } }), { tenantId: tenantA });
  assert.deepEqual(await resolveRequestTenant({ ...request, headers: { "x-tenant-id": tenantB } }), { error: "membership" });

  const response = reply();
  await requireTenant({ ...request, headers: { "x-tenant-id": tenantB } }, response);
  assert.equal(response.statusCode, 403);
});
