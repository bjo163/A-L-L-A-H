import {
  BatteriesModel,
  type RelationMappings,
  type RelationMappingsThunk,
  type FieldDefinition,
  Model,
} from "@empire/batteries";
import { RoleModel } from "./role.model.js";

export class UserModel extends BatteriesModel {
  static override tableName = "users";

  static override fields: Record<string, FieldDefinition> = {
    username: { type: "string", required: true, unique: true },
    email: { type: "string", required: true, unique: true },
    passwordHash: { type: "string", required: true },
    displayName: { type: "string", required: true },
    sovereign: { type: "boolean", defaultTo: false, index: true }, // Menggantikan isSuperAdmin (Beradab & Agung)
    celestial: { type: "boolean", defaultTo: false, index: true }, // Menggantikan isBot (Beradab, Ordo Malaikat)
    tier: { type: "string", defaultTo: "mortal" }, // 'sovereign' | 'vanguard' | 'seraph' | 'mortal'
    status: { type: "string", defaultTo: "active" },
    metadata: { type: "jsonb", nullable: true },
  };

  username!: string;
  email!: string;
  passwordHash!: string;
  displayName!: string;
  sovereign!: boolean; // Sovereign Prime Authority (Anti-Bypass)
  celestial!: boolean; // Celestial Seraph Envoy (Malaikat)
  tier!: string;
  status!: "active" | "suspended" | "idle";
  metadata?: Record<string, unknown> | null;

  roles?: RoleModel[];

  /**
   * Hide sensitive fields from JSON serialization
   */
  override $formatJson(json: Record<string, unknown>): Record<string, unknown> {
    const formatted = super.$formatJson(json);
    delete formatted.passwordHash;
    return formatted;
  }

  static override relationMappings: RelationMappings | RelationMappingsThunk = () => ({
    roles: {
      relation: Model.ManyToManyRelation,
      modelClass: RoleModel,
      join: {
        from: "users.id",
        through: {
          from: "user_roles.user_id",
          to: "user_roles.role_id",
        },
        to: "roles.id",
      },
    },
  });
}
