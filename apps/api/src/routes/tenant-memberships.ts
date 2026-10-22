import type { FastifyInstance } from "fastify";
import { AuditLogModel, TenantMembershipModel, UserModel } from "@empire/batteries-base";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant } from "./tenant-context.js";

const roles = ["operator", "system", "member"];
export async function tenantMembershipRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requirePermission("users:manage"));
  app.addHook("preHandler", requireTenant);

  app.get("/v1/tenant-memberships", async (request) => TenantMembershipModel.query()
    .where({ tenant_id: request.tenantId! }).orderBy("created_at", "asc"));

  app.post("/v1/tenant-memberships", async (request, reply) => {
    const body = request.body as { userId?: unknown; role?: unknown };
    if (!body || typeof body.userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(body.userId) || body.role !== undefined && !roles.includes(body.role as string))
      return reply.code(400).send({ status: "invalid_request", message: "userId atau role tidak valid." });
    const user = await UserModel.query().where({ id: body.userId, status: "active" }).first();
    if (!user) return reply.code(404).send({ status: "not_found", message: "Akun aktif tidak ditemukan." });
    try {
      const membership = await (TenantMembershipModel.query() as any).insert({ tenantId: request.tenantId!, userId: user.id, role: body.role ?? "member", status: "active" });
      await AuditLogModel.query().insert({ userId: request.authUser!.id, action: "TENANT_MEMBER_ADDED", entity: "tenant_membership", entityId: membership.id, payload: { userId: user.id, role: membership.role, tenantId: request.tenantId }, ipAddress: request.ip });
      return reply.code(201).send(membership);
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "Akun sudah memiliki keanggotaan tenant ini." });
      throw error;
    }
  });

  app.patch<{ Params: { id: string } }>("/v1/tenant-memberships/:id", async (request, reply) => {
    const body = request.body as { role?: unknown; status?: unknown };
    if (!body || Object.keys(body).length === 0 || Object.keys(body).some((key) => !["role", "status"].includes(key)) || body.role !== undefined && !roles.includes(body.role as string) || body.status !== undefined && !["active", "suspended"].includes(body.status as string))
      return reply.code(400).send({ status: "invalid_request", message: "Perubahan keanggotaan tidak valid." });
    const membership = await TenantMembershipModel.query().where({ id: request.params.id, tenant_id: request.tenantId! }).first();
    if (!membership) return reply.code(404).send({ status: "not_found", message: "Keanggotaan tidak ditemukan." });
    if (membership.userId === request.authUser!.id && body.status === "suspended") return reply.code(409).send({ status: "conflict", message: "Akun tidak dapat menangguhkan keanggotaannya sendiri." });
    const updated = await (membership.$query() as any).patchAndFetch(body);
    await AuditLogModel.query().insert({ userId: request.authUser!.id, action: "TENANT_MEMBER_UPDATED", entity: "tenant_membership", entityId: membership.id, payload: { userId: membership.userId, ...body, tenantId: request.tenantId }, ipAddress: request.ip });
    return updated;
  });
}
