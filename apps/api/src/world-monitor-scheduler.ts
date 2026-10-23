import { refreshWorldMonitorSources, type WorldMonitorRefreshResult } from "./world-monitor-ingest.js";

const DEFAULT_INTERVAL_MS = 10 * 60_000;

/** Manual and scheduled requests enter the same PostgreSQL-coordinated job. */
export async function triggerManualWorldMonitorRefresh(refresh: () => Promise<WorldMonitorRefreshResult> = refreshWorldMonitorSources): Promise<WorldMonitorRefreshResult> {
  return refresh();
}

export function startWorldMonitorScheduler(refresh: () => Promise<WorldMonitorRefreshResult | void> = triggerManualWorldMonitorRefresh, configuredValue = process.env.WORLD_MONITOR_INTERVAL_MS): () => void {
  const configured = Number(configuredValue ?? DEFAULT_INTERVAL_MS);
  const intervalMs = Number.isFinite(configured) ? Math.min(15 * 60_000, Math.max(5 * 60_000, configured)) : DEFAULT_INTERVAL_MS;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    const scheduledAt = new Date().toISOString();
    try {
      const result = await refresh();
      if (result?.status === "skipped") console.info(`[World Monitor] ingest skipped job=${result.jobId} reason=${result.reason} scheduledAt=${scheduledAt}`);
      else console.info(`[World Monitor] ingest completed job=${result?.jobId ?? "unknown"} scheduledAt=${scheduledAt} intervalMs=${intervalMs}`);
    }
    catch (error) { console.error(`[World Monitor] scheduled ingest failed scheduledAt=${scheduledAt}`, error); }
    finally { running = false; }
  };
  void run();
  const timer = setInterval(() => void run(), intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
