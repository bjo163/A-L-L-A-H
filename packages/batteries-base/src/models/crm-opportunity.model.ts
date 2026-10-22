import { BatteriesModel, type FieldDefinition } from "@empire/batteries";
export class CrmOpportunityModel extends BatteriesModel {
  static override tableName = "crm_opportunities";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    partnerId: { type: "uuid", required: true, index: true, references: { table: "partners", column: "id", onDelete: "RESTRICT" } },
    title: { type: "string", required: true, index: true }, stage: { type: "string", required: true, defaultTo: "qualified", index: true },
    amount: { type: "decimal", required: true, defaultTo: 0 }, currency: { type: "string", required: true, defaultTo: "IDR" },
    probability: { type: "integer", required: true, defaultTo: 0 }, expectedCloseAt: { type: "timestamp", nullable: true, index: true },
    ownerId: { type: "uuid", required: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
    source: { type: "string", nullable: true }, notes: { type: "text", nullable: true }, metadata: { type: "jsonb", nullable: true },
  };
}
