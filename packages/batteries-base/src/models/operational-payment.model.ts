import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class OperationalPaymentModel extends BatteriesModel {
  static override tableName = "operational_payments";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    invoiceId: { type: "uuid", required: true, index: true, references: { table: "operational_invoices", column: "id", onDelete: "CASCADE" } },
    amount: { type: "decimal", required: true }, currency: { type: "string", required: true, defaultTo: "IDR" },
    method: { type: "string", required: true }, reference: { type: "string", nullable: true }, paidAt: { type: "timestamp", required: true }, notes: { type: "text", nullable: true },
    recordedBy: { type: "uuid", required: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
  };
}
