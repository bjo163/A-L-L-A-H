import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ResearchApprovalModel extends BatteriesModel {
  static override tableName = "research_approvals";
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
      index: true,
      references: { table: "research_runs", column: "id", onDelete: "CASCADE" },
    },
    approverId: {
      type: "uuid",
      required: true,
      references: { table: "users", column: "id", onDelete: "RESTRICT" },
    },
    decision: { type: "string", required: true },
    comments: { type: "text", nullable: true },
  };

  tenantId!: string;
  researchRunId!: string;
  approverId!: string;
  decision!: "approved" | "rejected";
  comments?: string | null;
}
