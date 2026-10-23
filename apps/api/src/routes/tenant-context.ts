import type { FastifyReply, FastifyRequest } from "fastify";
import type { Knex } from "knex";
import { TenantMembershipModel } from "@empire/batteries-base";

export type TenantResolution =
  | { tenantId: string }
  | { error: "membership" | "selection" | "invalid" };

/** A tenant is selected explicitly when a user belongs to more than one. */
export async function resolveRequestTenant(request: FastifyRequest, trx?: Knex.Transaction): Promise<TenantResolution> {
  const userId = request.authUser?.id;
  if (!userId) return { error: "membership" };
  const rawHeader = request.headers["x-tenant-id"];
  if (Array.isArray(rawHeader) && rawHeader.length !== 1) return { error: "invalid" };
  const selected = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (selected !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selected)) return { error: "invalid" };
  let memberships = TenantMembershipModel.query(trx)
    .where({ user_id: userId, status: "active" })
    .select("tenant_id")
    .limit(selected ? 1 : 2);
  if (selected) memberships = memberships.where({ tenant_id: selected });
  const rows = await memberships;
  if (selected) return rows.length ? { tenantId: selected } : { error: "membership" };
  if (!rows.length) return { error: "membership" };
  if (rows.length > 1) return { error: "selection" };
  return { tenantId: rows[0]!.tenantId };
}

export async function requireTenant(request: FastifyRequest, reply: FastifyReply) {
  const result = await resolveRequestTenant(request);
  if ("error" in result) {
    if (result.error === "selection") return reply.code(400).send({ status: "tenant_required", message: "Pilih tenant menggunakan header X-Tenant-Id." });
    if (result.error === "invalid") return reply.code(400).send({ status: "invalid_request", message: "Header X-Tenant-Id harus berupa UUID." });
    return reply.code(403).send({ status: "forbidden", message: "Keanggotaan tenant aktif diperlukan." });
  }
  request.tenantId = result.tenantId;
}
