import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class WorldMonitorObservationModel extends BatteriesModel {
  static override tableName = "world_monitor_observations";
  static override uniqueConstraints = [["source", "externalId", "observedAt"]];
  static override uniqueConflictResolutions = [{
    columns: ["source", "externalId", "observedAt"],
    keepBy: ["fetchedAt", "updatedAt"],
  }];
  static override fields: Record<string, FieldDefinition> = {
    source: { type: "string", required: true, index: true },
    sourceTier: { type: "string", required: true, defaultTo: "primary" },
    category: { type: "string", required: true, index: true },
    externalId: { type: "string", nullable: true, index: true },
    observedAt: { type: "timestamp", required: true, index: true },
    fetchedAt: { type: "timestamp", required: true, index: true },
    freshnessSeconds: { type: "integer", nullable: true },
    confidence: { type: "float", nullable: true },
    status: { type: "string", required: true, defaultTo: "available" },
    normalized: { type: "jsonb", nullable: true },
    payload: { type: "jsonb", nullable: true },
  };
  source!: string; sourceTier!: string; category!: string; externalId?: string | null; observedAt!: string; fetchedAt!: string; freshnessSeconds?: number | null; confidence?: number | null; status!: string; normalized?: Record<string, unknown> | null; payload?: Record<string, unknown> | null;
}
