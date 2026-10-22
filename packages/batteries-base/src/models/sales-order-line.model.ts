import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class SalesOrderLineModel extends BatteriesModel {
  static override tableName = "sales_order_lines";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    orderId: { type: "uuid", required: true, index: true, references: { table: "sales_orders", column: "id", onDelete: "CASCADE" } },
    catalogItemId: { type: "uuid", nullable: true, references: { table: "catalog_items", column: "id", onDelete: "SET NULL" } },
    description: { type: "string", required: true }, quantity: { type: "decimal", required: true }, unitPrice: { type: "decimal", required: true },
    taxRate: { type: "decimal", required: true, defaultTo: 0 }, lineTotal: { type: "decimal", required: true },
  };
}
