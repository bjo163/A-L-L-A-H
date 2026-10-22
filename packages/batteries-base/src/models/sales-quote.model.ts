import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class SalesQuoteModel extends BatteriesModel {
  static override tableName = "sales_quotes";
  static override uniqueConstraints = [["tenantId", "number"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    partnerId: { type: "uuid", required: true, index: true, references: { table: "partners", column: "id", onDelete: "RESTRICT" } },
    opportunityId: { type: "uuid", nullable: true, index: true, references: { table: "crm_opportunities", column: "id", onDelete: "SET NULL" } },
    number: { type: "string", required: true }, status: { type: "string", required: true, defaultTo: "draft", index: true },
    currency: { type: "string", required: true, defaultTo: "IDR" }, subtotal: { type: "decimal", required: true, defaultTo: 0 },
    taxTotal: { type: "decimal", required: true, defaultTo: 0 }, total: { type: "decimal", required: true, defaultTo: 0 },
    validUntil: { type: "timestamp", nullable: true }, notes: { type: "text", nullable: true },
    createdBy: { type: "uuid", required: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
  };
  tenantId!: string; partnerId!: string; opportunityId?: string | null; number!: string; status!: string; currency!: string;
  subtotal!: string | number; taxTotal!: string | number; total!: string | number; validUntil?: string | null; notes?: string | null; createdBy!: string;
}
