import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Tenant-owned reusable label. */
export class TagModel extends BatteriesModel {
  static override tableName = "tags";
  static override uniqueConstraints = [["tenantId", "slug"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    slug: { type: "string", required: true },
    name: { type: "string", required: true, index: true },
    color: { type: "string", nullable: true },
    description: { type: "text", nullable: true },
  };
  tenantId!: string;
  slug!: string;
  name!: string;
  color?: string | null;
  description?: string | null;
}
