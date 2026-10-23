import type { FastifyInstance, FastifyReply } from "fastify";
import { getDatabase } from "@empire/batteries";
import {
  PUBLIC_MOONWITNESS_COLLECTION_SCHEMA, PUBLIC_MOONWITNESS_EPISODE_SCHEMA,
  PUBLIC_MOONWITNESS_ERROR_SCHEMA, PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA,
  PUBLIC_MOONWITNESS_PAGE_QUERY_SCHEMA, PUBLIC_MOONWITNESS_PAGE_SCHEMA, PUBLIC_MOONWITNESS_SIGNAL_UNAVAILABLE_SCHEMA,
  PUBLIC_MOONWITNESS_STORY_SCHEMA,
} from "@empire/api-contract";

const slugPattern = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
const collectionParams = { type: "object", additionalProperties: false, required: ["collectionSlug"], properties: { collectionSlug: { type: "string", pattern: slugPattern } } } as const;
const storyParams = { type: "object", additionalProperties: false, required: ["collectionSlug", "storySlug"], properties: { collectionSlug: { type: "string", pattern: slugPattern }, storySlug: { type: "string", pattern: slugPattern } } } as const;
const episodeParams = { type: "object", additionalProperties: false, required: ["collectionSlug", "storySlug", "episodeSlug"], properties: { collectionSlug: { type: "string", pattern: slugPattern }, storySlug: { type: "string", pattern: slugPattern }, episodeSlug: { type: "string", pattern: slugPattern } } } as const;
const pageParams = { type: "object", additionalProperties: false, required: ["collectionSlug", "storySlug", "episodeSlug", "sceneSlug", "sequence"], properties: { collectionSlug: { type: "string", pattern: slugPattern }, storySlug: { type: "string", pattern: slugPattern }, episodeSlug: { type: "string", pattern: slugPattern }, sceneSlug: { type: "string", pattern: slugPattern }, sequence: { type: "integer", minimum: 1 } } } as const;
const pageDtoSchema = PUBLIC_MOONWITNESS_PAGE_SCHEMA;
const pageListResponse = { ...PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA, properties: { ...PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA.properties, items: { type: "array", items: pageDtoSchema } } } as const;
const collectionListResponse = { ...PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA, properties: { ...PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA.properties, items: { type: "array", items: PUBLIC_MOONWITNESS_COLLECTION_SCHEMA } } } as const;
const storyListResponse = { ...PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA, properties: { ...PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA.properties, items: { type: "array", items: PUBLIC_MOONWITNESS_STORY_SCHEMA } } } as const;
const episodeListResponse = { ...PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA, properties: { ...PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA.properties, items: { type: "array", items: { type: "object", additionalProperties: false, required: ["slug", "title", "synopsis", "sequence"], properties: { slug: { type: "string" }, title: { type: "string" }, synopsis: { anyOf: [{ type: "string" }, { type: "null" }] }, sequence: { type: "integer" } } } } } } as const;

export function parsePublicPage(query: Record<string, unknown>) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  return { page: Number.isInteger(page) && page > 0 ? Math.min(page, 100000) : 1, limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20 };
}

export function projectPublicCollection(row: Record<string, any>) {
  return { slug: row.slug, title: row.title, language: row.language };
}

export function projectPublicStory(row: Record<string, any>) {
  const snapshot = typeof row.snapshot === "string" ? JSON.parse(row.snapshot) as Record<string, any> : row.snapshot;
  if (!snapshot || snapshot.classification !== "public" || snapshot.visibility !== "public" || typeof snapshot.title !== "string" || typeof snapshot.body !== "string") return null;
  return {
    slug: snapshot.slug,
    title: snapshot.title,
    synopsis: snapshot.synopsis ?? null,
    body: snapshot.body,
    publishedAt: new Date(row.publishedAt).toISOString(),
    collection: { slug: row.collectionSlug, title: row.collectionTitle, language: row.language },
  };
}

function pageMeta(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  return { page, limit, total, totalPages, hasNextPage: page < totalPages };
}

async function publicCollectionQuery(db: any) {
  return db("moonwitness_collections as c").where({ "c.status": "published", "c.visibility": "public" });
}

function publicStoriesQuery(db: any) {
  return db("moonwitness_publications as p")
    .join("moonwitness_stories as s", function (this: any) { this.on("s.tenant_id", "=", "p.tenant_id").andOn("s.id", "=", "p.story_id"); })
    .join("moonwitness_collections as c", function (this: any) { this.on("c.tenant_id", "=", "s.tenant_id").andOn("c.id", "=", "s.collection_id"); })
    .where({ "s.editorial_state": "published", "s.classification": "public", "s.visibility": "public", "c.status": "published", "c.visibility": "public" })
    .whereRaw("p.id = (select p2.id from moonwitness_publications p2 where p2.tenant_id = s.tenant_id and p2.story_id = s.id order by p2.published_at desc, p2.id desc limit 1)")
    .whereRaw("p.snapshot ->> 'classification' = ? and p.snapshot ->> 'visibility' = ?", ["public", "public"]);
}

async function resolvePublicStory(db: any, collectionSlug: string, storySlug: string) {
  const rows = await publicStoriesQuery(db).where({ "c.slug": collectionSlug, "s.slug": storySlug })
    .select({ storyId: "s.id", tenantId: "s.tenant_id", collectionSlug: "c.slug", collectionTitle: "c.title", language: "c.language", snapshot: "p.snapshot", publishedAt: "p.published_at" }).limit(2);
  if (rows.length !== 1) return null;
  const projection = projectPublicStory(rows[0]);
  return projection ? { tenantId: rows[0].tenantId, storyId: rows[0].storyId, projection } : null;
}

function notFound(reply: FastifyReply) { return reply.code(404).send({ status: "not_found", message: "Konten publik tidak ditemukan." }); }
function pageNumber(request: { query: unknown }) { return parsePublicPage((request.query ?? {}) as Record<string, unknown>); }

export async function moonwitnessPublicApiRoutes(app: FastifyInstance) {
  app.addHook("onRoute", (route) => {
    if (route.url.startsWith("/v1/public/moonwitness/")) {
      route.config = { ...route.config, rateLimit: { max: 120, timeWindow: "1 minute" } };
    }
  });
  // Deliberately no session or tenant-selection hook: each query is explicitly
  // constrained to currently public content and projects an allowlisted DTO.
  app.get("/v1/public/moonwitness/collections", { schema: { tags: ["MOONWITNESS Public"], security: [], querystring: PUBLIC_MOONWITNESS_PAGE_QUERY_SCHEMA, response: { 200: collectionListResponse } } }, async (request) => {
    const query = request.query as Record<string, unknown>; const { page, limit } = pageNumber(request);
    const db = getDatabase() as any; let rowsQuery = await publicCollectionQuery(db);
    if (query.language) rowsQuery = rowsQuery.where({ "c.language": query.language });
    if (typeof query.q === "string" && query.q.trim()) rowsQuery = rowsQuery.whereILike("c.title", `%${query.q.trim().slice(0, 100)}%`);
    const count = await rowsQuery.clone().count({ total: "c.id" }).first();
    const rows = await rowsQuery.clone().select("c.slug", "c.title", "c.language").orderBy(query.sort === "title" ? "c.title" : "c.slug", query.direction === "desc" ? "desc" : "asc").limit(limit).offset((page - 1) * limit);
    return { items: rows.map(projectPublicCollection), ...pageMeta(page, limit, Number(count?.total ?? 0)) };
  });

  app.get("/v1/public/moonwitness/collections/:collectionSlug", { schema: { tags: ["MOONWITNESS Public"], security: [], params: collectionParams, response: { 200: PUBLIC_MOONWITNESS_COLLECTION_SCHEMA, 404: PUBLIC_MOONWITNESS_ERROR_SCHEMA } } }, async (request, reply) => {
    const { collectionSlug } = request.params as { collectionSlug: string }; const db = getDatabase() as any;
    const rows = await (await publicCollectionQuery(db)).where({ "c.slug": collectionSlug }).select("c.slug", "c.title", "c.language").limit(2);
    if (rows.length !== 1) return notFound(reply);
    return projectPublicCollection(rows[0]);
  });

  app.get("/v1/public/moonwitness/collections/:collectionSlug/stories", { schema: { tags: ["MOONWITNESS Public"], security: [], params: collectionParams, querystring: PUBLIC_MOONWITNESS_PAGE_QUERY_SCHEMA, response: { 200: storyListResponse, 404: PUBLIC_MOONWITNESS_ERROR_SCHEMA } } }, async (request, reply) => {
    const { collectionSlug } = request.params as { collectionSlug: string }; const query = request.query as Record<string, unknown>; const { page, limit } = pageNumber(request); const db = getDatabase() as any;
    const collectionRows = await (await publicCollectionQuery(db)).where({ "c.slug": collectionSlug }).select("c.id").limit(2);
    if (collectionRows.length !== 1) return notFound(reply);
    let rowsQuery = publicStoriesQuery(db).where({ "c.slug": collectionSlug });
    if (query.language) rowsQuery = rowsQuery.where({ "c.language": query.language });
    if (typeof query.q === "string" && query.q.trim()) rowsQuery = rowsQuery.whereRaw("p.snapshot ->> 'title' ILIKE ?", [`%${query.q.trim().slice(0, 100)}%`]);
    const count = await rowsQuery.clone().count({ total: "s.id" }).first();
    const rows = await rowsQuery.clone().select({ snapshot: "p.snapshot", publishedAt: "p.published_at", collectionSlug: "c.slug", collectionTitle: "c.title", language: "c.language" })
      .orderByRaw(query.sort === "title" ? `p.snapshot ->> 'title' ${query.direction === "asc" ? "asc" : "desc"}` : `p.published_at ${query.direction === "asc" ? "asc" : "desc"}`).orderBy("s.slug", "asc").limit(limit).offset((page - 1) * limit);
    return { items: rows.map(projectPublicStory).filter(Boolean), ...pageMeta(page, limit, Number(count?.total ?? 0)) };
  });

  // Legacy collection-agnostic listing remains available, now backed only by
  // the same approved publication snapshot projection as the scoped endpoint.
  app.get("/v1/public/moonwitness/stories", { schema: { tags: ["MOONWITNESS Public"], security: [], querystring: PUBLIC_MOONWITNESS_PAGE_QUERY_SCHEMA, response: { 200: storyListResponse } } }, async (request) => {
    const query = request.query as Record<string, unknown>; const { page, limit } = pageNumber(request); const db = getDatabase() as any;
    let rowsQuery = publicStoriesQuery(db);
    if (typeof query.language === "string") rowsQuery = rowsQuery.where({ "c.language": query.language });
    if (typeof query.q === "string" && query.q.trim()) rowsQuery = rowsQuery.whereRaw("p.snapshot ->> 'title' ILIKE ?", [`%${query.q.trim().slice(0, 100)}%`]);
    const count = await rowsQuery.clone().count({ total: "s.id" }).first();
    const rows = await rowsQuery.clone().select({ snapshot: "p.snapshot", publishedAt: "p.published_at", collectionSlug: "c.slug", collectionTitle: "c.title", language: "c.language" })
      .orderByRaw(query.sort === "title" ? `p.snapshot ->> 'title' ${query.direction === "asc" ? "asc" : "desc"}` : `p.published_at ${query.direction === "asc" ? "asc" : "desc"}`).orderBy("s.slug", "asc").limit(limit).offset((page - 1) * limit);
    return { items: rows.map(projectPublicStory).filter(Boolean), ...pageMeta(page, limit, Number(count?.total ?? 0)) };
  });

  app.get("/v1/public/moonwitness/collections/:collectionSlug/stories/:storySlug", { schema: { tags: ["MOONWITNESS Public"], security: [], params: storyParams, response: { 200: PUBLIC_MOONWITNESS_STORY_SCHEMA, 404: PUBLIC_MOONWITNESS_ERROR_SCHEMA } } }, async (request, reply) => {
    const { collectionSlug, storySlug } = request.params as { collectionSlug: string; storySlug: string }; const db = getDatabase() as any;
    const found = await resolvePublicStory(db, collectionSlug, storySlug); return found ? found.projection : notFound(reply);
  });

  app.get("/v1/public/moonwitness/collections/:collectionSlug/stories/:storySlug/episodes", { schema: { tags: ["MOONWITNESS Public"], security: [], params: storyParams, querystring: PUBLIC_MOONWITNESS_PAGE_QUERY_SCHEMA, response: { 200: episodeListResponse, 404: PUBLIC_MOONWITNESS_ERROR_SCHEMA } } }, async (request, reply) => {
    const { collectionSlug, storySlug } = request.params as { collectionSlug: string; storySlug: string }; const { page, limit } = pageNumber(request); const db = getDatabase() as any;
    const story = await resolvePublicStory(db, collectionSlug, storySlug); if (!story) return notFound(reply);
    const episodes = db("moonwitness_episodes").where({ tenant_id: story.tenantId, story_id: story.storyId, status: "published" });
    const count = await episodes.clone().count({ total: "id" }).first();
    const rows = await episodes.clone().select("slug", "title", "synopsis", "sequence").orderBy("sequence", "asc").limit(limit).offset((page - 1) * limit);
    return { items: rows, ...pageMeta(page, limit, Number(count?.total ?? 0)) };
  });

  app.get("/v1/public/moonwitness/collections/:collectionSlug/stories/:storySlug/episodes/:episodeSlug", { schema: { tags: ["MOONWITNESS Public"], security: [], params: episodeParams, response: { 200: PUBLIC_MOONWITNESS_EPISODE_SCHEMA, 404: PUBLIC_MOONWITNESS_ERROR_SCHEMA } } }, async (request, reply) => {
    const { collectionSlug, storySlug, episodeSlug } = request.params as { collectionSlug: string; storySlug: string; episodeSlug: string }; const db = getDatabase() as any;
    const story = await resolvePublicStory(db, collectionSlug, storySlug); if (!story) return notFound(reply);
    const episode = await db("moonwitness_episodes").where({ tenant_id: story.tenantId, story_id: story.storyId, slug: episodeSlug, status: "published" }).select("id", "slug", "title", "synopsis", "sequence").first();
    if (!episode) return notFound(reply);
    const sceneRows = await db("moonwitness_scenes").where({ tenant_id: story.tenantId, episode_id: episode.id, status: "published" }).select("id", "slug", "title", "sequence").orderBy("sequence", "asc");
    const scenes = await Promise.all(sceneRows.map(async (scene: any) => {
      const pages = await db("moonwitness_comic_pages").where({ tenant_id: story.tenantId, scene_id: scene.id, status: "published" }).select("sequence", "alt_text").orderBy("sequence", "asc");
      return { slug: scene.slug, title: scene.title, sequence: scene.sequence, pages: pages.map((item: any) => ({ sequence: item.sequence, altText: item.alt_text, assetUrl: null as null })) };
    }));
    return { slug: episode.slug, title: episode.title, synopsis: episode.synopsis, sequence: episode.sequence, scenes };
  });

  app.get("/v1/public/moonwitness/collections/:collectionSlug/stories/:storySlug/episodes/:episodeSlug/pages", { schema: { tags: ["MOONWITNESS Public"], security: [], params: episodeParams, querystring: PUBLIC_MOONWITNESS_PAGE_QUERY_SCHEMA, response: { 200: pageListResponse, 404: PUBLIC_MOONWITNESS_ERROR_SCHEMA } } }, async (request, reply) => {
    const { collectionSlug, storySlug, episodeSlug } = request.params as { collectionSlug: string; storySlug: string; episodeSlug: string }; const { page, limit } = pageNumber(request); const db = getDatabase() as any;
    const story = await resolvePublicStory(db, collectionSlug, storySlug); if (!story) return notFound(reply);
    const episode = await db("moonwitness_episodes").where({ tenant_id: story.tenantId, story_id: story.storyId, slug: episodeSlug, status: "published" }).select("id").first();
    if (!episode) return notFound(reply);
    const rowsQuery = db("moonwitness_comic_pages as p").join("moonwitness_scenes as s", function (this: any) { this.on("s.tenant_id", "=", "p.tenant_id").andOn("s.id", "=", "p.scene_id"); })
      .where({ "p.tenant_id": story.tenantId, "s.episode_id": episode.id, "s.status": "published", "p.status": "published" });
    const count = await rowsQuery.clone().count({ total: "p.id" }).first();
    const rows = await rowsQuery.clone().select({ sceneSlug: "s.slug", sequence: "p.sequence", altText: "p.alt_text" }).orderBy("s.sequence", "asc").orderBy("p.sequence", "asc").limit(limit).offset((page - 1) * limit);
    return { items: rows.map((item: any) => ({ ...item, assetUrl: null })), ...pageMeta(page, limit, Number(count?.total ?? 0)) };
  });

  app.get("/v1/public/moonwitness/collections/:collectionSlug/stories/:storySlug/episodes/:episodeSlug/pages/:sceneSlug/:sequence", { schema: { tags: ["MOONWITNESS Public"], security: [], params: pageParams, response: { 200: pageDtoSchema, 404: PUBLIC_MOONWITNESS_ERROR_SCHEMA } } }, async (request, reply) => {
    const { collectionSlug, storySlug, episodeSlug, sceneSlug, sequence } = request.params as { collectionSlug: string; storySlug: string; episodeSlug: string; sceneSlug: string; sequence: number };
    const db = getDatabase() as any; const story = await resolvePublicStory(db, collectionSlug, storySlug); if (!story) return notFound(reply);
    const episode = await db("moonwitness_episodes").where({ tenant_id: story.tenantId, story_id: story.storyId, slug: episodeSlug, status: "published" }).select("id").first();
    if (!episode) return notFound(reply);
    const row = await db("moonwitness_comic_pages as p").join("moonwitness_scenes as s", function (this: any) { this.on("s.tenant_id", "=", "p.tenant_id").andOn("s.id", "=", "p.scene_id"); })
      .where({ "p.tenant_id": story.tenantId, "s.episode_id": episode.id, "s.slug": sceneSlug, "s.status": "published", "p.sequence": Number(sequence), "p.status": "published" })
      .select({ sceneSlug: "s.slug", sequence: "p.sequence", altText: "p.alt_text" }).first();
    return row ? { ...row, assetUrl: null } : notFound(reply);
  });

  app.get("/v1/public/moonwitness/signals", { schema: { tags: ["MOONWITNESS Public"], security: [], querystring: PUBLIC_MOONWITNESS_PAGE_QUERY_SCHEMA, response: { 503: PUBLIC_MOONWITNESS_SIGNAL_UNAVAILABLE_SCHEMA } } }, async (_request, reply) =>
    reply.code(503).send({ status: "publication_unavailable", message: "Public Signal reads await a reviewed, immutable Signal publication workflow." }));

  app.get("/v1/public/moonwitness/signals/:signalId", { schema: { tags: ["MOONWITNESS Public"], security: [], params: { type: "object", required: ["signalId"], properties: { signalId: { type: "string", format: "uuid" } } }, response: { 503: PUBLIC_MOONWITNESS_SIGNAL_UNAVAILABLE_SCHEMA } } }, async (_request, reply) =>
    reply.code(503).send({ status: "publication_unavailable", message: "Public Signal reads await a reviewed, immutable Signal publication workflow." }));
}
