import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class OperationalInvoiceModel extends BatteriesModel {
  static override tableName = "operational_invoices";
  static override uniqueConstraints = [["tenantId", "number"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    partnerId: { type: "uuid", required: true, index: true, references: { table: "partners", column: "id", onDelete: "RESTRICT" } },
    orderId: { type: "uuid", nullable: true, index: true, references: { table: "sales_orders", column: "id", onDelete: "SET NULL" } },
    number: { type: "string", required: true }, status: { type: "string", required: true, defaultTo: "issued", index: true },
    currency: { type: "string", required: true, defaultTo: "IDR" }, amount: { type: "decimal", required: true }, paidAmount: { type: "decimal", required: true, defaultTo: 0 },
    issuedAt: { type: "timestamp", required: true }, dueAt: { type: "timestamp", nullable: true, index: true }, notes: { type: "text", nullable: true },
  };
  tenantId!: string; partnerId!: string; orderId?: string | null; number!: string; status!: string; currency!: string;
  amount!: string | number; paidAmount!: string | number; issuedAt!: string; dueAt?: string | null; notes?: string | null;
}
