import {
  BatteriesModel,
  type RelationMappings,
  type RelationMappingsThunk,
  type FieldDefinition,
  Model,
} from "@empire/batteries";
import { UserModel } from "./user.model.js";

export class AuditLogModel extends BatteriesModel {
  static override tableName = "audit_logs";
  // Audit events are append-only and the legacy ledger has no deleted_at column.
  static override hasSoftDelete = false;

  static override fields: Record<string, FieldDefinition> = {
    userId: {
      type: "uuid",
      nullable: true,
      index: true,
      references: { table: "users", column: "id", onDelete: "SET NULL" },
    },
    action: { type: "string", required: true, index: true },
    entity: { type: "string", required: true, index: true },
    entityId: { type: "string", nullable: true },
    payload: { type: "jsonb", nullable: true },
    ipAddress: { type: "string", nullable: true },
  };

  userId?: string | null;
  action!: string;
  entity!: string;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
  ipAddress?: string | null;

  user?: UserModel | null;

  static override relationMappings: RelationMappings | RelationMappingsThunk = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: {
        from: "audit_logs.user_id",
        to: "users.id",
      },
    },
  });
}
