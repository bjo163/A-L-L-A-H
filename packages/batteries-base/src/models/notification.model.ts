import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Durable per-user inbox item. Delivery channels can be added without changing this record. */
export class NotificationModel extends BatteriesModel {
  static override tableName = "notifications";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    userId: { type: "uuid", required: true, index: true, references: { table: "users", column: "id", onDelete: "CASCADE" } },
    eventType: { type: "string", required: true, index: true },
    title: { type: "string", required: true },
    body: { type: "text", nullable: true },
    actionUrl: { type: "string", nullable: true },
    readAt: { type: "timestamp", nullable: true, index: true },
    metadata: { type: "jsonb", nullable: true },
  };
  tenantId!: string;
  userId!: string;
  eventType!: string;
  title!: string;
  body?: string | null;
  actionUrl?: string | null;
  readAt?: string | null;
  metadata?: Record<string, unknown> | null;
}
