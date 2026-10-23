import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  AuditLogModel,
  ResearchApprovalModel,
  ResearchEvidenceModel,
  ResearchJobModel,
  ResearchRunModel,
  ResearchWorkflowModel,
} from "@empire/batteries-base";
import { getDatabase } from "@empire/batteries";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant, resolveRequestTenant } from "./tenant-context.js";
import { researchEvidenceAuditPayload } from "./research-audit.js";
import { RESEARCH_CLASSIFICATIONS, RESEARCH_EVIDENCE_REQUEST_SCHEMA, RESEARCH_REQUEST_SCHEMAS, RESEARCH_SOURCE_FAMILIES } from "@empire/api-contract";

type ApprovalDecision = "approved" | "rejected";

function auditPayload(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => !/(password|secret|token|credential)/i.test(key)),
  );
}

export async function researchRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requireTenant);

  app.get(
    "/v1/research-runs",
    { preHandler: requirePermission("research:read") },
    async (request, reply) => {
      const tenantId = request.tenantId!;
      const query = request.query as { page?: string; limit?: string; status?: string };
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
      let runs = ResearchRunModel.query().where({ tenant_id: tenantId }).orderBy("created_at", "desc");
      if (query.status) runs = runs.where({ status: query.status });
      return runs.paginate({ page, limit });
    },
  );

  app.get(
    "/v1/research-runs/:id",
    {
      preHandler: requirePermission("research:read"),
      schema: {
        tags: ["Research"],
        summary: "Read a tenant-scoped research run and its workflow evidence",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.tenantId!;
      const run = await ResearchRunModel.query().where({ id, tenant_id: tenantId }).first();
      if (!run) return reply.code(404).send({ status: "not_found", message: "Research run tidak ditemukan." });
      const [approvals, workflow] = await Promise.all([
        ResearchApprovalModel.query().where({ research_run_id: run.id, tenant_id: tenantId }).orderBy("created_at", "desc"),
        ResearchWorkflowModel.query().where({ research_run_id: run.id, tenant_id: tenantId }).first(),
      ]);
      const jobs = workflow ? await ResearchJobModel.query().where({ workflow_id: workflow.id, tenant_id: tenantId }) : [];
      const evidence = await ResearchEvidenceModel.query().where({ research_run_id: run.id, tenant_id: tenantId }).orderBy("created_at", "asc");
      return { ...run, approvals, workflow: workflow ? { ...workflow, jobs } : null, evidence };
    },
  );

  app.post(
    "/v1/research-runs",
    {
      preHandler: requirePermission("research:write"),
      schema: {
        tags: ["Research"],
        summary: "Submit a research run for human approval",
        security: [{ bearerAuth: [] }],
        body: RESEARCH_REQUEST_SCHEMAS.createRun,
      },
    },
    async (request, reply) => {
      const body = request.body as { title?: string; question?: string; scope?: string };
      if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.length > 200)
        return reply.code(400).send({ status: "invalid_request", message: "Judul wajib 3–200 karakter." });
      if (typeof body.question !== "string" || body.question.trim().length < 10 || body.question.length > 10000)
        return reply.code(400).send({ status: "invalid_request", message: "Pertanyaan wajib 10–10000 karakter." });
      if (!(["self", "community", "global"] as const).includes(body.scope as "self" | "community" | "global"))
        return reply.code(400).send({ status: "invalid_request", message: "Scope harus self, community, atau global." });
      const user = request.authUser!;
      const created = await getDatabase().transaction(async (trx) => {
        const tenantResult = await resolveRequestTenant(request, trx);
        if ("error" in tenantResult) return null;
        const tenantId = tenantResult.tenantId;
        const run = await ResearchRunModel.query(trx).insert({
          tenantId,
          requestedBy: user.id,
          title: body.title!.trim(),
          question: body.question!.trim(),
          scope: body.scope as "self" | "community" | "global",
          status: "pending_approval",
        });
        await AuditLogModel.query(trx).insert({
          userId: user.id,
          action: "RESEARCH_RUN_SUBMITTED",
          entity: "research_run",
          entityId: run.id,
          payload: auditPayload({ title: run.title, scope: run.scope, tenantId }),
          ipAddress: request.ip,
        });
        return run;
      });
      if (!created) return reply.code(403).send({ status: "forbidden", message: "Keanggotaan tenant aktif diperlukan." });
      return reply.code(201).send(created);
    },
  );

  app.post(
    "/v1/research-runs/:id/approval",
    {
      preHandler: requirePermission("research:approve"),
      schema: {
        tags: ["Research"],
        summary: "Approve or reject a submitted research run",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        body: RESEARCH_REQUEST_SCHEMAS.approveRun,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { decision?: ApprovalDecision; comments?: string };
      if (body.decision !== "approved" && body.decision !== "rejected")
        return reply.code(400).send({ status: "invalid_request", message: "Keputusan harus approved atau rejected." });
      if (body.comments !== undefined && (typeof body.comments !== "string" || body.comments.length > 5000))
        return reply.code(400).send({ status: "invalid_request", message: "Komentar maksimal 5000 karakter." });
      const user = request.authUser!;
      const result = await getDatabase().transaction(async (trx) => {
        const tenantResult = await resolveRequestTenant(request, trx);
        if ("error" in tenantResult) return { error: "membership" as const };
        const tenantId = tenantResult.tenantId;
        const run = await ResearchRunModel.query(trx).where({ id, tenant_id: tenantId }).forUpdate().first();
        if (!run) return { error: "missing" as const };
        if (run.status !== "pending_approval") return { error: "state" as const };
        if (run.requestedBy === user.id) return { error: "self_approval" as const };
        await ResearchApprovalModel.query(trx).insert({ tenantId, researchRunId: run.id, approverId: user.id, decision: body.decision!, comments: body.comments?.trim() || null });
        if (body.decision === "approved") {
          const workflow = await ResearchWorkflowModel.query(trx).insert({ tenantId, researchRunId: run.id, createdBy: user.id, status: "queued" });
          await ResearchJobModel.query(trx).insert({ tenantId, workflowId: workflow.id, kind: "evidence_collection", status: "queued" });
          await run.$query(trx).patch({ status: "queued", approvedAt: new Date().toISOString() });
        } else {
          await run.$query(trx).patch({ status: "rejected" });
        }
        await AuditLogModel.query(trx).insert({
          userId: user.id,
          action: `RESEARCH_RUN_${body.decision!.toUpperCase()}`,
          entity: "research_run",
          entityId: run.id,
          payload: auditPayload({ decision: body.decision, comments: body.comments ?? null, tenantId }),
          ipAddress: request.ip,
        });
        return { status: body.decision, id: run.id };
      });
      if (result.error === "membership") return reply.code(403).send({ status: "forbidden", message: "Keanggotaan tenant aktif diperlukan." });
      if (result.error === "missing") return reply.code(404).send({ status: "not_found", message: "Research run tidak ditemukan." });
      if (result.error === "self_approval") return reply.code(403).send({ status: "forbidden", message: "Pengusul tidak boleh menyetujui run sendiri." });
      if (result.error === "state") return reply.code(409).send({ status: "conflict", message: "Research run sudah diputuskan." });
      return result;
    },
  );

  app.post(
    "/v1/research-runs/:id/evidence",
    {
      preHandler: requirePermission("research:write"),
      schema: {
        tags: ["Research"],
        summary: "Attach source-grounded evidence to an approved research run",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        body: RESEARCH_EVIDENCE_REQUEST_SCHEMA,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, unknown>;
      const user = request.authUser!;
      const inserted = await getDatabase().transaction(async (trx) => {
        const tenantResult = await resolveRequestTenant(request, trx);
        if ("error" in tenantResult) return { error: "membership" as const };
        const tenantId = tenantResult.tenantId;
        const run = await ResearchRunModel.query(trx).where({ id, tenant_id: tenantId }).forUpdate().first();
        if (!run) return { error: "missing" as const };
        if (run.status !== "queued" && run.status !== "running") return { error: "state" as const };
        const version2 = body.source !== undefined;
        const source = version2 && typeof body.source === "object" && body.source !== null
          ? body.source as Record<string, unknown>
          : null;
        const provenanceInput = body.provenance && typeof body.provenance === "object" && !Array.isArray(body.provenance)
          ? body.provenance as Record<string, unknown>
          : null;
        const sourceUriInput = version2 ? source?.url : body.sourceUri;
        const sourceFamilyInput = version2 ? source?.familyId : body.sourceFamily;
        if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.length > 300 ||
            typeof sourceUriInput !== "string" || sourceUriInput.length > 2048 ||
            typeof body.excerpt !== "string" || body.excerpt.length < 1 || body.excerpt.length > 20000 ||
            !provenanceInput ||
            !RESEARCH_SOURCE_FAMILIES.includes(sourceFamilyInput as (typeof RESEARCH_SOURCE_FAMILIES)[number]) ||
            !RESEARCH_CLASSIFICATIONS.includes(body.classification as (typeof RESEARCH_CLASSIFICATIONS)[number])) return { error: "invalid" as const };
        let parsedUri: URL;
        try { parsedUri = new URL(sourceUriInput); } catch { return { error: "invalid" as const }; }
        if (parsedUri.protocol !== "https:" && parsedUri.protocol !== "http:") return { error: "invalid" as const };
        if (version2 && (
          typeof source?.sourceId !== "string" ||
          typeof source.license !== "string" ||
          typeof provenanceInput?.sourceId !== "string" ||
          typeof provenanceInput.collectedAt !== "string" ||
          typeof provenanceInput.method !== "string" ||
          source.sourceId !== provenanceInput.sourceId
        )) return { error: "invalid" as const };
        const title = (body.title as string).trim();
        const sourceUri = sourceUriInput as string;
        const sourceFamily = sourceFamilyInput as (typeof RESEARCH_SOURCE_FAMILIES)[number];
        const classification = body.classification as (typeof RESEARCH_CLASSIFICATIONS)[number];
        const excerpt = body.excerpt as string;
        const provenance = version2
          ? { ...provenanceInput, source: { ...source } }
          : provenanceInput;
        const workflow = await ResearchWorkflowModel.query(trx).where({ research_run_id: run.id, tenant_id: tenantId }).first();
        if (!workflow) return { error: "missing_workflow" as const };
        const job = await ResearchJobModel.query(trx).where({ workflow_id: workflow.id, tenant_id: tenantId }).first();
        if (!job) return { error: "missing_workflow" as const };
        const contentHash = createHash("sha256").update(`${sourceUri}\n${title}\n${excerpt}`).digest("hex");
        const evidence = await ResearchEvidenceModel.query(trx).insert({
          tenantId,
          researchRunId: run.id,
          jobId: job.id,
          submittedBy: user.id,
          title,
          sourceUri,
          sourceFamily,
          classification,
          excerpt,
          contentHash,
          provenance,
        });
        const now = new Date().toISOString();
        await run.$query(trx).patch({ status: "running" });
        await workflow.$query(trx).patch({ status: "running" });
        if (job.status === "queued") await job.$query(trx).patch({ status: "running", startedAt: now });
        await AuditLogModel.query(trx).insert({
          userId: user.id,
          action: "RESEARCH_EVIDENCE_ATTACHED",
          entity: "research_evidence",
          entityId: evidence.id,
          payload: researchEvidenceAuditPayload({ researchRunId: run.id, sourceFamily, classification, contentHash, tenantId }),
          ipAddress: request.ip,
        });
        return evidence;
      });
      if ("error" in inserted) {
        if (inserted.error === "membership") return reply.code(403).send({ status: "forbidden", message: "Keanggotaan tenant aktif diperlukan." });
        if (inserted.error === "missing") return reply.code(404).send({ status: "not_found", message: "Research run tidak ditemukan." });
        if (inserted.error === "state") return reply.code(409).send({ status: "conflict", message: "Bukti hanya dapat ditambahkan setelah persetujuan." });
        if (inserted.error === "invalid") return reply.code(400).send({ status: "invalid_request", message: "Metadata bukti atau URL sumber tidak valid." });
        return reply.code(409).send({ status: "conflict", message: "Workflow pengumpulan bukti belum tersedia." });
      }
      return reply.code(201).send(inserted);
    },
  );

  app.post(
    "/v1/research-runs/:id/complete",
    {
      preHandler: requirePermission("research:write"),
      schema: {
        tags: ["Research"],
        summary: "Complete an approved run after evidence has been attached",
        security: [{ bearerAuth: [] }],
        params: { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } },
        body: RESEARCH_REQUEST_SCHEMAS.completeRun,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { resultSummary?: string };
      if (typeof body.resultSummary !== "string" || body.resultSummary.trim().length < 3 || body.resultSummary.length > 5000)
        return reply.code(400).send({ status: "invalid_request", message: "Ringkasan hasil wajib 3–5000 karakter." });
      const summary = body.resultSummary.trim();
      const user = request.authUser!;
      const result = await getDatabase().transaction(async (trx) => {
        const tenantResult = await resolveRequestTenant(request, trx);
        if ("error" in tenantResult) return { error: "membership" as const };
        const tenantId = tenantResult.tenantId;
        const run = await ResearchRunModel.query(trx).where({ id, tenant_id: tenantId }).forUpdate().first();
        if (!run) return { error: "missing" as const };
        if (run.status !== "running" && run.status !== "queued") return { error: "state" as const };
        const approval = await ResearchApprovalModel.query(trx).where({ research_run_id: run.id, tenant_id: tenantId, decision: "approved" }).first();
        const count = await ResearchEvidenceModel.query(trx).where({ research_run_id: run.id, tenant_id: tenantId }).resultSize();
        if (!approval || count < 1) return { error: "evidence" as const };
        const now = new Date().toISOString();
        const updated = await run.$query(trx).patchAndFetch({ status: "completed", resultSummary: summary, completedAt: now });
        const workflow = await ResearchWorkflowModel.query(trx).where({ research_run_id: run.id, tenant_id: tenantId }).first();
        if (workflow) {
          await workflow.$query(trx).patch({ status: "completed" });
          await ResearchJobModel.query(trx).where({ workflow_id: workflow.id, tenant_id: tenantId }).patch({ status: "completed", completedAt: now });
        }
        await AuditLogModel.query(trx).insert({
          userId: user.id,
          action: "RESEARCH_RUN_COMPLETED",
          entity: "research_run",
          entityId: run.id,
          payload: auditPayload({ evidenceCount: count, tenantId }),
          ipAddress: request.ip,
        });
        return updated;
      });
      if ("error" in result) {
        if (result.error === "membership") return reply.code(403).send({ status: "forbidden", message: "Keanggotaan tenant aktif diperlukan." });
        if (result.error === "missing") return reply.code(404).send({ status: "not_found", message: "Research run tidak ditemukan." });
        if (result.error === "evidence") return reply.code(409).send({ status: "conflict", message: "Run memerlukan persetujuan dan minimal satu bukti." });
        return reply.code(409).send({ status: "conflict", message: "Research run sudah selesai atau tidak dapat ditutup." });
      }
      return result;
    },
  );
}
