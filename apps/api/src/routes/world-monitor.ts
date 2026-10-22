import type { FastifyInstance } from "fastify";
import { generateBrowserAutomationSnippet, getWorldMonitoringSnapshot, scanYoutube, youtubeSentinelRepo } from "@empire/batteries-world-monitor";
import type { WorldMonitoringSnapshot, YoutubeMonitoredItem, YoutubeWorkflowStatus } from "@empire/batteries-world-monitor";
import { checkDatabaseHealth } from "../db.js";
import { getActiveWorldMonitorSources, refreshWorldMonitorSources } from "../world-monitor-ingest.js";
import { WorldMonitorObservationModel, WorldMonitorSourceRunModel, YoutubeSentinelItemModel, YoutubeSentinelScanModel } from "@empire/batteries-base";
import { dbAvailable, rowToItem, persistItemsToDB } from "../youtube-sentinel-storage.js";

let lastRefreshAt = 0;


export async function worldMonitorRoutes(app: FastifyInstance) {
  // This endpoint stays public for the pre-login HUD. It returns aggregate health only;
  // audit events and user data are intentionally excluded.
  app.get(
    "/v1/world-monitor",
    {
      schema: {
        tags: ["System"],
        summary: "World monitoring snapshot with explicit unavailable states for unconnected sources",
        security: [],
      },
    },
    async (): Promise<WorldMonitoringSnapshot> => {
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
      if (databaseStatus === "available" && Date.now() - lastRefreshAt > 60_000) {
        lastRefreshAt = Date.now();
        try { void refreshWorldMonitorSources().catch(() => undefined); } catch { /* test or degraded runtime without ingest module */ }
      }
      let runs: any[] = [];
      let observations: any[] = [];
      try { runs = databaseStatus === "available" ? await WorldMonitorSourceRunModel.query().orderBy("completed_at", "desc").limit(1000) : []; } catch { runs = []; }
      const activeSourceIds = new Set(getActiveWorldMonitorSources());
      runs = runs.filter((run) => activeSourceIds.has(run.source));
      if (databaseStatus === "available") {
        const categories = ["weather", "atmosphere", "earthquake", "space-weather", "disaster"];
        const perCategory = await Promise.all(categories.map(async (category) => {
          try {
            return await (WorldMonitorObservationModel.query() as any).where({ category }).orderBy("observed_at", "desc").limit(40);
          } catch { return []; }
        }));
        observations = perCategory.flat().sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt));
      }
      const sourceGroups = new Map<string, any[]>();
      for (const run of runs) sourceGroups.set(run.source, [...(sourceGroups.get(run.source) ?? []), run]);
      const sources = [...sourceGroups.entries()].map(([source, history]) => {
        const latest = history[0];
        const recentHistory = history.slice(0, 20);
        let failureStreak = 0;
        for (const run of history) { if (run.status === "failed") failureStreak += 1; else break; }
        return { source, category: latest.category, tier: latest.tier, status: latest.status, lastFetchedAt: latest.completedAt ?? null, records: latest.recordCount, durationMs: latest.durationMs ?? null, errorRate: recentHistory.filter((run) => run.status === "failed").length / recentHistory.length, failureStreak };
      });
      observations = observations.map((item) => {
        const freshnessSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(item.observedAt)) / 1000));
        const threshold = item.category === "weather" ? 3_600 : item.category === "atmosphere" ? 10_800 : item.category === "space-weather" ? 1_800 : item.category === "disaster" ? 86_400 : Number.POSITIVE_INFINITY;
        return { ...item, freshnessSeconds, status: freshnessSeconds > threshold ? "stale" : item.status };
      });
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

      return {
        ...snapshot,
        status,
        timestamp: new Date().toISOString(),
        globalAlertLevel: databaseStatus === "available"
          ? "green"
          : databaseStatus === "unavailable" ? "yellow" : "unknown",
        apiUptimeSeconds: Number(process.uptime().toFixed(3)),
        databaseStatus,
        sources,
        observations,
        alerts: [...new Map(alerts.map((alert) => [alert.id, alert])).values()],
        history: [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([bucket, value]) => ({ bucket, ...value })),
      };
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
        security: [],
        querystring: {
          type: "object",
          properties: {
            category: { type: "string" },
            riskLevel: { type: "string" },
            workflowStatus: { type: "string" },
            search: { type: "string" },
            hideResolved: { type: "boolean" },
            onlyNew: { type: "boolean" },
          },
        },
      },
    },
    async (request) => {
      const query = (request.query ?? {}) as {
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
          // Sync in-memory repo so other operations (workflowStatus update) work
          for (const item of items) youtubeSentinelRepo.upsertItem(item);
        } catch {
          items = youtubeSentinelRepo.getItems({ ...query, hideResolved, onlyNew });
        }
      } else {
        items = youtubeSentinelRepo.getItems({ ...query, hideResolved, onlyNew });
      }

      const summary = youtubeSentinelRepo.getSummary();

      return {
        ok: true,
        summary,
        items,
        persistenceMode: isDbUp ? "database" : "in_memory",
        taxonomy: {
          categories: [
            { id: "ALL", label: "Semua Kategori" },
            { id: "SIHIR_PELET", label: "Sihir & Pelet" },
            { id: "DUKUN_RAMALAN", label: "Dukun & Ramalan" },
            { id: "PESUGIHAN_TUMBAL", label: "Pesugihan & Tumbal" },
            { id: "KHODAM_JIN", label: "Khodam & Jin" },
            { id: "BENDA_KERAMAT_JIMAT", label: "Benda Keramat & Jimat" },
            { id: "KUBURAN_SESAJEN", label: "Makam & Sesajen" },
            { id: "UMUM_SYIRIK", label: "Kesyirikan Umum" },
          ],
          riskLevels: [
            { id: "ALL", label: "Semua Level Risiko" },
            { id: "CRITICAL_SYIRIK", label: "Kritis (Syirik Nyata)" },
            { id: "HIGH_SYIRIK_RISK", label: "Tinggi (Bahaya Okultisme)" },
            { id: "ADVISORY_SUPERSTITION", label: "Peringatan (Takhayul/Khurafat)" },
            { id: "DAKWAH_REFUTATION", label: "Bantahan Dakwah Tauhid" },
            { id: "NOMINAL_CLEAR", label: "Aman" },
          ],
          statuses: [
            { id: "ALL", label: "Semua Status" },
            { id: "PENDING_REVIEW", label: "Menunggu Telaah" },
            { id: "VERIFIED_SYIRIK", label: "Terverifikasi Melanggar" },
            { id: "COUNTER_DAKWAH_QUEUED", label: "Disposisi Bantahan Tauhid" },
            { id: "REPORT_FILED", label: "Laporan YouTube Terkirim" },
            { id: "FALSE_POSITIVE_DISMISSED", label: "Bukan Pelanggaran / Edukasi" },
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
        security: [],
        body: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string" },
            limit: { type: "number" },
            forceLive: { type: "boolean" },
            useBrowserAutomation: { type: "boolean" },
            engine: { type: "string", enum: ["innertube", "playwright", "auto"] },
            sortBy: { type: "string", enum: ["upload_date", "relevance"] },
            onlyNew: { type: "boolean" },
          },
        },
      },
    },
    async (request) => {
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

      const scanResult = await scanYoutube({
        query: body.query,
        limit: body.limit ?? 12,
        forceLive: body.forceLive ?? false,
        useBrowserAutomation: body.useBrowserAutomation ?? false,
        engine: body.engine ?? "auto",
        sortBy: body.sortBy ?? "upload_date",
        onlyNew: body.onlyNew ?? false,
      });

      const durationMs = Date.now() - t0;

      // ── Persist to DB (non-blocking, non-fatal) ───────────────────────────
      const isDbUp = await dbAvailable();
      if (isDbUp && scanResult.items.length > 0) {
        try {
          await persistItemsToDB(scanResult.items, scanResult.crawlerMode ?? "auto");
        } catch { /* DB write errors must not break the API response */ }
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
        security: [],
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
                "FALSE_POSITIVE_DISMISSED",
              ],
            },
            notes: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        id: string;
        action: YoutubeWorkflowStatus;
        notes?: string;
      };

      // Update in-memory repo first (fast)
      const updated = youtubeSentinelRepo.updateWorkflowStatus(body.id, body.action, body.notes);
      if (!updated) {
        return reply.status(404).send({ ok: false, message: "Item not found" });
      }

      // Persist the workflow status change to DB (non-blocking)
      const isDbUp = await dbAvailable();
      if (isDbUp) {
        try {
          const isUUID = typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id);
          const row = isUUID
            ? await YoutubeSentinelItemModel.query().where({ id: body.id }).orWhere({ video_id: body.id }).first()
            : await YoutubeSentinelItemModel.query().where({ video_id: body.id }).first();
          if (row) {
            await YoutubeSentinelItemModel.query().patchAndFetchById(row.id, {
              workflowStatus: body.action,
              operatorNotes: body.notes ?? row.operatorNotes ?? null,
              lastActionAt: new Date().toISOString(),
            });
          }
        } catch { /* DB update failure is non-fatal */ }
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
    "/v1/world-monitor/youtube/snippet",
    {
      schema: {
        tags: ["System"],
        summary: "Retrieve browser automation crawler script snippet",
        security: [],
        querystring: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const query = (request.query ?? {}) as { query?: string };
      const snippet = generateBrowserAutomationSnippet(query.query || "cek khodam");
      return {
        ok: true,
        query: query.query || "cek khodam",
        script: snippet,
      };
    },
  );
}

