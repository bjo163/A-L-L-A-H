import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class OperationalExpenseModel extends BatteriesModel {
  static override tableName = "operational_expenses";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    partnerId: { type: "uuid", nullable: true, index: true, references: { table: "partners", column: "id", onDelete: "SET NULL" } },
    category: { type: "string", required: true, index: true }, description: { type: "string", required: true },
    amount: { type: "decimal", required: true }, currency: { type: "string", required: true, defaultTo: "IDR" },
    incurredAt: { type: "timestamp", required: true, index: true }, status: { type: "string", required: true, defaultTo: "recorded", index: true },
    receiptDocumentId: { type: "uuid", nullable: true, references: { table: "documents", column: "id", onDelete: "SET NULL" } },
    recordedBy: { type: "uuid", required: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } }, notes: { type: "text", nullable: true },
  };
}
