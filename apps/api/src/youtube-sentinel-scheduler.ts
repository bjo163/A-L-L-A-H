import { scanYoutube } from "@empire/batteries-world-monitor";
import { YoutubeSentinelScanModel } from "@empire/batteries-base";
import { dbAvailable, persistItemsToDB } from "./youtube-sentinel-storage.js";

/**
 * Default periodic surveillance queries targeting syirik, occultism,
 * commercial witchcraft, and misleading supernatural transactions.
 */
export const YOUTUBE_SENTINEL_DEFAULT_SCHEDULED_QUERIES = [
  "pesugihan uang gaib tanpa tumbal",
  "dukun santet sakti mahar",
  "jual jimat pelet ampuh",
  "cek khodam pendamping leluhur",
  "larung sesaji makam keramat pesugihan",
  "tarik pusaka gaib mustika",
];

export const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export interface ScheduledRunResult {
  totalScanned: number;
  totalNew: number;
  durationMs: number;
  queriesRun: number;
}

/**
 * Executes one complete sweep across all scheduled queries.
 * Always searches by `upload_date` (urutan video terbaru).
 */
export async function executeScheduledYoutubeSweep(
  queries: string[] = YOUTUBE_SENTINEL_DEFAULT_SCHEDULED_QUERIES,
  limitPerQuery: number = 10,
): Promise<ScheduledRunResult> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  let totalScanned = 0;
  let totalNew = 0;
  let queriesRun = 0;

  console.info(`[YouTube Sentinel Scheduler] Starting 12-hour sweep across ${queries.length} queries (sortBy: upload_date)...`);

  for (const query of queries) {
    try {
      const scanResult = await scanYoutube({
        query,
        limit: limitPerQuery,
        sortBy: "upload_date", // Video terbaru
        engine: "auto",
      });

      queriesRun++;
      totalScanned += scanResult.scannedCount;
      totalNew += scanResult.newItemsCount;

      const isDbUp = await dbAvailable();
      if (isDbUp && scanResult.items.length > 0) {
        try {
          await persistItemsToDB(scanResult.items, scanResult.crawlerMode ?? "auto");
        } catch (dbErr) {
          console.warn(`[YouTube Sentinel Scheduler] DB persist warning for query "${query}":`, dbErr);
        }

        try {
          await YoutubeSentinelScanModel.query().insert({
            query,
            engine: "auto",
            crawlerMode: scanResult.crawlerMode ?? null,
            scannedCount: scanResult.scannedCount,
            newCount: scanResult.newItemsCount,
            durationMs: Date.now() - t0,
            diagnosticMessage: scanResult.diagnosticMessage ?? null,
            startedAt,
            completedAt: new Date().toISOString(),
            triggeredBy: "scheduler_12h",
          });
        } catch {
          // Ledger write failure is non-fatal
        }
      }
    } catch (err) {
      console.error(`[YouTube Sentinel Scheduler] Error running query "${query}":`, err);
    }
  }

  const durationMs = Date.now() - t0;
  console.info(
    `[YouTube Sentinel Scheduler] Completed 12-hour sweep in ${durationMs}ms: ` +
    `${totalScanned} scanned, ${totalNew} new potential syirik items added to review queue.`
  );

  return { totalScanned, totalNew, durationMs, queriesRun };
}

/**
 * Starts the background timer running every 12 hours (or configured interval).
 * Returns a cancel function for clean shutdown.
 */
export function startYoutubeSentinelScheduler(
  intervalMsConfigured = process.env.YOUTUBE_SENTINEL_INTERVAL_MS,
  runInitialDelayMs = 15_000,
): () => void {
  const parsed = Number(intervalMsConfigured);
  // Minimum 10 seconds for testing/dev override, default 12 hours
  const intervalMs = Number.isFinite(parsed) && parsed >= 10_000 ? parsed : TWELVE_HOURS_MS;

  let running = false;
  const runSweep = async () => {
    if (running) return;
    running = true;
    try {
      await executeScheduledYoutubeSweep();
    } catch (err) {
      console.error("[YouTube Sentinel Scheduler] Sweep error:", err);
    } finally {
      running = false;
    }
  };

  // Schedule first run after initial boot delay so server startup is fast
  const initialTimer = setTimeout(() => {
    void runSweep();
  }, runInitialDelayMs);
  initialTimer.unref?.();

  // Recurring 12-hour interval
  const recurringTimer = setInterval(() => {
    void runSweep();
  }, intervalMs);
  recurringTimer.unref?.();

  console.info(
    `[YouTube Sentinel Scheduler] Initialized. Recurring every ${(intervalMs / 3_600_000).toFixed(1)} hours.`
  );

  return () => {
    clearTimeout(initialTimer);
    clearInterval(recurringTimer);
    console.info("[YouTube Sentinel Scheduler] Stopped.");
  };
}
