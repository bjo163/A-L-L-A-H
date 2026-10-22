import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class UserRoleModel extends BatteriesModel {
  static override tableName = "user_roles";
  static override uniqueConstraints = [["userId", "roleId"]];

  static override fields: Record<string, FieldDefinition> = {
    userId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    roleId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "roles", column: "id", onDelete: "CASCADE" },
    },
  };

  userId!: string;
  roleId!: string;
}
