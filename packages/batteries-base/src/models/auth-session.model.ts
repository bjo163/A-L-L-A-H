import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class AuthSessionModel extends BatteriesModel {
  static override tableName = "auth_sessions";
  static override fields: Record<string, FieldDefinition> = {
    userId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    tokenHash: { type: "string", required: true, unique: true },
    expiresAt: { type: "timestamp", required: true, index: true },
    revokedAt: { type: "timestamp", nullable: true },
    ipAddress: { type: "string", nullable: true },
  };
  userId!: string;
  tokenHash!: string;
  expiresAt!: string;
  revokedAt?: string | null;
  ipAddress?: string | null;
}
