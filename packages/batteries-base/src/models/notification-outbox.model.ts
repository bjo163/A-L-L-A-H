import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Transactional outbox row. A worker may claim pending rows and retry with backoff. */
export class NotificationOutboxModel extends BatteriesModel {
  static override tableName = "notification_outbox";
  static override uniqueConstraints = [["tenantId", "idempotencyKey"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    eventType: { type: "string", required: true, index: true },
    aggregateType: { type: "string", required: true, index: true },
    aggregateId: { type: "string", required: true, index: true },
    idempotencyKey: { type: "string", required: true },
    payload: { type: "jsonb", required: true },
    status: { type: "string", required: true, defaultTo: "pending", index: true },
    attempts: { type: "integer", required: true, defaultTo: 0 },
    availableAt: { type: "timestamp", required: true, index: true },
    lockedAt: { type: "timestamp", nullable: true },
    processedAt: { type: "timestamp", nullable: true },
    lastError: { type: "text", nullable: true },
  };
  tenantId!: string;
  eventType!: string;
  aggregateType!: string;
  aggregateId!: string;
  idempotencyKey!: string;
  payload!: Record<string, unknown>;
  status!: "pending" | "processing" | "processed" | "failed";
  attempts!: number;
  availableAt!: string;
  lockedAt?: string | null;
  processedAt?: string | null;
  lastError?: string | null;
}
