import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ResearchWorkflowModel extends BatteriesModel {
  static override tableName = "research_workflows";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "tenants", column: "id", onDelete: "CASCADE" },
    },
    researchRunId: {
      type: "uuid",
      required: true,
      unique: true,
      references: { table: "research_runs", column: "id", onDelete: "CASCADE" },
    },
    createdBy: {
      type: "uuid",
      required: true,
      references: { table: "users", column: "id", onDelete: "RESTRICT" },
    },
    status: { type: "string", required: true, defaultTo: "queued", index: true },
  };

  tenantId!: string;
  researchRunId!: string;
  createdBy!: string;
  status!: "queued" | "running" | "completed" | "failed";
}
