export type RegionStatus = "nominal" | "advisory" | "alert" | "critical" | "unavailable";
export type AlertLevel = "green" | "yellow" | "orange" | "red" | "unknown";

export interface WorldRegion {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  status: RegionStatus;
  latencyMs: number | null;
  uptimePercentage: number | null;
  nodeCount: number | null;
  activeSensors: number | null;
  heliogridLoadMw: number | null;
}

export interface DnaSensorMapping {
  dnaId: string;
  code: string;
  arabic: string;
  transliteration: string;
  capability: string;
  operationalTarget: string;
  currentStatus: "healthy" | "calibrated" | "degraded" | "unavailable";
  observedEventsCount: number | null;
  limitations: readonly string[];
}

export interface TelemetryFeedItem {
  id: string;
  category: "physical" | "cyber" | "environmental" | "heliogrid";
  regionCode: string;
  title: string;
  detail: string;
  severity: "info" | "advisory" | "warning" | "critical";
  timestamp: string;
  source: string;
  associatedDna: string;
}

export interface WorldMonitoringSnapshot {
  status: "operational" | "degraded" | "critical" | "unavailable";
  timestamp: string;
  globalAlertLevel: AlertLevel;
  averageGlobalLatencyMs: number | null;
  totalMonitoredNodes: number;
  apiUptimeSeconds: number | null;
  databaseStatus: "available" | "unavailable" | "unknown";
  regions: WorldRegion[];
  dnaSensors: DnaSensorMapping[];
  telemetryFeeds: TelemetryFeedItem[];
  sources: Array<{ source: string; category: string; tier: string; status: string; lastFetchedAt: string | null; records: number; durationMs: number | null; errorRate: number; failureStreak: number }>;
  observations: Array<{ id: string; source: string; category: string; sourceTier: string; observedAt: string; fetchedAt: string; freshnessSeconds: number | null; confidence: number | null; status: string; normalized: Record<string, unknown> | null }>;
  alerts: Array<{ id: string; level: "normal" | "advisory" | "critical"; category: string; title: string; detail: string; observedAt: string; source: string }>;
  history: Array<{ bucket: string; count: number; categories: Record<string, number> }>;
  mapLayers: Array<{ id: string; title: string; type: "raster" | "vector"; url: string; attribution: string }>;
}

export type YoutubeRiskLevel =
  | "CRITICAL_SYIRIK"
  | "HIGH_SYIRIK_RISK"
  | "ADVISORY_SUPERSTITION"
  | "DAKWAH_REFUTATION"
  | "NOMINAL_CLEAR";

export type YoutubeViolationCategory =
  | "SIHIR_PELET"
  | "DUKUN_RAMALAN"
  | "PESUGIHAN_TUMBAL"
  | "KHODAM_JIN"
  | "BENDA_KERAMAT_JIMAT"
  | "KUBURAN_SESAJEN"
  | "UMUM_SYIRIK"
  | "BEBAS_SYIRIK";

export type YoutubeWorkflowStatus =
  | "PENDING_REVIEW"
  | "VERIFIED_SYIRIK"
  | "COUNTER_DAKWAH_QUEUED"
  | "REPORT_FILED"
  | "FALSE_POSITIVE_DISMISSED";

export interface YoutubeMatchedRule {
  ruleId: string;
  category: YoutubeViolationCategory;
  pattern: string;
  weight: number;
  label: string;
  excerpt: string;
}

export interface TauhidGuidance {
  topic: string;
  dalilRef: string;
  arabicText?: string;
  translation: string;
  theologicalPrinciple: string;
  recommendedAction: string;
}

export interface YoutubeReportPacket {
  platform: "YouTube";
  targetUrl: string;
  videoTitle: string;
  channelTitle: string;
  reportedCategory: "harmful_dangerous" | "scams_fraud" | "misleading";
  policyReference: string;
  generatedComplaint: string;
  recommendedTimestamp: string;
}

export interface CounterDakwahBrief {
  summary: string;
  dalilReferences: string[];
  keyRebuttalPoints: string[];
  suggestedCommentResponse: string;
  educationalReferenceVideo?: string;
}

export interface YoutubeMonitoredItem {
  id: string;
  videoId: string;
  url: string;
  title: string;
  channelTitle: string;
  channelUrl: string;
  publishedAt: string;
  viewCountText?: string;
  durationText?: string;
  thumbnailUrl: string;
  descriptionSnippet: string;
  riskLevel: YoutubeRiskLevel;
  category: YoutubeViolationCategory;
  riskScore: number;
  confidence: number;
  isRefutation: boolean;
  matchedRules: YoutubeMatchedRule[];
  tauhidGuidance: TauhidGuidance;
  reportPacket: YoutubeReportPacket;
  counterDakwahBrief: CounterDakwahBrief;
  workflowStatus: YoutubeWorkflowStatus;
  operatorNotes?: string;
  scannedAt: string;
  lastActionAt?: string;
  sourceType: "live_search" | "browser_automation" | "feed_crawl" | "verified_seed" | "innertube_client";
  isNew?: boolean;
  transcriptAnalyzed?: boolean;
  transcriptSnippet?: string;
}

export type YoutubeCrawlerEngine = "innertube" | "playwright" | "auto";
export type YoutubeSortBy = "upload_date" | "relevance";

export interface YoutubeScanQuery {
  query: string;
  limit?: number;
  forceLive?: boolean;
  useBrowserAutomation?: boolean;
  engine?: YoutubeCrawlerEngine;
  sortBy?: YoutubeSortBy;
  onlyNew?: boolean;
}

export interface YoutubeScanResult {
  scannedCount: number;
  newItemsCount: number;
  existingItemsCount?: number;
  items: YoutubeMonitoredItem[];
  summary: YoutubeScanSummary;
  crawlerMode: "youtubei_innertube" | "playwright_headless_browser" | "http_live_fetch" | "fallback_synthetic";
  diagnosticMessage?: string;
}

export interface YoutubeScanSummary {
  totalMonitored: number;
  criticalSyirikCount: number;
  highRiskCount: number;
  advisoryCount: number;
  counterDakwahCount: number;
  safeCount: number;
  pendingReviewCount: number;
  actionTakenCount: number;
  lastScanTimestamp: string;
  activeSensors: string[];
}

