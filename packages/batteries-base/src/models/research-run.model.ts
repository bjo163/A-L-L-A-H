import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ResearchRunModel extends BatteriesModel {
  static override tableName = "research_runs";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "tenants", column: "id", onDelete: "CASCADE" },
    },
    requestedBy: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "users", column: "id", onDelete: "RESTRICT" },
    },
    title: { type: "string", required: true },
    question: { type: "text", required: true },
    scope: { type: "string", required: true, defaultTo: "self" },
    status: { type: "string", required: true, defaultTo: "pending_approval", index: true },
    resultSummary: { type: "text", nullable: true },
    metadata: { type: "jsonb", nullable: true },
    approvedAt: { type: "timestamp", nullable: true },
    completedAt: { type: "timestamp", nullable: true },
  };

  tenantId!: string;
  requestedBy!: string;
  title!: string;
  question!: string;
  scope!: "self" | "community" | "global";
  status!: "pending_approval" | "queued" | "running" | "completed" | "rejected";
  resultSummary?: string | null;
  metadata?: Record<string, unknown> | null;
  approvedAt?: string | null;
  completedAt?: string | null;
}
