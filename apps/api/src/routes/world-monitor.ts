import type { FastifyInstance } from "fastify";
import { getWorldMonitoringSnapshot, scanYoutube, youtubeSentinelRepo } from "@empire/batteries-world-monitor";
import type { SentinelDirection, SentinelTradition, WorldMonitoringSnapshot, YoutubeMonitoredItem, YoutubeWorkflowStatus } from "@empire/batteries-world-monitor";
import { checkDatabaseHealth } from "../db.js";
import { getActiveWorldMonitorSourceDetails, getActiveWorldMonitorSources } from "../world-monitor-ingest.js";
import { PartnerModel, WorldMonitorObservationModel, WorldMonitorSourceRunModel, YoutubeSentinelItemModel, YoutubeSentinelScanModel, YoutubeSentinelPartnerLinkModel } from "@empire/batteries-base";
import { dbAvailable, rowToItem, persistItemsToDB } from "../youtube-sentinel-storage.js";
import { getYoutubeSentinelSchedulerStatus, triggerManualYoutubeSweep, updateYoutubeSentinelSchedulerInterval } from "../youtube-sentinel-scheduler.js";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant } from "./tenant-context.js";
import { createYoutubeScanGate } from "../youtube-scan-gate.js";
import { WORLD_MONITOR_PUBLIC_SUMMARY_SCHEMA, type WorldMonitorPublicSummary } from "@empire/api-contract";

const youtubeScanGate = createYoutubeScanGate();
// Keep the last known hazard events briefly in-process so a transient database or
// ingestion outage does not erase a credible critical alert from the public HUD.
const worldMonitorHazardEvents = new Map<string, any>();
const hazardSeverity = (level: string) => level === "critical" ? 2 : level === "advisory" ? 1 : 0;
const hazardTtlMs = (category: string) => {
  const configuredSeconds = Number(process.env[`WM_HAZARD_TTL_${category.toUpperCase().replace(/-/g, "_")}_SECONDS`]);
  if (Number.isFinite(configuredSeconds) && configuredSeconds > 0) return configuredSeconds * 1000;
  if (category === "disaster") return 7 * 86_400_000;
  if (category === "earthquake") return 86_400_000;
  return 6 * 3_600_000;
};
const YOUTUBE_WORKFLOW_ACTIONS: readonly YoutubeWorkflowStatus[] = [
  "PENDING_REVIEW", "VERIFIED_SYIRIK", "COUNTER_DAKWAH_QUEUED", "REPORT_FILED", "REPORT_RETRACTED", "FALSE_POSITIVE_DISMISSED", "REVIEW_RETRACTED",
  "WISDOM_QUEUED", "AMPLIFY_RECOMMENDED", "SHARED_VIA_DAKWAH", "ARCHIVED_REFERENCE",
];

const PUBLIC_MAX_OBSERVATIONS = 200;
const PUBLIC_MAX_SOURCE_RUNS = 2000;
const PUBLIC_MAX_SOURCES = 100;

function summarizePublicSources(sources: Array<Record<string, any>>): WorldMonitorPublicSummary["sources"] {
  const groups = new Map<string, Record<string, any>[]>();
  for (const source of sources) groups.set(source.category, [...(groups.get(source.category) ?? []), source]);
  return [...groups.entries()].map(([category, items]) => {
    const records = items.reduce((total, item) => total + (Number.isFinite(item.records) ? item.records : 0), 0);
    const rates = items.map((item) => item.errorRate).filter((value) => typeof value === "number" && Number.isFinite(value));
    const successful = items.filter((item) => item.status === "success" || item.status === "stale" || item.status === "empty").length;
    const freshness = items.map((item) => item.freshnessSeconds).filter((value) => typeof value === "number" && Number.isFinite(value));
    const withRecords = items.filter((item) => item.status === "success" && Number.isFinite(item.records) && item.records > 0).length;
    return {
      category,
      configuredSourceCount: items.length,
      sourcesWithRecordsCount: withRecords,
      status: (items.some((item) => item.status === "failed") ? successful ? "stale" : "failed" : items.some((item) => item.status === "success") ? "success" : items.some((item) => item.status === "empty") ? "empty" : "unknown") as WorldMonitorPublicSummary["sources"][number]["status"],
      lastAttemptAt: latestTimestamp(items.map((item) => item.lastAttemptAt)),
      lastSuccessAt: latestTimestamp(items.map((item) => item.lastSuccessAt)),
      freshnessSeconds: freshness.length ? Math.min(...freshness) : null,
      recordCount: items.some((item) => item.records !== null) ? records : null,
      errorRate: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null,
      freshnessSlaSeconds: items.map((item) => item.freshnessSlaSeconds).filter((value) => typeof value === "number").sort((a, b) => a - b)[0] ?? null,
      fallbackActive: items.some((item) => item.fallbackActivated === true) ? true : items.some((item) => item.fallbackActivated === null) ? null : false,
    };
  });
}

function latestTimestamp(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => typeof value === "string").sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}


export async function worldMonitorRoutes(app: FastifyInstance) {
  // This endpoint stays public for the pre-login HUD. It returns aggregate health only;
  // audit events and user data are intentionally excluded.
  app.get(
    "/v1/world-monitor",
    {
      schema: {
        tags: ["System"],
        summary: "Aggregate public world monitoring summary",
        security: [],
        response: { 200: WORLD_MONITOR_PUBLIC_SUMMARY_SCHEMA },
      },
    },
    async (): Promise<WorldMonitorPublicSummary> => {
      let databaseStatus: WorldMonitoringSnapshot["databaseStatus"] = "unknown";
      try {
        databaseStatus = (await checkDatabaseHealth()).ok ? "available" : "unavailable";
      } catch {
        // Preserve the distinction between an unhealthy database and a failed health check.
      }

      const status: WorldMonitoringSnapshot["status"] = databaseStatus === "available"
        ? "operational"
        : databaseStatus === "unavailable" ? "degraded" : "unavailable";
      const snapshot = getWorldMonitoringSnapshot();
      let runs: any[] = [];
      let observations: any[] = [];
      try { runs = databaseStatus === "available" ? await WorldMonitorSourceRunModel.query().orderBy("completed_at", "desc").limit(PUBLIC_MAX_SOURCE_RUNS) : []; } catch { runs = []; }
      const activeSourceDetails = getActiveWorldMonitorSourceDetails().slice(0, PUBLIC_MAX_SOURCES);
      const activeSourceIds = new Set(activeSourceDetails.map(({ source }) => source));
      runs = runs.filter((run) => activeSourceIds.has(run.source));
      if (databaseStatus === "available") {
        const configuredSources = activeSourceDetails.slice(0, PUBLIC_MAX_SOURCES);
        const latestPerSource = await Promise.all(configuredSources.map(async ({ source }) => {
          try {
            // One latest row for each configured source avoids broad category scans.
            return await (WorldMonitorObservationModel.query() as any).where({ source }).orderBy("observed_at", "desc").limit(1);
          } catch { return []; }
        }));
        observations = latestPerSource.flat().slice(0, PUBLIC_MAX_OBSERVATIONS);
      }
      const sourceGroups = new Map<string, any[]>();
      for (const run of runs) sourceGroups.set(run.source, [...(sourceGroups.get(run.source) ?? []), run]);
      const sources = [...activeSourceIds].map((source) => {
        const history = sourceGroups.get(source) ?? [];
        const latest = history[0];
        const recentHistory = history.slice(0, 20);
        let failureStreak = 0;
        for (const run of history) { if (run.status === "failed") failureStreak += 1; else break; }
        const configured = activeSourceDetails.find((item) => item.source === source);
        const observationHistory = observations.filter((item) => item.source === source);
        const latestObservation = observationHistory[0];
        const latestSuccess = history.find((run) => run.status === "success" || run.status === "stale" || run.status === "empty");
        const counterpart = source.startsWith("open-meteo-gfs-weather-")
          ? source.replace("open-meteo-gfs-weather-", "open-meteo-weather-")
          : source === "usgs-fdsn-earthquakes" ? "usgs-earthquakes"
            : source === "noaa-swpc-kp-final-fallback" ? "noaa-swpc-kp-1m" : null;
        const primaryHistory = counterpart ? sourceGroups.get(counterpart) ?? [] : [];
        const primaryLatest = primaryHistory[0];
        const freshnessSlaSeconds = latest?.metadata?.maxAgeSeconds ?? (configured?.category === "weather" ? 3600 : configured?.category === "atmosphere" ? 10800 : configured?.category === "space-weather" ? 1800 : configured?.category === "disaster" ? 86400 : null);
        const observedAge = latestObservation ? Math.max(0, Math.floor((Date.now() - Date.parse(latestObservation.observedAt)) / 1000)) : null;
        const freshnessSeconds = observedAge !== null && Number.isFinite(observedAge) ? observedAge : null;
        const hasHistory = history.length > 0;
        const fresh = freshnessSeconds !== null && (freshnessSlaSeconds === null || freshnessSeconds <= freshnessSlaSeconds);
        const fallbackActivated = configured?.tier !== "fallback" ? false : !primaryLatest ? null :
          (primaryLatest.status === "failed" || primaryLatest.status === "stale") &&
          (latest?.status === "success" || latest?.status === "stale") &&
          Date.parse(latest?.completedAt ?? "") >= Date.parse(primaryLatest.completedAt ?? "");
        return {
          source,
          category: latest?.category ?? configured?.category ?? "unknown",
          tier: latest?.tier ?? configured?.tier ?? "unknown",
          status: latest?.status ?? "unknown",
          lastAttemptAt: latest?.startedAt ?? null,
          lastSuccessAt: latestSuccess?.completedAt ?? null,
          lastFetchedAt: latest?.completedAt ?? null,
          records: hasHistory ? Number(latest?.recordCount ?? 0) : null,
          fetchedPoints: hasHistory ? Number(latest?.recordCount ?? 0) : null,
          durationMs: latest?.durationMs ?? null,
          errorRate: recentHistory.length ? recentHistory.filter((run) => run.status === "failed").length / recentHistory.length : hasHistory ? 0 : null,
          failureStreak: hasHistory ? failureStreak : null,
          parseErrors: hasHistory ? history.filter((run) => run.metadata?.failureKind === "parse").length : null,
          fallbackActivated,
          freshnessSlaSeconds,
          freshnessSeconds,
          coverageStatus: (databaseStatus !== "available" || !hasHistory || latest?.status === "empty" ? "unknown" : latestObservation && fresh ? "healthy" : "degraded") as WorldMonitoringSnapshot["coverageStatus"],
          // No expected-point denominator exists in the source contract; keep quantitative coverage unknown.
          coverage: null,
        };
      });
      observations = observations.map((item) => {
        const freshnessSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(item.observedAt)) / 1000));
        const threshold = item.category === "weather" ? 3_600 : item.category === "atmosphere" ? 10_800 : item.category === "space-weather" ? 1_800 : item.category === "disaster" ? 86_400 : Number.POSITIVE_INFINITY;
        return { ...item, freshnessSeconds, status: freshnessSeconds > threshold ? "stale" : item.status };
      }).sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)).slice(0, PUBLIC_MAX_OBSERVATIONS);
      const latestBySource = new Map<string, any>();
      for (const item of observations) if (!latestBySource.has(item.source)) latestBySource.set(item.source, item);
      const alerts = observations.filter((item) => item.category === "earthquake" || item.category === "disaster" || latestBySource.get(item.source)?.id === item.id).flatMap((item) => {
        const value = item.normalized ?? {};
        const pm25 = Number(value.pm2_5);
        const kp = Number(value.kp);
        const magnitude = Number(value.mag);
        const age = Number(item.freshnessSeconds);
        const result: any[] = [];
        const pmAdvisory = Number(process.env.WM_PM25_ADVISORY ?? 55), pmCritical = Number(process.env.WM_PM25_CRITICAL ?? 150), kpAdvisory = Number(process.env.WM_KP_ADVISORY ?? 5), kpCritical = Number(process.env.WM_KP_CRITICAL ?? 7), quakeAdvisory = Number(process.env.WM_QUAKE_ADVISORY ?? 5), quakeCritical = Number(process.env.WM_QUAKE_CRITICAL ?? 7), staleSeconds = Number(process.env.WM_STALE_SECONDS ?? 21_600);
        if (Number.isFinite(pm25) && pm25 >= pmAdvisory) result.push({ id: `${item.source}-pm25`, level: pm25 >= pmCritical ? "critical" : "advisory", category: "atmosphere", title: "PM2.5 elevated", detail: `${pm25.toFixed(1)} µg/m³`, observedAt: item.observedAt, source: item.source });
        if (Number.isFinite(kp) && kp >= kpAdvisory) result.push({ id: `${item.source}-kp`, level: kp >= kpCritical ? "critical" : "advisory", category: "space-weather", title: "Geomagnetic activity elevated", detail: `Kp ${kp.toFixed(1)}`, observedAt: item.observedAt, source: item.source });
        if (Number.isFinite(magnitude) && magnitude >= quakeAdvisory) result.push({ id: `${item.externalId ?? item.id}-quake`, level: magnitude >= quakeCritical ? "critical" : "advisory", category: "earthquake", title: "Significant earthquake", detail: `Magnitude ${magnitude.toFixed(1)}`, observedAt: item.observedAt, source: item.source });
        const disasterAlert = String(value.alertlevel ?? "").toLowerCase();
        if (item.category === "disaster" && ["red", "orange"].includes(disasterAlert)) result.push({ id: `${item.externalId ?? item.id}-disaster`, level: disasterAlert === "red" ? "critical" : "advisory", category: "disaster", title: `${disasterAlert.toUpperCase()} disaster alert`, detail: String(value.name ?? value.description ?? "Global disaster event"), observedAt: item.observedAt, source: item.source });
        if (latestBySource.get(item.source)?.id === item.id && Number.isFinite(age) && age > staleSeconds) result.push({ id: `${item.source}-stale`, level: "advisory", category: item.category, title: "Stale observation", detail: `${Math.round(age / 3600)} hours old`, observedAt: item.observedAt, source: item.source });
        return result;
      });
      const buckets = new Map<string, { count: number; categories: Record<string, number> }>();
      for (const item of observations) {
        const time = Date.parse(item.observedAt);
        if (!Number.isFinite(time) || time < Date.now() - 7 * 86_400_000) continue;
        const bucket = new Date(Math.floor(time / 3_600_000) * 3_600_000).toISOString();
        const current = buckets.get(bucket) ?? { count: 0, categories: {} };
        current.count += 1; current.categories[item.category] = (current.categories[item.category] ?? 0) + 1; buckets.set(bucket, current);
      }
      const nowMs = Date.now();
      const seenEventIds = new Set<string>();
      const deduplicatedAlerts = [...new Map(alerts.map((alert) => [alert.id, alert])).values()];
      for (const alert of deduplicatedAlerts) {
        // Provider event IDs (externalId) form the stable identity across sampled
        // refreshes. Aggregate readings are keyed by their source/region feed.
        const eventId = alert.id;
        seenEventIds.add(eventId);
        const fetchedAt = observations.find((item) => item.source === alert.source && item.observedAt === alert.observedAt)?.fetchedAt ?? null;
        const previous = worldMonitorHazardEvents.get(eventId);
        const observedAt = previous?.observedAt && Date.parse(previous.observedAt) > Date.parse(alert.observedAt) ? previous.observedAt : alert.observedAt;
        const expiresAt = new Date(Date.parse(observedAt) + hazardTtlMs(alert.category)).toISOString();
        if (Date.parse(expiresAt) <= nowMs) continue;
        const level = previous && hazardSeverity(previous.level) > hazardSeverity(alert.level) ? previous.level : alert.level;
        const lifecycle = !previous || previous.lifecycle === "resolved" ? "initial" : previous.level !== level ? "updated" : "active";
        worldMonitorHazardEvents.set(eventId, {
          ...alert,
          id: eventId,
          eventId,
          level,
          lifecycle,
          observedAt,
          fetchedAt: fetchedAt ?? previous?.fetchedAt ?? null,
          expiresAt,
          resolvedAt: null,
          removeAt: null,
        });
      }
      for (const [eventId, event] of worldMonitorHazardEvents) {
        if (event.lifecycle === "resolved" && Date.parse(event.removeAt) <= nowMs) worldMonitorHazardEvents.delete(eventId);
        else if (event.lifecycle !== "resolved" && Date.parse(event.expiresAt) <= nowMs) {
          event.lifecycle = "resolved";
          event.resolvedAt = new Date(nowMs).toISOString();
          event.removeAt = new Date(nowMs + 3_600_000).toISOString();
        }
        else if (event.lifecycle !== "resolved" && databaseStatus === "available" && !seenEventIds.has(eventId)) {
          // Absence from a bounded sample is not proof of resolution; retain the
          // event until its observation-based TTL expires.
          event.lifecycle = "active";
        }
      }
      const uniqueAlerts = [...worldMonitorHazardEvents.values()];
      // Keep source health separate: unknown stays unknown, critical wins, and service/data degradation stays yellow.
      const activeAlerts = uniqueAlerts.filter((alert) => alert.lifecycle !== "resolved");
      const hazardAlertLevel: WorldMonitoringSnapshot["hazardAlertLevel"] = activeAlerts.some((alert) => alert.level === "critical")
        ? "red"
        : activeAlerts.some((alert) => alert.level === "advisory") ? "yellow" : observations.length ? "green" : "unknown";
      const sourceCoverage = sources.length ? sources.filter((source) => source.status === "success" && source.records !== null && source.records > 0).length / sources.length : 0;
      const coverageStatus: WorldMonitoringSnapshot["coverageStatus"] = sources.length === 0 || sources.every((source) => source.status === "unknown" || source.status === "empty")
        ? "unknown"
        : sourceCoverage === 1 ? "healthy" : sourceCoverage > 0 ? "degraded" : "unavailable";
      const freshnessStatus: WorldMonitoringSnapshot["freshnessStatus"] = observations.length === 0
        ? "unknown"
        : observations.every((item) => item.status === "available") ? "healthy" : "degraded";
      const ingestionStatus: WorldMonitoringSnapshot["ingestionStatus"] = sources.length === 0
        ? "unknown"
        : sources.every((source) => source.status === "unknown")
          ? "unknown"
          : sources.some((source) => source.status === "success" || source.status === "empty")
            ? sources.some((source) => source.status === "failed" || source.status === "unknown") ? "degraded" : "healthy"
            : sources.some((source) => source.status === "failed") ? "unavailable" : "unknown";
      const coverageNumerator = sources.filter((source) => source.status === "success" && source.records !== null && source.records > 0).length;
      const coverageDenominator = sources.length;
      const databaseHealth = databaseStatus === "available" ? "healthy" : databaseStatus === "unavailable" ? "unavailable" : "unknown";
      const globalAlertLevel = databaseStatus === "unknown"
        ? "unknown"
        : hazardAlertLevel === "red" ? "red"
          : hazardAlertLevel === "yellow" || databaseStatus === "unavailable" || ingestionStatus === "degraded" || ingestionStatus === "unavailable" || freshnessStatus === "degraded" || coverageStatus === "degraded" || coverageStatus === "unavailable"
            ? "yellow"
            : hazardAlertLevel === "unknown" || ingestionStatus === "unknown" || freshnessStatus === "unknown" || coverageStatus === "unknown"
              ? "unknown"
              : "green";

      const publicSnapshot: WorldMonitorPublicSummary = {
        schemaVersion: "2",
        status,
        timestamp: new Date().toISOString(),
        // Reaching this handler establishes API liveness; dependency health remains separate.
        apiHealth: "healthy",
        databaseHealth,
        ingestionHealth: ingestionStatus,
        coverageHealth: coverageStatus,
        dataFreshness: freshnessStatus,
        coverageNumerator,
        coverageDenominator,
        globalAlertLevel,
        databaseStatus,
        ingestionStatus,
        freshnessStatus,
        coverageStatus,
        hazardAlertLevel,
        // The anonymous endpoint is an aggregate summary. Detailed source/event rows
        // belong on authenticated, paginated endpoints and are never serialized here.
        sources: summarizePublicSources(sources),
        observationCount: observations.length,
        alertCount: uniqueAlerts.filter((alert) => alert.lifecycle !== "resolved").length,
        history: [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-168).map(([bucket, value]) => ({ bucket, count: value.count })),
      };
      // Aggregate DTO carries bounded arrays and no provider payloads or identifiers.
      return publicSnapshot;
    },
  );

  // ── YouTube Tauhid Sentinel — DB-backed persistent endpoints ─────────────
  // Storage helpers (rowToItem, dbAvailable, persistItemsToDB) are imported from ../youtube-sentinel-storage.js

  app.get(
    "/v1/world-monitor/youtube",
    {
      schema: {
        tags: ["System"],
        summary: "List monitored YouTube videos with non-AI heuristic Tauhid evaluation",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            direction: { type: "string" },
            tradition: { type: "string" },
            category: { type: "string" },
            riskLevel: { type: "string" },
            workflowStatus: { type: "string" },
            search: { type: "string" },
            hideResolved: { type: "boolean" },
            onlyNew: { type: "boolean" },
          },
        },
      },
      preHandler: [requireSession, requirePermission("sentinel:read")],
    },
    async (request) => {
      const query = (request.query ?? {}) as {
        direction?: SentinelDirection;
        tradition?: SentinelTradition;
        category?: string;
        riskLevel?: string;
        workflowStatus?: string;
        search?: string;
        hideResolved?: boolean | string;
        onlyNew?: boolean | string;
      };

      const hideResolved = query.hideResolved === true || query.hideResolved === "true";
      const onlyNew = query.onlyNew === true || query.onlyNew === "true";

      let items: YoutubeMonitoredItem[];
      const isDbUp = await dbAvailable();

      if (isDbUp) {
        try {
          let q = YoutubeSentinelItemModel.query().whereNull("deleted_at").orderBy("risk_score", "desc");
          if (query.direction && (query.direction as string) !== "ALL") q = q.where({ direction: query.direction }) as typeof q;
          if (query.tradition && (query.tradition as string) !== "ALL") q = q.where({ tradition: query.tradition }) as typeof q;
          if (query.category && query.category !== "ALL") q = q.where({ category: query.category }) as typeof q;
          if (query.riskLevel && query.riskLevel !== "ALL") q = q.where({ risk_level: query.riskLevel }) as typeof q;
          if (query.workflowStatus && query.workflowStatus !== "ALL") q = q.where({ workflow_status: query.workflowStatus }) as typeof q;
          if (hideResolved) {
            q = q.whereNotIn("workflow_status", ["REPORT_FILED", "FALSE_POSITIVE_DISMISSED"]) as typeof q;
          }
          if (query.search) {
            const like = `%${query.search}%`;
            q = q.where((builder) =>
              builder.whereRaw("title ILIKE ?", [like]).orWhereRaw("channel_title ILIKE ?", [like])
            ) as typeof q;
          }
          const rows = await q.limit(500);
          items = rows.map(rowToItem);

          // Public telemetry never expands a tenant-local partner association.
          for (const item of items) item.partnerId = undefined;

          // Sync in-memory repo so other operations (workflowStatus update) work
          for (const item of items) youtubeSentinelRepo.upsertItem(item);
        } catch {
          items = youtubeSentinelRepo.getItems({ ...query, hideResolved, onlyNew });
        }
      } else {
        items = youtubeSentinelRepo.getItems({ ...query, hideResolved, onlyNew });
      }

      items = items.map((item) => ({ ...item, partnerId: undefined, partnerInfo: undefined }));
      const summary = youtubeSentinelRepo.getSummary();

      return {
        ok: true,
        summary,
        items,
        persistenceMode: isDbUp ? "database" : "in_memory",
        taxonomy: {
          directions: [
            { id: "ALL", label: "Semua Arah Deteksi" },
            { id: "NEGATIVE", label: "Kecocokan aturan yang perlu ditelaah" },
            { id: "POSITIVE", label: "Positif (Kebajikan & Hikmah)" },
            { id: "NEUTRAL", label: "Netral (Edukasi / Jurnalistik)" },
          ],
          traditions: [
            { id: "ALL", label: "Semua Tradisi" },
            { id: "ISLAM", label: "Islam" },
            { id: "KRISTEN", label: "Kristen" },
            { id: "KATOLIK", label: "Katolik" },
            { id: "HINDU", label: "Hindu" },
            { id: "BUDDHA", label: "Buddha" },
            { id: "KHONGHUCU", label: "Khonghucu" },
            { id: "UNIVERSAL", label: "Universal" },
          ],
          categories: [
            { id: "ALL", label: "Semua Kategori" },
            // Negatif
            { id: "SIHIR_PELET", label: "Sihir & Pelet" },
            { id: "DUKUN_RAMALAN", label: "Dukun & Ramalan" },
            { id: "PESUGIHAN_TUMBAL", label: "Pesugihan & Tumbal" },
            { id: "KHODAM_JIN", label: "Khodam & Jin" },
            { id: "BENDA_KERAMAT_JIMAT", label: "Benda Keramat & Jimat" },
            { id: "KUBURAN_SESAJEN", label: "Makam & Sesajen" },
            { id: "UMUM_SYIRIK", label: "Kesyirikan Umum" },
            // Positif
            { id: "TAUHID_DAKWAH", label: "Dakwah Tauhid" },
            { id: "AKHLAK_KARIMAH", label: "Akhlak Karimah" },
            { id: "KASIH_KRISTIANI", label: "Kasih Kristiani" },
            { id: "DHARMA_HINDU", label: "Dharma Hindu" },
            { id: "DHARMA_BUDDHA", label: "Dharma Buddha" },
            { id: "KEBAJIKAN_KHONGHUCU", label: "Kebajikan Khonghucu" },
            { id: "UNIVERSAL_HIKMAH", label: "Hikmah Universal" },
            // Netral
            { id: "BEBAS_SYIRIK", label: "Bebas Syirik / Edukasi" },
          ],
          riskLevels: [
            { id: "ALL", label: "Semua Level Risiko" },
            { id: "CRITICAL_SYIRIK", label: "Banyak kecocokan heuristik" },
            { id: "HIGH_SYIRIK_RISK", label: "Kecocokan heuristik sedang" },
            { id: "ADVISORY_SUPERSTITION", label: "Kecocokan heuristik terbatas" },
            { id: "DAKWAH_REFUTATION", label: "Bantahan Dakwah Tauhid / Hikmah" },
            { id: "NOMINAL_CLEAR", label: "Tidak ada kecocokan heuristik" },
          ],
          statuses: [
            { id: "ALL", label: "Semua Status" },
            { id: "PENDING_REVIEW", label: "Menunggu Telaah" },
            { id: "VERIFIED_SYIRIK", label: "Kesimpulan teologis reviewer (bukan temuan kebijakan platform)" },
            { id: "COUNTER_DAKWAH_QUEUED", label: "Disposisi Bantahan Tauhid" },
            { id: "REPORT_FILED", label: "Laporan YouTube Terkirim" },
            { id: "FALSE_POSITIVE_DISMISSED", label: "Bukan Pelanggaran / Edukasi" },
            { id: "WISDOM_QUEUED", label: "Antrean Hikmah" },
            { id: "AMPLIFY_RECOMMENDED", label: "Rekomendasi Amplifikasi" },
            { id: "SHARED_VIA_DAKWAH", label: "Telah Diamplifikasi" },
            { id: "ARCHIVED_REFERENCE", label: "Arsip Referensi Luhur" },
          ],
        },
      };
    },
  );

  app.post(
    "/v1/world-monitor/youtube/scan",
    {
      schema: {
        tags: ["System"],
        summary: "Dispatch YouTube automated search / crawler scan",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          additionalProperties: false,
          required: ["query"],
          properties: {
            query: { type: "string", minLength: 1, maxLength: 200 },
            limit: { type: "integer", minimum: 1, maximum: 50 },
            forceLive: { type: "boolean" },
            useBrowserAutomation: { type: "boolean" },
            engine: { type: "string", enum: ["innertube", "playwright", "auto"] },
            sortBy: { type: "string", enum: ["upload_date", "relevance"] },
            onlyNew: { type: "boolean" },
          },
        },
      },
      preHandler: [requireSession, requirePermission("sentinel:scan")],
    },
    async (request, reply) => {
      const lease = youtubeScanGate.acquire(request.authUser?.id ?? "");
      if (!lease.allowed) {
        const retryAfterSeconds = Math.max(1, Math.ceil(lease.retryAfterMs / 1000));
          const temporarilyBusy = lease.reason === "global_concurrency";
        return reply
          .header("retry-after", String(retryAfterSeconds))
          .header("x-ratelimit-limit", "5")
          .header("x-ratelimit-remaining", String(lease.remaining))
            .code(temporarilyBusy ? 503 : 429)
          .send({
              status: temporarilyBusy ? "scan_busy" : "rate_limited",
              reason: lease.reason,
              message: temporarilyBusy
                ? "Kapasitas scan sedang penuh. Coba kembali setelah jeda yang diberikan."
                : "Batas scan YouTube tercapai. Coba kembali setelah jeda yang diberikan.",
            retryAfterSeconds,
          });
      }

      const body = request.body as {
        query: string;
        limit?: number;
        forceLive?: boolean;
        useBrowserAutomation?: boolean;
        engine?: "innertube" | "playwright" | "auto";
        sortBy?: "upload_date" | "relevance";
        onlyNew?: boolean;
      };

      const startedAt = new Date().toISOString();
      const t0 = Date.now();

      let scanResult;
      try {
        scanResult = await scanYoutube({
          query: body.query,
          limit: body.limit ?? 12,
          forceLive: body.forceLive ?? false,
          useBrowserAutomation: body.useBrowserAutomation ?? false,
          engine: body.engine ?? "auto",
          sortBy: body.sortBy ?? "upload_date",
          onlyNew: body.onlyNew ?? false,
        });
      } finally {
        lease.release();
      }

      reply
        .header("x-ratelimit-limit", "5")
        .header("x-ratelimit-remaining", String(lease.remaining));

      const durationMs = Date.now() - t0;

      // ── Persist to DB (non-blocking, non-fatal) ───────────────────────────
      const isDbUp = await dbAvailable();
      if (isDbUp) {
        if (scanResult.scannedCount > 0 && scanResult.items.length > 0) {
          try {
            await persistItemsToDB(scanResult.items, scanResult.crawlerMode ?? "auto");
          } catch { /* DB write errors must not break the API response */ }
        }
        try {
          await YoutubeSentinelScanModel.query().insert({
            query: body.query,
            engine: body.engine ?? "auto",
            crawlerMode: scanResult.crawlerMode ?? null,
            scannedCount: scanResult.scannedCount,
            newCount: scanResult.newItemsCount,
            durationMs,
            diagnosticMessage: scanResult.diagnosticMessage ?? null,
            startedAt,
            completedAt: new Date().toISOString(),
            triggeredBy: "operator",
          });
        } catch { /* Scan ledger write failure is non-fatal */ }
      }

      return {
        ok: true,
        scannedCount: scanResult.scannedCount,
        newItemsCount: scanResult.newItemsCount,
        existingItemsCount: scanResult.existingItemsCount ?? 0,
        crawlerMode: scanResult.crawlerMode,
        diagnosticMessage: scanResult.diagnosticMessage,
        durationMs,
        persistenceMode: isDbUp ? "database" : "in_memory",
        items: scanResult.items,
        summary: scanResult.summary,
      };
    },
  );

  app.post(
    "/v1/world-monitor/youtube/action",
    {
      schema: {
        tags: ["System"],
        summary: "Execute operator workflow action on monitored YouTube item",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["id", "action"],
          properties: {
            id: { type: "string" },
            action: {
              type: "string",
              enum: [
                "PENDING_REVIEW",
                "VERIFIED_SYIRIK",
                "COUNTER_DAKWAH_QUEUED",
                "REPORT_FILED",
                "REPORT_RETRACTED",
                "FALSE_POSITIVE_DISMISSED",
                "REVIEW_RETRACTED",
                "WISDOM_QUEUED",
                "AMPLIFY_RECOMMENDED",
                "SHARED_VIA_DAKWAH",
                "ARCHIVED_REFERENCE",
              ],
            },
            notes: { type: "string" },
            rationale: { type: "string", minLength: 20, maxLength: 2000 },
            actionReference: { type: "string", minLength: 1, maxLength: 500 },
            reviewReference: { type: "string", minLength: 8, maxLength: 1000 },
            attestsExternalAction: { type: "boolean" },
            expectedReviewRevision: { type: "integer", minimum: 0 },
          },
        },
      },
      preHandler: [requireSession, requirePermission("sentinel:review")],
    },
    async (request, reply) => {
      const body = request.body as {
        id: string;
        action: YoutubeWorkflowStatus;
        notes?: string;
        rationale?: string;
        actionReference?: string;
        reviewReference?: string;
        attestsExternalAction?: boolean;
        expectedReviewRevision?: number;
      };

      if (!YOUTUBE_WORKFLOW_ACTIONS.includes(body.action)) {
        return reply.status(400).send({ ok: false, message: "Unsupported workflow action" });
      }
      const requiresReviewEvidence = ["VERIFIED_SYIRIK", "REPORT_FILED", "REPORT_RETRACTED", "SHARED_VIA_DAKWAH", "FALSE_POSITIVE_DISMISSED", "REVIEW_RETRACTED"].includes(body.action);
      const requiresActionEvidence = ["REPORT_FILED", "REPORT_RETRACTED", "SHARED_VIA_DAKWAH"].includes(body.action);
      if (requiresReviewEvidence && (!body.rationale || body.rationale.trim().length < 20)) {
        return reply.status(400).send({ ok: false, message: "A contextual review rationale of at least 20 characters is required" });
      }
      if (requiresActionEvidence && !body.actionReference?.trim()) {
        return reply.status(400).send({ ok: false, message: "A traceable external action reference is required" });
      }
      if (body.action === "VERIFIED_SYIRIK" && !body.reviewReference?.trim()) {
        return reply.status(400).send({ ok: false, message: "A traceable public evidence reference is required for human review" });
      }
      if (requiresActionEvidence && body.attestsExternalAction !== true) {
        return reply.status(400).send({ ok: false, message: "Explicit human attestation of the completed external action is required" });
      }
      const isTraceableHttpsUrl = (value?: string) => {
        if (!value || value.length > 1000) return false;
        try { return new URL(value).protocol === "https:"; } catch { return false; }
      };
      if (body.reviewReference && !isTraceableHttpsUrl(body.reviewReference.trim())) {
        return reply.status(400).send({ ok: false, message: "Review evidence reference must be a traceable HTTPS URL" });
      }
      if (requiresActionEvidence && !isTraceableHttpsUrl(body.actionReference?.trim())) {
        return reply.status(400).send({ ok: false, message: "External action reference must be a traceable HTTPS URL" });
      }

      const isDbUp = await dbAvailable();
      if (!isDbUp) {
        return reply.status(503).send({ ok: false, message: "Sentinel review storage is unavailable; action was not applied" });
      }
      const isUUID = typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id);
      let row;
      try {
        row = isUUID
          ? await YoutubeSentinelItemModel.query().where({ id: body.id }).orWhere({ video_id: body.id }).first()
          : await YoutubeSentinelItemModel.query().where({ video_id: body.id }).first();
      } catch {
        return reply.status(503).send({ ok: false, message: "Sentinel review storage could not be read; action was not applied" });
      }
      if (!row) return reply.status(404).send({ ok: false, message: "Item not found" });
      const currentRevision = Number(row.reviewRevision ?? 0);
      if (body.expectedReviewRevision !== undefined && body.expectedReviewRevision !== currentRevision) {
        return reply.status(409).send({ ok: false, message: "Review changed concurrently; reload the item before applying this action" });
      }
      const actorId = String((request as any).authUser?.id ?? "");
      if (!actorId) return reply.status(401).send({ ok: false, message: "Reviewer identity is unavailable" });
      const priorActionEvidence: NonNullable<YoutubeMonitoredItem["actionEvidence"]> = row.actionEvidence && typeof row.actionEvidence === "object" ? row.actionEvidence : {};
      const history = Array.isArray(priorActionEvidence.history) ? priorActionEvidence.history : [];
      const previousStatus = row.workflowStatus as YoutubeWorkflowStatus;
      const lastEvent = history.at(-1);
      if (previousStatus === body.action && lastEvent?.actorId === actorId && lastEvent?.externalActionReference === body.actionReference?.trim()) {
        return { ok: true, item: rowToItem(row), persistenceMode: "database", summary: youtubeSentinelRepo.getSummary() };
      }
      if (body.action === "REPORT_FILED" && (row.workflowStatus !== "VERIFIED_SYIRIK" || row.reviewEvidence?.reviewerId === actorId)) {
        return reply.status(409).send({ ok: false, message: "A report requires a prior human review and a different reporting reviewer" });
      }
      if (body.action === "REPORT_RETRACTED" && row.workflowStatus !== "REPORT_FILED") {
        return reply.status(409).send({ ok: false, message: "Only a previously attested report can be retracted" });
      }
      if (body.action === "REVIEW_RETRACTED" && !["VERIFIED_SYIRIK", "FALSE_POSITIVE_DISMISSED"].includes(row.workflowStatus)) {
        return reply.status(409).send({ ok: false, message: "Only an existing human review can be retracted" });
      }
      if (body.action === "REPORT_FILED" && row.direction === "POSITIVE") {
        return reply.status(409).send({ ok: false, message: "A positive-direction item cannot be submitted as a platform report" });
      }
      if (["VERIFIED_SYIRIK", "FALSE_POSITIVE_DISMISSED", "COUNTER_DAKWAH_QUEUED"].includes(body.action) && row.direction === "POSITIVE") {
        return reply.status(409).send({ ok: false, message: "A positive-direction item cannot receive a negative-direction review action" });
      }
      if (body.action === "SHARED_VIA_DAKWAH" && row.direction !== "POSITIVE") {
        return reply.status(409).send({ ok: false, message: "Only a positive-direction item can be marked as shared" });
      }
      const now = new Date().toISOString();
      const effectiveStatus: YoutubeWorkflowStatus = body.action === "REVIEW_RETRACTED" || body.action === "REPORT_RETRACTED" ? "PENDING_REVIEW" : body.action;
      const event = {
        action: body.action, previousStatus, actorId, occurredAt: now,
        ...(body.rationale?.trim() ? { rationale: body.rationale.trim() } : {}),
        ...(body.reviewReference?.trim() ? { reviewReference: body.reviewReference.trim() } : {}),
        ...(requiresActionEvidence ? { externalActionReference: body.actionReference!.trim(), externalActionAttested: true } : {}),
      };
      const reviewEvidence = requiresReviewEvidence
        ? body.action === "REVIEW_RETRACTED" || body.action === "REPORT_RETRACTED" ? null : { reviewerId: actorId, rationale: body.rationale!.trim(), reviewedAt: now, ...(body.reviewReference?.trim() ? { reference: body.reviewReference.trim() } : {}) }
        : row.reviewEvidence ?? null;
      const actionEvidence = {
        ...priorActionEvidence,
        ...(requiresActionEvidence ? { reference: body.actionReference!.trim(), attestedBy: actorId, attestedAt: now } : {}),
        history: [...history, event],
      };
      let updated;
      try {
        const updatedRows = await YoutubeSentinelItemModel.query()
          .patch({ workflowStatus: effectiveStatus, operatorNotes: body.notes ?? row.operatorNotes ?? null, lastActionAt: now, reviewEvidence, actionEvidence, reviewRevision: currentRevision + 1 } as any)
          .where({ id: row.id, review_revision: currentRevision });
        if (updatedRows !== 1) return reply.status(409).send({ ok: false, message: "Review changed concurrently; reload the item before applying this action" });
        updated = youtubeSentinelRepo.updateWorkflowStatus(body.id, effectiveStatus, body.notes);
        if (!updated) return reply.status(404).send({ ok: false, message: "Item not found" });
        updated.workflowStatus = effectiveStatus;
        updated.reviewEvidence = reviewEvidence;
        updated.actionEvidence = actionEvidence;
        updated.reviewRevision = currentRevision + 1;
        updated.lastActionAt = now;
      } catch {
        return reply.status(503).send({ ok: false, message: "Sentinel review action could not be saved; action was not applied" });
      }
      return {
        ok: true,
        item: updated,
        persistenceMode: isDbUp ? "database" : "in_memory",
        summary: youtubeSentinelRepo.getSummary(),
      };
    },
  );

  app.get(
    "/v1/world-monitor/youtube/schedule",
    {
      schema: {
        tags: ["System"],
        summary: "Check periodic YouTube Sentinel surveillance scheduler status",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [requireSession, requirePermission("sentinel:read")],
    },
    async () => {
      const status = getYoutubeSentinelSchedulerStatus();
      return {
        ok: true,
        scheduler: status,
      };
    },
  );

  app.post(
    "/v1/world-monitor/youtube/schedule",
    {
      schema: {
        tags: ["System"],
        summary: "Configure or trigger surveillance scheduler sweep",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["trigger", "update_interval"] },
            intervalHours: { type: "number" },
            queries: { type: "array", items: { type: "string" } },
            limitPerQuery: { type: "number" },
          },
        },
      },
      preHandler: [requireSession, requirePermission("sentinel:schedule")],
    },
    async (request) => {
      const body = (request.body ?? {}) as {
        action?: "trigger" | "update_interval";
        intervalHours?: number;
        queries?: string[];
        limitPerQuery?: number;
      };

      if (body.action === "update_interval" && typeof body.intervalHours === "number") {
        const updated = updateYoutubeSentinelSchedulerInterval(body.intervalHours);
        return {
          ok: true,
          message: `Interval pemindaian otomatis diperbarui ke ${body.intervalHours} jam.`,
          scheduler: updated,
        };
      }

      // Default or explicit trigger action
      const sweep = await triggerManualYoutubeSweep(body.queries, body.limitPerQuery);
      return sweep;
    },
  );

  // ── YouTube Sentinel Partner Association Endpoint ───────────────────────────
  app.post(
    "/v1/world-monitor/youtube/partner",
    {
      schema: {
        tags: ["System"],
        summary: "Link a YouTube channel or video to a Partner (mitra dakwah or target pantau)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["videoId"],
          properties: {
            videoId: { type: "string" },
            partnerId: { type: "string" },
            createPartner: {
              type: "object",
              properties: {
                name: { type: "string" },
                companyName: { type: "string" },
                type: { type: "string", enum: ["contact", "invoice", "delivery", "other"] },
                isMitra: { type: "boolean" },
                website: { type: "string" },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      preHandler: [requireSession, requirePermission("users:manage"), requireTenant],
    },
    async (request, reply) => {
      const body = request.body as {
        videoId: string;
        partnerId?: string;
        createPartner?: {
          name: string;
          companyName?: string;
          type?: "contact" | "invoice" | "delivery" | "other";
          isMitra?: boolean;
          website?: string;
          notes?: string;
        };
      };

      const isDbUp = await dbAvailable();
      if (!isDbUp) {
        return reply.status(503).send({ ok: false, message: "Database tidak tersedia untuk pencatatan Partner." });
      }

      try {
        const itemRow = await YoutubeSentinelItemModel.query().where({ video_id: body.videoId }).first();
        if (!itemRow) return reply.status(404).send({ ok: false, message: "Video Sentinel tidak ditemukan." });
        let targetPartnerId = body.partnerId;

        // Create new Partner if requested
        if (!targetPartnerId && body.createPartner) {
          const newPartner = await PartnerModel.query().insert({
            tenantId: request.tenantId!,
            name: body.createPartner.name,
            companyName: body.createPartner.companyName ?? null,
            type: body.createPartner.type ?? "contact",
            isCompany: Boolean(body.createPartner.companyName),
            website: body.createPartner.website ?? null,
            notes: body.createPartner.notes ?? null,
            metadata: {
              isMitra: body.createPartner.isMitra ?? true,
              source: "youtube_sentinel",
              associatedVideoId: body.videoId,
            },
          });
          targetPartnerId = newPartner.id;
        }

        if (!targetPartnerId) {
          return reply.status(400).send({ ok: false, message: "partnerId atau createPartner harus disediakan." });
        }

        // Store the association per tenant; Sentinel observations remain global.
        const partner = await PartnerModel.query().where({ id: targetPartnerId, tenant_id: request.tenantId! }).first();
        if (!partner) return reply.status(404).send({ ok: false, message: "Partner tidak ditemukan di tenant aktif." });
        const link = await YoutubeSentinelPartnerLinkModel.query().where({ tenant_id: request.tenantId!, item_id: itemRow.id }).first();
        if (link) await (link.$query() as any).patch({ partnerId: targetPartnerId, createdBy: request.authUser!.id });
        else await (YoutubeSentinelPartnerLinkModel.query() as any).insert({ tenantId: request.tenantId!, itemId: itemRow.id, partnerId: targetPartnerId, createdBy: request.authUser!.id });

        return {
          ok: true,
          message: `Berhasil menautkan kanal ke Partner "${partner?.name ?? targetPartnerId}".`,
          partnerId: targetPartnerId,
          partner,
        };
      } catch (err) {
        return reply.status(500).send({
          ok: false,
          message: `Gagal menautkan ke Partner: ${(err as Error).message}`,
        });
      }
    },
  );
}
