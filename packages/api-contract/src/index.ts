export const API_PATHS = {
  openapi: "/openapi.json",
  health: "/v1/health",
  readiness: "/v1/readiness",
  capabilities: "/v1/metadata/capabilities",
  modules: "/v1/modules",
  worldMonitor: "/v1/world-monitor",
  worldMonitorYoutube: "/v1/world-monitor/youtube",
  worldMonitorYoutubeScan: "/v1/world-monitor/youtube/scan",
  worldMonitorYoutubeAction: "/v1/world-monitor/youtube/action",
  worldMonitorYoutubeSnippet: "/v1/world-monitor/youtube/snippet",
  continuum: "/continuum",

  continuumAgents: "/continuum/agents",
  continuumAsma: "/continuum/asma",
  continuumChronicles: "/continuum/chronicles",
  users: "/users",
  login: "/auth/login",
  session: "/auth/session",
  logout: "/auth/logout",
  cabSummary: "/continuum/cab/summary",
  cabRfcs: "/continuum/cab/rfcs",
  researchRuns: "/v1/research-runs",
} as const;

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH";
  token?: string | null;
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

export interface LoginResponse { status: "authenticated"; token?: string; entity: AuthEntity }
export interface LoginRequest { username: string; password: string; rememberMe?: boolean }
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
