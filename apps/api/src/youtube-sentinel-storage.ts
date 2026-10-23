import { checkDatabaseHealth } from "./db.js";
import { YoutubeSentinelItemModel } from "@empire/batteries-base";
import type { YoutubeMonitoredItem } from "@empire/batteries-world-monitor";

export async function dbAvailable(): Promise<boolean> {
  try {
    return (await checkDatabaseHealth()).ok;
  } catch {
    return false;
  }
}

/**
 * Maps a database row from `youtube_sentinel_items` to the domain YoutubeMonitoredItem contract.
 */
export function rowToItem(row: YoutubeSentinelItemModel): YoutubeMonitoredItem {
  return {
    id: row.id,
    videoId: row.videoId,
    title: row.title,
    channelTitle: row.channelTitle,
    channelUrl: row.channelUrl ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(row.channelTitle)}`,
    url: row.url,
    publishedAt: row.publishedAt ?? new Date().toISOString(),
    viewCountText: row.viewCountText ?? undefined,
    durationText: row.durationText ?? undefined,
    thumbnailUrl: row.thumbnailUrl ?? `https://i.ytimg.com/vi/${row.videoId}/hqdefault.jpg`,
    descriptionSnippet: row.descriptionSnippet ?? "",
    direction: (row.direction ?? "NEGATIVE") as YoutubeMonitoredItem["direction"],
    tradition: (row.tradition ?? "ISLAM") as YoutubeMonitoredItem["tradition"],
    riskLevel: row.riskLevel as YoutubeMonitoredItem["riskLevel"],
    category: row.category as YoutubeMonitoredItem["category"],
    riskScore: row.riskScore,
    isRefutation: Boolean(row.isRefutation),
    matchedRules: (row.matchedRules ?? []) as YoutubeMonitoredItem["matchedRules"],
    tauhidGuidance: (row.tauhidGuidance ?? {
      topic: "Penjagaan Tauhid",
      dalilRef: "QS. Luqman: 13",
      translation: "Sesungguhnya mempersekutukan (Allah) adalah benar-benar kezaliman yang besar.",
      theologicalPrinciple: "Tauhid adalah hak mutlak Allah Subhanahu wa Ta'ala.",
      recommendedAction: "Waspada terhadap klaim supranatural atau perdukunan.",
    }) as YoutubeMonitoredItem["tauhidGuidance"],
    wisdomGuidance: (row.wisdomGuidance as YoutubeMonitoredItem["wisdomGuidance"]) ?? undefined,
    reportPacket: (row.reportPacket ?? {
      platform: "YouTube",
      targetUrl: row.url,
      videoTitle: row.title,
      channelTitle: row.channelTitle,
      reportedCategory: "harmful_dangerous",
      policyReference: "Kebijakan Konten Berbahaya & Merugikan YouTube",
      generatedComplaint: `Konten memuat promosi perdukunan/sihir: ${row.title}`,
      recommendedTimestamp: "00:00",
    }) as YoutubeMonitoredItem["reportPacket"],
    amplifyPacket: (row.amplifyPacket as YoutubeMonitoredItem["amplifyPacket"]) ?? undefined,
    counterDakwahBrief: (row.counterDakwahBrief ?? {
      summary: `Edukasi Tauhid terkait video ${row.title}`,
      dalilReferences: ["QS. Luqman: 13", "HR. Muslim no. 2230"],
      keyRebuttalPoints: ["Sihir dan perdukunan bertentangan dengan ajaran Tauhid."],
      suggestedCommentResponse: "Alhamdulillah, mari senantiasa bertawakkal kepada Allah semata dan menjauhi perdukunan.",
    }) as YoutubeMonitoredItem["counterDakwahBrief"],
    wisdomBrief: (row.wisdomBrief as YoutubeMonitoredItem["wisdomBrief"]) ?? undefined,
    workflowStatus: row.workflowStatus as YoutubeMonitoredItem["workflowStatus"],
    reviewEvidence: row.reviewEvidence ?? null,
    actionEvidence: row.actionEvidence ?? null,
    reviewRevision: row.reviewRevision ?? 0,
    operatorNotes: row.operatorNotes ?? undefined,
    scannedAt: row.scannedAt ?? row.createdAt,
    lastActionAt: row.lastActionAt ?? undefined,
    sourceType: (row.sourceType ?? "browser_automation") as YoutubeMonitoredItem["sourceType"],
    partnerId: row.partnerId ?? null,
  };
}

/**
 * Persist a batch of YoutubeMonitoredItem into the database using upsert semantics by videoId.
 * Preserves operator workflow status and operator notes so manual reviews are never lost.
 */
export async function persistItemsToDB(items: YoutubeMonitoredItem[], crawlerModeStr: string): Promise<void> {
  const now = new Date().toISOString();
  for (const item of items) {
    try {
      const existing = await YoutubeSentinelItemModel.query()
        .where({ video_id: item.videoId })
        .first();
      if (existing) {
        // Update metadata + risk evaluation, preserve operator workflow status & notes
        await YoutubeSentinelItemModel.query().patchAndFetchById(existing.id, {
          title: item.title,
          channelTitle: item.channelTitle,
          channelUrl: item.channelUrl,
          url: item.url,
          descriptionSnippet: item.descriptionSnippet ?? null,
          viewCountText: item.viewCountText ?? null,
          durationText: item.durationText ?? null,
          publishedAt: item.publishedAt ?? null,
          thumbnailUrl: item.thumbnailUrl ?? null,
          direction: item.direction ?? "NEGATIVE",
          tradition: item.tradition ?? "ISLAM",
          riskScore: item.riskScore,
          riskLevel: item.riskLevel,
          category: item.category,
          sourceType: item.sourceType,
          isRefutation: item.isRefutation,
          matchedRules: item.matchedRules as unknown[],
          tauhidGuidance: (item.tauhidGuidance as unknown) ?? null,
          wisdomGuidance: (item.wisdomGuidance as unknown) ?? null,
          reportPacket: (item.reportPacket as unknown) ?? null,
          amplifyPacket: (item.amplifyPacket as unknown) ?? null,
          counterDakwahBrief: (item.counterDakwahBrief as unknown) ?? null,
          wisdomBrief: (item.wisdomBrief as unknown) ?? null,
          crawlerMode: crawlerModeStr,
          lastCrawledAt: now,
        });
      } else {
        const isValidUUID = typeof item.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
        const insertPayload: Record<string, unknown> = {
          videoId: item.videoId,
          title: item.title,
          channelTitle: item.channelTitle,
          channelUrl: item.channelUrl,
          url: item.url,
          descriptionSnippet: item.descriptionSnippet ?? null,
          viewCountText: item.viewCountText ?? null,
          durationText: item.durationText ?? null,
          publishedAt: item.publishedAt ?? null,
          thumbnailUrl: item.thumbnailUrl ?? null,
          direction: item.direction ?? "NEGATIVE",
          tradition: item.tradition ?? "ISLAM",
          riskScore: item.riskScore,
          riskLevel: item.riskLevel,
          category: item.category,
          sourceType: item.sourceType,
          isRefutation: item.isRefutation,
          matchedRules: item.matchedRules as unknown[],
          tauhidGuidance: (item.tauhidGuidance as unknown) ?? null,
          wisdomGuidance: (item.wisdomGuidance as unknown) ?? null,
          reportPacket: (item.reportPacket as unknown) ?? null,
          amplifyPacket: (item.amplifyPacket as unknown) ?? null,
          counterDakwahBrief: (item.counterDakwahBrief as unknown) ?? null,
          wisdomBrief: (item.wisdomBrief as unknown) ?? null,
          workflowStatus: item.workflowStatus ?? (item.direction === "POSITIVE" ? "WISDOM_QUEUED" : "PENDING_REVIEW"),
          crawlerMode: crawlerModeStr,
          scannedAt: item.scannedAt ?? now,
          lastCrawledAt: now,
        };
        if (isValidUUID) {
          insertPayload.id = item.id;
        }
        await YoutubeSentinelItemModel.query().insert(insertPayload);
      }
    } catch (err) {
      // Non-fatal — log warning so DB issues are discoverable while preserving API response
      console.warn(`[YouTube Sentinel DB] Failed to persist item "${item.videoId}":`, (err as Error).message);
    }
  }
}
