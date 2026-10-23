import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createHash } from "node:crypto";
import {
  AuthService, AuditLogModel, MoonwitnessContentRevisionModel, MoonwitnessPublicationModel,
  MoonwitnessCollectionModel,
  MoonwitnessStoryModel,
  MoonwitnessStoryTagModel,
  MoonwitnessEpisodeModel, MoonwitnessSceneModel, MoonwitnessComicPageModel,
  TagModel,
} from "@empire/batteries-base";
import { getDatabase } from "@empire/batteries";
import {
  MOONWITNESS_COLLECTION_CREATE_SCHEMA,
  MOONWITNESS_COLLECTION_PATCH_SCHEMA,
  MOONWITNESS_STORY_CREATE_SCHEMA,
  MOONWITNESS_STORY_PATCH_SCHEMA,
  MOONWITNESS_EPISODE_CREATE_SCHEMA, MOONWITNESS_SCENE_CREATE_SCHEMA, MOONWITNESS_COMIC_PAGE_CREATE_SCHEMA, MOONWITNESS_PAGE_ORDER_SCHEMA,
} from "@empire/api-contract";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant } from "./tenant-context.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const collectionTransitions: Record<string, string[]> = { draft: ["published", "archived"], published: ["archived"], archived: [] };
const storyTransitions: Record<string, string[]> = {
  idea: ["draft", "archived"], draft: ["in_review", "archived"],
  in_review: ["changes_requested", "approved"], changes_requested: ["draft", "in_review", "archived"],
  approved: ["draft", "scheduled", "published", "archived"], scheduled: ["published", "approved", "archived"],
  published: ["approved", "archived"], archived: ["draft"],
};

export function isEditorialTransitionAllowed(kind: "collection" | "story", current: string, next: string) {
  const transitions = kind === "collection" ? collectionTransitions : storyTransitions;
  return transitions[current]?.includes(next) ?? false;
}

export function isPublicEditorialProjection(collection: { status: string; visibility: string }, story: { editorialState: string; classification: string; visibility: string }) {
  return collection.status === "published" && collection.visibility === "public" && story.editorialState === "published" && story.classification === "public" && story.visibility === "public";
}

function invalid(reply: FastifyReply, message: string) {
  return reply.code(400).send({ status: "invalid_request", message });
}

function conflict(reply: FastifyReply, message: string) {
  return reply.code(409).send({ status: "conflict", message });
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}

function canPublish(request: FastifyRequest) {
  return Boolean(request.authUser && AuthService.hasPermission(request.authUser, "moonwitness:publish"));
}

function canReview(request: FastifyRequest) {
  return Boolean(request.authUser && AuthService.hasPermission(request.authUser, "moonwitness:review"));
}

function revisionDigest(snapshot: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

async function appendStoryRevision(trx: any, story: any, actorId: string, reason: string, tagIds: string[]) {
  const snapshot = {
    storyId: story.id, collectionId: story.collectionId, slug: story.slug, title: story.title,
    synopsis: story.synopsis ?? null, body: story.body, classification: story.classification,
    visibility: story.visibility, tagIds: [...tagIds].sort(), revision: story.revision,
  };
  return (MoonwitnessContentRevisionModel.query(trx) as any).insert({
    tenantId: story.tenantId, storyId: story.id, revision: story.revision, actorId, reason,
    snapshot, sha256: revisionDigest(snapshot), provenance: { source: "moonwitness-editorial-api" },
  });
}

function stringValue(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.trim().length >= min && value.length <= max;
}

function storyTags(value: unknown): value is string[] {
  return value === undefined || (Array.isArray(value) && value.length <= 30 && value.every((id) => typeof id === "string" && uuidPattern.test(id)) && new Set(value).size === value.length);
}

export async function moonwitnessEditorialRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requireTenant);

  // All episode/scene/page reads and writes are scoped to the active tenant. Drafts
  // remain private behind the existing session + moonwitness permissions.
  app.get("/v1/moonwitness/stories/:storyId/episodes", { preHandler: requirePermission("moonwitness:read") }, async (request, reply) => {
    const { storyId } = request.params as { storyId: string };
    if (!uuidPattern.test(storyId)) return invalid(reply, "ID cerita harus berupa UUID.");
    const story = await MoonwitnessStoryModel.query().where({ id: storyId, tenant_id: request.tenantId! }).first();
    if (!story) return reply.code(404).send({ status: "not_found", message: "Cerita tidak ditemukan." });
    return MoonwitnessEpisodeModel.query().where({ tenant_id: request.tenantId!, story_id: storyId }).orderBy("sequence", "asc");
  });
  app.post("/v1/moonwitness/stories/:storyId/episodes", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_EPISODE_CREATE_SCHEMA } }, async (request, reply) => {
    const { storyId } = request.params as { storyId: string }; const body = request.body as Record<string, unknown>;
    if (!uuidPattern.test(storyId) || !body || !stringValue(body.slug, 1, 80) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || !stringValue(body.title, 1, 200) || body.synopsis != null && !stringValue(body.synopsis, 1, 2000)) return invalid(reply, "Data episode tidak valid.");
    const created = await getDatabase().transaction(async (trx) => {
      const story = await MoonwitnessStoryModel.query(trx).where({ id: storyId, tenant_id: request.tenantId! }).forUpdate().first();
      if (!story) return null;
      const last = await trx("moonwitness_episodes").where({ tenant_id: request.tenantId!, story_id: storyId }).max({ sequence: "sequence" }).first();
      return (MoonwitnessEpisodeModel.query(trx) as any).insert({ tenantId: request.tenantId!, storyId, slug: (body.slug as string).trim(), title: (body.title as string).trim(), synopsis: (body.synopsis as string | null | undefined) ?? null, sequence: Number(last?.sequence ?? 0) + 1, status: "draft" });
    });
    if (!created) return reply.code(404).send({ status: "not_found", message: "Cerita tidak ditemukan di tenant aktif." });
    return reply.code(201).send(created);
  });

  app.get("/v1/moonwitness/episodes/:episodeId/scenes", { preHandler: requirePermission("moonwitness:read") }, async (request, reply) => {
    const { episodeId } = request.params as { episodeId: string }; if (!uuidPattern.test(episodeId)) return invalid(reply, "ID episode harus berupa UUID.");
    const episode = await MoonwitnessEpisodeModel.query().where({ id: episodeId, tenant_id: request.tenantId! }).first();
    if (!episode) return reply.code(404).send({ status: "not_found", message: "Episode tidak ditemukan." });
    return MoonwitnessSceneModel.query().where({ tenant_id: request.tenantId!, episode_id: episodeId }).orderBy("sequence", "asc");
  });
  app.post("/v1/moonwitness/episodes/:episodeId/scenes", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_SCENE_CREATE_SCHEMA } }, async (request, reply) => {
    const { episodeId } = request.params as { episodeId: string }; const body = request.body as Record<string, unknown>;
    if (!uuidPattern.test(episodeId) || !body || !stringValue(body.slug, 1, 80) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || !stringValue(body.title, 1, 200)) return invalid(reply, "Data scene tidak valid.");
    const created = await getDatabase().transaction(async (trx) => {
      const episode = await MoonwitnessEpisodeModel.query(trx).where({ id: episodeId, tenant_id: request.tenantId! }).forUpdate().first(); if (!episode) return null;
      const last = await trx("moonwitness_scenes").where({ tenant_id: request.tenantId!, episode_id: episodeId }).max({ sequence: "sequence" }).first();
      return (MoonwitnessSceneModel.query(trx) as any).insert({ tenantId: request.tenantId!, episodeId, slug: (body.slug as string).trim(), title: (body.title as string).trim(), sequence: Number(last?.sequence ?? 0) + 1, status: "draft" });
    });
    if (!created) return reply.code(404).send({ status: "not_found", message: "Episode tidak ditemukan di tenant aktif." }); return reply.code(201).send(created);
  });

  app.get("/v1/moonwitness/scenes/:sceneId/pages", { preHandler: requirePermission("moonwitness:read") }, async (request, reply) => {
    const { sceneId } = request.params as { sceneId: string }; if (!uuidPattern.test(sceneId)) return invalid(reply, "ID scene harus berupa UUID.");
    const scene = await MoonwitnessSceneModel.query().where({ id: sceneId, tenant_id: request.tenantId! }).first();
    if (!scene) return reply.code(404).send({ status: "not_found", message: "Scene tidak ditemukan." });
    return MoonwitnessComicPageModel.query().where({ tenant_id: request.tenantId!, scene_id: sceneId }).orderBy("sequence", "asc");
  });
  app.post("/v1/moonwitness/scenes/:sceneId/pages", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_COMIC_PAGE_CREATE_SCHEMA } }, async (request, reply) => {
    const { sceneId } = request.params as { sceneId: string }; const body = request.body as Record<string, unknown>;
    if (!uuidPattern.test(sceneId) || !body || !stringValue(body.assetUrl, 1, 2048) || !/^(https:\/\/|\/)[^\s]+$/i.test(body.assetUrl) || !stringValue(body.altText, 1, 1000)) return invalid(reply, "Aset harus berupa URL HTTPS/path lokal dan alt text wajib diisi.");
    const created = await getDatabase().transaction(async (trx) => {
      const scene = await MoonwitnessSceneModel.query(trx).where({ id: sceneId, tenant_id: request.tenantId! }).forUpdate().first(); if (!scene) return null;
      const last = await trx("moonwitness_comic_pages").where({ tenant_id: request.tenantId!, scene_id: sceneId }).max({ sequence: "sequence" }).first();
      return (MoonwitnessComicPageModel.query(trx) as any).insert({ tenantId: request.tenantId!, sceneId, sequence: Number(last?.sequence ?? 0) + 1, assetUrl: (body.assetUrl as string).trim(), altText: (body.altText as string).trim(), status: "draft" });
    });
    if (!created) return reply.code(404).send({ status: "not_found", message: "Scene tidak ditemukan di tenant aktif." }); return reply.code(201).send(created);
  });
  app.patch("/v1/moonwitness/scenes/:sceneId/pages/order", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_PAGE_ORDER_SCHEMA } }, async (request, reply) => {
    const { sceneId } = request.params as { sceneId: string }; const body = request.body as { orderedIds?: unknown };
    if (!uuidPattern.test(sceneId) || !body || !Array.isArray(body.orderedIds) || !body.orderedIds.length || body.orderedIds.length > 500 || !body.orderedIds.every((id) => typeof id === "string" && uuidPattern.test(id)) || new Set(body.orderedIds).size !== body.orderedIds.length) return invalid(reply, "Urutan halaman tidak valid.");
    const orderedIds = body.orderedIds as string[];
    const result = await getDatabase().transaction(async (trx) => {
      const scene = await MoonwitnessSceneModel.query(trx).where({ id: sceneId, tenant_id: request.tenantId! }).forUpdate().first(); if (!scene) return "missing" as const;
      const pages = await MoonwitnessComicPageModel.query(trx).where({ tenant_id: request.tenantId!, scene_id: sceneId }).select("id");
      const ids = pages.map((page: { id: string }) => page.id); if (ids.length !== orderedIds.length || ids.some((id: string) => !orderedIds.includes(id))) return "mismatch" as const;
      // Move to a disjoint negative range first so unique (tenant, scene, sequence)
      // constraints remain satisfied even when positions are swapped.
      for (let index = 0; index < ids.length; index++) await MoonwitnessComicPageModel.query(trx).where({ tenant_id: request.tenantId!, scene_id: sceneId, id: orderedIds[index] }).patch({ sequence: -(index + 1) });
      for (let index = 0; index < orderedIds.length; index++) await MoonwitnessComicPageModel.query(trx).where({ tenant_id: request.tenantId!, scene_id: sceneId, id: orderedIds[index] }).patch({ sequence: index + 1 });
      return "ok" as const;
    });
    if (result === "missing") return reply.code(404).send({ status: "not_found", message: "Scene tidak ditemukan." });
    if (result === "mismatch") return invalid(reply, "Urutan harus memuat semua halaman scene ini tepat satu kali.");
    return MoonwitnessComicPageModel.query().where({ tenant_id: request.tenantId!, scene_id: sceneId }).orderBy("sequence", "asc");
  });

  app.get("/v1/moonwitness/collections", { preHandler: requirePermission("moonwitness:read") }, async (request) => {
    const query = request.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    return MoonwitnessCollectionModel.query().where({ tenant_id: request.tenantId! }).orderBy("created_at", "desc").paginate({ page, limit });
  });

  app.post("/v1/moonwitness/collections", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], summary: "Create a draft collection in the active tenant", security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_COLLECTION_CREATE_SCHEMA } }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    if (!body || !stringValue(body.slug, 1, 80) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || !stringValue(body.title, 1, 200))
      return invalid(reply, "Slug huruf kecil dengan tanda hubung dan judul 1–200 karakter wajib diisi.");
    if (body.cover !== undefined && body.cover !== null && (!stringValue(body.cover, 1, 2048) || !/^(https:\/\/|\/)[^\s]+$/i.test(body.cover)))
      return invalid(reply, "Cover harus berupa URL HTTPS atau path lokal.");
    if (body.theme !== undefined && !stringValue(body.theme, 1, 80)) return invalid(reply, "Tema tidak valid.");
    if (body.language !== undefined && !["id", "en", "ar"].includes(body.language as string)) return invalid(reply, "Bahasa harus id, en, atau ar.");
    try {
      const collection = await (MoonwitnessCollectionModel.query() as any).insert({
        tenantId: request.tenantId!, ownerId: request.authUser!.id, slug: (body.slug as string).trim(), title: (body.title as string).trim(),
        cover: body.cover ?? null, theme: (body.theme as string | undefined)?.trim() ?? "moonwitness", language: (body.language as string | undefined) ?? "id",
        status: "draft", visibility: "private",
      });
      return reply.code(201).send(collection);
    } catch (error) {
      if (isUniqueViolation(error)) return conflict(reply, "Slug koleksi sudah digunakan di tenant ini.");
      throw error;
    }
  });

  app.patch("/v1/moonwitness/collections/:id", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], summary: "Edit or transition a tenant collection", security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_COLLECTION_PATCH_SCHEMA } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    if (!uuidPattern.test(id) || !body || !Object.keys(body).length || Object.keys(body).some((key) => !["title", "cover", "theme", "language", "status", "visibility"].includes(key))) return invalid(reply, "Perubahan koleksi tidak valid.");
    if (body.title !== undefined && !stringValue(body.title, 1, 200)) return invalid(reply, "Judul koleksi harus 1–200 karakter.");
    if (body.cover !== undefined && body.cover !== null && (!stringValue(body.cover, 1, 2048) || !/^(https:\/\/|\/)[^\s]+$/i.test(body.cover))) return invalid(reply, "Cover harus berupa URL HTTPS atau path lokal.");
    if (body.theme !== undefined && !stringValue(body.theme, 1, 80)) return invalid(reply, "Tema tidak valid.");
    if (body.language !== undefined && !["id", "en", "ar"].includes(body.language as string)) return invalid(reply, "Bahasa harus id, en, atau ar.");
    if (body.visibility !== undefined && !["private", "unlisted", "public"].includes(body.visibility as string)) return invalid(reply, "Visibilitas tidak valid.");
    const collection = await MoonwitnessCollectionModel.query().where({ id, tenant_id: request.tenantId! }).first();
    if (!collection) return reply.code(404).send({ status: "not_found", message: "Koleksi tidak ditemukan." });
    if (body.status !== undefined) {
      if (typeof body.status !== "string" || !isEditorialTransitionAllowed("collection", collection.status, body.status)) return conflict(reply, "Transisi status koleksi tidak diizinkan.");
      if (body.status === "published" && !canPublish(request)) return reply.code(403).send({ status: "forbidden", message: "Izin moonwitness:publish diperlukan." });
      if (body.status === "published" && (body.visibility ?? collection.visibility) !== "public") return invalid(reply, "Koleksi harus berstatus public sebelum diterbitkan.");
    }
    const patch: Record<string, unknown> = {};
    for (const key of ["title", "cover", "theme", "language", "status", "visibility"]) if (body[key] !== undefined) patch[key] = key === "title" || key === "theme" ? (body[key] as string).trim() : body[key];
    try {
      return await collection.$query().patchAndFetch(patch);
    } catch (error) {
      if (isUniqueViolation(error)) return conflict(reply, "Slug koleksi sudah digunakan di tenant ini.");
      throw error;
    }
  });

  app.get("/v1/moonwitness/collections/:id/stories", { preHandler: requirePermission("moonwitness:read") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!uuidPattern.test(id)) return invalid(reply, "ID koleksi harus berupa UUID.");
    const collection = await MoonwitnessCollectionModel.query().where({ id, tenant_id: request.tenantId! }).first();
    if (!collection) return reply.code(404).send({ status: "not_found", message: "Koleksi tidak ditemukan." });
    const stories = await MoonwitnessStoryModel.query().where({ tenant_id: request.tenantId!, collection_id: id }).orderBy("created_at", "asc");
    if (!stories.length) return [];
    const tags = await MoonwitnessStoryTagModel.query().where({ tenant_id: request.tenantId! }).whereIn("story_id", stories.map((story) => story.id));
    const tagIdsByStory = new Map<string, string[]>();
    for (const tag of tags) tagIdsByStory.set(tag.storyId, [...(tagIdsByStory.get(tag.storyId) ?? []), tag.tagId]);
    return stories.map((story) => ({ ...story, tagIds: tagIdsByStory.get(story.id) ?? [] }));
  });

  app.post("/v1/moonwitness/stories", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], summary: "Create a draft story in a tenant collection", security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_STORY_CREATE_SCHEMA } }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    if (!body || typeof body.collectionId !== "string" || !uuidPattern.test(body.collectionId) || !stringValue(body.slug, 1, 80) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || !stringValue(body.title, 1, 200) || !stringValue(body.body, 1, 100000) || body.synopsis != null && !stringValue(body.synopsis, 1, 2000) || !storyTags(body.tagIds))
      return invalid(reply, "Koleksi, slug, judul, isi, ringkasan, atau tag cerita tidak valid.");
    let result;
    try {
      result = await getDatabase().transaction(async (trx) => {
        const tenantId = request.tenantId!;
        const collection = await MoonwitnessCollectionModel.query(trx).where({ id: body.collectionId, tenant_id: tenantId }).first();
        if (!collection) return { error: "collection" as const };
        const tagIds = body.tagIds as string[] | undefined;
        if (tagIds?.length) {
          const found = await TagModel.query(trx).where({ tenant_id: tenantId }).whereNull("deleted_at").whereIn("id", tagIds).select("id");
          if (found.length !== tagIds.length) return { error: "tags" as const };
        }
        const story = await MoonwitnessStoryModel.query(trx).insert({
          tenantId, collectionId: collection.id, authorId: request.authUser!.id, slug: (body.slug as string).trim(),
          title: (body.title as string).trim(), synopsis: body.synopsis == null ? null : (body.synopsis as string).trim(), body: (body.body as string).trim(),
          editorialState: "draft", classification: "internal", visibility: "private", revision: 1,
        });
        if (tagIds?.length) await MoonwitnessStoryTagModel.query(trx).insert(tagIds.map((tagId) => ({ tenantId, storyId: story.id, tagId })));
        await appendStoryRevision(trx, story, request.authUser!.id, "Initial story draft", tagIds ?? []);
        return { story };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return conflict(reply, "Slug cerita sudah digunakan di koleksi ini.");
      throw error;
    }
    if (result.error === "collection") return reply.code(404).send({ status: "not_found", message: "Koleksi tidak ditemukan di tenant aktif." });
    if (result.error === "tags") return invalid(reply, "Semua tag harus aktif dan berada di tenant aktif.");
    return reply.code(201).send(result.story);
  });

  app.patch("/v1/moonwitness/stories/:id", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], summary: "Edit a draft or transition a tenant story", security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_STORY_PATCH_SCHEMA } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const allowed = ["title", "synopsis", "body", "editorialState", "classification", "visibility", "tagIds", "reason", "scheduledAt"];
    if (!uuidPattern.test(id) || !body || !Object.keys(body).length || Object.keys(body).some((key) => !allowed.includes(key))) return invalid(reply, "Perubahan cerita tidak valid.");
    if (body.title !== undefined && !stringValue(body.title, 1, 200) || body.synopsis != null && !stringValue(body.synopsis, 1, 2000) || body.body !== undefined && !stringValue(body.body, 1, 100000)) return invalid(reply, "Judul, ringkasan, atau isi cerita tidak valid.");
    if (body.classification !== undefined && !["public", "internal", "confidential", "restricted"].includes(body.classification as string)) return invalid(reply, "Klasifikasi tidak valid.");
    if (body.visibility !== undefined && !["private", "unlisted", "public"].includes(body.visibility as string)) return invalid(reply, "Visibilitas tidak valid.");
    if (!storyTags(body.tagIds)) return invalid(reply, "Daftar tag cerita tidak valid.");
    if (!stringValue(body.reason, 1, 500)) return invalid(reply, "Alasan perubahan wajib diisi (1–500 karakter).");
    if (body.scheduledAt !== undefined && (typeof body.scheduledAt !== "string" || !Number.isFinite(Date.parse(body.scheduledAt)) || Date.parse(body.scheduledAt) <= Date.now())) return invalid(reply, "Waktu jadwal harus berupa tanggal ISO di masa depan.");
    let result;
    try {
    result = await getDatabase().transaction(async (trx) => {
      const story = await MoonwitnessStoryModel.query(trx).where({ id, tenant_id: request.tenantId! }).forUpdate().first();
      if (!story) return { error: "missing" as const };
      const contentChanged = ["title", "synopsis", "body", "classification", "visibility", "tagIds"].some((key) => body[key] !== undefined);
      if (contentChanged && !["draft", "changes_requested"].includes(story.editorialState)) return { error: "locked" as const };
      if (body.editorialState !== undefined) {
        if (typeof body.editorialState !== "string" || !isEditorialTransitionAllowed("story", story.editorialState, body.editorialState)) return { error: "transition" as const };
        const isReviewDecision = ["approved", "changes_requested"].includes(body.editorialState) && story.editorialState === "in_review";
        const isUnpublish = body.editorialState === "approved" && story.editorialState === "published";
        if (isReviewDecision && !canReview(request)) return { error: "permission" as const };
        if (isReviewDecision && story.authorId === request.authUser!.id) return { error: "self_review" as const };
        if (isUnpublish && !canPublish(request)) return { error: "permission" as const };
        if (["published", "scheduled"].includes(body.editorialState) && !canPublish(request)) return { error: "permission" as const };
        if (["published", "scheduled"].includes(body.editorialState) && story.authorId === request.authUser!.id) return { error: "self_publish" as const };
        if (body.editorialState === "scheduled" && !body.scheduledAt) return { error: "schedule_time" as const };
        if (body.editorialState === "published") {
          const priorApproval = await AuditLogModel.query(trx).where({ entity: "moonwitness_story", entity_id: id, action: "MOONWITNESS_REVISION_APPROVED" }).whereRaw("payload ->> 'tenantId' = ?", [request.tenantId!]).orderBy("created_at", "desc").first();
          if (priorApproval?.userId === request.authUser!.id) return { error: "self_review" as const };
        }
      }
      const nextClassification = body.classification ?? story.classification;
      const nextVisibility = body.visibility ?? story.visibility;
      const nextState = body.editorialState ?? story.editorialState;
      if (nextState === "published" && (nextClassification !== "public" || nextVisibility !== "public")) return { error: "publication" as const };
      const tagIds = body.tagIds as string[] | undefined;
      if (tagIds) {
        const found = tagIds.length ? await TagModel.query(trx).where({ tenant_id: request.tenantId! }).whereNull("deleted_at").whereIn("id", tagIds).select("id") : [];
        if (found.length !== tagIds.length) return { error: "tags" as const };
        await MoonwitnessStoryTagModel.query(trx).where({ tenant_id: request.tenantId!, story_id: id }).delete();
        if (tagIds.length) await MoonwitnessStoryTagModel.query(trx).insert(tagIds.map((tagId) => ({ tenantId: request.tenantId!, storyId: id, tagId })));
      }
      const patch: Record<string, unknown> = { revision: story.revision + 1 };
      for (const key of ["title", "synopsis", "body", "editorialState", "classification", "visibility"]) if (body[key] !== undefined) patch[key] = typeof body[key] === "string" ? (body[key] as string).trim() : body[key];
      if (body.scheduledAt !== undefined) patch.scheduledAt = body.scheduledAt;
      // Editing after review invalidates that approval; the new immutable revision must be reviewed again.
      if (contentChanged && story.editorialState === "changes_requested") patch.editorialState = "draft";
      const updated = await story.$query(trx).patchAndFetch(patch);
      const nextTagIds = tagIds ?? (await MoonwitnessStoryTagModel.query(trx).where({ tenant_id: request.tenantId!, story_id: id }).select("tag_id")).map((tag: any) => tag.tagId);
      const revision = await appendStoryRevision(trx, updated, request.authUser!.id, body.reason as string, nextTagIds);
      if (body.editorialState === "changes_requested" || body.editorialState === "approved" && story.editorialState === "in_review") {
        await (AuditLogModel.query(trx) as any).insert({ userId: request.authUser!.id, action: body.editorialState === "approved" ? "MOONWITNESS_REVISION_APPROVED" : "MOONWITNESS_CHANGES_REQUESTED", entity: "moonwitness_story", entityId: id, payload: { tenantId: request.tenantId, revisionId: revision.id, revision: updated.revision, reason: body.reason }, ipAddress: request.ip });
      }
      if (body.editorialState === "published") {
        await (MoonwitnessPublicationModel.query(trx) as any).insert({ tenantId: request.tenantId!, storyId: id, revisionId: revision.id, publisherId: request.authUser!.id, snapshot: revision.snapshot, sha256: revision.sha256, publishedAt: new Date() });
        await (AuditLogModel.query(trx) as any).insert({ userId: request.authUser!.id, action: "MOONWITNESS_REVISION_PUBLISHED", entity: "moonwitness_story", entityId: id, payload: { tenantId: request.tenantId, revisionId: revision.id, revision: updated.revision, reason: body.reason }, ipAddress: request.ip });
      }
      if (body.editorialState === "approved" && story.editorialState === "published") {
        await (AuditLogModel.query(trx) as any).insert({ userId: request.authUser!.id, action: "MOONWITNESS_STORY_UNPUBLISHED", entity: "moonwitness_story", entityId: id, payload: { tenantId: request.tenantId, revision: updated.revision, reason: body.reason }, ipAddress: request.ip });
      }
      return { story: updated };
    });
    } catch (error) {
      if (isUniqueViolation(error)) return conflict(reply, "Slug cerita sudah digunakan di koleksi ini.");
      throw error;
    }
    if (result.error === "missing") return reply.code(404).send({ status: "not_found", message: "Cerita tidak ditemukan." });
    if (result.error === "transition") return conflict(reply, "Transisi editorial cerita tidak diizinkan.");
    if (result.error === "permission") return reply.code(403).send({ status: "forbidden", message: "Izin moonwitness:publish diperlukan." });
    if (result.error === "self_review" || result.error === "self_publish") return reply.code(403).send({ status: "forbidden", message: "Penulis tidak boleh menyetujui atau menerbitkan revisinya sendiri." });
    if (result.error === "locked") return conflict(reply, "Konten terkunci pada status ini; minta perubahan atau kembalikan status ke draft terlebih dahulu.");
    if (result.error === "schedule_time") return invalid(reply, "Jadwal publikasi memerlukan scheduledAt di masa depan.");
    if (result.error === "publication") return invalid(reply, "Cerita harus berklasifikasi public dan memiliki visibilitas public sebelum diterbitkan.");
    if (result.error === "tags") return invalid(reply, "Semua tag harus aktif dan berada di tenant aktif.");
    return result.story;
  });

  app.get("/v1/moonwitness/stories/:id/revisions", { preHandler: requirePermission("moonwitness:read") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!uuidPattern.test(id)) return invalid(reply, "ID cerita harus berupa UUID.");
    const story = await MoonwitnessStoryModel.query().where({ id, tenant_id: request.tenantId! }).first();
    if (!story) return reply.code(404).send({ status: "not_found", message: "Cerita tidak ditemukan." });
    return MoonwitnessContentRevisionModel.query().where({ tenant_id: request.tenantId!, story_id: id }).orderBy("revision", "desc");
  });

  app.get("/v1/moonwitness/stories/:id/publications", { preHandler: requirePermission("moonwitness:read") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!uuidPattern.test(id)) return invalid(reply, "ID cerita harus berupa UUID.");
    const story = await MoonwitnessStoryModel.query().where({ id, tenant_id: request.tenantId! }).first();
    if (!story) return reply.code(404).send({ status: "not_found", message: "Cerita tidak ditemukan." });
    return MoonwitnessPublicationModel.query().where({ tenant_id: request.tenantId!, story_id: id }).orderBy("published_at", "desc");
  });

  app.post("/v1/moonwitness/stories/:id/restore", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], security: [{ bearerAuth: [], tenantSelection: [] }], body: { type: "object", additionalProperties: false, required: ["revisionId", "reason"], properties: { revisionId: { type: "string", format: "uuid" }, reason: { type: "string", minLength: 1, maxLength: 500 } } } } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { revisionId?: unknown; reason?: unknown };
    if (!uuidPattern.test(id) || !body || typeof body.revisionId !== "string" || !uuidPattern.test(body.revisionId) || !stringValue(body.reason, 1, 500)) return invalid(reply, "ID revisi atau alasan pemulihan tidak valid.");
    const result = await getDatabase().transaction(async (trx) => {
      const story = await MoonwitnessStoryModel.query(trx).where({ id, tenant_id: request.tenantId! }).forUpdate().first();
      if (!story) return { error: "missing" as const };
      if (!["draft", "changes_requested", "archived", "approved"].includes(story.editorialState)) return { error: "locked" as const };
      const source = await MoonwitnessContentRevisionModel.query(trx).where({ id: body.revisionId as string, tenant_id: request.tenantId!, story_id: id }).first();
      if (!source) return { error: "revision" as const };
      const snapshot = source.snapshot as Record<string, any>;
      const tagIds = Array.isArray(snapshot.tagIds) ? snapshot.tagIds as string[] : [];
      await MoonwitnessStoryTagModel.query(trx).where({ tenant_id: request.tenantId!, story_id: id }).delete();
      if (tagIds.length) await MoonwitnessStoryTagModel.query(trx).insert(tagIds.map((tagId) => ({ tenantId: request.tenantId!, storyId: id, tagId })));
      const restored = await story.$query(trx).patchAndFetch({ title: snapshot.title, synopsis: snapshot.synopsis ?? null, body: snapshot.body, classification: snapshot.classification, visibility: snapshot.visibility, editorialState: "draft", revision: story.revision + 1 });
      const revision = await appendStoryRevision(trx, restored, request.authUser!.id, body.reason as string, tagIds);
      await (AuditLogModel.query(trx) as any).insert({ userId: request.authUser!.id, action: "MOONWITNESS_REVISION_RESTORED", entity: "moonwitness_story", entityId: id, payload: { tenantId: request.tenantId, sourceRevisionId: source.id, revisionId: revision.id, reason: body.reason }, ipAddress: request.ip });
      return { story: restored };
    });
    if (result.error === "missing") return reply.code(404).send({ status: "not_found", message: "Cerita tidak ditemukan." });
    if (result.error === "revision") return reply.code(404).send({ status: "not_found", message: "Revisi tidak ditemukan di tenant aktif." });
    if (result.error === "locked") return conflict(reply, "Story harus dihentikan atau diminta perubahannya sebelum dipulihkan.");
    return result.story;
  });
}

export async function moonwitnessPublicStoryRoutes(app: FastifyInstance) {
  app.get("/v1/public/moonwitness/stories", async (request) => {
    const query = request.query as { collectionSlug?: string; limit?: string };
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    let collections = MoonwitnessCollectionModel.query()
      .where({ status: "published", visibility: "public" })
      .select("id", "title", "slug");
    if (query.collectionSlug) collections = collections.where({ slug: query.collectionSlug });
    const visibleCollections = await collections;
    if (!visibleCollections.length) return { items: [] };
    const stories = await MoonwitnessStoryModel.query()
      .whereIn("collection_id", visibleCollections.map((collection) => collection.id))
      .where({ editorial_state: "published", classification: "public", visibility: "public" })
      .select("id", "collection_id", "slug", "title", "synopsis", "body", "editorial_state", "classification", "visibility", "created_at", "updated_at")
      .orderBy("created_at", "desc")
      .limit(limit);
    const collectionById = new Map(visibleCollections.map((collection) => [collection.id, collection]));
    return { items: stories.filter((story) => isPublicEditorialProjection(collectionById.get(story.collectionId)!, story)).map((story) => ({
      id: story.id, collectionId: story.collectionId, slug: story.slug, title: story.title, synopsis: story.synopsis, body: story.body,
      createdAt: story.createdAt, updatedAt: story.updatedAt,
      collection: { id: collectionById.get(story.collectionId)!.id, slug: collectionById.get(story.collectionId)!.slug, title: collectionById.get(story.collectionId)!.title },
    })) };
  });
}
