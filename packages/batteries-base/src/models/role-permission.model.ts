import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class RolePermissionModel extends BatteriesModel {
  static override tableName = "role_permissions";
  static override uniqueConstraints = [["roleId", "permissionId"]];

  static override fields: Record<string, FieldDefinition> = {
    roleId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "roles", column: "id", onDelete: "CASCADE" },
    },
    permissionId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "permissions", column: "id", onDelete: "CASCADE" },
    },
  };

  roleId!: string;
  permissionId!: string;
}
