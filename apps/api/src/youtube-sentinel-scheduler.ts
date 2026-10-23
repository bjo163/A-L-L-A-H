import { scanYoutube } from "@empire/batteries-world-monitor";
import { YoutubeSentinelScanModel } from "@empire/batteries-base";
import { dbAvailable, persistItemsToDB } from "./youtube-sentinel-storage.js";
import { youtubeScanGate } from "./youtube-scan-gate.js";

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
export const MAX_SCHEDULED_YOUTUBE_QUERIES = 6;
export const MAX_SCHEDULED_YOUTUBE_RESULTS_PER_QUERY = 10;
export const MAX_SCHEDULED_YOUTUBE_QUERY_LENGTH = 200;

export interface ScheduledRunResult {
  totalScanned: number;
  totalNew: number;
  durationMs: number;
  queriesRun: number;
}

export function validateScheduledYoutubeSweepInput(
  queries: string[] = YOUTUBE_SENTINEL_DEFAULT_SCHEDULED_QUERIES,
  limitPerQuery = MAX_SCHEDULED_YOUTUBE_RESULTS_PER_QUERY,
) {
  if (!Array.isArray(queries) || queries.length < 1 || queries.length > MAX_SCHEDULED_YOUTUBE_QUERIES) {
    throw new RangeError(`A scheduled YouTube sweep must contain 1-${MAX_SCHEDULED_YOUTUBE_QUERIES} queries.`);
  }
  const normalizedQueries = queries.map((query) => {
    if (typeof query !== "string") throw new TypeError("Scheduled YouTube queries must be strings.");
    const normalized = query.normalize("NFC").trim().replace(/\s+/gu, " ");
    if (!normalized || normalized.length > MAX_SCHEDULED_YOUTUBE_QUERY_LENGTH) {
      throw new RangeError(`Scheduled YouTube queries must contain 1-${MAX_SCHEDULED_YOUTUBE_QUERY_LENGTH} characters.`);
    }
    return normalized;
  });
  if (new Set(normalizedQueries.map((query) => query.toLocaleLowerCase("en-US"))).size !== normalizedQueries.length) {
    throw new RangeError("Scheduled YouTube queries must be unique.");
  }
  if (!Number.isInteger(limitPerQuery) || limitPerQuery < 1 || limitPerQuery > MAX_SCHEDULED_YOUTUBE_RESULTS_PER_QUERY) {
    throw new RangeError(`Scheduled YouTube result limits must be 1-${MAX_SCHEDULED_YOUTUBE_RESULTS_PER_QUERY} per query.`);
  }
  return { queries: normalizedQueries, limitPerQuery };
}

/**
 * Executes one complete sweep across all scheduled queries.
 * Always searches by `upload_date` (urutan video terbaru).
 */
export async function executeScheduledYoutubeSweep(
  queries: string[] = YOUTUBE_SENTINEL_DEFAULT_SCHEDULED_QUERIES,
  limitPerQuery: number = MAX_SCHEDULED_YOUTUBE_RESULTS_PER_QUERY,
): Promise<ScheduledRunResult> {
  ({ queries, limitPerQuery } = validateScheduledYoutubeSweepInput(queries, limitPerQuery));
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
      const boundedItems = scanResult.items.slice(0, limitPerQuery);
      const boundedScannedCount = Math.min(scanResult.scannedCount, limitPerQuery);
      const boundedNewItemsCount = Math.min(scanResult.newItemsCount, boundedScannedCount);
      totalScanned += boundedScannedCount;
      totalNew += boundedNewItemsCount;

      const isDbUp = await dbAvailable();
      if (isDbUp) {
        if (boundedScannedCount > 0 && boundedItems.length > 0) {
          try {
            await persistItemsToDB(boundedItems, scanResult.crawlerMode ?? "auto");
          } catch (dbErr) {
            console.warn("[YouTube Sentinel Scheduler] DB persist warning:", dbErr);
          }
        }

        try {
          await YoutubeSentinelScanModel.query().insert({
            query,
            engine: "auto",
            crawlerMode: scanResult.crawlerMode ?? null,
            scannedCount: boundedScannedCount,
            newCount: boundedNewItemsCount,
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
  const lease = youtubeScanGate.acquire("youtube-scheduler");
  if (!lease.allowed) {
    return {
      ok: false,
      message: "Kapasitas pemindaian YouTube sedang penuh; coba kembali setelah jeda.",
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
    lease.release();
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
  const lease = youtubeScanGate.acquire("youtube-scheduler");
  if (!lease.allowed) {
    console.warn("[YouTube Sentinel Scheduler] Skipping sweep: shared scan capacity is full.");
    return;
  }
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
    lease.release();
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
