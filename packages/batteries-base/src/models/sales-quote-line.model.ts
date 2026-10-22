import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class SalesQuoteLineModel extends BatteriesModel {
  static override tableName = "sales_quote_lines";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    quoteId: { type: "uuid", required: true, index: true, references: { table: "sales_quotes", column: "id", onDelete: "CASCADE" } },
    catalogItemId: { type: "uuid", nullable: true, references: { table: "catalog_items", column: "id", onDelete: "SET NULL" } },
    description: { type: "string", required: true }, quantity: { type: "decimal", required: true }, unitPrice: { type: "decimal", required: true },
    taxRate: { type: "decimal", required: true, defaultTo: 0 }, lineTotal: { type: "decimal", required: true },
  };
  tenantId!: string; quoteId!: string; catalogItemId?: string | null; description!: string;
  quantity!: string | number; unitPrice!: string | number; taxRate!: string | number; lineTotal!: string | number;
}
