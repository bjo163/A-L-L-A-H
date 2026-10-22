import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ResearchJobModel extends BatteriesModel {
  static override tableName = "research_jobs";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "tenants", column: "id", onDelete: "CASCADE" },
    },
    workflowId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "research_workflows", column: "id", onDelete: "CASCADE" },
    },
    kind: { type: "string", required: true, defaultTo: "evidence_collection" },
    status: { type: "string", required: true, defaultTo: "queued", index: true },
    startedAt: { type: "timestamp", nullable: true },
    completedAt: { type: "timestamp", nullable: true },
    error: { type: "text", nullable: true },
  };

  tenantId!: string;
  workflowId!: string;
  kind!: string;
  status!: "queued" | "running" | "completed" | "failed";
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
}
