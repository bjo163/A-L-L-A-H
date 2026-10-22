import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class TaskModel extends BatteriesModel {
  static override tableName = "tasks";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    projectId: { type: "uuid", required: true, index: true, references: { table: "projects", column: "id", onDelete: "CASCADE" } },
    createdBy: { type: "uuid", required: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
    assignedTo: { type: "uuid", nullable: true, index: true, references: { table: "users", column: "id", onDelete: "SET NULL" } },
    researchRunId: { type: "uuid", nullable: true, index: true, references: { table: "research_runs", column: "id", onDelete: "SET NULL" } },
    title: { type: "string", required: true, index: true },
    description: { type: "text", nullable: true },
    status: { type: "string", required: true, defaultTo: "todo", index: true },
    priority: { type: "string", required: true, defaultTo: "normal", index: true },
    dueAt: { type: "timestamp", nullable: true, index: true },
    completedAt: { type: "timestamp", nullable: true },
    metadata: { type: "jsonb", nullable: true },
  };
  tenantId!: string;
  projectId!: string;
  createdBy!: string;
  assignedTo?: string | null;
  researchRunId?: string | null;
  title!: string;
  description?: string | null;
  status!: "todo" | "in_progress" | "blocked" | "done" | "cancelled";
  priority!: "low" | "normal" | "high" | "urgent";
  dueAt?: string | null;
  completedAt?: string | null;
  metadata?: Record<string, unknown> | null;
}
