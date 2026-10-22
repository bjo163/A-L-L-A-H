import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ProjectModel extends BatteriesModel {
  static override tableName = "projects";
  static override uniqueConstraints = [["workspaceId", "slug"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    workspaceId: { type: "uuid", required: true, index: true, references: { table: "workspaces", column: "id", onDelete: "CASCADE" } },
    slug: { type: "string", required: true },
    name: { type: "string", required: true, index: true },
    description: { type: "text", nullable: true },
    status: { type: "string", required: true, defaultTo: "active", index: true },
    createdBy: { type: "uuid", required: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
    metadata: { type: "jsonb", nullable: true },
  };
  tenantId!: string;
  workspaceId!: string;
  slug!: string;
  name!: string;
  description?: string | null;
  status!: "active" | "archived";
  createdBy!: string;
  metadata?: Record<string, unknown> | null;
}
