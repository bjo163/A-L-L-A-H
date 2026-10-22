import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class WorldMonitorSourceRunModel extends BatteriesModel {
  static override tableName = "world_monitor_source_runs";
  static override fields: Record<string, FieldDefinition> = {
    source: { type: "string", required: true, index: true },
    category: { type: "string", required: true, index: true },
    tier: { type: "string", required: true, defaultTo: "primary" },
    startedAt: { type: "timestamp", required: true },
    completedAt: { type: "timestamp", nullable: true },
    status: { type: "string", required: true, index: true },
    error: { type: "text", nullable: true },
    recordCount: { type: "integer", required: true, defaultTo: 0 },
    durationMs: { type: "integer", nullable: true },
    metadata: { type: "jsonb", nullable: true },
  };
  source!: string; category!: string; tier!: string; startedAt!: string; completedAt?: string | null; status!: string; error?: string | null; recordCount!: number; durationMs?: number | null; metadata?: Record<string, unknown> | null;
}
