import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/**
 * Ledger of every automated or manual scan run triggered against YouTube.
 * One row = one call to the /youtube/scan endpoint.
 */
export class YoutubeSentinelScanModel extends BatteriesModel {
  static override tableName = "youtube_sentinel_scans";
  static override fields: Record<string, FieldDefinition> = {
    query:        { type: "text",      required: true,  index: true },
    engine:       { type: "string",    required: true,  defaultTo: "auto" },
    crawlerMode:  { type: "string",    nullable: true },
    scannedCount: { type: "integer",   required: true,  defaultTo: 0 },
    newCount:     { type: "integer",   required: true,  defaultTo: 0 },
    durationMs:   { type: "integer",   nullable: true },
    diagnosticMessage: { type: "text", nullable: true },
    startedAt:    { type: "timestamp", required: true,  index: true },
    completedAt:  { type: "timestamp", nullable: true },
    triggeredBy:  { type: "string",    nullable: true,  defaultTo: "auto" },
  };

  query!: string;
  engine!: string;
  crawlerMode?: string | null;
  scannedCount!: number;
  newCount!: number;
  durationMs?: number | null;
  diagnosticMessage?: string | null;
  startedAt!: string;
  completedAt?: string | null;
  triggeredBy?: string | null;
}
