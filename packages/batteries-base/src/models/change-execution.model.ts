import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ChangeExecutionModel extends BatteriesModel {
  static override tableName = "change_executions";
  static override fields: Record<string, FieldDefinition> = {
    changeRequestId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "change_requests", column: "id", onDelete: "CASCADE" },
    },
    executorId: {
      type: "uuid",
      required: true,
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    action: { type: "string", required: true },
    outcome: { type: "string", required: true },
    notes: { type: "text", nullable: true },
    startedAt: { type: "timestamp", required: true },
    completedAt: { type: "timestamp", nullable: true },
  };
  changeRequestId!: string;
  executorId!: string;
  action!: "execute" | "rollback";
  outcome!: "started" | "completed" | "failed";
  notes?: string | null;
  startedAt!: string;
  completedAt?: string | null;
}
