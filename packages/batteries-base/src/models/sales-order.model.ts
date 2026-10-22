import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class SalesOrderModel extends BatteriesModel {
  static override tableName = "sales_orders";
  static override uniqueConstraints = [["tenantId", "number"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    quoteId: { type: "uuid", nullable: true, index: true, references: { table: "sales_quotes", column: "id", onDelete: "SET NULL" } },
    partnerId: { type: "uuid", required: true, index: true, references: { table: "partners", column: "id", onDelete: "RESTRICT" } },
    number: { type: "string", required: true }, status: { type: "string", required: true, defaultTo: "confirmed", index: true },
    currency: { type: "string", required: true, defaultTo: "IDR" }, subtotal: { type: "decimal", required: true }, taxTotal: { type: "decimal", required: true }, total: { type: "decimal", required: true },
    orderedAt: { type: "timestamp", required: true }, notes: { type: "text", nullable: true },
  };
}
