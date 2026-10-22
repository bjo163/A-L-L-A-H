import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class WorldMonitorAggregateModel extends BatteriesModel {
  static override tableName = "world_monitor_aggregates";
  static override fields: Record<string, FieldDefinition> = {
    bucketStart: { type: "timestamp", required: true, index: true },
    category: { type: "string", required: true, index: true },
    source: { type: "string", required: true },
    recordCount: { type: "integer", required: true, defaultTo: 0 },
    summary: { type: "jsonb", nullable: true },
  };
  bucketStart!: string; category!: string; source!: string; recordCount!: number; summary?: Record<string, unknown> | null;
}
