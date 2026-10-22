import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class TenantModel extends BatteriesModel {
  static override tableName = "tenants";
  static override fields: Record<string, FieldDefinition> = {
    slug: { type: "string", required: true, unique: true },
    displayName: { type: "string", required: true },
    status: { type: "string", required: true, defaultTo: "active", index: true },
  };

  slug!: string;
  displayName!: string;
  status!: "active" | "suspended";
}
