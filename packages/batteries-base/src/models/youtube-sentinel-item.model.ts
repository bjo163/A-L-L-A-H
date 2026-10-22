import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/**
 * Persistent storage for every YouTube video evaluated by the
 * Tauhid Sentinel heuristic engine.
 *
 * videoId is unique — upsert semantics: re-crawling the same video
 * updates metadata columns but preserves operator workflowStatus /
 * operatorNotes unless explicitly overridden.
 */
export class YoutubeSentinelItemModel extends BatteriesModel {
  static override tableName = "youtube_sentinel_items";
  static override fields: Record<string, FieldDefinition> = {
    // ── YouTube metadata ──────────────────────────────────────────
    videoId:            { type: "string",    required: true,  index: true,  unique: true },
    title:              { type: "text",      required: true },
    channelTitle:       { type: "string",    required: true },
    channelUrl:         { type: "text",      nullable: true },
    url:                { type: "text",      required: true },
    descriptionSnippet: { type: "text",      nullable: true },
    viewCountText:      { type: "string",    nullable: true },
    durationText:       { type: "string",    nullable: true },
    publishedAt:        { type: "string",    nullable: true },
    thumbnailUrl:       { type: "text",      nullable: true },

    // ── Heuristic evaluation ──────────────────────────────────────
    direction:          { type: "string",    required: true,  defaultTo: "NEGATIVE", index: true },
    tradition:          { type: "string",    required: true,  defaultTo: "ISLAM",    index: true },
    riskScore:          { type: "integer",   required: true,  defaultTo: 0, index: true },
    riskLevel:          { type: "string",    required: true,  index: true },
    category:           { type: "string",    required: true,  index: true },
    sourceType:         { type: "string",    required: true,  defaultTo: "browser_automation" },
    confidence:         { type: "float",       required: true,  defaultTo: 0.9 },
    isRefutation:       { type: "boolean",   required: true,  defaultTo: false },

    /** JSON array of YoutubeMatchedRule objects */
    matchedRules:       { type: "jsonb",     required: true,  defaultTo: "[]" },

    /** JSON object of TauhidGuidance */
    tauhidGuidance:     { type: "jsonb",     nullable: true },

    /** JSON object of WisdomGuidance (for POSITIVE direction) */
    wisdomGuidance:     { type: "jsonb",     nullable: true },

    /** JSON object of YoutubeReportPacket */
    reportPacket:       { type: "jsonb",     nullable: true },

    /** JSON object of YoutubeAmplifyPacket (for POSITIVE direction) */
    amplifyPacket:      { type: "jsonb",     nullable: true },

    /** JSON object of CounterDakwahBrief */
    counterDakwahBrief: { type: "jsonb",     nullable: true },

    /** JSON object of WisdomBrief (for POSITIVE direction) */
    wisdomBrief:        { type: "jsonb",     nullable: true },

    // ── Operator workflow ─────────────────────────────────────────
    workflowStatus:     { type: "string",    required: true,  defaultTo: "PENDING_REVIEW", index: true },
    operatorNotes:      { type: "text",      nullable: true },
    lastActionAt:       { type: "timestamp", nullable: true },

    /** Hubungan ke partner (mitra dakwah / organisasi / target pantau) */
    partnerId:          { type: "uuid",      nullable: true,  index: true, references: { table: "partners", column: "id", onDelete: "SET NULL" } },

    // ── Crawler provenance ────────────────────────────────────────
    crawlerMode:        { type: "string",    nullable: true },
    scannedAt:          { type: "timestamp", required: true,  index: true },
    lastCrawledAt:      { type: "timestamp", required: true,  index: true },
  };

  static override get jsonAttributes(): string[] {
    return [
      "matchedRules",
      "tauhidGuidance",
      "wisdomGuidance",
      "reportPacket",
      "amplifyPacket",
      "counterDakwahBrief",
      "wisdomBrief",
    ];
  }

  // ── TypeScript property declarations ──────────────────────────────
  videoId!: string;
  title!: string;
  channelTitle!: string;
  channelUrl?: string | null;
  url!: string;
  descriptionSnippet?: string | null;
  viewCountText?: string | null;
  durationText?: string | null;
  publishedAt?: string | null;
  thumbnailUrl?: string | null;

  direction!: string;
  tradition!: string;
  riskScore!: number;
  riskLevel!: string;
  category!: string;
  sourceType!: string;
  confidence!: number;
  isRefutation!: boolean;
  matchedRules!: unknown[];
  tauhidGuidance?: unknown | null;
  wisdomGuidance?: unknown | null;
  reportPacket?: unknown | null;
  amplifyPacket?: unknown | null;
  counterDakwahBrief?: unknown | null;
  wisdomBrief?: unknown | null;

  workflowStatus!: string;
  operatorNotes?: string | null;
  lastActionAt?: string | null;
  partnerId?: string | null;

  crawlerMode?: string | null;
  scannedAt!: string;
  lastCrawledAt!: string;
}
