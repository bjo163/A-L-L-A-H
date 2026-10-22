import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Tenant-scoped discussion on an application record; target IDs are polymorphic. */
export class CommentModel extends BatteriesModel {
  static override tableName = "comments";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    entityType: { type: "string", required: true, index: true },
    entityId: { type: "string", required: true, index: true },
    authorId: { type: "uuid", required: true, index: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
    parentId: { type: "uuid", nullable: true, index: true, references: { table: "comments", column: "id", onDelete: "CASCADE" } },
    body: { type: "text", required: true },
    editedAt: { type: "timestamp", nullable: true },
    status: { type: "string", required: true, defaultTo: "active", index: true },
  };
  tenantId!: string;
  entityType!: string;
  entityId!: string;
  authorId!: string;
  parentId?: string | null;
  body!: string;
  editedAt?: string | null;
  status!: "active" | "deleted";
}
