import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  AuditLogModel, DocumentModel, ProjectModel, ResearchRunModel, TaskModel, TenantMembershipModel, WorkspaceModel, YoutubeSentinelPartnerLinkModel,
} from "@empire/batteries-base";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant } from "./tenant-context.js";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const taskStatuses = ["todo", "in_progress", "blocked", "done", "cancelled"];
const priorities = ["low", "normal", "high", "urgent"];
const classifications = ["public", "internal", "confidential", "restricted"];
const text = (v: unknown, max = 10000) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const optionalText = (v: unknown, max = 10000) => v === null || v === undefined || typeof v === "string" && v.length <= max;
const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(v);
const object = (v: unknown) => v === undefined || v === null || typeof v === "object" && !Array.isArray(v);
const tenantId = (request: FastifyRequest) => request.tenantId!;
const invalid = (reply: import("fastify").FastifyReply, message = "Data work item tidak valid.") => reply.code(400).send({ status: "invalid_request", message });

async function audit(request: FastifyRequest, action: string, entity: string, entityId: string, payload: Record<string, unknown>) {
  await AuditLogModel.query().insert({ userId: request.authUser!.id, action, entity, entityId, payload: { ...payload, tenantId: tenantId(request) }, ipAddress: request.ip });
}

async function sameTenantWorkspace(id: unknown, tenant: string) {
  return uuid(id) ? WorkspaceModel.query().where({ id, tenant_id: tenant, status: "active" }).first() : null;
}
async function sameTenantProject(id: unknown, tenant: string) {
  return uuid(id) ? ProjectModel.query().where({ id, tenant_id: tenant }).first() : null;
}

export async function workRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requirePermission("work:read"));
  app.addHook("preHandler", requireTenant);

  app.get("/v1/workspaces", async (request) => {
    const q = request.query as { status?: string; page?: string; limit?: string };
    let rows = WorkspaceModel.query().where({ tenant_id: tenantId(request) }).orderBy("name", "asc");
    if (q.status === "active" || q.status === "archived") rows = rows.where({ status: q.status });
    return rows.paginate({ page: Math.max(1, Number(q.page) || 1), limit: Math.min(100, Math.max(1, Number(q.limit) || 20)) });
  });
  app.get("/v1/youtube-partner-links", async (request) => {
    const q = request.query as { page?: string; limit?: string };
    return YoutubeSentinelPartnerLinkModel.query().where({ tenant_id: tenantId(request) }).orderBy("created_at", "desc")
      .paginate({ page: Math.max(1, Number(q.page) || 1), limit: Math.min(100, Math.max(1, Number(q.limit) || 20)) });
  });
  app.post("/v1/workspaces", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !text(b.slug, 100) || !slugPattern.test(b.slug as string) || !text(b.name, 200) || !optionalText(b.description, 10000) || !object(b.metadata)) return invalid(reply);
    try {
      const workspace = await (WorkspaceModel.query() as any).insert({ tenantId: tenantId(request), createdBy: request.authUser!.id, slug: b.slug, name: (b.name as string).trim(), description: b.description ?? null, metadata: b.metadata ?? null });
      await audit(request, "WORKSPACE_CREATED", "workspace", workspace.id, { slug: workspace.slug });
      return reply.code(201).send(workspace);
    } catch (e) { if ((e as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "Slug workspace sudah digunakan tenant ini." }); throw e; }
  });
  app.get<{ Params: { id: string } }>("/v1/workspaces/:id", async (request, reply) => {
    const workspace = await WorkspaceModel.query().where({ id: request.params.id, tenant_id: tenantId(request) }).first();
    return workspace ?? reply.code(404).send({ status: "not_found", message: "Workspace tidak ditemukan." });
  });
  app.patch<{ Params: { id: string } }>("/v1/workspaces/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !Object.keys(b).length || Object.keys(b).some((k) => !["name", "description", "status", "metadata"].includes(k)) || b.name !== undefined && !text(b.name, 200) || !optionalText(b.description, 10000) || b.status !== undefined && !["active", "archived"].includes(b.status as string) || !object(b.metadata)) return invalid(reply);
    const workspace = await WorkspaceModel.query().where({ id: request.params.id, tenant_id: tenantId(request) }).first();
    if (!workspace) return reply.code(404).send({ status: "not_found", message: "Workspace tidak ditemukan." });
    const updated = await workspace.$query().patchAndFetch({ ...b, ...(typeof b.name === "string" ? { name: b.name.trim() } : {}) });
    await audit(request, "WORKSPACE_UPDATED", "workspace", workspace.id, { fields: Object.keys(b) });
    return updated;
  });

  app.get("/v1/projects", async (request) => {
    const query = request.query as { page?: string; limit?: string; status?: string; workspaceId?: string };
    let rows = ProjectModel.query().where({ tenant_id: tenantId(request) }).orderBy("name", "asc");
    if (query.workspaceId) rows = rows.where({ workspace_id: query.workspaceId });
    if (query.status === "active" || query.status === "archived") rows = rows.where({ status: query.status });
    return rows.paginate({ page: Math.max(1, Number(query.page) || 1), limit: Math.min(100, Math.max(1, Number(query.limit) || 20)) });
  });
  app.post("/v1/projects", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !uuid(b.workspaceId) || !text(b.slug, 100) || !slugPattern.test(b.slug as string) || !text(b.name, 200) || !optionalText(b.description, 10000) || !object(b.metadata)) return invalid(reply);
    const workspace = await sameTenantWorkspace(b.workspaceId, tenantId(request));
    if (!workspace) return invalid(reply, "Workspace harus berasal dari tenant aktif dan berstatus aktif.");
    try {
      const project = await (ProjectModel.query() as any).insert({ tenantId: tenantId(request), workspaceId: workspace.id, createdBy: request.authUser!.id, slug: b.slug, name: (b.name as string).trim(), description: b.description ?? null, metadata: b.metadata ?? null });
      await audit(request, "PROJECT_CREATED", "project", project.id, { slug: project.slug });
      return reply.code(201).send(project);
    } catch (e) { if ((e as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "Slug proyek sudah digunakan workspace ini." }); throw e; }
  });
  app.get<{ Params: { id: string } }>("/v1/projects/:id", async (request, reply) => {
    const project = await ProjectModel.query().where({ id: request.params.id, tenant_id: tenantId(request) }).first();
    return project ?? reply.code(404).send({ status: "not_found", message: "Project tidak ditemukan." });
  });
  app.patch<{ Params: { id: string } }>("/v1/projects/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !Object.keys(b).length || Object.keys(b).some((k) => !["name", "description", "status", "metadata"].includes(k)) || b.name !== undefined && !text(b.name, 200) || !optionalText(b.description, 10000) || b.status !== undefined && !["active", "archived"].includes(b.status as string) || !object(b.metadata)) return invalid(reply);
    const project = await ProjectModel.query().where({ id: request.params.id, tenant_id: tenantId(request) }).first();
    if (!project) return reply.code(404).send({ status: "not_found", message: "Project tidak ditemukan." });
    const updated = await (project.$query() as any).patchAndFetch({ ...b, ...(typeof b.name === "string" ? { name: b.name.trim() } : {}) });
    await audit(request, "PROJECT_UPDATED", "project", project.id, { fields: Object.keys(b) });
    return updated;
  });

  app.get("/v1/tasks", async (request) => {
    const q = request.query as { projectId?: string; status?: string; page?: string; limit?: string };
    let rows = TaskModel.query().where({ tenant_id: tenantId(request) }).orderBy("created_at", "desc");
    if (q.projectId) rows = rows.where({ project_id: q.projectId });
    if (taskStatuses.includes(q.status ?? "")) rows = rows.where({ status: q.status });
    return rows.paginate({ page: Math.max(1, Number(q.page) || 1), limit: Math.min(100, Math.max(1, Number(q.limit) || 20)) });
  });
  app.get<{ Params: { id: string } }>("/v1/tasks/:id", async (request, reply) => {
    const task = await TaskModel.query().where({ id: request.params.id, tenant_id: tenantId(request) }).first();
    return task ?? reply.code(404).send({ status: "not_found", message: "Task tidak ditemukan." });
  });
  app.post("/v1/tasks", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !uuid(b.projectId) || !text(b.title, 300) || !optionalText(b.description) || b.assignedTo !== undefined && b.assignedTo !== null && !uuid(b.assignedTo) || b.researchRunId !== undefined && b.researchRunId !== null && !uuid(b.researchRunId) || b.status !== undefined && !taskStatuses.includes(b.status as string) || b.priority !== undefined && !priorities.includes(b.priority as string) || b.dueAt !== undefined && b.dueAt !== null && !Number.isFinite(Date.parse(b.dueAt as string)) || !object(b.metadata)) return invalid(reply);
    const project = await sameTenantProject(b.projectId, tenantId(request));
    if (!project) return invalid(reply, "Project harus berasal dari tenant aktif.");
    if (b.assignedTo) { const m = await TenantMembershipModel.query().where({ tenant_id: tenantId(request), user_id: b.assignedTo as string, status: "active" }).first(); if (!m) return invalid(reply, "Penerima tugas harus menjadi anggota aktif tenant ini."); }
    if (b.researchRunId) { const run = await ResearchRunModel.query().where({ id: b.researchRunId as string, tenant_id: tenantId(request) }).first(); if (!run) return invalid(reply, "Research run harus berasal dari tenant aktif."); }
    const task = await (TaskModel.query() as any).insert({ tenantId: tenantId(request), projectId: project.id, createdBy: request.authUser!.id, assignedTo: b.assignedTo ?? null, researchRunId: b.researchRunId ?? null, title: (b.title as string).trim(), description: b.description ?? null, status: b.status ?? "todo", priority: b.priority ?? "normal", dueAt: b.dueAt ?? null, metadata: b.metadata ?? null });
    await audit(request, "TASK_CREATED", "task", task.id, { projectId: task.projectId });
    return reply.code(201).send(task);
  });
  app.patch<{ Params: { id: string } }>("/v1/tasks/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    const allowed = ["title", "description", "assignedTo", "researchRunId", "status", "priority", "dueAt", "metadata"];
    if (!b || !Object.keys(b).length || Object.keys(b).some((k) => !allowed.includes(k)) || b.title !== undefined && !text(b.title, 300) || !optionalText(b.description) || b.assignedTo !== undefined && b.assignedTo !== null && !uuid(b.assignedTo) || b.researchRunId !== undefined && b.researchRunId !== null && !uuid(b.researchRunId) || b.status !== undefined && !taskStatuses.includes(b.status as string) || b.priority !== undefined && !priorities.includes(b.priority as string) || b.dueAt !== undefined && b.dueAt !== null && !Number.isFinite(Date.parse(b.dueAt as string)) || !object(b.metadata)) return invalid(reply);
    const task = await TaskModel.query().where({ id: request.params.id, tenant_id: tenantId(request) }).first();
    if (!task) return reply.code(404).send({ status: "not_found", message: "Task tidak ditemukan." });
    if (b.assignedTo) { const m = await TenantMembershipModel.query().where({ tenant_id: tenantId(request), user_id: b.assignedTo as string, status: "active" }).first(); if (!m) return invalid(reply, "Penerima tugas harus menjadi anggota aktif tenant ini."); }
    if (b.researchRunId) { const run = await ResearchRunModel.query().where({ id: b.researchRunId as string, tenant_id: tenantId(request) }).first(); if (!run) return invalid(reply, "Research run harus berasal dari tenant aktif."); }
    const updated = await (task.$query() as any).patchAndFetch({ ...b, ...(b.title ? { title: (b.title as string).trim() } : {}), ...(b.status === "done" ? { completedAt: new Date().toISOString() } : b.status ? { completedAt: null } : {}) });
    await audit(request, "TASK_UPDATED", "task", task.id, { fields: Object.keys(b) });
    return updated;
  });

  app.get("/v1/documents", async (request) => {
    const q = request.query as { projectId?: string; taskId?: string; page?: string; limit?: string };
    let rows = DocumentModel.query().where({ tenant_id: tenantId(request), status: "active" }).orderBy("created_at", "desc");
    if (q.projectId) rows = rows.where({ project_id: q.projectId });
    if (q.taskId) rows = rows.where({ task_id: q.taskId });
    return rows.paginate({ page: Math.max(1, Number(q.page) || 1), limit: Math.min(100, Math.max(1, Number(q.limit) || 20)) });
  });
  app.post("/v1/documents", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !uuid(b.projectId) || !text(b.title, 300) || !text(b.fileName, 500) || !text(b.storageProvider, 100) || !text(b.storageKey, 2000) || !text(b.mediaType, 200) || !Number.isSafeInteger(b.sizeBytes) || (b.sizeBytes as number) < 0 || typeof b.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(b.sha256) || b.taskId !== undefined && b.taskId !== null && !uuid(b.taskId) || b.researchRunId !== undefined && b.researchRunId !== null && !uuid(b.researchRunId) || b.classification !== undefined && !classifications.includes(b.classification as string) || !optionalText(b.license, 500) || !object(b.provenance)) return invalid(reply);
    const project = await sameTenantProject(b.projectId, tenantId(request));
    if (!project) return invalid(reply, "Project harus berasal dari tenant aktif.");
    if (b.taskId) { const task = await TaskModel.query().where({ id: b.taskId as string, project_id: project.id, tenant_id: tenantId(request) }).first(); if (!task) return invalid(reply, "Task harus berada di project yang dipilih."); }
    if (b.researchRunId) { const run = await ResearchRunModel.query().where({ id: b.researchRunId as string, tenant_id: tenantId(request) }).first(); if (!run) return invalid(reply, "Research run harus berasal dari tenant aktif."); }
    const doc = await (DocumentModel.query() as any).insert({ tenantId: tenantId(request), projectId: project.id, taskId: b.taskId ?? null, researchRunId: b.researchRunId ?? null, uploadedBy: request.authUser!.id, title: (b.title as string).trim(), fileName: b.fileName, storageProvider: b.storageProvider, storageKey: b.storageKey, mediaType: b.mediaType, sizeBytes: b.sizeBytes, sha256: (b.sha256 as string).toLowerCase(), classification: b.classification ?? "internal", license: b.license ?? null, provenance: b.provenance ?? null });
    await audit(request, "DOCUMENT_REGISTERED", "document", doc.id, { projectId: doc.projectId, sizeBytes: doc.sizeBytes });
    return reply.code(201).send(doc);
  });
  app.get<{ Params: { id: string } }>("/v1/documents/:id", async (request, reply) => {
    const doc = await DocumentModel.query().where({ id: request.params.id, tenant_id: tenantId(request), status: "active" }).first();
    return doc ?? reply.code(404).send({ status: "not_found", message: "Document tidak ditemukan." });
  });
  app.delete<{ Params: { id: string } }>("/v1/documents/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const doc = await DocumentModel.query().where({ id: request.params.id, tenant_id: tenantId(request), status: "active" }).first();
    if (!doc) return reply.code(404).send({ status: "not_found", message: "Document tidak ditemukan." });
    await (doc.$query() as any).patch({ status: "archived" });
    await audit(request, "DOCUMENT_ARCHIVED", "document", doc.id, {});
    return { status: "archived", id: doc.id };
  });
}
