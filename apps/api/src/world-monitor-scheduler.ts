import { refreshWorldMonitorSources } from "./world-monitor-ingest.js";

const DEFAULT_INTERVAL_MS = 10 * 60_000;

export function startWorldMonitorScheduler(refresh: () => Promise<void> = refreshWorldMonitorSources, configuredValue = process.env.WORLD_MONITOR_INTERVAL_MS): () => void {
  const configured = Number(configuredValue ?? DEFAULT_INTERVAL_MS);
  const intervalMs = Number.isFinite(configured) ? Math.min(15 * 60_000, Math.max(5 * 60_000, configured)) : DEFAULT_INTERVAL_MS;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await refresh(); console.info(`[World Monitor] ingest completed (${intervalMs}ms interval)`); }
    catch (error) { console.error("[World Monitor] scheduled ingest failed", error); }
    finally { running = false; }
  };
  void run();
  const timer = setInterval(() => void run(), intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
