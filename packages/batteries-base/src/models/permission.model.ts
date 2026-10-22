import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class PermissionModel extends BatteriesModel {
  static override tableName = "permissions";

  static override fields: Record<string, FieldDefinition> = {
    name: { type: "string", required: true },
    slug: { type: "string", required: true, unique: true },
    description: { type: "string", nullable: true },
  };

  name!: string;
  slug!: string;
  description?: string | null;
}
