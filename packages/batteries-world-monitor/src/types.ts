export type RegionStatus = "nominal" | "advisory" | "alert" | "critical" | "unavailable";
export type AlertLevel = "green" | "yellow" | "orange" | "red" | "unknown";
export type WorldMonitorDataState = "healthy" | "degraded" | "unavailable" | "unknown";

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
  ingestionStatus: WorldMonitorDataState;
  freshnessStatus: WorldMonitorDataState;
  coverageStatus: WorldMonitorDataState;
  hazardAlertLevel: AlertLevel;
  regions: WorldRegion[];
  dnaSensors: DnaSensorMapping[];
  telemetryFeeds: TelemetryFeedItem[];
  sources: Array<{
    source: string; category: string; tier: string;
    status: string; lastAttemptAt: string | null; lastSuccessAt: string | null;
    lastFetchedAt: string | null; records: number | null; fetchedPoints: number | null;
    durationMs: number | null; errorRate: number | null; failureStreak: number | null;
    parseErrors: number | null; fallbackActivated: boolean | null;
    freshnessSlaSeconds: number | null; freshnessSeconds: number | null;
    coverageStatus: WorldMonitorDataState; coverage: number | null;
  }>;
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

/**
 * Polaritas arah deteksi Sentinel.
 * NEGATIVE = konten kesesatan / bahaya / eksploitatif
 * POSITIVE = konten kebajikan / dakwah / kebijaksanaan luhur
 * NEUTRAL  = konten edukasi / analisis / berita netral
 */
export type SentinelDirection = "NEGATIVE" | "POSITIVE" | "NEUTRAL";

/**
 * Tradisi agama / kebijaksanaan yang teridentifikasi dalam konten.
 * Digunakan untuk kontekstualisasi pada kedua arah (negatif & positif).
 */
export type SentinelTradition =
  | "ISLAM"
  | "KRISTEN"
  | "KATOLIK"
  | "HINDU"
  | "BUDDHA"
  | "KHONGHUCU"
  | "UNIVERSAL";

/** Kategori pelanggaran untuk konten arah NEGATIVE */
export type YoutubeNegativeCategory =
  | "SIHIR_PELET"
  | "DUKUN_RAMALAN"
  | "PESUGIHAN_TUMBAL"
  | "KHODAM_JIN"
  | "BENDA_KERAMAT_JIMAT"
  | "KUBURAN_SESAJEN"
  | "UMUM_SYIRIK";

/** Kategori kebajikan untuk konten arah POSITIVE */
export type YoutubePositiveCategory =
  | "TAUHID_DAKWAH"
  | "AKHLAK_KARIMAH"
  | "KASIH_KRISTIANI"
  | "DHARMA_HINDU"
  | "DHARMA_BUDDHA"
  | "KEBAJIKAN_KHONGHUCU"
  | "UNIVERSAL_HIKMAH";

/** Kategori netral — konten edukasi/analisis, termasuk refutation/debunking */
export type YoutubeNeutralCategory = "BEBAS_SYIRIK";

/** Gabungan seluruh kategori yang mungkin */
export type YoutubeViolationCategory =
  | YoutubeNegativeCategory
  | YoutubePositiveCategory
  | YoutubeNeutralCategory;

/** Status alur kerja untuk konten arah NEGATIVE (tindakan laporan & bantahan) */
export type YoutubeNegativeWorkflowStatus =
  | "PENDING_REVIEW"
  | "VERIFIED_SYIRIK"
  | "COUNTER_DAKWAH_QUEUED"
  | "REPORT_FILED"
  | "FALSE_POSITIVE_DISMISSED";

/** Status alur kerja untuk konten arah POSITIVE (tindakan amplifikasi & referensi) */
export type YoutubePositiveWorkflowStatus =
  | "WISDOM_QUEUED"
  | "AMPLIFY_RECOMMENDED"
  | "SHARED_VIA_DAKWAH"
  | "ARCHIVED_REFERENCE";

/** Gabungan seluruh status alur kerja */
export type YoutubeWorkflowStatus =
  | YoutubeNegativeWorkflowStatus
  | YoutubePositiveWorkflowStatus;

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

/**
 * Panduan kebijaksanaan untuk konten arah POSITIVE.
 * Menyimpan kutipan luhur dari tradisi agama/kebijaksanaan yang terdeteksi.
 */
export interface WisdomGuidance {
  tradition: SentinelTradition;
  topic: string;
  /** Referensi teks suci / sumber kebijaksanaan (Quran, Injil, Veda, Tripitaka, dll) */
  scriptureRef: string;
  /** Teks asli dalam bahasa aslinya (Arab, Yunani, Sansekerta, Tionghoa, dll) */
  originalText?: string;
  /** Terjemahan ke Bahasa Indonesia */
  translation: string;
  /** Nilai luhur inti yang terkandung */
  coreValue: string;
  /** Saran tindakan positif untuk operator */
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

/** Paket amplifikasi dakwah / kebaikan untuk konten arah POSITIVE */
export interface YoutubeAmplifyPacket {
  platform: "YouTube";
  targetUrl: string;
  videoTitle: string;
  channelTitle: string;
  tradition: SentinelTradition;
  wisdomCategory: YoutubePositiveCategory;
  generatedEndorsement: string;
  suggestedHashtags: string[];
  suggestedShareCaption: string;
}

export interface CounterDakwahBrief {
  summary: string;
  dalilReferences: string[];
  keyRebuttalPoints: string[];
  suggestedCommentResponse: string;
  educationalReferenceVideo?: string;
}

/** Ringkasan hikmah untuk konten arah POSITIVE */
export interface WisdomBrief {
  summary: string;
  coreValues: string[];
  keyInsights: string[];
  suggestedShareComment: string;
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

  /** Arah deteksi Sentinel: NEGATIVE / POSITIVE / NEUTRAL */
  direction: SentinelDirection;

  /** Tradisi agama / kebijaksanaan yang teridentifikasi */
  tradition: SentinelTradition;

  riskLevel: YoutubeRiskLevel;
  category: YoutubeViolationCategory;
  riskScore: number;
  /** @deprecated Legacy persisted field; heuristic matches are not calibrated probabilities. */
  confidence?: number;
  isRefutation: boolean;
  matchedRules: YoutubeMatchedRule[];

  /** Panduan teologi — untuk direction NEGATIVE */
  tauhidGuidance: TauhidGuidance;

  /** Panduan kebijaksanaan — untuk direction POSITIVE */
  wisdomGuidance?: WisdomGuidance;

  /** Paket laporan — untuk direction NEGATIVE */
  reportPacket: YoutubeReportPacket;

  /** Paket amplifikasi — untuk direction POSITIVE */
  amplifyPacket?: YoutubeAmplifyPacket;

  /** Bantahan Tauhid — untuk direction NEGATIVE */
  counterDakwahBrief: CounterDakwahBrief;

  /** Ringkasan hikmah — untuk direction POSITIVE */
  wisdomBrief?: WisdomBrief;

  workflowStatus: YoutubeWorkflowStatus;
  reviewEvidence?: { reviewerId: string; rationale: string; reviewedAt: string; secondReviewerId?: string | null } | null;
  actionEvidence?: { reference: string; attestedBy: string; attestedAt: string } | null;
  reviewRevision?: number;
  operatorNotes?: string;
  scannedAt: string;
  lastActionAt?: string;
  sourceType: "live_search" | "browser_automation" | "feed_crawl" | "verified_seed" | "innertube_client" | "demo_synthetic";
  isNew?: boolean;
  transcriptAnalyzed?: boolean;
  transcriptSnippet?: string;

  /** Relasi ke model Partner (mitra dakwah / organisasi / tokoh / target pantau) */
  partnerId?: string | null;
  partnerInfo?: {
    id: string;
    name: string;
    type?: string;
    companyName?: string | null;
    isMitra?: boolean;
    notes?: string | null;
  } | null;
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
  /** Filter berdasarkan arah deteksi */
  direction?: SentinelDirection;
  /** Filter berdasarkan tradisi agama */
  tradition?: SentinelTradition;
}

export interface YoutubeScanResult {
  scannedCount: number;
  newItemsCount: number;
  existingItemsCount?: number;
  items: YoutubeMonitoredItem[];
  summary: YoutubeScanSummary;
  crawlerMode: "youtubei_innertube" | "playwright_headless_browser" | "http_live_fetch" | "no_results";
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
  /** Jumlah konten positif / dakwah yang terdeteksi */
  positiveContentCount?: number;
  /** Tradisi yang terdeteksi */
  detectedTraditions?: string[];
}
