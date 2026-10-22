import type { FastifyInstance, FastifyRequest } from "fastify";
import { AuditLogModel, CommentModel, DocumentModel, NotificationModel, NotificationOutboxModel, PartnerModel, ProjectModel, TagAssignmentModel, TagModel, TaskModel, WorkspaceModel } from "@empire/batteries-base";
import { getDatabase } from "@empire/batteries";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant } from "./tenant-context.js";

const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
const tenant = (request: FastifyRequest) => request.tenantId!;
const allowedTypes = new Set(["workspace", "project", "task", "document", "partner"]);

async function targetExists(type: string, id: string, tenantId: string) {
  if (!allowedTypes.has(type)) return false;
  const model = ({ workspace: WorkspaceModel, project: ProjectModel, task: TaskModel, document: DocumentModel, partner: PartnerModel } as const)[type as "workspace"];
  return Boolean(await model.query().where({ id, tenant_id: tenantId }).first());
}

async function appendCollaborationEvent(trx: import("knex").Knex.Transaction, request: FastifyRequest, event: {
  action: string; entity: string; entityId: string; eventType: string; title: string; body: string; actionUrl?: string | null;
  recipientUserIds?: string[]; metadata?: Record<string, unknown>;
}) {
  const tenantId = tenant(request);
  await AuditLogModel.query(trx).insert({ userId: request.authUser!.id, action: event.action, entity: event.entity, entityId: event.entityId, payload: { tenantId, ...(event.metadata ?? {}) }, ipAddress: request.ip });
  await NotificationOutboxModel.query(trx).insert({
    tenantId, eventType: event.eventType, aggregateType: event.entity, aggregateId: event.entityId,
    idempotencyKey: `${event.eventType}:${event.entityId}`,
    payload: { title: event.title, body: event.body, actionUrl: event.actionUrl ?? null, recipientUserIds: event.recipientUserIds ?? [], metadata: event.metadata ?? {} },
    status: "pending", attempts: 0, availableAt: new Date().toISOString(),
  });
}

export async function collaborationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requirePermission("work:read"));
  app.addHook("preHandler", requireTenant);

  app.get("/v1/activity", async (request) => {
    const q = request.query as { limit?: string; before?: string };
    let query = AuditLogModel.query().whereRaw("payload ->> 'tenantId' = ?", [tenant(request)]).orderBy("created_at", "desc").limit(Math.min(100, Math.max(1, Number(q.limit) || 30)));
    if (q.before && Number.isFinite(Date.parse(q.before))) query = query.where("created_at", "<", new Date(q.before).toISOString());
    return { items: await query };
  });

  app.get("/v1/comments", async (request, reply) => {
    const q = request.query as { entityType?: string; entityId?: string };
    if (!q.entityType || !uuid(q.entityId) || !await targetExists(q.entityType, q.entityId, tenant(request))) return reply.code(404).send({ status: "not_found", message: "Record tenant tidak ditemukan." });
    const items = await CommentModel.query().where({ tenant_id: tenant(request), entity_type: q.entityType, entity_id: q.entityId, status: "active" }).orderBy("created_at", "asc").limit(200);
    return { items };
  });
  app.post("/v1/comments", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    if (!body || typeof body.entityType !== "string" || !uuid(body.entityId) || typeof body.body !== "string" || !body.body.trim() || body.body.length > 10000 || body.parentId !== undefined && body.parentId !== null && !uuid(body.parentId)) return reply.code(400).send({ status: "invalid_request", message: "Data komentar tidak valid." });
    const commentBody = body.body as string;
    const tenantId = tenant(request);
    if (!await targetExists(body.entityType, body.entityId, tenantId)) return reply.code(404).send({ status: "not_found", message: "Record tenant tidak ditemukan." });
    if (body.parentId) {
      const parent = await CommentModel.query().where({ id: body.parentId, tenant_id: tenantId, entity_type: body.entityType, entity_id: body.entityId, status: "active" }).first();
      if (!parent) return reply.code(400).send({ status: "invalid_request", message: "Balasan harus mengarah ke komentar aktif pada record yang sama." });
    }
    const database = getDatabase();
    const comment = await database.transaction(async (trx) => {
      const inserted = await (CommentModel.query(trx) as any).insert({ tenantId, entityType: body.entityType, entityId: body.entityId, authorId: request.authUser!.id, parentId: body.parentId ?? null, body: commentBody.trim() });
      const ownerIds = body.entityType === "task"
        ? (await TaskModel.query(trx).where({ id: body.entityId, tenant_id: tenantId }).select("created_by", "assigned_to").first())
        : body.entityType === "project" ? await ProjectModel.query(trx).where({ id: body.entityId, tenant_id: tenantId }).select("created_by").first()
          : body.entityType === "workspace" ? await WorkspaceModel.query(trx).where({ id: body.entityId, tenant_id: tenantId }).select("created_by").first()
            : body.entityType === "document" ? await DocumentModel.query(trx).where({ id: body.entityId, tenant_id: tenantId }).select("uploaded_by").first()
              : body.entityType === "partner" ? await PartnerModel.query(trx).where({ id: body.entityId, tenant_id: tenantId }).select("user_id").first() : null;
      const recipients = ownerIds
        ? ["createdBy" in ownerIds ? ownerIds.createdBy : null, "assignedTo" in ownerIds ? ownerIds.assignedTo : null, "uploadedBy" in ownerIds ? ownerIds.uploadedBy : null, "userId" in ownerIds ? ownerIds.userId : null].filter((id): id is string => typeof id === "string" && id !== request.authUser!.id)
        : [];
      await appendCollaborationEvent(trx, request, { action: "COMMENT_CREATED", entity: "comment", entityId: inserted.id, eventType: "comment.created", title: "Komentar baru", body: inserted.body, recipientUserIds: recipients, metadata: { entityType: body.entityType, entityId: body.entityId } });
      return inserted;
    });
    return reply.code(201).send(comment);
  });
  app.patch<{ Params: { id: string } }>("/v1/comments/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const body = request.body as { body?: unknown };
    const comment = await CommentModel.query().where({ id: request.params.id, tenant_id: tenant(request), status: "active" }).first();
    if (!comment) return reply.code(404).send({ status: "not_found", message: "Komentar tidak ditemukan." });
    if (comment.authorId !== request.authUser!.id && !request.authUser!.sovereign) return reply.code(403).send({ status: "forbidden", message: "Hanya penulis komentar yang dapat mengubahnya." });
    if (typeof body?.body !== "string" || !body.body.trim() || body.body.length > 10000) return reply.code(400).send({ status: "invalid_request", message: "Isi komentar tidak valid." });
    const updatedBody = body.body as string;
    const db = getDatabase();
    return db.transaction(async (trx) => {
      const updated = await (comment.$query(trx) as any).patchAndFetch({ body: updatedBody.trim(), editedAt: new Date().toISOString() });
      await AuditLogModel.query(trx).insert({ userId: request.authUser!.id, action: "COMMENT_UPDATED", entity: "comment", entityId: comment.id, payload: { tenantId: tenant(request) }, ipAddress: request.ip });
      return updated;
    });
  });
  app.delete<{ Params: { id: string } }>("/v1/comments/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const comment = await CommentModel.query().where({ id: request.params.id, tenant_id: tenant(request), status: "active" }).first();
    if (!comment) return reply.code(404).send({ status: "not_found", message: "Komentar tidak ditemukan." });
    if (comment.authorId !== request.authUser!.id && !request.authUser!.sovereign) return reply.code(403).send({ status: "forbidden", message: "Hanya penulis komentar atau administrator yang dapat menghapusnya." });
    const db = getDatabase();
    await db.transaction(async (trx) => {
      await (comment.$query(trx) as any).patch({ status: "deleted", body: "[deleted]" });
      await AuditLogModel.query(trx).insert({ userId: request.authUser!.id, action: "COMMENT_DELETED", entity: "comment", entityId: comment.id, payload: { tenantId: tenant(request) }, ipAddress: request.ip });
    });
    return { status: "deleted", id: comment.id };
  });

  app.get("/v1/tags", async (request) => ({ items: await TagModel.query().where({ tenant_id: tenant(request) }).orderBy("name", "asc").limit(500) }));
  app.post("/v1/tags", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    if (!body || typeof body.name !== "string" || !body.name.trim() || body.name.length > 100 || body.color !== undefined && body.color !== null && (typeof body.color !== "string" || !/^#[0-9a-f]{6}$/i.test(body.color)) || body.description !== undefined && body.description !== null && (typeof body.description !== "string" || body.description.length > 1000)) return reply.code(400).send({ status: "invalid_request", message: "Data label tidak valid." });
    const tagName = body.name as string;
    const slug = typeof body.slug === "string" ? body.slug : tagName.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return reply.code(400).send({ status: "invalid_request", message: "Slug label tidak valid." });
    try {
      const db = getDatabase();
      const tag = await db.transaction(async (trx) => {
        const inserted = await (TagModel.query(trx) as any).insert({ tenantId: tenant(request), slug, name: tagName.trim(), color: body.color ?? null, description: body.description ?? null });
        await (AuditLogModel.query(trx) as any).insert({ userId: request.authUser!.id, action: "TAG_CREATED", entity: "tag", entityId: inserted.id, payload: { tenantId: tenant(request), slug }, ipAddress: request.ip });
        return inserted;
      });
      return reply.code(201).send(tag);
    }
    catch (error) { if ((error as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "Slug label sudah digunakan." }); throw error; }
  });
  app.get("/v1/tag-assignments", async (request, reply) => {
    const q = request.query as { entityType?: string; entityId?: string };
    if (!q.entityType || !uuid(q.entityId) || !await targetExists(q.entityType, q.entityId, tenant(request))) return reply.code(404).send({ status: "not_found", message: "Record tenant tidak ditemukan." });
    return { items: await TagAssignmentModel.query().where({ tenant_id: tenant(request), entity_type: q.entityType, entity_id: q.entityId }).limit(100) };
  });
  app.post("/v1/tag-assignments", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const body = request.body as { tagId?: unknown; entityType?: unknown; entityId?: unknown };
    if (!uuid(body?.tagId) || typeof body.entityType !== "string" || !uuid(body.entityId) || !await targetExists(body.entityType, body.entityId, tenant(request))) return reply.code(400).send({ status: "invalid_request", message: "Target label tidak valid." });
    const tag = await TagModel.query().where({ id: body.tagId, tenant_id: tenant(request) }).first();
    if (!tag) return reply.code(404).send({ status: "not_found", message: "Label tidak ditemukan." });
    try {
      const db = getDatabase();
      const row = await db.transaction(async (trx) => {
        const assignment = await (TagAssignmentModel.query(trx) as any).insert({ tenantId: tenant(request), tagId: tag.id, entityType: body.entityType, entityId: body.entityId, assignedBy: request.authUser!.id });
        await (AuditLogModel.query(trx) as any).insert({ userId: request.authUser!.id, action: "TAG_ASSIGNED", entity: body.entityType, entityId: body.entityId, payload: { tenantId: tenant(request), tagId: tag.id }, ipAddress: request.ip });
        return assignment;
      });
      return reply.code(201).send(row);
    } catch (error) { if ((error as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "Label sudah dipasang." }); throw error; }
  });
  app.delete<{ Params: { id: string } }>("/v1/tag-assignments/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const row = await TagAssignmentModel.query().where({ id: request.params.id, tenant_id: tenant(request) }).first();
    if (!row) return reply.code(404).send({ status: "not_found", message: "Label tidak ditemukan pada tenant ini." });
    const db = getDatabase();
    await db.transaction(async (trx) => {
      await row.$query(trx).delete();
      await (AuditLogModel.query(trx) as any).insert({ userId: request.authUser!.id, action: "TAG_REMOVED", entity: row.entityType, entityId: row.entityId, payload: { tenantId: tenant(request), tagId: row.tagId }, ipAddress: request.ip });
    });
    return { status: "removed", id: row.id };
  });

  app.get("/v1/notifications", async (request) => {
    const q = request.query as { unread?: string };
    let rows = NotificationModel.query().where({ tenant_id: tenant(request), user_id: request.authUser!.id }).orderBy("created_at", "desc").limit(100);
    if (q.unread === "true") rows = rows.whereNull("read_at");
    return { items: await rows };
  });
  app.patch<{ Params: { id: string } }>("/v1/notifications/:id/read", async (request, reply) => {
    const row = await NotificationModel.query().where({ id: request.params.id, tenant_id: tenant(request), user_id: request.authUser!.id }).first();
    if (!row) return reply.code(404).send({ status: "not_found", message: "Notifikasi tidak ditemukan." });
    if (!row.readAt) await (row.$query() as any).patch({ readAt: new Date().toISOString() });
    return { status: "read", id: row.id };
  });
}
