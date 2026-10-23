import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/routes/tenant-context.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

let memberships = [];
function query() {
  const builder = {
    where(criteria) {
      if (criteria.user_id) memberships = memberships.filter((row) => row.user_id === criteria.user_id);
      if (criteria.status) memberships = memberships.filter((row) => row.status === criteria.status);
      if (criteria.tenant_id) memberships = memberships.filter((row) => row.tenant_id === criteria.tenant_id);
      return this;
    },
    select() { return this; },
    limit(count) { this.count = count; return this; },
    then(resolve, reject) { return Promise.resolve(memberships.slice(0, this.count ?? memberships.length)).then(resolve, reject); },
  };
  return builder;
}

const dependencies = { "@empire/batteries-base": { TenantMembershipModel: { query } } };
const exports = {};
new Function("require", "exports", compiled)((specifier) => dependencies[specifier], exports);
const user = { authUser: { id: "operator-a" } };
const tenantA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test("tenant resolution requires an active membership and explicit selection for multiple tenants", async () => {
  memberships = [
    { user_id: "operator-a", tenant_id: tenantA, status: "active" },
    { user_id: "operator-a", tenant_id: tenantB, status: "active" },
  ];
  assert.deepEqual(await exports.resolveRequestTenant({ ...user, headers: {} }), { error: "selection" });
  assert.deepEqual(await exports.resolveRequestTenant({ ...user, headers: { "x-tenant-id": tenantA } }), { tenantId: tenantA });
  assert.deepEqual(await exports.resolveRequestTenant({ ...user, headers: { "x-tenant-id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc" } }), { error: "membership" });
});

test("malformed or repeated tenant headers are rejected before querying", async () => {
  memberships = [{ user_id: "operator-a", tenant_id: tenantA, status: "active" }];
  for (const invalid of ["aaaaaaaa-aaaaa-aaa-8aaa-aaaaaaaaaaaa", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaZ"]) {
    assert.deepEqual(await exports.resolveRequestTenant({ ...user, headers: { "x-tenant-id": invalid } }), { error: "invalid" });
  }
  assert.deepEqual(await exports.resolveRequestTenant({ ...user, headers: { "x-tenant-id": [tenantA, tenantB] } }), { error: "invalid" });
});

test("inactive memberships and missing operator identity never resolve a tenant", async () => {
  memberships = [{ user_id: "operator-a", tenant_id: tenantA, status: "inactive" }];
  assert.deepEqual(await exports.resolveRequestTenant({ ...user, headers: {} }), { error: "membership" });
  assert.deepEqual(await exports.resolveRequestTenant({ headers: {} }), { error: "membership" });
});
