import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { getDatabase } from "@empire/batteries";
import {
  AuditLogModel,
  ChangeExecutionModel,
  ChangeRequestModel,
  ChangeReviewModel,
  checkAdabText,
  AuthService,
  UserModel,
  evaluateBySeraphCouncil,
} from "@empire/batteries-base";
import { requirePermission, requireSession } from "./auth.js";

type Tier = "standard" | "significant" | "critical" | "emergency";
type Verdict = "affirm" | "inquire" | "dissent";
interface CreateBody {
  title?: string;
  tier?: Tier;
  riskLevel?: "low" | "moderate" | "high" | "critical";
  summary?: string;
  justification?: string;
  executionPlan?: string;
  rollbackPlan?: string;
  targetService?: string;
  scheduledWindowStart?: string | null;
  scheduledWindowEnd?: string | null;
}
const clean = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length >= 3;

export async function cabRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", async (request, reply) => {
    const path = request.url.split("?")[0];
    const permission = request.method === "GET"
      ? "cab:read"
      : path.endsWith("/audit")
        ? "cab:audit"
        : path.endsWith("/decree")
          ? "cab:decree"
          : path.endsWith("/execute") || path.endsWith("/rollback")
            ? "cab:execute"
            : path.endsWith("/reviews") || path.endsWith("/vote")
              ? "cab:review"
              : "cab:write";
    return requirePermission(permission)(request, reply);
  });

  app.get("/continuum/cab/summary", async () => {
    const [total, active, emergency, completed, reverted, scheduled, reviews] = await Promise.all([
      ChangeRequestModel.query().resultSize(),
      ChangeRequestModel.query()
        .whereIn("status", ["deliberation", "auditing", "approved", "executing"])
        .resultSize(),
      ChangeRequestModel.query()
        .whereIn("tier", ["critical", "emergency"])
        .whereNotIn("status", ["rejected", "reverted"])
        .resultSize(),
      ChangeRequestModel.query().where({ status: "completed" }).resultSize(),
      ChangeRequestModel.query().where({ status: "reverted" }).resultSize(),
      ChangeRequestModel.query()
        .where("scheduled_window_start", ">", new Date().toISOString())
        .orderBy("scheduled_window_start", "asc")
        .first(),
      ChangeReviewModel.query()
        .whereIn("reviewer_role", [
          "seraph_arbiter",
          "seraph_sentinel",
          "seraph_bastion",
          "seraph_reaper",
        ])
        .resultSize(),
    ]);
    return {
      total,
      active,
      emergency,
      completed,
      successRatio:
        completed + reverted === 0 ? 0 : Math.round((completed / (completed + reverted)) * 100),
      seraphReviews: reviews,
      nextWindow: scheduled?.scheduledWindowStart ?? null,
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/continuum/cab/rfcs", async (request) => {
    const query = request.query as { page?: string; limit?: string; status?: string };
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    let builder = ChangeRequestModel.query().orderBy("created_at", "desc");
    if (query.status) builder = builder.where({ status: query.status });
    const result = await builder.paginate({ page, limit });
    const allReviews = result.data.length
      ? await ChangeReviewModel.query()
          .whereIn(
            "change_request_id",
            result.data.map((item) => item.id),
          )
          .orderBy("round", "desc")
          .orderBy("created_at", "desc")
      : [];
    const byRequest = new Map<string, typeof allReviews>();
    for (const review of allReviews) {
      const records = byRequest.get(review.changeRequestId) ?? [];
      records.push(review);
      byRequest.set(review.changeRequestId, records);
    }
    return {
      items: result.data.map((item) => ({ ...item, reviews: byRequest.get(item.id) ?? [] })),
      ...result.meta,
    };
  });

  app.get("/continuum/cab/rfcs/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const rfc = await ChangeRequestModel.query().findById(id);
    if (!rfc) return reply.code(404).send({ message: "RFC tidak ditemukan." });
    const [reviews, executions] = await Promise.all([
      ChangeReviewModel.query().where({ change_request_id: rfc.id }).orderBy("created_at", "asc"),
      ChangeExecutionModel.query()
        .where({ change_request_id: rfc.id })
        .orderBy("created_at", "asc"),
    ]);
    return { ...rfc, reviews, executions };
  });

  app.patch("/continuum/cab/rfcs/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as Partial<CreateBody>;
    const user = request.authUser!;
    const allowed = [
      "title",
      "summary",
      "justification",
      "executionPlan",
      "rollbackPlan",
      "targetService",
      "scheduledWindowStart",
      "scheduledWindowEnd",
    ];
    if (Object.keys(body).some((key) => !allowed.includes(key)))
      return reply
        .code(400)
        .send({ message: "Tier dan tingkat risiko tidak dapat diubah setelah pengajuan." });
    return getDatabase().transaction(async (trx) => {
      const rfc = await ChangeRequestModel.query(trx).findById(id).forUpdate();
      if (!rfc) return reply.code(404).send({ message: "RFC tidak ditemukan." });
      if (rfc.authorId !== user.id)
        return reply.code(403).send({ message: "Hanya pengusul yang dapat memperbarui RFC." });
      if (rfc.status !== "deliberation")
        return reply.code(409).send({ message: "RFC hanya dapat diperbarui saat musyawarah." });
      const fields = [
        "title",
        "summary",
        "justification",
        "executionPlan",
        "rollbackPlan",
        "targetService",
      ] as const;
      if (fields.some((key) => body[key] !== undefined && !clean(body[key])))
        return reply
          .code(400)
          .send({ message: "Setiap kolom teks harus berisi minimal 3 karakter." });
      const next = {
        title: body.title?.trim() ?? rfc.title,
        summary: body.summary?.trim() ?? rfc.summary,
        justification: body.justification?.trim() ?? rfc.justification,
        executionPlan: body.executionPlan?.trim() ?? rfc.executionPlan,
        rollbackPlan: body.rollbackPlan?.trim() ?? rfc.rollbackPlan,
        targetService: body.targetService?.trim() ?? rfc.targetService,
      };
      const adab = checkAdabText(Object.values(next).join("\n"));
      if (!adab.passed)
        return reply.code(422).send({
          message: "Usulan perlu diperbaiki sebelum diajukan.",
          matchedRules: adab.matchedRules,
        });
      const start =
        body.scheduledWindowStart === undefined
          ? rfc.scheduledWindowStart
          : body.scheduledWindowStart;
      const end =
        body.scheduledWindowEnd === undefined ? rfc.scheduledWindowEnd : body.scheduledWindowEnd;
      if (
        (start !== null && start !== undefined && typeof start !== "string") ||
        (end !== null && end !== undefined && typeof end !== "string")
      )
        return reply
          .code(400)
          .send({ message: "Tanggal jadwal harus berupa teks ISO atau kosong." });
      for (const date of [start, end])
        if (date && !Number.isFinite(new Date(date).getTime()))
          return reply.code(400).send({ message: "Tanggal jadwal tidak valid." });
      if (start && end && new Date(end) <= new Date(start))
        return reply.code(400).send({ message: "Akhir jadwal harus setelah awal jadwal." });
      const updated = await rfc.$query(trx).patchAndFetch({
        ...next,
        scheduledWindowStart: start ?? null,
        scheduledWindowEnd: end ?? null,
        // Any prior council result applies to the previous proposal contents only.
        auditRound: rfc.auditRound + 1,
      });
      await AuditLogModel.query(trx).insert({
        userId: user.id,
        action: "CAB_RFC_UPDATED",
        entity: "change_request",
        entityId: rfc.id,
        payload: {
          code: rfc.code,
          previousAuditRound: rfc.auditRound,
          auditRound: updated.auditRound,
        },
        ipAddress: request.ip,
      });
      return updated;
    });
  });

  app.post("/continuum/cab/rfcs", async (request, reply) => {
    const body = (request.body ?? {}) as CreateBody;
    const required: Array<keyof CreateBody> = [
      "title",
      "summary",
      "justification",
      "executionPlan",
      "rollbackPlan",
      "targetService",
    ];
    if (required.some((key) => !clean(body[key])))
      return reply.code(400).send({
        message:
          "Lengkapi judul, ringkasan, alasan, rencana eksekusi, rollback, dan layanan sasaran (minimal 3 karakter).",
      });
    const tier: Tier = body.tier ?? "standard";
    const riskLevel = body.riskLevel ?? "moderate";
    if (
      !["standard", "significant", "critical", "emergency"].includes(tier) ||
      !["low", "moderate", "high", "critical"].includes(riskLevel)
    )
      return reply.code(400).send({ message: "Tier atau tingkat risiko tidak valid." });
    for (const date of [body.scheduledWindowStart, body.scheduledWindowEnd]) {
      if (date && !Number.isFinite(new Date(date).getTime()))
        return reply.code(400).send({ message: "Tanggal jadwal tidak valid." });
    }
    if (
      body.scheduledWindowStart &&
      body.scheduledWindowEnd &&
      new Date(body.scheduledWindowEnd) <= new Date(body.scheduledWindowStart)
    )
      return reply.code(400).send({ message: "Akhir jadwal harus setelah awal jadwal." });
    const text = required.map((key) => body[key]).join("\n");
    const adab = checkAdabText(text);
    if (!adab.passed)
      return reply.code(422).send({
        message: "Usulan perlu diperbaiki sebelum diajukan.",
        matchedRules: adab.matchedRules,
      });
    const year = new Date().getUTCFullYear();
    const code = `RFC-${year}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const rfc = await getDatabase().transaction(async (trx) => {
      const created = await ChangeRequestModel.query(trx).insert({
        code,
        title: body.title!.trim(),
        tier,
        riskLevel,
        status: "deliberation",
        authorId: request.authUser!.id,
        summary: body.summary!.trim(),
        justification: body.justification!.trim(),
        executionPlan: body.executionPlan!.trim(),
        rollbackPlan: body.rollbackPlan!.trim(),
        targetService: body.targetService!.trim(),
        scheduledWindowStart: body.scheduledWindowStart ?? null,
        scheduledWindowEnd: body.scheduledWindowEnd ?? null,
        sovereignDecree: false,
        adabScore: 100,
      });
      await AuditLogModel.query(trx).insert({
        userId: request.authUser!.id,
        action: "CAB_RFC_CREATED",
        entity: "change_request",
        entityId: created.id,
        payload: { code, tier, riskLevel, adabScore: 100 },
        ipAddress: request.ip,
      });
      return created;
    });
    return reply.code(201).send(rfc);
  });

  const createRfcReview = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { verdict?: Verdict; notes?: string };
    const user = request.authUser!;
    const verdict = body?.verdict;
    if (verdict !== "affirm" && verdict !== "inquire" && verdict !== "dissent")
      return reply.code(400).send({ message: "Verdict harus affirm, inquire, atau dissent." });
    if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 5000))
      return reply.code(400).send({ message: "Catatan review maksimal 5000 karakter." });
    return getDatabase().transaction(async (trx) => {
      const rfc = await ChangeRequestModel.query(trx).findById(id).forUpdate();
      if (!rfc) return reply.code(404).send({ message: "RFC tidak ditemukan." });
      if (rfc.status !== "deliberation")
        return reply.code(409).send({ message: "RFC sudah meninggalkan tahap musyawarah." });
      const critical = ["critical", "emergency"].includes(rfc.tier);
      if (critical)
        return reply
          .code(409)
          .send({ message: "RFC kritis memerlukan dekrit melalui endpoint sovereign." });
      if (!AuthService.hasPermission(user, "cab:govern"))
        return reply.code(403).send({ message: "Review RFC memerlukan izin Architect." });
      const council = await ChangeReviewModel.query(trx)
        .where({ change_request_id: rfc.id, round: rfc.auditRound })
        .whereIn("reviewer_role", [
          "seraph_arbiter",
          "seraph_sentinel",
          "seraph_bastion",
          "seraph_reaper",
        ])
        .orderBy("created_at", "desc");
      const latest = new Map<string, string>();
      for (const item of council)
        if (!latest.has(item.reviewerRole)) latest.set(item.reviewerRole, item.verdict);
      if (latest.size !== 4)
        return reply
          .code(409)
          .send({ message: "Empat pemeriksaan Seraph harus tercatat sebelum voting Architect." });
      if (verdict === "affirm" && [...latest.values()].some((item) => item !== "affirm"))
        return reply
          .code(409)
          .send({ message: "Empat audit Seraph harus affirm sebelum persetujuan Architect." });
      const review = await ChangeReviewModel.query(trx).insert({
        changeRequestId: rfc.id,
        reviewerId: user.id,
        reviewerRole: "architect",
        verdict,
        notes: body.notes?.trim() || null,
        confidence: 100,
        round: rfc.auditRound,
      });
      const nextStatus =
        verdict === "affirm" ? "approved" : verdict === "dissent" ? "rejected" : "deliberation";
      await rfc.$query(trx).patch({ status: nextStatus, sovereignDecree: false });
      await AuditLogModel.query(trx).insert({
        userId: user.id,
        action: `CAB_RFC_${verdict.toUpperCase()}`,
        entity: "change_request",
        entityId: rfc.id,
        payload: { code: rfc.code, tier: rfc.tier, notes: body.notes ?? null },
        ipAddress: request.ip,
      });
      return { review, status: nextStatus };
    });
  };
  app.post("/continuum/cab/rfcs/:id/reviews", createRfcReview);
  app.post("/continuum/cab/rfcs/:id/vote", createRfcReview);

  app.post("/continuum/cab/rfcs/:id/audit", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.authUser!;
    if (!AuthService.hasPermission(user, "cab:govern"))
      return reply.code(403).send({ message: "Audit memerlukan izin Architect." });
    return getDatabase().transaction(async (trx) => {
      const rfc = await ChangeRequestModel.query(trx).findById(id).forUpdate();
      if (!rfc) return reply.code(404).send({ message: "RFC tidak ditemukan." });
      if (rfc.status !== "deliberation")
        return reply.code(409).send({ message: "RFC belum berada pada tahap musyawarah." });
      const evaluations = evaluateBySeraphCouncil(rfc);
      const round = rfc.auditRound + 1;
      const auditUsers = await UserModel.query(trx).whereIn(
        "username",
        evaluations.map((item) => item.code),
      );
      if (auditUsers.length !== evaluations.length)
        return reply
          .code(503)
          .send({ message: "Anggota Seraph council belum lengkap di database." });
      const byUsername = new Map(auditUsers.map((item) => [item.username, item]));
      const inserted = [];
      for (const evaluation of evaluations) {
        const agent = byUsername.get(evaluation.code)!;
        inserted.push(
          await ChangeReviewModel.query(trx).insert({
            changeRequestId: rfc.id,
            reviewerId: agent.id,
            reviewerRole: `seraph_${evaluation.role}`,
            verdict: evaluation.verdict,
            notes: evaluation.notes,
            confidence: evaluation.confidence,
            round,
          }),
        );
      }
      await rfc.$query(trx).patch({ auditRound: round });
      await AuditLogModel.query(trx).insert({
        userId: user.id,
        action: "CAB_SERAPH_AUDIT",
        entity: "change_request",
        entityId: rfc.id,
        payload: {
          code: rfc.code,
          source: "deterministic_policy_checks",
          checks: evaluations.map(({ code, role, verdict, confidence }) => ({
            code,
            role,
            verdict,
            confidence,
          })),
        },
        ipAddress: request.ip,
      });
      return {
        status: "deliberation",
        source: "deterministic_policy_checks",
        round,
        reviews: inserted,
      };
    });
  });

  app.post("/continuum/cab/rfcs/:id/decree", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { verdict?: "approve" | "veto"; notes?: string };
    const user = request.authUser!;
    if (!AuthService.isSovereignAntiBypass(user))
      return reply.code(403).send({ message: "Dekrit hanya tersedia bagi Luminary." });
    if (body?.verdict !== "approve" && body?.verdict !== "veto")
      return reply.code(400).send({ message: "Dekrit harus approve atau veto." });
    const decree = body.verdict;
    if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 5000))
      return reply.code(400).send({ message: "Catatan dekrit maksimal 5000 karakter." });
    return getDatabase().transaction(async (trx) => {
      const rfc = await ChangeRequestModel.query(trx).findById(id).forUpdate();
      if (!rfc) return reply.code(404).send({ message: "RFC tidak ditemukan." });
      if (!["critical", "emergency"].includes(rfc.tier))
        return reply.code(409).send({
          message: "Dekrit Sovereign hanya diperlukan untuk RFC critical atau emergency.",
        });
      if (rfc.status !== "deliberation")
        return reply.code(409).send({ message: "RFC harus berada pada tahap musyawarah." });
      if (decree === "approve") {
        const council = await ChangeReviewModel.query(trx)
          .where({ change_request_id: rfc.id, round: rfc.auditRound })
          .whereIn("reviewer_role", [
            "seraph_arbiter",
            "seraph_sentinel",
            "seraph_bastion",
            "seraph_reaper",
          ])
          .orderBy("created_at", "desc");
        const latest = new Map<string, string>();
        for (const item of council)
          if (!latest.has(item.reviewerRole)) latest.set(item.reviewerRole, item.verdict);
        if (latest.size !== 4 || [...latest.values()].some((item) => item !== "affirm"))
          return reply.code(409).send({
            message: "Dekrit persetujuan memerlukan empat hasil audit Seraph yang affirm.",
          });
      }
      const nextStatus = decree === "approve" ? "approved" : "rejected";
      const review = await ChangeReviewModel.query(trx).insert({
        changeRequestId: rfc.id,
        reviewerId: user.id,
        reviewerRole: "sovereign_decree",
        verdict: decree === "approve" ? "affirm" : "dissent",
        notes: body.notes?.trim() || `Sovereign ${decree}.`,
        confidence: 100,
        round: rfc.auditRound,
      });
      await rfc.$query(trx).patch({ status: nextStatus, sovereignDecree: decree === "approve" });
      await AuditLogModel.query(trx).insert({
        userId: user.id,
        action: `CAB_SOVEREIGN_${decree.toUpperCase()}`,
        entity: "change_request",
        entityId: rfc.id,
        payload: { code: rfc.code, tier: rfc.tier, notes: body.notes ?? null },
        ipAddress: request.ip,
      });
      return { status: nextStatus, review };
    });
  });

  app.post("/continuum/cab/rfcs/:id/execute", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.authUser!;
    return getDatabase().transaction(async (trx) => {
      const rfc = await ChangeRequestModel.query(trx).findById(id).forUpdate();
      if (!rfc) return reply.code(404).send({ message: "RFC tidak ditemukan." });
      if (rfc.status !== "approved")
        return reply.code(409).send({ message: "Hanya RFC yang disetujui dapat dieksekusi." });
      if (["critical", "emergency"].includes(rfc.tier) && !rfc.sovereignDecree)
        return reply.code(403).send({ message: "Eksekusi RFC kritis memerlukan dekrit Luminary." });
      if (!AuthService.hasPermission(user, "cab:govern"))
        return reply
          .code(403)
          .send({ message: "Eksekusi hanya dapat dimulai Architect atau Luminary." });
      const now = new Date().toISOString();
      await rfc.$query(trx).patch({ status: "completed" });
      const execution = await ChangeExecutionModel.query(trx).insert({
        changeRequestId: rfc.id,
        executorId: user.id,
        action: "execute",
        outcome: "completed",
        startedAt: now,
        completedAt: now,
      });
      await AuditLogModel.query(trx).insert({
        userId: user.id,
        action: "CAB_RFC_EXECUTED",
        entity: "change_request",
        entityId: rfc.id,
        payload: { code: rfc.code },
        ipAddress: request.ip,
      });
      return { status: "completed", execution };
    });
  });

  app.post("/continuum/cab/rfcs/:id/rollback", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.authUser!;
    return getDatabase().transaction(async (trx) => {
      const rfc = await ChangeRequestModel.query(trx).findById(id).forUpdate();
      if (!rfc) return reply.code(404).send({ message: "RFC tidak ditemukan." });
      if (rfc.status !== "completed")
        return reply.code(409).send({ message: "Rollback hanya tersedia untuk RFC yang selesai." });
      if (!AuthService.hasPermission(user, "cab:govern"))
        return reply
          .code(403)
          .send({ message: "Rollback hanya dapat dimulai Architect atau Luminary." });
      const now = new Date().toISOString();
      await rfc.$query(trx).patch({ status: "reverted" });
      const execution = await ChangeExecutionModel.query(trx).insert({
        changeRequestId: rfc.id,
        executorId: user.id,
        action: "rollback",
        outcome: "completed",
        notes: rfc.rollbackPlan,
        startedAt: now,
        completedAt: now,
      });
      await AuditLogModel.query(trx).insert({
        userId: user.id,
        action: "CAB_RFC_ROLLED_BACK",
        entity: "change_request",
        entityId: rfc.id,
        payload: { code: rfc.code },
        ipAddress: request.ip,
      });
      return { status: "reverted", execution };
    });
  });
}
