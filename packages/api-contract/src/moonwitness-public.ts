/** Public page metadata deliberately withholds storage URLs until a reviewed delivery layer exists. */
export interface PublicPageDto { sceneSlug: string; sequence: number; altText: string; assetUrl: null }
export interface PublicSceneDto { slug: string; title: string; sequence: number; pages: PublicPageDto[] }
export interface PublicEpisodeDto { slug: string; title: string; synopsis: string | null; sequence: number; scenes: PublicSceneDto[] }
export interface PublicCollectionDto { slug: string; title: string; language: string }
export interface PublicStoryDto {
  slug: string; title: string; synopsis: string | null; body: string; publishedAt: string;
  collection: PublicCollectionDto;
}
export interface PublicListDto<T> { items: T[]; page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean }
export interface PublicApiErrorDto { status: "not_found" | "publication_unavailable"; message: string }

export const PUBLIC_MOONWITNESS_PAGE_QUERY_SCHEMA = {
  type: "object", additionalProperties: false, properties: {
    page: { type: "integer", minimum: 1, maximum: 100000 }, limit: { type: "integer", minimum: 1, maximum: 100 }, language: { type: "string", enum: ["id", "en", "ar"] },
    q: { type: "string", maxLength: 100 }, sort: { type: "string", enum: ["publishedAt", "title", "slug"] }, direction: { type: "string", enum: ["asc", "desc"] },
  },
} as const;

export const PUBLIC_MOONWITNESS_LIST_RESPONSE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["items", "page", "limit", "total", "totalPages", "hasNextPage"], properties: {
    items: { type: "array", items: { type: "object" } }, page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" }, hasNextPage: { type: "boolean" },
  },
} as const;

export const PUBLIC_MOONWITNESS_PAGE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["sceneSlug", "sequence", "altText", "assetUrl"], properties: {
    sceneSlug: { type: "string" }, sequence: { type: "integer", minimum: 1 }, altText: { type: "string" }, assetUrl: { type: "null" },
  },
} as const;

export const PUBLIC_MOONWITNESS_SCENE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["slug", "title", "sequence", "pages"], properties: {
    slug: { type: "string" }, title: { type: "string" }, sequence: { type: "integer", minimum: 1 },
    pages: { type: "array", items: PUBLIC_MOONWITNESS_PAGE_SCHEMA },
  },
} as const;

export const PUBLIC_MOONWITNESS_COLLECTION_SCHEMA = {
  type: "object", additionalProperties: false, required: ["slug", "title", "language"], properties: {
    slug: { type: "string" }, title: { type: "string" }, language: { type: "string", enum: ["id", "en", "ar"] },
  },
} as const;

export const PUBLIC_MOONWITNESS_STORY_SCHEMA = {
  type: "object", additionalProperties: false, required: ["slug", "title", "synopsis", "body", "publishedAt", "collection"], properties: {
    slug: { type: "string" }, title: { type: "string" }, synopsis: { anyOf: [{ type: "string" }, { type: "null" }] }, body: { type: "string" }, publishedAt: { type: "string", format: "date-time" }, collection: PUBLIC_MOONWITNESS_COLLECTION_SCHEMA,
  },
} as const;

export const PUBLIC_MOONWITNESS_EPISODE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["slug", "title", "synopsis", "sequence", "scenes"], properties: {
    slug: { type: "string" }, title: { type: "string" }, synopsis: { anyOf: [{ type: "string" }, { type: "null" }] }, sequence: { type: "integer" },
    scenes: { type: "array", items: PUBLIC_MOONWITNESS_SCENE_SCHEMA },
  },
} as const;

export const PUBLIC_MOONWITNESS_ERROR_SCHEMA = {
  type: "object", additionalProperties: false, required: ["status", "message"], properties: { status: { type: "string", enum: ["not_found", "publication_unavailable"] }, message: { type: "string" } },
} as const;

export const PUBLIC_MOONWITNESS_SIGNAL_UNAVAILABLE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["status", "message"], properties: { status: { const: "publication_unavailable" }, message: { type: "string" } },
} as const;
