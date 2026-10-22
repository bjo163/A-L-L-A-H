import {
  BatteriesModel,
  type RelationMappings,
  type RelationMappingsThunk,
  type FieldDefinition,
  Model,
} from "@empire/batteries";
import { PermissionModel } from "./permission.model.js";

export class RoleModel extends BatteriesModel {
  static override tableName = "roles";

  static override fields: Record<string, FieldDefinition> = {
    name: { type: "string", required: true },
    slug: { type: "string", required: true, unique: true },
    description: { type: "string", nullable: true },
  };

  name!: string;
  slug!: string;
  description?: string | null;

  permissions?: PermissionModel[];

  static override relationMappings: RelationMappings | RelationMappingsThunk = () => ({
    permissions: {
      relation: Model.ManyToManyRelation,
      modelClass: PermissionModel,
      join: {
        from: "roles.id",
        through: {
          from: "role_permissions.role_id",
          to: "role_permissions.permission_id",
        },
        to: "permissions.id",
      },
    },
  });
}
