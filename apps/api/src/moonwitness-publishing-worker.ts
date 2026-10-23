import {
  AuditLogModel, MoonwitnessCollectionModel, MoonwitnessContentRevisionModel,
  MoonwitnessPublicationModel, MoonwitnessStoryModel, MoonwitnessStoryTagModel, TenantMembershipModel,
} from "@empire/batteries-base";
import { getDatabase } from "@empire/batteries";

const defaultIntervalMs = 30_000;
const maxBatchSize = 100;

function snapshotMatchesStory(snapshot: Record<string, any>, story: any, tagIds: string[]) {
  return snapshot?.storyId === story.id && snapshot?.collectionId === story.collectionId && snapshot?.slug === story.slug &&
    snapshot?.title === story.title && (snapshot?.synopsis ?? null) === (story.synopsis ?? null) && snapshot?.body === story.body &&
    snapshot?.classification === story.classification && snapshot?.visibility === story.visibility &&
    Array.isArray(snapshot?.tagIds) && JSON.stringify([...snapshot.tagIds].sort()) === JSON.stringify([...tagIds].sort());
}

/** Publishes only due schedules whose approved snapshot still matches current content. */
export async function publishDueMoonwitnessStories(now = new Date(), batchSize = 50) {
  const limit = Number.isInteger(batchSize) ? Math.max(1, Math.min(maxBatchSize, batchSize)) : 50;
  return getDatabase().transaction(async (trx) => {
    const dueStories = await MoonwitnessStoryModel.query(trx)
      .where({ editorial_state: "scheduled" }).whereNotNull("scheduled_at").where("scheduled_at", "<=", now)
      .orderBy("scheduled_at", "asc").forUpdate().skipLocked().limit(limit);
    let published = 0;
    let blocked = 0;

    for (const story of dueStories) {
      const scheduledAt = story.scheduledAt instanceof Date ? story.scheduledAt.toISOString() : new Date(story.scheduledAt!).toISOString();
      const scheduleEvent = await AuditLogModel.query(trx)
        .where({ entity: "moonwitness_story", entity_id: story.id, action: "MOONWITNESS_STORY_SCHEDULED" })
        .whereRaw("payload ->> 'tenantId' = ? AND payload ->> 'scheduledAt' = ?", [story.tenantId, scheduledAt])
        .orderBy("created_at", "desc").first();
      const approvedEvent = await AuditLogModel.query(trx)
        .where({ entity: "moonwitness_story", entity_id: story.id, action: "MOONWITNESS_REVISION_APPROVED" })
        .whereRaw("payload ->> 'tenantId' = ?", [story.tenantId]).orderBy("created_at", "desc").first();
      const approvedRevisionId = approvedEvent?.payload?.revisionId;
      const approvedRevision = approvedRevisionId ? await MoonwitnessContentRevisionModel.query(trx)
        .where({ tenant_id: story.tenantId, story_id: story.id, id: approvedRevisionId }).first() : null;
      const tagIds = (await MoonwitnessStoryTagModel.query(trx).where({ tenant_id: story.tenantId, story_id: story.id }).select("tag_id"))
        .map((tag: any) => tag.tagId).sort();
      const snapshot = approvedRevision?.snapshot as Record<string, any> | undefined;
      const collection = await MoonwitnessCollectionModel.query(trx).where({ tenant_id: story.tenantId, id: story.collectionId }).first();
      const schedulerMembership = scheduleEvent?.userId ? await TenantMembershipModel.query(trx).where({ tenant_id: story.tenantId, user_id: scheduleEvent.userId, status: "active" }).first() : null;
      const isPublishable = Boolean(scheduleEvent?.userId && schedulerMembership && scheduleEvent?.payload?.approvedRevisionId === approvedRevisionId && approvedRevision && snapshot && snapshotMatchesStory(snapshot, story, tagIds) &&
        story.classification === "public" && story.visibility === "public" && collection?.status === "published" && collection?.visibility === "public");

      if (!isPublishable) {
        await story.$query(trx).patch({ editorialState: "approved", scheduledAt: null });
        await (AuditLogModel.query(trx) as any).insert({
          userId: scheduleEvent?.userId ?? null, action: "MOONWITNESS_SCHEDULED_PUBLICATION_BLOCKED",
          entity: "moonwitness_story", entityId: story.id,
          payload: { tenantId: story.tenantId, approvedRevisionId: approvedRevisionId ?? null, reason: "Scheduled content no longer matches an approved public snapshot or its collection is not public." },
        });
        blocked += 1;
        continue;
      }

      const existingPublication = await MoonwitnessPublicationModel.query(trx)
        .where({ tenant_id: story.tenantId, story_id: story.id, revision_id: approvedRevision!.id }).first();
      if (!existingPublication) {
        await (MoonwitnessPublicationModel.query(trx) as any).insert({
          tenantId: story.tenantId, storyId: story.id, revisionId: approvedRevision!.id,
          publisherId: scheduleEvent!.userId, snapshot, sha256: approvedRevision!.sha256, publishedAt: now,
        });
      }
      await story.$query(trx).patch({ editorialState: "published", scheduledAt: null });
      await (AuditLogModel.query(trx) as any).insert({
        userId: scheduleEvent!.userId, action: "MOONWITNESS_REVISION_PUBLISHED", entity: "moonwitness_story", entityId: story.id,
        payload: { tenantId: story.tenantId, revisionId: approvedRevision!.id, revision: approvedRevision!.revision, reason: "Scheduled publication completed." },
      });
      published += 1;
    }
    return { published, blocked };
  });
}

export function startMoonwitnessPublishingWorker(intervalMs = defaultIntervalMs) {
  const boundedInterval = Number.isFinite(intervalMs) ? Math.max(5_000, Math.min(5 * 60_000, intervalMs)) : defaultIntervalMs;
  let running = false;
  let stopped = false;
  const run = async () => {
    if (running || stopped) return;
    running = true;
    try {
      const result = await publishDueMoonwitnessStories();
      if (result.published || result.blocked) console.info(`[MOONWITNESS] scheduled publication completed published=${result.published} blocked=${result.blocked}`);
    } catch (error) {
      console.error("[MOONWITNESS] scheduled publication worker failed", error);
    } finally {
      running = false;
    }
  };
  void run();
  const timer = setInterval(() => void run(), boundedInterval);
  timer.unref?.();
  return () => { stopped = true; clearInterval(timer); };
}

