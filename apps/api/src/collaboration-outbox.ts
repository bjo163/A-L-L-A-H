import { getDatabase } from "@empire/batteries";
import { NotificationModel } from "@empire/batteries-base";
import { TenantMembershipModel } from "@empire/batteries-base";

let running = false;

/** Turns durable in-app delivery intents into inbox rows, atomically and with row locking. */
export async function processNotificationOutboxBatch(limit = 50): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    const database = getDatabase();
    return await database.transaction(async (trx) => {
      const claimed = await trx.raw(
        `WITH selected AS (
           SELECT id FROM notification_outbox
           WHERE status IN ('pending', 'failed') AND available_at <= now()
           ORDER BY created_at ASC
           FOR UPDATE SKIP LOCKED LIMIT ?
         )
         UPDATE notification_outbox AS outbox
         SET status = 'processing', attempts = attempts + 1, locked_at = now(), updated_at = now()
         FROM selected WHERE outbox.id = selected.id
         RETURNING outbox.*`,
        [Math.max(1, Math.min(100, limit))],
      );
      const rows = claimed.rows as Array<Record<string, unknown>>;
      for (const row of rows) {
        const payload = row.payload as Record<string, unknown>;
        const recipients = Array.isArray(payload.recipientUserIds)
          ? [...new Set(payload.recipientUserIds.filter((item): item is string => typeof item === "string"))]
          : [];
        const memberships = recipients.length ? await TenantMembershipModel.query(trx)
          .where({ tenant_id: row.tenant_id, status: "active" }).whereIn("user_id", recipients).select("user_id") : [];
        for (const { userId } of memberships) {
          await (NotificationModel.query(trx) as any).insert({
            tenantId: row.tenant_id,
            userId,
            eventType: row.event_type,
            title: typeof payload.title === "string" ? payload.title : String(row.event_type),
            body: typeof payload.body === "string" ? payload.body : null,
            actionUrl: typeof payload.actionUrl === "string" ? payload.actionUrl : null,
            metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : null,
          });
        }
        await trx("notification_outbox").where({ id: row.id }).update({ status: "processed", processed_at: trx.fn.now(), locked_at: null, last_error: null, updated_at: trx.fn.now() });
      }
      return rows.length;
    });
  } finally {
    running = false;
  }
}

export function startNotificationOutboxWorker() {
  let active = true;
  let inFlight = false;
  let currentRun: Promise<void> | null = null;
  const timer = setInterval(() => {
    if (!active || inFlight) return;
    inFlight = true;
    currentRun = processNotificationOutboxBatch().then(() => undefined, (error) => {
      console.error("[Notification outbox] Batch failed; rows remain retryable.", error);
    }).finally(() => { inFlight = false; currentRun = null; });
  }, 5000);
  timer.unref?.();
  return async () => { active = false; clearInterval(timer); await currentRun; };
}
