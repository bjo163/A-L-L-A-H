import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class CatalogItemModel extends BatteriesModel {
  static override tableName = "catalog_items";
  static override uniqueConstraints = [["tenantId", "sku"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    sku: { type: "string", required: true }, name: { type: "string", required: true, index: true },
    kind: { type: "string", required: true, defaultTo: "service", index: true }, description: { type: "text", nullable: true },
    unit: { type: "string", required: true, defaultTo: "unit" }, unitPrice: { type: "decimal", required: true, defaultTo: 0 },
    currency: { type: "string", required: true, defaultTo: "IDR" }, taxRate: { type: "decimal", required: true, defaultTo: 0 },
    active: { type: "boolean", required: true, defaultTo: true, index: true }, metadata: { type: "jsonb", nullable: true },
  };
  tenantId!: string; sku!: string; name!: string; kind!: "product" | "service"; description?: string | null; unit!: string;
  unitPrice!: string | number; currency!: string; taxRate!: string | number; active!: boolean; metadata?: Record<string, unknown> | null;
}
