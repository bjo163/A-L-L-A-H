import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class TenantMembershipModel extends BatteriesModel {
  static override tableName = "tenant_memberships";
  static override uniqueConstraints = [["tenantId", "userId"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "tenants", column: "id", onDelete: "CASCADE" },
    },
    userId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    role: { type: "string", required: true, defaultTo: "member" },
    status: { type: "string", required: true, defaultTo: "active", index: true },
  };

  tenantId!: string;
  userId!: string;
  role!: string;
  status!: "active" | "suspended";
}
