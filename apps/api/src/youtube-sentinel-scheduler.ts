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
      if (isDbUp) {
        if (scanResult.scannedCount > 0 && scanResult.items.length > 0) {
          try {
            await persistItemsToDB(scanResult.items, scanResult.crawlerMode ?? "auto");
          } catch (dbErr) {
            console.warn("[YouTube Sentinel Scheduler] DB persist warning:", dbErr);
          }
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
      console.error("[YouTube Sentinel Scheduler] Error running query:", err);
    }
  }

  const durationMs = Date.now() - t0;
  console.info(
    `[YouTube Sentinel Scheduler] Completed 12-hour sweep in ${durationMs}ms: ` +
    `${totalScanned} scanned, ${totalNew} new potential syirik items added to review queue.`
  );

  return { totalScanned, totalNew, durationMs, queriesRun };
}

let activeIntervalMs = TWELVE_HOURS_MS;
let lastSweepStartedAt: string | null = null;
let lastSweepCompletedAt: string | null = null;
let lastSweepResult: ScheduledRunResult | null = null;
let isSweepInProgress = false;
let nextScheduledSweepAt: string | null = null;
let activeRecurringTimer: NodeJS.Timeout | null = null;
let activeInitialTimer: NodeJS.Timeout | null = null;

export function getYoutubeSentinelSchedulerStatus() {
  return {
    enabled: true,
    intervalMs: activeIntervalMs,
    intervalHours: activeIntervalMs / 3_600_000,
    isSweepInProgress,
    lastSweepStartedAt,
    lastSweepCompletedAt,
    lastSweepResult,
    nextScheduledSweepAt,
    defaultQueries: YOUTUBE_SENTINEL_DEFAULT_SCHEDULED_QUERIES,
  };
}

export async function triggerManualYoutubeSweep(queries?: string[], limitPerQuery?: number) {
  if (isSweepInProgress) {
    return {
      ok: false,
      message: "Pemindaian terjadwal sedang berlangsung, silakan tunggu.",
      status: getYoutubeSentinelSchedulerStatus(),
    };
  }
  isSweepInProgress = true;
  lastSweepStartedAt = new Date().toISOString();
  try {
    const result = await executeScheduledYoutubeSweep(queries, limitPerQuery);
    lastSweepResult = result;
    lastSweepCompletedAt = new Date().toISOString();
    nextScheduledSweepAt = new Date(Date.now() + activeIntervalMs).toISOString();
    return {
      ok: true,
      message: `Pemindaian terjadwal selesai: ${result.totalScanned} video dievaluasi (${result.totalNew} baru).`,
      result,
      status: getYoutubeSentinelSchedulerStatus(),
    };
  } finally {
    isSweepInProgress = false;
  }
}

export function updateYoutubeSentinelSchedulerInterval(newIntervalHours: number) {
  const ms = Math.max(1, newIntervalHours) * 3_600_000;
  activeIntervalMs = ms;
  nextScheduledSweepAt = new Date(Date.now() + activeIntervalMs).toISOString();
  if (activeRecurringTimer) {
    clearInterval(activeRecurringTimer);
    activeRecurringTimer = setInterval(() => {
      void runSweep();
    }, activeIntervalMs);
    activeRecurringTimer.unref?.();
  }
  return getYoutubeSentinelSchedulerStatus();
}

const runSweep = async () => {
  if (isSweepInProgress) return;
  isSweepInProgress = true;
  lastSweepStartedAt = new Date().toISOString();
  try {
    const result = await executeScheduledYoutubeSweep();
    lastSweepResult = result;
    lastSweepCompletedAt = new Date().toISOString();
    nextScheduledSweepAt = new Date(Date.now() + activeIntervalMs).toISOString();
  } catch (err) {
    console.error("[YouTube Sentinel Scheduler] Sweep error:", err);
  } finally {
    isSweepInProgress = false;
  }
};

/**
 * Starts the background timer running every 12 hours (or configured interval).
 * Returns a cancel function for clean shutdown.
 */
export function startYoutubeSentinelScheduler(
  intervalMsConfigured = process.env.YOUTUBE_SENTINEL_INTERVAL_MS,
  runInitialDelayMs = 15_000,
): () => void {
  const parsed = Number(intervalMsConfigured);
  activeIntervalMs = Number.isFinite(parsed) && parsed >= 10_000 ? parsed : TWELVE_HOURS_MS;
  nextScheduledSweepAt = new Date(Date.now() + runInitialDelayMs).toISOString();

  // Schedule first run after initial boot delay so server startup is fast
  activeInitialTimer = setTimeout(() => {
    void runSweep();
  }, runInitialDelayMs);
  activeInitialTimer.unref?.();

  // Recurring interval
  activeRecurringTimer = setInterval(() => {
    void runSweep();
  }, activeIntervalMs);
  activeRecurringTimer.unref?.();

  console.info(
    `[YouTube Sentinel Scheduler] Initialized. Recurring every ${(activeIntervalMs / 3_600_000).toFixed(1)} hours.`
  );

  return () => {
    if (activeInitialTimer) clearTimeout(activeInitialTimer);
    if (activeRecurringTimer) clearInterval(activeRecurringTimer);
    console.info("[YouTube Sentinel Scheduler] Stopped.");
  };
}
