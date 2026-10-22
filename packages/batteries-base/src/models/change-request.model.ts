import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ChangeRequestModel extends BatteriesModel {
  static override tableName = "change_requests";
  static override fields: Record<string, FieldDefinition> = {
    code: { type: "string", required: true, unique: true, index: true },
    title: { type: "string", required: true },
    tier: { type: "string", required: true, index: true },
    riskLevel: { type: "string", required: true, index: true },
    status: { type: "string", required: true, index: true },
    authorId: {
      type: "uuid",
      required: true,
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    summary: { type: "text", required: true },
    justification: { type: "text", required: true },
    executionPlan: { type: "text", required: true },
    rollbackPlan: { type: "text", required: true },
    targetService: { type: "string", required: true },
    scheduledWindowStart: { type: "timestamp", nullable: true },
    scheduledWindowEnd: { type: "timestamp", nullable: true },
    sovereignDecree: { type: "boolean", defaultTo: false },
    adabScore: { type: "integer", defaultTo: 100 },
    auditRound: { type: "integer", defaultTo: 0 },
    metadata: { type: "jsonb", nullable: true },
  };
  code!: string;
  title!: string;
  tier!: "standard" | "significant" | "critical" | "emergency";
  riskLevel!: "low" | "moderate" | "high" | "critical";
  status!:
    | "draft"
    | "auditing"
    | "deliberation"
    | "approved"
    | "rejected"
    | "executing"
    | "completed"
    | "reverted";
  authorId!: string;
  summary!: string;
  justification!: string;
  executionPlan!: string;
  rollbackPlan!: string;
  targetService!: string;
  scheduledWindowStart?: string | null;
  scheduledWindowEnd?: string | null;
  sovereignDecree!: boolean;
  adabScore!: number;
  auditRound!: number;
  metadata?: Record<string, unknown> | null;
}
