import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class CalendarActivityModel extends BatteriesModel {
  static override tableName = "calendar_activities";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    partnerId: { type: "uuid", nullable: true, index: true, references: { table: "partners", column: "id", onDelete: "SET NULL" } },
    opportunityId: { type: "uuid", nullable: true, index: true, references: { table: "crm_opportunities", column: "id", onDelete: "SET NULL" } },
    projectId: { type: "uuid", nullable: true, index: true, references: { table: "projects", column: "id", onDelete: "SET NULL" } },
    taskId: { type: "uuid", nullable: true, index: true, references: { table: "tasks", column: "id", onDelete: "SET NULL" } },
    ownerId: { type: "uuid", required: true, index: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
    title: { type: "string", required: true }, kind: { type: "string", required: true, defaultTo: "meeting", index: true },
    status: { type: "string", required: true, defaultTo: "planned", index: true }, startsAt: { type: "timestamp", required: true, index: true }, endsAt: { type: "timestamp", nullable: true },
    location: { type: "string", nullable: true }, notes: { type: "text", nullable: true }, completedAt: { type: "timestamp", nullable: true },
  };
  tenantId!: string; partnerId?: string | null; opportunityId?: string | null; projectId?: string | null; taskId?: string | null;
  ownerId!: string; title!: string; kind!: string; status!: string; startsAt!: string; endsAt?: string | null;
  location?: string | null; notes?: string | null; completedAt?: string | null;
}
