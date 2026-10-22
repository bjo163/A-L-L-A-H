import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PartnerModel, TenantMembershipModel } from "@empire/batteries-base";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant } from "./tenant-context.js";

const partnerTypes = ["contact", "invoice", "delivery", "other"] as const;
const writableFields = [
  "name", "companyName", "type", "isCompany", "parentId", "userId", "email", "phone", "mobile",
  "website", "street", "street2", "city", "state", "postalCode", "country", "vat", "function", "notes", "metadata",
] as const;
type PartnerInput = Partial<Record<(typeof writableFields)[number], unknown>>;

function parseInput(body: unknown, partial = false): { ok: true; value: Record<string, unknown> } | { ok: false } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false };
  const source = body as Record<string, unknown>;
  if (Object.keys(source).some((key) => !writableFields.includes(key as (typeof writableFields)[number]))) return { ok: false };
  if (!partial && (typeof source.name !== "string" || !source.name.trim())) return { ok: false };
  const value: Record<string, unknown> = {};
  for (const key of writableFields) {
    if (!(key in source)) continue;
    const item = source[key];
    if (key === "name" || key === "companyName" || key === "email" || key === "phone" || key === "mobile" || key === "website" || key === "street" || key === "street2" || key === "city" || key === "state" || key === "postalCode" || key === "country" || key === "vat" || key === "function" || key === "notes") {
      if (item !== null && typeof item !== "string") return { ok: false };
      if (typeof item === "string" && item.length > (key === "notes" ? 10000 : 500)) return { ok: false };
      value[key] = typeof item === "string" ? item.trim() || null : item;
    } else if (key === "type") {
      if (!partnerTypes.includes(item as (typeof partnerTypes)[number])) return { ok: false };
      value[key] = item;
    } else if (key === "isCompany") {
      if (typeof item !== "boolean") return { ok: false };
      value[key] = item;
    } else if (key === "parentId" || key === "userId") {
      if (item !== null && (typeof item !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(item))) return { ok: false };
      value[key] = item;
    } else if (key === "metadata") {
      if (item !== null && (typeof item !== "object" || Array.isArray(item))) return { ok: false };
      value[key] = item;
    }
  }
  if ("name" in value && (typeof value.name !== "string" || !value.name)) return { ok: false };
  return { ok: true, value };
}

async function validateLinks(value: Record<string, unknown>, tenantId: string, currentId?: string): Promise<string | null> {
  if (value.userId) {
    const membership = await TenantMembershipModel.query().where({ tenant_id: tenantId, user_id: value.userId as string, status: "active" }).first();
    if (!membership) return "User harus menjadi anggota aktif tenant ini sebelum ditautkan ke partner.";
    const existing = await PartnerModel.query().where({ tenant_id: tenantId, user_id: value.userId as string }).first();
    if (existing && existing.id !== currentId) return "User sudah terhubung ke partner lain.";
  }
  if (value.parentId) {
    if (value.parentId === currentId) return "Partner tidak dapat menjadi parent bagi dirinya sendiri.";
    const parent = await PartnerModel.query().where({ id: value.parentId as string, tenant_id: tenantId }).first();
    if (!parent) return "Partner induk tidak ditemukan.";
    if (currentId) {
      const partners = await PartnerModel.query().where({ tenant_id: tenantId }).select("id", "parent_id");
      const parentById = new Map(partners.map((item) => [item.id, item.parentId]));
      const visited = new Set<string>();
      let cursor: string | null = value.parentId as string;
      while (cursor) {
        if (cursor === currentId || visited.has(cursor)) return "Relasi parent tidak boleh membentuk siklus.";
        visited.add(cursor);
        cursor = parentById.get(cursor) ?? null;
      }
    }
  }
  return null;
}

function invalid(reply: FastifyReply) {
  return reply.code(400).send({ status: "invalid_request", message: "Data partner tidak valid." });
}

export async function partnerRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requirePermission("users:manage"));
  app.addHook("preHandler", requireTenant);

  app.get("/partners", async (request) => {
    const query = request.query as { page?: string; limit?: string; search?: string; type?: string; isCompany?: string; parentId?: string };
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    let partners = PartnerModel.query().where({ tenant_id: request.tenantId! }).withGraphFetched("user(selectProfile)").modifiers({
      selectProfile(builder) { builder.select("id", "username", "displayName", "email", "status"); },
    }).orderBy("name", "asc");
    if (query.search?.trim()) partners = partners.search(["name", "company_name", "email", "phone", "city"], query.search.trim());
    if (query.type && partnerTypes.includes(query.type as (typeof partnerTypes)[number])) partners = partners.where({ type: query.type });
    if (query.isCompany === "true" || query.isCompany === "false") partners = partners.where({ is_company: query.isCompany === "true" });
    if (query.parentId) partners = partners.where({ parent_id: query.parentId });
    return partners.paginate({ page, limit });
  });

  app.get<{ Params: { id: string } }>("/partners/:id", async (request, reply) => {
    const partner = await PartnerModel.query().where({ id: request.params.id, tenant_id: request.tenantId! }).withGraphFetched("user(selectProfile)").modifiers({
      selectProfile(builder) { builder.select("id", "username", "displayName", "email", "status"); },
    });
    if (!partner) return reply.code(404).send({ status: "not_found", message: "Partner tidak ditemukan." });
    return partner;
  });

  app.post("/partners", async (request, reply) => {
    const parsed = parseInput(request.body as PartnerInput);
    if (!parsed.ok) return invalid(reply);
    const linkError = await validateLinks(parsed.value, request.tenantId!);
    if (linkError) return reply.code(400).send({ status: "invalid_request", message: linkError });
    try {
      const partner = await PartnerModel.query().insert({ ...parsed.value, tenantId: request.tenantId! });
      return reply.code(201).send(partner);
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "Partner dengan user atau email tersebut sudah ada." });
      throw error;
    }
  });

  app.patch<{ Params: { id: string } }>("/partners/:id", async (request, reply) => {
    const parsed = parseInput(request.body as PartnerInput, true);
    if (!parsed.ok || Object.keys(parsed.value).length === 0) return invalid(reply);
    const existing = await PartnerModel.query().where({ id: request.params.id, tenant_id: request.tenantId! }).first();
    if (!existing) return reply.code(404).send({ status: "not_found", message: "Partner tidak ditemukan." });
    const linkError = await validateLinks(parsed.value, request.tenantId!, existing.id);
    if (linkError) return reply.code(400).send({ status: "invalid_request", message: linkError });
    try {
      return await existing.$query().patchAndFetch(parsed.value);
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "Partner dengan user atau email tersebut sudah ada." });
      throw error;
    }
  });

  app.delete<{ Params: { id: string } }>("/partners/:id", async (request, reply) => {
    const partner = await PartnerModel.query().where({ id: request.params.id, tenant_id: request.tenantId! }).first();
    if (!partner) return reply.code(404).send({ status: "not_found", message: "Partner tidak ditemukan." });
    await partner.softDelete();
    return { status: "archived", id: partner.id };
  });
}
