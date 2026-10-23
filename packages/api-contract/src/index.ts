export const API_PATHS = {
  openapi: "/openapi.json",
  health: "/v1/health",
  readiness: "/v1/readiness",
  capabilities: "/v1/metadata/capabilities",
  modules: "/v1/modules",
  dnaRegistry: "/v1/dna/registry",
  worldMonitor: "/v1/world-monitor",
  worldMonitorYoutube: "/v1/world-monitor/youtube",
  worldMonitorYoutubeScan: "/v1/world-monitor/youtube/scan",
  worldMonitorYoutubeAction: "/v1/world-monitor/youtube/action",
  worldMonitorYoutubeSchedule: "/v1/world-monitor/youtube/schedule",
  worldMonitorYoutubePartner: "/v1/world-monitor/youtube/partner",
  continuum: "/continuum",

  continuumAgents: "/continuum/agents",
  continuumAsma: "/continuum/asma",
  continuumChronicles: "/continuum/chronicles",
  users: "/users",
  partners: "/partners",
  workspaces: "/v1/workspaces",
  projects: "/v1/projects",
  tasks: "/v1/tasks",
  documents: "/v1/documents",
  comments: "/v1/comments",
  tags: "/v1/tags",
  tagAssignments: "/v1/tag-assignments",
  notifications: "/v1/notifications",
  activity: "/v1/activity",
  crmOpportunities: "/v1/crm/opportunities",
  businessPartners: "/v1/business/partners",
  catalogItems: "/v1/catalog/items",
  salesQuotes: "/v1/sales/quotes",
  salesOrders: "/v1/sales/orders",
  invoices: "/v1/finance/invoices",
  expenses: "/v1/finance/expenses",
  activities: "/v1/activities",
  youtubePartnerLinks: "/v1/youtube-partner-links",
  login: "/auth/login",
  session: "/auth/session",
  logout: "/auth/logout",
  cabSummary: "/continuum/cab/summary",
  cabRfcs: "/continuum/cab/rfcs",
  researchRuns: "/v1/research-runs",
  moonwitnessCollections: "/v1/moonwitness/collections",
  moonwitnessStories: "/v1/moonwitness/stories",
  moonwitnessEpisodes: "/v1/moonwitness/stories/{storyId}/episodes",
  moonwitnessScenes: "/v1/moonwitness/episodes/{episodeId}/scenes",
  moonwitnessComicPages: "/v1/moonwitness/scenes/{sceneId}/pages",
  moonwitnessPublicStories: "/v1/public/moonwitness/stories",
  moonwitnessCharacters: "/v1/moonwitness/characters",
  moonwitnessSignals: "/v1/moonwitness/signals",
} as const;

export type MoonwitnessContentCategory = "fiction" | "user_testimony" | "scriptural_quotation" | "historical_assertion" | "interpretation" | "empirical_claim" | "project_concept";
export type MoonwitnessEditorialClassification = "public" | "internal" | "confidential" | "restricted";
export const MOONWITNESS_CHARACTER_CREATE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["slug", "displayName", "kind"], properties: {
    slug: { type: "string", minLength: 1, maxLength: 80, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    displayName: { type: "string", minLength: 1, maxLength: 160 }, aliases: { type: "array", maxItems: 30, uniqueItems: true, items: { type: "string", minLength: 1, maxLength: 160 } },
    kind: { type: "string", enum: ["fictional", "real_contributor"] }, collectionId: { type: "string", format: "uuid" }, storyId: { type: "string", format: "uuid" },
    editorialClassification: { type: "string", enum: ["public", "internal", "confidential", "restricted"] },
    consentStatus: { type: "string", enum: ["granted"] }, consentScope: { type: "string", minLength: 1, maxLength: 2000 }, consentCapturedAt: { type: "string", format: "date-time" },
  },
} as const;
export const MOONWITNESS_CHARACTER_PATCH_SCHEMA = {
  type: "object", additionalProperties: false, minProperties: 1,
  allOf: [
    { if: { properties: { consentStatus: { const: "granted" } }, required: ["consentStatus"] }, then: { required: ["consentScope", "consentCapturedAt"] } },
    { if: { properties: { consentStatus: { const: "revoked" } }, required: ["consentStatus"] }, then: { required: ["consentRevokedAt"] } },
  ], properties: {
    displayName: { type: "string", minLength: 1, maxLength: 160 }, aliases: { type: "array", maxItems: 30, uniqueItems: true, items: { type: "string", minLength: 1, maxLength: 160 } },
    editorialClassification: { type: "string", enum: ["public", "internal", "confidential", "restricted"] },
    consentStatus: { type: "string", enum: ["granted", "revoked"] }, consentScope: { type: "string", minLength: 1, maxLength: 2000 }, consentCapturedAt: { type: "string", format: "date-time" }, consentRevokedAt: { type: "string", format: "date-time" },
  },
} as const;
export const MOONWITNESS_SIGNAL_CREATE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["title", "body", "contentCategory"], allOf: [{ if: { properties: { sensitiveLocation: { const: true } }, required: ["sensitiveLocation"] }, then: { properties: { locationDisclosure: { const: "none" } }, required: ["locationDisclosure"], not: { required: ["locationLabel"] } } }], properties: {
    title: { type: "string", minLength: 1, maxLength: 200 }, body: { type: "string", minLength: 1, maxLength: 30000 }, characterId: { type: "string", format: "uuid" },
    contentCategory: { type: "string", enum: ["fiction", "user_testimony", "scriptural_quotation", "historical_assertion", "interpretation", "empirical_claim", "project_concept"] },
    editorialClassification: { type: "string", enum: ["public", "internal", "confidential", "restricted"] }, claimedAt: { type: "string", format: "date-time" }, observedAt: { type: "string", format: "date-time" },
    sourceMetadata: { type: "object", additionalProperties: false, properties: { sourceName: { type: "string", maxLength: 200 }, sourceUrl: { type: "string", maxLength: 2048 }, sourcePublishedAt: { type: "string", format: "date-time" }, notes: { type: "string", maxLength: 2000 } } },
    evidenceLinks: { type: "array", maxItems: 50, items: { type: "object", additionalProperties: false, required: ["label", "url"], properties: { label: { type: "string", minLength: 1, maxLength: 160 }, url: { type: "string", minLength: 1, maxLength: 2048 } } } },
    sensitiveLocation: { type: "boolean" }, locationDisclosure: { type: "string", enum: ["none", "generalized"] }, locationLabel: { type: "string", maxLength: 120 },
  },
} as const;
export const MOONWITNESS_SIGNAL_PATCH_SCHEMA = {
  type: "object", additionalProperties: false, minProperties: 1, allOf: [{ if: { properties: { sensitiveLocation: { const: true } }, required: ["sensitiveLocation"] }, then: { properties: { locationDisclosure: { const: "none" } }, required: ["locationDisclosure"], not: { required: ["locationLabel"] } } }], properties: {
    title: { type: "string", minLength: 1, maxLength: 200 }, body: { type: "string", minLength: 1, maxLength: 30000 }, contentCategory: { type: "string", enum: ["fiction", "user_testimony", "scriptural_quotation", "historical_assertion", "interpretation", "empirical_claim", "project_concept"] },
    editorialClassification: { type: "string", enum: ["public", "internal", "confidential", "restricted"] }, claimedAt: { type: "string", format: "date-time" }, observedAt: { type: "string", format: "date-time" },
    sourceMetadata: { type: "object", additionalProperties: false, properties: { sourceName: { type: "string", maxLength: 200 }, sourceUrl: { type: "string", maxLength: 2048 }, sourcePublishedAt: { type: "string", format: "date-time" }, notes: { type: "string", maxLength: 2000 } } },
    evidenceLinks: { type: "array", maxItems: 50, items: { type: "object", additionalProperties: false, required: ["label", "url"], properties: { label: { type: "string", minLength: 1, maxLength: 160 }, url: { type: "string", minLength: 1, maxLength: 2048 } } } },
    sensitiveLocation: { type: "boolean" }, locationDisclosure: { type: "string", enum: ["none", "generalized"] }, locationLabel: { type: "string", maxLength: 120 },
    testimonyConsentStatus: { type: "string", enum: ["granted", "revoked"] }, testimonyConsentScope: { type: "string", minLength: 1, maxLength: 2000 }, testimonyConsentCapturedAt: { type: "string", format: "date-time" }, testimonyConsentRevokedAt: { type: "string", format: "date-time" },
  },
} as const;

export type EditorialClassification = "public" | "internal" | "confidential" | "restricted";
export type EditorialVisibility = "private" | "unlisted" | "public";
export type CollectionStatus = "draft" | "published" | "archived";
export type StoryEditorialState = "draft" | "in_review" | "approved" | "published" | "archived";
export interface MoonwitnessCollectionDto {
  id: string; tenantId: string; ownerId: string; slug: string; title: string; cover: string | null;
  theme: string; language: "id" | "en" | "ar"; status: CollectionStatus; visibility: EditorialVisibility;
  createdAt: string; updatedAt: string;
}
export interface MoonwitnessStoryDto {
  id: string; tenantId: string; collectionId: string; authorId: string; slug: string; title: string;
  synopsis: string | null; body: string; editorialState: StoryEditorialState; classification: EditorialClassification;
  visibility: EditorialVisibility; revision: number; tagIds?: string[]; createdAt: string; updatedAt: string;
}
export interface MoonwitnessPublicStoryDto extends Pick<MoonwitnessStoryDto, "id" | "collectionId" | "slug" | "title" | "synopsis" | "body" | "createdAt" | "updatedAt"> {
  collection: { id: string; slug: string; title: string };
}
export interface MoonwitnessEpisodeDto { id: string; storyId: string; slug: string; title: string; synopsis: string | null; sequence: number; status: "draft" | "published" | "archived" }
export interface MoonwitnessSceneDto { id: string; episodeId: string; slug: string; title: string; sequence: number; status: "draft" | "published" | "archived" }
export interface MoonwitnessComicPageDto { id: string; sceneId: string; sequence: number; assetUrl: string; altText: string; status: "draft" | "published" | "archived" }
export const MOONWITNESS_EPISODE_CREATE_SCHEMA = { type: "object", additionalProperties: false, required: ["slug", "title"], properties: { slug: { type: "string", minLength: 1, maxLength: 80, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }, title: { type: "string", minLength: 1, maxLength: 200 }, synopsis: { anyOf: [{ type: "string", minLength: 1, maxLength: 2000 }, { type: "null" }] } } } as const;
export const MOONWITNESS_SCENE_CREATE_SCHEMA = { type: "object", additionalProperties: false, required: ["slug", "title"], properties: { slug: { type: "string", minLength: 1, maxLength: 80, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }, title: { type: "string", minLength: 1, maxLength: 200 } } } as const;
export const MOONWITNESS_COMIC_PAGE_CREATE_SCHEMA = { type: "object", additionalProperties: false, required: ["assetUrl", "altText"], properties: { assetUrl: { type: "string", minLength: 1, maxLength: 2048 }, altText: { type: "string", minLength: 1, maxLength: 1000 } } } as const;
export const MOONWITNESS_PAGE_ORDER_SCHEMA = { type: "object", additionalProperties: false, required: ["orderedIds"], properties: { orderedIds: { type: "array", minItems: 1, maxItems: 500, uniqueItems: true, items: { type: "string", format: "uuid" } } } } as const;

export const MOONWITNESS_COLLECTION_CREATE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["slug", "title"],
  properties: {
    slug: { type: "string", minLength: 1, maxLength: 80, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    title: { type: "string", minLength: 1, maxLength: 200 },
    cover: { anyOf: [{ type: "string", minLength: 1, maxLength: 2048 }, { type: "null" }] },
    theme: { type: "string", minLength: 1, maxLength: 80 },
    language: { type: "string", enum: ["id", "en", "ar"] },
  },
} as const;

export const MOONWITNESS_STORY_CREATE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["collectionId", "slug", "title", "body"],
  properties: {
    collectionId: { type: "string", format: "uuid" },
    slug: { type: "string", minLength: 1, maxLength: 80, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    title: { type: "string", minLength: 1, maxLength: 200 },
    synopsis: { anyOf: [{ type: "string", minLength: 1, maxLength: 2000 }, { type: "null" }] },
    body: { type: "string", minLength: 1, maxLength: 100000 },
    tagIds: { type: "array", maxItems: 30, uniqueItems: true, items: { type: "string", format: "uuid" } },
  },
} as const;

export const MOONWITNESS_STORY_PATCH_SCHEMA = {
  type: "object", additionalProperties: false, minProperties: 1,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    synopsis: { anyOf: [{ type: "string", minLength: 1, maxLength: 2000 }, { type: "null" }] },
    body: { type: "string", minLength: 1, maxLength: 100000 },
    editorialState: { type: "string", enum: ["idea", "draft", "in_review", "changes_requested", "approved", "scheduled", "published", "archived"] },
    reason: { type: "string", minLength: 1, maxLength: 500 },
    scheduledAt: { type: "string", format: "date-time" },
    classification: { type: "string", enum: ["public", "internal", "confidential", "restricted"] },
    visibility: { type: "string", enum: ["private", "unlisted", "public"] },
    tagIds: { type: "array", maxItems: 30, uniqueItems: true, items: { type: "string", format: "uuid" } },
  },
} as const;

export const MOONWITNESS_COLLECTION_PATCH_SCHEMA = {
  type: "object", additionalProperties: false, minProperties: 1,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    cover: { anyOf: [{ type: "string", minLength: 1, maxLength: 2048 }, { type: "null" }] },
    theme: { type: "string", minLength: 1, maxLength: 80 },
    language: { type: "string", enum: ["id", "en", "ar"] },
    status: { type: "string", enum: ["draft", "published", "archived"] },
    visibility: { type: "string", enum: ["private", "unlisted", "public"] },
  },
} as const;

/** Public, anonymous World Monitor summary. Keep this DTO aggregate-only: it must
 * never contain database identifiers, raw payloads, private links, or operator data. */
export interface WorldMonitorPublicSourceSummary {
  category: string;
  configuredSourceCount: number;
  sourcesWithRecordsCount: number;
  status: "success" | "stale" | "empty" | "failed" | "unknown";
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  freshnessSeconds: number | null;
  freshnessSlaSeconds: number | null;
  recordCount: number | null;
  errorRate: number | null;
  fallbackActive: boolean | null;
}

export interface WorldMonitorPublicSummary {
  schemaVersion: "2";
  status: "operational" | "degraded" | "critical" | "unavailable";
  timestamp: string;
  apiHealth: "healthy" | "degraded" | "unavailable" | "unknown";
  databaseHealth: "healthy" | "degraded" | "unavailable" | "unknown";
  ingestionHealth: "healthy" | "degraded" | "unavailable" | "unknown";
  coverageHealth: "healthy" | "degraded" | "unavailable" | "unknown";
  dataFreshness: "healthy" | "degraded" | "unavailable" | "unknown";
  coverageNumerator: number;
  coverageDenominator: number;
  databaseStatus: "available" | "unavailable" | "unknown";
  ingestionStatus: "healthy" | "degraded" | "unavailable" | "unknown";
  freshnessStatus: "healthy" | "degraded" | "unavailable" | "unknown";
  coverageStatus: "healthy" | "degraded" | "unavailable" | "unknown";
  globalAlertLevel: "green" | "yellow" | "orange" | "red" | "unknown";
  hazardAlertLevel: "green" | "yellow" | "orange" | "red" | "unknown";
  sources: WorldMonitorPublicSourceSummary[];
  observationCount: number;
  alertCount: number;
  history: Array<{ bucket: string; count: number }>;
}

/** OpenAPI-compatible allowlist schema for the anonymous summary response. */
export const WORLD_MONITOR_PUBLIC_SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "status", "timestamp", "apiHealth", "databaseHealth", "ingestionHealth", "coverageHealth", "dataFreshness", "coverageNumerator", "coverageDenominator", "databaseStatus", "ingestionStatus", "freshnessStatus", "coverageStatus", "globalAlertLevel", "hazardAlertLevel", "sources", "observationCount", "alertCount", "history"],
  properties: {
    schemaVersion: { type: "string", const: "2" },
    status: { type: "string", enum: ["operational", "degraded", "critical", "unavailable"] },
    timestamp: { type: "string", format: "date-time" },
    apiHealth: { type: "string", enum: ["healthy", "degraded", "unavailable", "unknown"] },
    databaseHealth: { type: "string", enum: ["healthy", "degraded", "unavailable", "unknown"] },
    ingestionHealth: { type: "string", enum: ["healthy", "degraded", "unavailable", "unknown"] },
    coverageHealth: { type: "string", enum: ["healthy", "degraded", "unavailable", "unknown"] },
    dataFreshness: { type: "string", enum: ["healthy", "degraded", "unavailable", "unknown"] },
    coverageNumerator: { type: "integer", minimum: 0 },
    coverageDenominator: { type: "integer", minimum: 0 },
    databaseStatus: { type: "string", enum: ["available", "unavailable", "unknown"] },
    ingestionStatus: { type: "string", enum: ["healthy", "degraded", "unavailable", "unknown"] },
    freshnessStatus: { type: "string", enum: ["healthy", "degraded", "unavailable", "unknown"] },
    coverageStatus: { type: "string", enum: ["healthy", "degraded", "unavailable", "unknown"] },
    globalAlertLevel: { type: "string", enum: ["green", "yellow", "orange", "red", "unknown"] },
    hazardAlertLevel: { type: "string", enum: ["green", "yellow", "orange", "red", "unknown"] },
    sources: {
      type: "array", maxItems: 100,
      items: {
        type: "object", additionalProperties: false,
        required: ["category", "configuredSourceCount", "sourcesWithRecordsCount", "status", "lastAttemptAt", "lastSuccessAt", "freshnessSeconds", "freshnessSlaSeconds", "recordCount", "errorRate", "fallbackActive"],
        properties: {
          category: { type: "string", maxLength: 64 },
          configuredSourceCount: { type: "integer", minimum: 0 },
          sourcesWithRecordsCount: { type: "integer", minimum: 0 },
          status: { type: "string", enum: ["success", "stale", "empty", "failed", "unknown"] },
          lastAttemptAt: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
          lastSuccessAt: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
          freshnessSeconds: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
          freshnessSlaSeconds: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
          recordCount: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
          errorRate: { anyOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] },
          fallbackActive: { anyOf: [{ type: "boolean" }, { type: "null" }] },
        },
      },
    },
    observationCount: { type: "integer", minimum: 0 },
    alertCount: { type: "integer", minimum: 0 },
    history: {
      type: "array", maxItems: 168,
      items: {
        type: "object", additionalProperties: false, required: ["bucket", "count"],
        properties: { bucket: { type: "string", format: "date-time" }, count: { type: "integer", minimum: 0 } },
      },
    },
  },
} as const;

export type CrmStage = "qualified" | "proposal" | "negotiation" | "won" | "lost";
export interface CrmOpportunity { id: string; tenantId: string; partnerId: string; title: string; stage: CrmStage; amount: string | number; currency: string; probability: number; expectedCloseAt?: string | null; ownerId: string }
export interface CatalogItem { id: string; tenantId: string; sku: string; name: string; kind: "product" | "service"; unit: string; unitPrice: string | number; currency: string; taxRate: string | number; active: boolean }
export interface SalesQuote { id: string; tenantId: string; partnerId: string; number: string; status: "draft" | "sent" | "accepted" | "rejected" | "expired"; currency: string; subtotal: string | number; taxTotal: string | number; total: string | number; validUntil?: string | null }
export interface SalesOrder { id: string; tenantId: string; partnerId: string; quoteId?: string | null; number: string; status: string; currency: string; total: string | number; orderedAt: string }
export interface OperationalInvoice { id: string; tenantId: string; partnerId: string; orderId?: string | null; number: string; status: string; currency: string; amount: string | number; paidAmount: string | number; dueAt?: string | null }
export interface OperationalPayment { id: string; tenantId: string; invoiceId: string; amount: string | number; currency: string; method: string; reference?: string | null; paidAt: string; recordedBy: string }
export interface OperationalExpense { id: string; tenantId: string; partnerId?: string | null; category: string; description: string; amount: string | number; currency: string; incurredAt: string; status: string; recordedBy: string }
export interface CalendarActivity { id: string; tenantId: string; partnerId?: string | null; title: string; kind: string; status: string; startsAt: string; endsAt?: string | null; ownerId: string }

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  tenantId?: string | null;
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly details: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiClient(origin: string) {
  const base = origin.replace(/\/$/, "");
  return {
    async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
      const headers = new Headers({ accept: "application/json" });
      if (options.body !== undefined) headers.set("content-type", "application/json");
      if (options.token) headers.set("authorization", `Bearer ${options.token}`);
      if (options.tenantId) headers.set("x-tenant-id", options.tenantId);
      const response = await fetch(`${base}${path}`, {
        method: options.method ?? "GET",
        credentials: "include",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal ?? AbortSignal.timeout(10000),
      });
      const data = await response.json().catch(() => null) as unknown;
      if (!response.ok) {
        const body = data && typeof data === "object" ? data as Record<string, unknown> : {};
        throw new ApiError(typeof body.message === "string" ? body.message : `API request failed (${response.status})`, response.status, data);
      }
      return data as T;
    },
    async upload<T>(path: string, file: Blob, options: Pick<ApiRequestOptions, "token" | "tenantId"> = {}): Promise<T> {
      const headers = new Headers({ "content-type": "application/octet-stream", accept: "application/json" });
      if (options.token) headers.set("authorization", `Bearer ${options.token}`);
      if (options.tenantId) headers.set("x-tenant-id", options.tenantId);
      const response = await fetch(`${base}${path}`, { method: "POST", credentials: "include", headers, body: file, signal: AbortSignal.timeout(60000) });
      const data = await response.json().catch(() => null) as unknown;
      if (!response.ok) {
        const body = data && typeof data === "object" ? data as Record<string, unknown> : {};
        throw new ApiError(typeof body.message === "string" ? body.message : `API request failed (${response.status})`, response.status, data);
      }
      return data as T;
    },
  };
}

export interface AuthEntity {
  id: string;
  username: string;
  displayName: string;
  tier: string;
  sovereign: boolean;
  celestial: boolean;
  isSovereignAntiBypass: boolean;
  role: string;
  slug: string;
  permissions: string[];
}

export interface LoginResponse { status: "authenticated"; token?: string; entity: AuthEntity; tenants: Array<{ id: string; slug: string; displayName: string; membershipRole: string }> }
export interface LoginRequest { username: string; password: string; rememberMe?: boolean }
export type PartnerType = "contact" | "invoice" | "delivery" | "other";
export interface Partner {
  id: string; tenantId: string; name: string; companyName?: string | null; type: PartnerType; isCompany: boolean;
  parentId?: string | null; userId?: string | null; email?: string | null; phone?: string | null;
  mobile?: string | null; website?: string | null; street?: string | null; street2?: string | null;
  city?: string | null; state?: string | null; postalCode?: string | null; country?: string | null;
  vat?: string | null; function?: string | null; notes?: string | null; metadata?: Record<string, unknown> | null;
  createdAt: string; updatedAt: string;
}
export type CreatePartnerRequest = Pick<Partner, "name" | "type" | "isCompany"> & Partial<Omit<Partner, "id" | "tenantId" | "createdAt" | "updatedAt" | "name" | "type" | "isCompany">>;
export type UpdatePartnerRequest = Partial<CreatePartnerRequest>;
export interface Workspace { id: string; tenantId: string; slug: string; name: string; description?: string | null; status: "active" | "archived"; createdBy: string; metadata?: Record<string, unknown> | null; createdAt: string; updatedAt: string }
export interface Project { id: string; tenantId: string; workspaceId: string; slug: string; name: string; description?: string | null; status: "active" | "archived"; createdBy: string; metadata?: Record<string, unknown> | null; createdAt: string; updatedAt: string }
export interface Task { id: string; tenantId: string; projectId: string; createdBy: string; assignedTo?: string | null; researchRunId?: string | null; title: string; description?: string | null; status: "todo" | "in_progress" | "blocked" | "done" | "cancelled"; priority: "low" | "normal" | "high" | "urgent"; dueAt?: string | null; completedAt?: string | null; createdAt: string; updatedAt: string }
export interface DocumentRecord { id: string; tenantId: string; projectId: string; taskId?: string | null; researchRunId?: string | null; uploadedBy: string; title: string; fileName: string; storageProvider: string; storageKey: string; mediaType: string; sizeBytes: string; sha256: string; version: number; classification: "public" | "internal" | "confidential" | "restricted"; license?: string | null; provenance?: Record<string, unknown> | null; status: "active" | "archived"; createdAt: string; updatedAt: string }
export interface CreateProjectRequest { workspaceId: string; slug: string; name: string; description?: string | null; metadata?: Record<string, unknown> | null }
export interface CreateWorkspaceRequest { slug: string; name: string; description?: string | null; metadata?: Record<string, unknown> | null }
export interface CreateTaskRequest { projectId: string; title: string; description?: string | null; assignedTo?: string | null; researchRunId?: string | null; status?: Task["status"]; priority?: Task["priority"]; dueAt?: string | null }
export interface CreateDocumentRequest { projectId: string; taskId?: string | null; researchRunId?: string | null; title: string; fileName: string; storageProvider: string; storageKey: string; mediaType: string; sizeBytes: number; sha256: string; classification?: DocumentRecord["classification"]; license?: string | null; provenance?: Record<string, unknown> | null }
export type CabTier = "standard" | "significant" | "critical" | "emergency";
export type CabRiskLevel = "low" | "moderate" | "high" | "critical";
export type CabReviewVerdict = "affirm" | "inquire" | "dissent";
export type ResearchScope = "self" | "community" | "global";
export type LocaleTag = string; // BCP 47; en is canonical, id is the first localization
export type UncertaintyKind = "unknown" | "estimated" | "measured" | "interpreted" | "disputed";
export interface LocalizedText { en?: string; id?: string; [locale: string]: string | undefined }
export function resolveLocalizedText(
  values: LocalizedText,
  requestedLocale: LocaleTag,
  fallbackLocale: LocaleTag = "en",
): { text: string | null; requestedLocale: LocaleTag; localeUsed: LocaleTag | null; fallback: boolean } {
  const candidates = [requestedLocale, requestedLocale.split("-")[0], fallbackLocale, fallbackLocale.split("-")[0]];
  const localeUsed = candidates.find((locale) => Boolean(values[locale]?.trim())) ?? null;
  return {
    text: localeUsed ? values[localeUsed]!.trim() : null,
    requestedLocale,
    localeUsed,
    fallback: localeUsed !== null && localeUsed !== requestedLocale,
  };
}
export interface Uncertainty { kind?: UncertaintyKind; confidence?: number; method?: string; limitations?: string[] }
export interface SourceReference { sourceId: string; edition?: string; locator?: string; url?: string; languageTag?: LocaleTag; license?: string; contentHash?: string; note?: string }
export interface Provenance { sourceId: string; observedAt: string; collectedAt?: string; method: string; collectorId?: string; sourceVersion?: string; contentHash?: string; license?: string; notes?: string }
export interface WorldObservation {
  id: string; sourceId: string; observedAt: string; metric: string; value: number | string | boolean | null; unit: string;
  calibration?: { status: "calibrated" | "uncalibrated" | "unknown" | "not_applicable"; reference?: string; calibratedAt?: string; validUntil?: string };
  provenance: Provenance; scope: { description: string; coverage?: string; limitations?: string[]; authorizationId?: string };
  uncertainty: Uncertainty; quality?: "valid" | "suspect" | "invalid" | "unknown";
}
export interface UnilexConcept {
  id: string; lane: "UNIVERSAL" | "SCRIPTURE" | "TEXT_SOURCE" | "PROJECT"; preferredLabel: LocalizedText;
  definition: LocalizedText; sourceLanguage?: LocaleTag; sourceForm?: string; transliteration?: string;
  alternateLabels?: Record<string, string[]>; sourceReferences?: SourceReference[];
  relations?: Array<{ type: "relatedTo" | "inspiredBy" | "distinctFrom" | "exactMatch" | "closeMatch" | "narrowerThan" | "broaderThan"; targetId: string; confidence?: number; reviewer?: string; reviewedAt?: string }>;
  status: "DRAFT_REVIEW" | "SOURCE_CHECK" | "LINGUISTIC_REVIEW" | "APPROVED" | "DEPRECATED";
}
export const RESEARCH_SOURCE_FAMILIES = ["quran", "torah", "psalms", "gospels", "other"] as const;
export const RESEARCH_CLASSIFICATIONS = ["SCRIPTURE_TEXT", "TRADITION_INTERPRETATION", "HISTORICAL_CLAIM", "VERIFIED_MEASUREMENT", "SCIENTIFIC_MODEL", "HYPOTHESIS", "PROJECT_NARRATIVE", "PERSONAL_TESTIMONY"] as const;
export const RESEARCH_REQUEST_SCHEMAS = {
  createRun: { type: "object", additionalProperties: false, required: ["title", "question", "scope"], properties: { title: { type: "string", minLength: 3, maxLength: 200 }, question: { type: "string", minLength: 10, maxLength: 10000 }, scope: { type: "string", enum: ["self", "community", "global"] } } },
  approveRun: { type: "object", additionalProperties: false, required: ["decision"], properties: { decision: { type: "string", enum: ["approved", "rejected"] }, comments: { type: "string", maxLength: 5000 } } },
  legacyEvidence: { type: "object", additionalProperties: false, required: ["title", "sourceUri", "sourceFamily", "classification", "excerpt", "provenance"], properties: { title: { type: "string", minLength: 3, maxLength: 300 }, sourceUri: { type: "string", format: "uri", maxLength: 2048 }, sourceFamily: { type: "string", enum: RESEARCH_SOURCE_FAMILIES }, classification: { type: "string", enum: RESEARCH_CLASSIFICATIONS }, excerpt: { type: "string", minLength: 1, maxLength: 20000 }, provenance: { type: "object", additionalProperties: true } } },
  evidenceV2: { type: "object", additionalProperties: false, required: ["title", "source", "classification", "excerpt", "provenance"], properties: { title: { type: "string", minLength: 3, maxLength: 300 }, source: { type: "object", additionalProperties: false, required: ["sourceId", "familyId", "url", "license"], properties: { sourceId: { type: "string", minLength: 1 }, familyId: { type: "string", enum: RESEARCH_SOURCE_FAMILIES }, edition: { type: "string" }, locator: { type: "string" }, url: { type: "string", format: "uri", maxLength: 2048 }, languageTag: { type: "string", minLength: 2 }, license: { type: "string", minLength: 1 }, contentHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, note: { type: "string" } } }, classification: { type: "string", enum: RESEARCH_CLASSIFICATIONS }, excerpt: { type: "string", minLength: 1, maxLength: 20000 }, provenance: { type: "object", additionalProperties: false, required: ["sourceId", "collectedAt", "method"], properties: { sourceId: { type: "string", minLength: 1 }, collectedAt: { type: "string", format: "date-time" }, method: { type: "string", minLength: 1 }, collectorId: { type: "string" }, sourceVersion: { type: "string" }, contentHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, notes: { type: "string" } } }, uncertainty: { type: "object", additionalProperties: false, properties: { kind: { type: "string", enum: ["unknown", "estimated", "measured", "interpreted", "disputed"] }, confidence: { type: "number", minimum: 0, maximum: 1 }, method: { type: "string" }, limitations: { type: "array", items: { type: "string" } } } } } },
  completeRun: { type: "object", additionalProperties: false, required: ["resultSummary"], properties: { resultSummary: { type: "string", minLength: 3, maxLength: 5000 } } },
} as const;
export const RESEARCH_EVIDENCE_REQUEST_SCHEMA = {
  oneOf: [RESEARCH_REQUEST_SCHEMAS.legacyEvidence, RESEARCH_REQUEST_SCHEMAS.evidenceV2],
} as const;
export interface CreateCabRfcRequest {
  title: string; tier: CabTier; riskLevel: CabRiskLevel; summary: string; justification: string;
  executionPlan: string; rollbackPlan: string; targetService: string;
  scheduledWindowStart?: string | null; scheduledWindowEnd?: string | null;
}
export interface CabReviewRequest { verdict: CabReviewVerdict; notes?: string }
export interface CabDecreeRequest { verdict: "approve" | "veto"; notes?: string }
export interface CreateResearchRunRequest { title: string; question: string; scope: ResearchScope }
export interface ResearchApprovalRequest { decision: "approved" | "rejected"; comments?: string }
export interface CreateResearchEvidenceRequest {
  title: string; sourceUri: string;
  sourceFamily: typeof RESEARCH_SOURCE_FAMILIES[number];
  classification: typeof RESEARCH_CLASSIFICATIONS[number];
  excerpt: string; provenance: Record<string, unknown>;
}
export interface CreateResearchEvidenceV2Request {
  title: string; source: SourceReference & { familyId: typeof RESEARCH_SOURCE_FAMILIES[number]; url: string; license: string };
  classification: typeof RESEARCH_CLASSIFICATIONS[number]; excerpt: string;
  provenance: { sourceId: string; collectedAt: string; method: string; collectorId?: string; sourceVersion?: string; contentHash?: string; notes?: string };
  uncertainty?: Uncertainty;
}
export interface ResearchEvidence {
  id: string; researchRunId: string; jobId?: string; source: SourceReference;
  classification: typeof RESEARCH_CLASSIFICATIONS[number]; excerpt: string; provenance: Provenance;
  contentHash: string; uncertainty?: Uncertainty;
}
export interface ApiErrorResponse { status: "error"; error: { code: string; message: string; messageKey?: string; details?: unknown; requestId?: string } }
export interface CompleteResearchRunRequest { resultSummary: string }
export interface ResearchRunSummary { id: string; tenantId: string; requestedBy: string; title: string; question: string; scope: ResearchScope; status: "pending_approval" | "queued" | "running" | "completed" | "rejected" | "failed" | "cancelled"; resultSummary?: string | null; createdAt: string; approvedAt?: string | null; completedAt?: string | null }
export interface CabSummary { total: number; active: number; emergency: number; completed: number; reverted: number; successRatio: number; seraphReviews: number; nextWindow: string | null }
export interface CabRfc {
  id: string; code: string; title: string; tier: CabTier;
  riskLevel: CabRiskLevel; status: string; summary: string;
  justification: string; executionPlan: string; rollbackPlan: string; targetService: string;
  authorId: string; auditRound: number; sovereignDecree: boolean;
  reviews?: Array<{ reviewerRole: string; verdict: string; notes?: string | null; confidence: number }>;
  executions?: Array<{ action: string; outcome: string; notes?: string | null; startedAt: string }>;
}
export interface ResearchRun {
  id: string; title: string; question: string; scope: ResearchScope;
  status: "pending_approval" | "queued" | "running" | "completed" | "rejected";
  resultSummary?: string | null;
  evidence?: Array<{ id: string; title: string; sourceUri: string; sourceFamily: string; classification: string; excerpt: string }>;
  approvals?: Array<{ decision: string; comments?: string | null }>;
  workflow?: { status: string; jobs: Array<{ status: string; kind: string }> } | null;
}
