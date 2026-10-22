import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Polymorphic tag link; API validation must confirm the target belongs to this tenant. */
export class TagAssignmentModel extends BatteriesModel {
  static override tableName = "tag_assignments";
  static override uniqueConstraints = [["tenantId", "tagId", "entityType", "entityId"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    tagId: { type: "uuid", required: true, index: true, references: { table: "tags", column: "id", onDelete: "CASCADE" } },
    entityType: { type: "string", required: true, index: true },
    entityId: { type: "string", required: true, index: true },
    assignedBy: { type: "uuid", required: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
  };
  tenantId!: string;
  tagId!: string;
  entityType!: string;
  entityId!: string;
  assignedBy!: string;
}
