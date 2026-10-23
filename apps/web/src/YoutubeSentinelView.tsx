import { useEffect, useMemo, useState } from "react";
import { API_PATHS, createApiClient, type ApiRequestOptions } from "@empire/api-contract";
import type {
  SentinelDirection,
  SentinelTradition,
  YoutubeMonitoredItem,
  YoutubeRiskLevel,
  YoutubeScanSummary,
  YoutubeViolationCategory,
  YoutubeWorkflowStatus,
} from "@empire/batteries-world-monitor";
import { Badge, Button, DataTable, type DataTableColumn, DonutChart, EmptyState, MetricGrid, Panel, StatusIndicator, RefreshIcon, ActivityIcon, GlobeIcon, ApprovalIcon, DocumentIcon, DownloadIcon, CopyIcon, IconText, SparkIcon, WarningIcon, AuditIcon, ModulesIcon, CheckIcon, ClockIcon, HistoryIcon, SettingsIcon, PlusIcon, SourceIcon, KnowledgeIcon, ArrowUpRightIcon, AgentIcon, CloseIcon } from "@empire/ui";
import { MotionRegion } from "@empire/ui/client";

const api = createApiClient(process.env.NEXT_PUBLIC_API_ORIGIN || "/api");

interface YoutubeSentinelViewProps {
  searchQuery?: string;
  token: string | null;
  permissions: { read: boolean; scan: boolean; review: boolean; schedule: boolean };
}

export function YoutubeSentinelView({ searchQuery = "", token, permissions }: YoutubeSentinelViewProps) {
  const request = <T,>(path: string, options: ApiRequestOptions = {}) => api.request<T>(path, { ...options, token });
  const [items, setItems] = useState<YoutubeMonitoredItem[]>([]);
  const [summary, setSummary] = useState<YoutubeScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("pesugihan uang gaib");
  const [selectedDirection, setSelectedDirection] = useState<SentinelDirection | "ALL">("ALL");
  const [selectedTradition, setSelectedTradition] = useState<SentinelTradition | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [forceLiveCrawl, setForceLiveCrawl] = useState(true);
  const [selectedEngine, setSelectedEngine] = useState<"auto" | "innertube" | "playwright">("auto");
  const [selectedSortBy, setSelectedSortBy] = useState<"upload_date" | "relevance">("upload_date");
  const [hideResolved, setHideResolved] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [toast, setToast] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<{
    type: "report" | "counter_dakwah" | "wisdom" | "partner";
    item?: YoutubeMonitoredItem;
  } | null>(null);
  const [partnerFormData, setPartnerFormData] = useState<{
    name: string;
    companyName: string;
    type: "contact" | "invoice" | "delivery" | "other";
    isMitra: boolean;
    notes: string;
  }>({
    name: "",
    companyName: "",
    type: "contact",
    isMitra: true,
    notes: "",
  });
  const [linkingPartner, setLinkingPartner] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [schedulerStatus, setSchedulerStatus] = useState<{
    enabled: boolean;
    intervalHours: number;
    isSweepInProgress: boolean;
    lastSweepCompletedAt: string | null;
    nextScheduledSweepAt: string | null;
  } | null>(null);
  const [schedulerTriggering, setSchedulerTriggering] = useState(false);

  // Fetch background scheduler status
  async function fetchSchedulerStatus() {
    if (!permissions.read) return;
    try {
      const res = await request<{
        ok: boolean;
        scheduler: {
          enabled: boolean;
          intervalHours: number;
          isSweepInProgress: boolean;
          lastSweepCompletedAt: string | null;
          nextScheduledSweepAt: string | null;
        };
      }>(API_PATHS.worldMonitorYoutubeSchedule);
      if (res.ok) {
        setSchedulerStatus(res.scheduler);
      }
    } catch {
      // Non-fatal
    }
  }

  // Trigger manual background sweep via scheduler
  async function triggerSchedulerSweep() {
    if (!permissions.schedule) return;
    setSchedulerTriggering(true);
    notify("Memulai pemindaian berkala di background...");
    try {
      const res = await request<{
        ok: boolean;
        message?: string;
        scheduler?: {
          enabled: boolean;
          intervalHours: number;
          isSweepInProgress: boolean;
          lastSweepCompletedAt: string | null;
          nextScheduledSweepAt: string | null;
        };
      }>(API_PATHS.worldMonitorYoutubeSchedule, {
        method: "POST",
        body: { action: "trigger" },
      });
      if (res.ok) {
        notify(res.message || "Pemindaian background selesai!");
        void fetchCatalog();
        void fetchSchedulerStatus();
      }
    } catch (err) {
      notify(`Gagal memicu scheduler: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setSchedulerTriggering(false);
    }
  }

  // Update scheduler interval hours
  async function updateSchedulerInterval(hours: number) {
    if (!permissions.schedule) return;
    try {
      const res = await request<{
        ok: boolean;
        message?: string;
        scheduler?: {
          enabled: boolean;
          intervalHours: number;
          isSweepInProgress: boolean;
          lastSweepCompletedAt: string | null;
          nextScheduledSweepAt: string | null;
        };
      }>(API_PATHS.worldMonitorYoutubeSchedule, {
        method: "POST",
        body: { action: "update_interval", intervalHours: hours },
      });
      if (res.ok) {
        setSchedulerStatus(res.scheduler ?? null);
        notify(res.message || `Interval pemindaian diubah ke ${hours} jam.`);
      }
    } catch {
      notify("Gagal memperbarui interval scheduler.");
    }
  }

  // Catalog reads are side-effect-free; crawls require an explicit operator action.
  async function fetchCatalog() {
    if (!permissions.read) return;
    setLoading(true);
    setCatalogError(null);
    try {
      const res = await request<{
        ok: boolean;
        items: YoutubeMonitoredItem[];
        summary: YoutubeScanSummary;
      }>(API_PATHS.worldMonitorYoutube);
      if (res.ok) {
        setItems(res.items);
        setSummary(res.summary);
      } else {
        setCatalogError("Katalog Sentinel tidak tersedia. Coba muat ulang.");
      }
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Katalog Sentinel tidak tersedia.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!permissions.read) return;
    void fetchCatalog();
    void fetchSchedulerStatus();
  }, []);

  // Show temporary toast message
  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }

  // Trigger manual search/crawl scan for a specific query
  async function handleScan(targetQuery?: string) {
    if (!permissions.scan) return;
    const q = (targetQuery ?? queryInput).trim();
    if (!q) return;

    setScanning(true);
    setScanProgress(`Memindai: "${q}"…`);
    try {
      const res = await request<{
        ok: boolean;
        scannedCount: number;
        newItemsCount: number;
        crawlerMode?: "youtubei_innertube" | "playwright_headless_browser" | "http_live_fetch" | "no_results";
        diagnosticMessage?: string;
        items: YoutubeMonitoredItem[];
        summary: YoutubeScanSummary;
      }>(API_PATHS.worldMonitorYoutubeScan, {
        method: "POST",
        body: {
          query: q,
          limit: 15,
          forceLive: forceLiveCrawl,
          engine: selectedEngine,
          sortBy: selectedSortBy,
          onlyNew,
          useBrowserAutomation: selectedEngine === "playwright",
        },
      });

      if (res.ok) {
        setItems(res.items);
        setSummary(res.summary);
      const mode = res.crawlerMode === "youtubei_innertube"
        ? "YouTube.js (InnerTube Native Client)"
        : res.crawlerMode === "playwright_headless_browser"
          ? "Playwright Headless Browser (Chromium)"
          : res.crawlerMode === "http_live_fetch"
            ? "Live HTTP Network Fetch"
            : res.crawlerMode === "no_results"
              ? "Tidak ada hasil live"
              : "Heuristic";
        if (res.scannedCount === 0 || res.crawlerMode === "no_results") {
          notify(`Tidak ada hasil pemindaian dari ${mode}.${res.diagnosticMessage ? " Info: " + res.diagnosticMessage : ""}`);
        } else {
          notify(`Pemindaian selesai via ${mode}: ${res.scannedCount} video dievaluasi.${res.diagnosticMessage ? " Info: " + res.diagnosticMessage : ""}`);
        }
      }
    } catch (err) {
      notify(`Gagal memindai: ${err instanceof Error ? err.message : "Error tidak diketahui"}`);
    } finally {
      setScanning(false);
      setScanProgress(null);
    }
  }

  // Execute workflow action on an item
  async function handleAction(
    id: string,
    action: YoutubeWorkflowStatus,
    notes?: string,
  ) {
    if (!permissions.review) return;
    try {
      const res = await request<{
        ok: boolean;
        item: YoutubeMonitoredItem;
        summary: YoutubeScanSummary;
      }>(API_PATHS.worldMonitorYoutubeAction, {
        method: "POST",
        body: { id, action, notes },
      });

      if (res.ok) {
        setItems((prev) => prev.map((item) => (item.id === id ? res.item : item)));
        setSummary(res.summary);
        notify(`Status video diperbarui: ${action}`);
        if (activeModal) setActiveModal(null);
      }
    } catch (err) {
      notify(`Gagal memperbarui status: ${err instanceof Error ? err.message : "Error"}`);
    }
  }

  // Export evidence ledger as Markdown or JSON
  function exportLedger(format: "markdown" | "json") {
    if (format === "json") {
      const jsonStr = JSON.stringify(visibleItems, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `youtube-sentinel-evidence-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify("Berhasil mengunduh berkas bukti JSON.");
      return;
    }

    // Markdown Report
    let md = `# LAPORAN BUKTI SENTINEL YOUTUBE — ANTI-SYIRIK & KHURAFAT\n`;
    md += `Tanggal Audit: ${new Date().toLocaleString()}\n`;
    md += `Total Bukti Dipantau: ${visibleItems.length} video\n\n`;
    md += `| Judul Video | Kanal | Kategori | Skor Risiko | Status Tindakan |\n`;
    md += `|---|---|---|---|---|\n`;
    for (const item of visibleItems) {
      md += `| [${item.title.replace(/\|/g, "-")}](${item.url}) | ${item.channelTitle} | ${item.category} | ${item.riskScore}/100 (${item.riskLevel}) | ${item.workflowStatus} |\n`;
    }
    md += `\n## Rincian Dalil Tauhid & Rekomendasi\n`;
    for (const item of visibleItems.filter((i) => i.riskScore >= 40)) {
      md += `### ${item.title}\n`;
      md += `- URL: ${item.url}\n`;
      md += `- Pelanggaran: ${item.matchedRules.map((r) => r.label).join(", ")}\n`;
      md += `- Rujukan Dalil: ${item.tauhidGuidance.dalilRef}\n`;
      md += `- Rekomendasi: ${item.tauhidGuidance.recommendedAction}\n\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `youtube-sentinel-laporan-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Berhasil mengunduh laporan audit Markdown.");
  }

  // Filtered items (with elimination of already resolved / actioned items)
  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = searchQuery
        ? `${item.title} ${item.channelTitle} ${item.category} ${item.descriptionSnippet} ${item.tradition ?? ""}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;
      const matchesDir = selectedDirection === "ALL" || item.direction === selectedDirection;
      const matchesTrad = selectedTradition === "ALL" || item.tradition === selectedTradition;
      const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesRisk = selectedRiskLevel === "ALL" || item.riskLevel === selectedRiskLevel;
      const matchesStatus = selectedStatus === "ALL" || item.workflowStatus === selectedStatus;
      const matchesHideResolved = hideResolved
        ? item.workflowStatus !== "REPORT_FILED" && item.workflowStatus !== "FALSE_POSITIVE_DISMISSED" && item.workflowStatus !== "SHARED_VIA_DAKWAH"
        : true;
      const matchesOnlyNew = onlyNew ? Boolean(item.isNew) : true;
      return matchesSearch && matchesDir && matchesTrad && matchesCat && matchesRisk && matchesStatus && matchesHideResolved && matchesOnlyNew;
    });
  }, [items, searchQuery, selectedDirection, selectedTradition, selectedCategory, selectedRiskLevel, selectedStatus, hideResolved, onlyNew]);

  const riskBadgeTone = (level: YoutubeRiskLevel) => {
    switch (level) {
      case "CRITICAL_SYIRIK":
        return "danger";
      case "HIGH_SYIRIK_RISK":
        return "warning";
      case "ADVISORY_SUPERSTITION":
        return "neutral";
      case "DAKWAH_REFUTATION":
        return "success";
      default:
        return "info";
    }
  };

  const statusTone = (status: YoutubeWorkflowStatus) => {
    switch (status) {
      case "VERIFIED_SYIRIK":
        return "danger";
      case "COUNTER_DAKWAH_QUEUED":
        return "info";
      case "REPORT_FILED":
        return "success";
      case "FALSE_POSITIVE_DISMISSED":
        return "neutral";
      case "WISDOM_QUEUED":
        return "warning";
      case "AMPLIFY_RECOMMENDED":
        return "success";
      case "SHARED_VIA_DAKWAH":
        return "info";
      case "ARCHIVED_REFERENCE":
        return "neutral";
      default:
        return "warning";
    }
  };

  const tableColumns = useMemo<DataTableColumn<YoutubeMonitoredItem>[]>(
    () => [
      {
        key: "index",
        header: "#",
        align: "center",
        cell: (item: YoutubeMonitoredItem) => {
          const idx = visibleItems.findIndex((it) => it.id === item.id);
          return (
            <span className="sentinel-match-index">
              {idx >= 0 ? idx + 1 : "•"}
            </span>
          );
        },
      },
      {
        key: "video",
        header: "Video YouTube",
        cell: (item: YoutubeMonitoredItem) => (
          <div className="sentinel-table-title-cell">
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="sentinel-table-thumb"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="sentinel-rule-summary">
              <div className="sentinel-card-badge-row">
                {item.direction === "POSITIVE" ? (
                  <Badge tone="success"><IconText icon={<SparkIcon />}>HIKMAH / POSITIF</IconText></Badge>
                ) : item.direction === "NEUTRAL" ? (
                  <Badge tone="neutral">NETRAL</Badge>
                ) : (
                  <Badge tone="danger"><IconText icon={<WarningIcon />}>ANCAMAN AKIDAH</IconText></Badge>
                )}
                {item.tradition && (
                  <span className={`sentinel-tradition-badge sentinel-tradition-badge--${item.tradition.toLowerCase()}`}>
                    {item.tradition}
                  </span>
                )}
                {item.isNew && (
                  <Badge tone="success">BARU</Badge>
                )}
                <span className="sentinel-card-source-pill sentinel-card-source-pill--inline">
                  {item.sourceType}
                </span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="sentinel-table-title-link"
                title={item.title}
              >
                {item.title}
              </a>
              {item.matchedRules && item.matchedRules.length > 0 && (
                <div className="sentinel-card-rule-tags">
                  {item.matchedRules.slice(0, 2).map((r, idx) => (
                    <span
                      key={idx}
                      className={`sentinel-matched-rule${r.weight > 0 ? " sentinel-matched-rule--risk" : " sentinel-matched-rule--safe"}`}
                    >
                      <IconText icon={r.weight > 0 ? <WarningIcon /> : <CheckIcon />}>{r.label}</IconText>
                    </span>
                  ))}
                  {item.matchedRules.length > 2 && (
                    <span className="sentinel-rule-overflow">
                      +{item.matchedRules.length - 2} lagi
                    </span>
                  )}
                </div>
              )}
              <div className="sentinel-card-metadata">
                {item.durationText && <IconText icon={<ClockIcon />}>{item.durationText}</IconText>}
                {item.publishedAt && <IconText icon={<HistoryIcon />}>{item.publishedAt}</IconText>}
                <span className="sentinel-video-id">ID: {item.videoId}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "channel",
        header: "Channel & Entitas Partner",
        cell: (item: YoutubeMonitoredItem) => (
          <div>
            <div className="sentinel-channel-partner-row">
              <span className="sentinel-channel-name">{item.channelTitle}</span>
              {item.partnerInfo ? (
                <span
                  className={`sentinel-partner-badge ${item.partnerInfo.isMitra ? "sentinel-partner-badge--mitra" : "sentinel-partner-badge--target"}`}
                  title={`Terhubung ke Partner: ${item.partnerInfo.name} (${item.partnerInfo.notes || ""})`}
                >
                  {item.partnerInfo.isMitra ? "Mitra: " : "Target: "}
                  {item.partnerInfo.name}
                </span>
              ) : null}
            </div>
            <div className="sentinel-channel-partner-actions">
              {item.viewCountText && <span>{item.viewCountText}</span>}
              <button
                type="button"
                className="text-button sentinel-partner-link"
                onClick={(e) => {
                  e.stopPropagation();
                  setPartnerFormData({
                    name: item.channelTitle,
                    companyName: item.channelTitle,
                    type: "contact",
                    isMitra: item.direction === "POSITIVE",
                    notes: item.direction === "POSITIVE"
                      ? `Mitra Dakwah / Komunitas Hikmah (${item.tradition}) dari YouTube Sentinel.`
                      : `Target Pemantauan Dugaan Kesesatan / Pelanggaran Tauhid dari YouTube Sentinel.`,
                  });
                  setActiveModal({ type: "partner", item });
                }}
              >
                {item.partnerInfo ? <IconText icon={<SettingsIcon />}>Kelola Partner</IconText> : <IconText icon={<PlusIcon />}>Simpan ke Partner</IconText>}
              </button>
            </div>
          </div>
        ),
      },
      {
        key: "category",
        header: "Kategori & Nilai",
        cell: (item: YoutubeMonitoredItem) => (
          <div>
            <Badge tone={item.direction === "POSITIVE" ? "success" : "info"}>
              {item.category.replace(/_/g, " ")}
            </Badge>
            {item.direction === "POSITIVE" && item.wisdomGuidance?.scriptureRef ? (
              <div className="sentinel-scripture-reference">
                <IconText icon={<KnowledgeIcon />}>{item.wisdomGuidance.scriptureRef}</IconText>
              </div>
            ) : item.tauhidGuidance?.dalilRef ? (
              <div className="sentinel-source-reference">
                <IconText icon={<SourceIcon />}>{item.tauhidGuidance.dalilRef}</IconText>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: "riskLevel",
        header: "Tingkat Risiko / Nilai",
        cell: (item: YoutubeMonitoredItem) => (
          <Badge tone={riskBadgeTone(item.riskLevel)}>
            {item.direction === "POSITIVE" ? "NILAI LUHUR" : item.riskLevel.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        key: "riskScore",
        header: "Skor",
        cell: (item: YoutubeMonitoredItem) => (
          <div>
            <span
              className={`sentinel-risk-score sentinel-risk-score--${item.direction === "POSITIVE" ? "positive" : item.riskScore >= 70 ? "high" : item.riskScore >= 40 ? "medium" : "low"}`}
            >
              {item.direction === "POSITIVE" ? "100" : item.riskScore}
            </span>
            <span className="sentinel-score-suffix">
              {item.direction === "POSITIVE" ? " HIKMAH" : "/100"}
            </span>
          </div>
        ),
      },
      {
        key: "workflowStatus",
        header: "Status Tindakan",
        cell: (item: YoutubeMonitoredItem) => (
          <select
            className="sentinel-select sentinel-select--compact"
            value={item.workflowStatus}
            disabled={!permissions.review}
            onChange={(e) => void handleAction(item.id, e.target.value as YoutubeWorkflowStatus)}
          >
            {item.direction === "POSITIVE" ? (
              <>
                <option value="WISDOM_QUEUED">Antrean Hikmah</option>
                <option value="AMPLIFY_RECOMMENDED">Rekomendasi Amplifikasi</option>
                <option value="SHARED_VIA_DAKWAH">Telah Diamplifikasi</option>
                <option value="ARCHIVED_REFERENCE">Arsip Referensi Luhur</option>
              </>
            ) : (
              <>
                <option value="PENDING_REVIEW">Menunggu Telaah</option>
                <option value="VERIFIED_SYIRIK">Terverifikasi Melanggar</option>
                <option value="COUNTER_DAKWAH_QUEUED">Bantahan Tauhid</option>
                <option value="REPORT_FILED">Laporan Terkirim</option>
                <option value="FALSE_POSITIVE_DISMISSED">Bukan Pelanggaran</option>
              </>
            )}
          </select>
        ),
      },
      {
        key: "scannedAt",
        header: "Waktu Scan",
        cell: (item: YoutubeMonitoredItem) => (
          <span className="sentinel-scan-timestamp">
            {new Date(item.scannedAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Aksi",
        align: "end",
        cell: (item: YoutubeMonitoredItem) => (
          <div className="sentinel-table-actions sentinel-actions-end">
            {item.direction === "POSITIVE" ? (
              <>
                <button
                  type="button"
                  className="sentinel-table-btn sentinel-table-btn--positive"
                  title="Lihat Hikmah & Amplifikasi Kebaikan"
                  onClick={() => setActiveModal({ type: "wisdom", item })}
                >
                  <IconText icon={<SparkIcon />}>Hikmah &amp; Amplify</IconText>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="sentinel-table-btn"
                  title="Buat Laporan Pelanggaran"
                  onClick={() => setActiveModal({ type: "report", item })}
                >
                  <IconText icon={<WarningIcon />}>Lapor</IconText>
                </button>
                <button
                  type="button"
                  className="sentinel-table-btn"
                  title="Draf Bantahan Tauhid"
                  onClick={() => setActiveModal({ type: "counter_dakwah", item })}
                >
                  <IconText icon={<CheckIcon />}>Bantahan</IconText>
                </button>
              </>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sentinel-table-btn sentinel-table-btn--link"
              title="Buka Video di YouTube"
            >
              <ArrowUpRightIcon size={14} />
            </a>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleItems],
  );

  return (
    <div className="youtube-sentinel-container">
      {items.some((item) => item.sourceType === "demo_synthetic") && (
        <div role="note" className="eol-notice eol-notice--warning sentinel-space-after-4">
          Data contoh sintetis aktif untuk mode demo. Data ini bukan hasil pantauan YouTube dan tidak boleh diperlakukan sebagai bukti.
        </div>
      )}
      {toast && (
        <div role="status" className="eol-notice eol-notice--info sentinel-space-after-4">
          {toast}
        </div>
      )}

      {/* ── Summary Stats ────────────────────────────────────────────────────── */}
      <MetricGrid
        className="sentinel-summary"
        columns={6}
        density="compact"
        items={[
          { label: "Total video dipantau", value: summary?.totalMonitored ?? items.length },
          { label: "Kritis (syirik nyata)", value: summary?.criticalSyirikCount ?? 0, tone: "danger" },
          { label: "Risiko tinggi (okultisme)", value: summary?.highRiskCount ?? 0, tone: "warning" },
          { label: "Hikmah & kebajikan", value: summary?.positiveContentCount ?? items.filter((item) => item.direction === "POSITIVE").length, tone: "success" },
          { label: "Bantahan dakwah tauhid", value: summary?.counterDakwahCount ?? 0, tone: "success" },
          { label: "Tindakan diajukan", value: summary?.actionTakenCount ?? 0 },
        ]}
      />

      {/* ── Scheduler Surveillance Bar (Auto-Scan Scheduler) ────────────────── */}
      <div className="sentinel-scheduler-card">
        <div className="sentinel-scheduler-info">
          <span className="sentinel-scheduler-badge">
            <span className="online-dot" data-state={schedulerStatus?.isSweepInProgress ? "checking" : "ok"} />
            {schedulerStatus?.isSweepInProgress ? "PEMINDAIAN BERJALAN..." : "AUTOSCAN AKTIF"}
          </span>
          <span>
            Frekuensi: <strong>Setiap {schedulerStatus?.intervalHours ?? 12} Jam</strong>
          </span>
          {schedulerStatus?.lastSweepCompletedAt && (
            <span>
              Terakhir: <strong>{new Date(schedulerStatus.lastSweepCompletedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</strong>
            </span>
          )}
          {schedulerStatus?.nextScheduledSweepAt && (
            <span>
              Jadwal Berikutnya: <strong>{new Date(schedulerStatus.nextScheduledSweepAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</strong>
            </span>
          )}
        </div>
        <div className="sentinel-scheduler-actions">
          {permissions.schedule && <select
            className="sentinel-select sentinel-select--scheduler"
            value={schedulerStatus?.intervalHours ?? 12}
            onChange={(e) => void updateSchedulerInterval(Number(e.target.value))}
          >
            <option value={1}>Ubah: 1 Jam</option>
            <option value={3}>Ubah: 3 Jam</option>
            <option value={6}>Ubah: 6 Jam</option>
            <option value={12}>Ubah: 12 Jam</option>
            <option value={24}>Ubah: 24 Jam</option>
          </select>}
          {permissions.schedule && <Button
            variant="secondary"
            size="sm"
            disabled={schedulerTriggering || schedulerStatus?.isSweepInProgress}
            onClick={() => void triggerSchedulerSweep()}
          >
            <RefreshIcon size={12} />
            {schedulerTriggering || schedulerStatus?.isSweepInProgress ? "Menjalankan..." : "Jalankan Auto-Sweep Sekarang"}
          </Button>}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCharts((prev) => !prev)}
          >
            <ActivityIcon size={12} />
            {showCharts ? "Sembunyikan Grafik" : "Tampilkan Grafik"}
          </Button>
        </div>
      </div>

      {/* ── Visual Analytics (Tradition & Category Charts) ────────────────── */}
      {showCharts && (
        <div className="sentinel-chart-grid sentinel-chart-grid--spaced">
          {/* Chart 1: Breakdown Per Tradisi & Polarisasi */}
          <div className="sentinel-chart-card">
            <div className="sentinel-chart-title">
              <h4>
                <GlobeIcon size={14} /> Distribusi Tradisi &amp; Polarisasi Konten
              </h4>
              <span className="sentinel-view-count">
                Total: {items.length} Video
              </span>
            </div>
            <div className="sentinel-bars-container">
              {[
        { label: "ISLAM", count: items.filter((i) => i.tradition === "ISLAM").length, tone: "success" },
        { label: "KRISTEN", count: items.filter((i) => i.tradition === "KRISTEN").length, tone: "info" },
        { label: "KATOLIK", count: items.filter((i) => i.tradition === "KATOLIK").length, tone: "sky" },
        { label: "HINDU", count: items.filter((i) => i.tradition === "HINDU").length, tone: "warning" },
        { label: "BUDDHA", count: items.filter((i) => i.tradition === "BUDDHA").length, tone: "yellow" },
        { label: "KHONGHUCU", count: items.filter((i) => i.tradition === "KHONGHUCU").length, tone: "rose" },
        { label: "UNIVERSAL", count: items.filter((i) => i.tradition === "UNIVERSAL").length, tone: "purple" },
              ].map((trad) => {
                const max = Math.max(1, ...items.map(() => items.length));
                const pct = items.length > 0 ? Math.round((trad.count / items.length) * 100) : 0;
                return (
                  <div key={trad.label} className="sentinel-bar-row">
                    <span className="sentinel-bar-label">{trad.label}</span>
                    <div className="sentinel-bar-track">
                      <div
                        className={`sentinel-bar-fill sentinel-bar-fill--${trad.tone}`}
                        role="meter"
                        aria-label={`${trad.label}: ${pct}%`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pct}
                        data-percent={Math.max(4, pct)}
                      >
                        {pct > 5 ? `${pct}%` : ""}
                      </div>
                    </div>
                    <span className="sentinel-bar-val">{trad.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Komposisi Polarisasi & Level Risiko */}
          <div className="sentinel-chart-card">
            <div className="sentinel-chart-title">
              <h4>
                <ApprovalIcon size={14} /> Komposisi Arah &amp; Risiko
              </h4>
            </div>
          <div className="sentinel-donut-wrapper">
              <DonutChart
                label="Komposisi arah konten"
                centerLabel="KONTEN"
                segments={[
                  { id: "negative", label: "Kesesatan", value: items.filter((i) => i.direction === "NEGATIVE").length, tone: "danger" },
                  { id: "positive", label: "Kebajikan", value: items.filter((i) => i.direction === "POSITIVE").length, tone: "success" },
                  { id: "neutral", label: "Netral", value: items.filter((i) => i.direction === "NEUTRAL").length, tone: "info" },
                ]}
              />

              <div className="sentinel-donut-legend">
                <div
                  className="sentinel-legend-item"
                  onClick={() => setSelectedDirection("NEGATIVE")}
                  title="Klik untuk filter arah Negatif"
                >
                    <span className="sentinel-legend-color sentinel-legend-color--danger" />
                  <span><IconText icon={<WarningIcon />}>Kesesatan:</IconText> <strong>{items.filter((i) => i.direction === "NEGATIVE").length}</strong></span>
                </div>
                <div
                  className="sentinel-legend-item"
                  onClick={() => setSelectedDirection("POSITIVE")}
                  title="Klik untuk filter arah Positif"
                >
                    <span className="sentinel-legend-color sentinel-legend-color--success" />
                  <span><IconText icon={<SparkIcon />}>Kebajikan:</IconText> <strong>{items.filter((i) => i.direction === "POSITIVE").length}</strong></span>
                </div>
                <div
                  className="sentinel-legend-item"
                  onClick={() => setSelectedDirection("NEUTRAL")}
                  title="Klik untuk filter arah Netral"
                >
                    <span className="sentinel-legend-color sentinel-legend-color--info" />
                  <span><IconText icon={<CheckIcon />}>Netral:</IconText> <strong>{items.filter((i) => i.direction === "NEUTRAL").length}</strong></span>
                </div>
          <div className="sentinel-chart-hint">
                  Klik salah satu legenda untuk menyaring tabel langsung.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Scanner Control Panel ────────────────────────────────────────────── */}
      <section className="sentinel-scanner-panel">
        <div className="sentinel-scanner-head">
          <div>
            <span className="eyebrow">AUTOMATED CRAWLER &amp; SENTINEL DISPATCHER</span>
            <h3>Pemindai Konten YouTube (Algoritma Heuristik Tanpa AI)</h3>
          </div>
          <div className="button-row">
            <Button variant="secondary" onClick={() => exportLedger("markdown")}>
              <DownloadIcon size={14} /> Ekspor Markdown
            </Button>
            <Button variant="secondary" onClick={() => exportLedger("json")}>
              <CopyIcon size={14} /> Unduh JSON
            </Button>
          </div>
        </div>

        {permissions.scan && <div className="sentinel-search-bar">
          <input
            type="text"
            className="sentinel-search-input"
            placeholder="Ketik kata kunci YouTube (contoh: pesugihan uang gaib, cek khodam live, jimat kebal)..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleScan()}
          />
          <Button variant="primary" onClick={() => void handleScan()} disabled={scanning}>
            {scanning ? "Sedang Memindai..." : <IconText icon={<SparkIcon />}>Jalankan Pemindaian</IconText>}
          </Button>
        </div>}

        {permissions.scan && <div className="sentinel-browser-status-bar">
          <div className="sentinel-engine-controls">
            <span className="muted sentinel-filter-label">Engine Penelusuran:</span>
            <div className="sentinel-engine-buttons">
              <button
                type="button"
                className={`sentinel-engine-btn ${selectedEngine === "auto" ? "sentinel-engine-btn--active" : ""}`}
                onClick={() => setSelectedEngine("auto")}
              >
                <IconText icon={<SparkIcon />}>Auto (YouTube.js + Playwright)</IconText>
              </button>
              <button
                type="button"
                className={`sentinel-engine-btn ${selectedEngine === "innertube" ? "sentinel-engine-btn--active" : ""}`}
                onClick={() => setSelectedEngine("innertube")}
              >
                <IconText icon={<ActivityIcon />}>YouTube.js (InnerTube Native - Sangat Cepat)</IconText>
              </button>
              <button
                type="button"
                className={`sentinel-engine-btn ${selectedEngine === "playwright" ? "sentinel-engine-btn--active" : ""}`}
                onClick={() => setSelectedEngine("playwright")}
              >
                <IconText icon={<AgentIcon />}>Playwright (Chromium Headless Browser)</IconText>
              </button>
            </div>
          </div>
          <small className="sentinel-engine-note">
            {selectedEngine === "innertube" && "Menggunakan library LuanRT/YouTube.js untuk mengambil metadata langsung via InnerTube tanpa perlu membuka browser (sangat cepat & hemat memori)."}
            {selectedEngine === "playwright" && "Membuka browser Chromium headless nyata di latar belakang dan merender halaman pencarian YouTube."}
            {selectedEngine === "auto" && "Memprioritaskan YouTube.js InnerTube yang cepat, lalu fallback otomatis ke browser Playwright jika diperlukan."}
          </small>
        </div>}

        {scanning && (
          <MotionRegion className="sentinel-scanning-banner">
            <div className="sentinel-spinner" />
            <div>
              <strong>
                {scanProgress ?? "Menginisialisasi crawler YouTube..."}
              </strong>
              <p>
                {scanProgress
                  ? "Matriks evaluasi heuristik Tauhid berjalan otomatis pada setiap hasil..."
                  : "Menyiapkan koneksi ke YouTube InnerTube API..."}
              </p>
            </div>
          </MotionRegion>
        )}

        <div className="sentinel-presets">
          <span className="muted sentinel-presets-label">
            Preset Cepat:
          </span>
          {[
            { label: "Pesugihan Uang Gaib", query: "pesugihan uang gaib tanpa tumbal" },
            { label: "Cek Khodam & Panggil Jin", query: "cek khodam live pengisian khodam" },
            { label: "Jimat Kebal & Mustika", query: "jimat kebal bacok keris pusaka bertuah" },
            { label: "Ramalan Tarot & Zodiak", query: "baca kartu tarot ramalan nasib 2026" },
            { label: "Santet & Pelet Jarak Jauh", query: "santet jarak jauh pelet semar mesem" },
            { label: "Ngalap Berkah Makam", query: "ngalap berkah makam keramat minta nomor" },
            { label: "Bantahan Ustadz Sunnah", query: "bahaya syirik ustadz membongkar trik dukun" },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="sentinel-preset-btn"
              onClick={() => {
                setQueryInput(preset.query);
                void handleScan(preset.query);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Filters Bar ──────────────────────────────────────────────────────── */}
      <div className="sentinel-filter-bar">
        {/* Direction Switcher Tabs */}
        <div className="sentinel-direction-row">
          <span className="muted sentinel-direction-label">
            Arah Sentinel:
          </span>
          <div className="sentinel-direction-switcher">
            <button
              type="button"
              className={`sentinel-direction-tab ${selectedDirection === "ALL" ? "sentinel-direction-tab--active-all" : ""}`}
              onClick={() => setSelectedDirection("ALL")}
            >
              <IconText icon={<GlobeIcon />}>Semua Arah ({items.length})</IconText>
            </button>
            <button
              type="button"
              className={`sentinel-direction-tab ${selectedDirection === "NEGATIVE" ? "sentinel-direction-tab--active-neg" : ""}`}
              onClick={() => setSelectedDirection("NEGATIVE")}
            >
              <IconText icon={<WarningIcon />}>Kesesatan &amp; Khurafat ({items.filter((i) => i.direction === "NEGATIVE").length})</IconText>
            </button>
            <button
              type="button"
              className={`sentinel-direction-tab ${selectedDirection === "POSITIVE" ? "sentinel-direction-tab--active-pos" : ""}`}
              onClick={() => setSelectedDirection("POSITIVE")}
            >
              <IconText icon={<SparkIcon />}>Kebajikan &amp; Hikmah ({items.filter((i) => i.direction === "POSITIVE").length})</IconText>
            </button>
          </div>

          <span className="muted sentinel-tradition-label">
            Tradisi Agama:
          </span>
          <select
            className="sentinel-select sentinel-select--wide"
            value={selectedTradition}
            onChange={(e) => setSelectedTradition(e.target.value as SentinelTradition | "ALL")}
          >
            <option value="ALL">Semua Tradisi</option>
            <option value="ISLAM">Islam</option>
            <option value="KRISTEN">Kristen</option>
            <option value="KATOLIK">Katolik</option>
            <option value="HINDU">Hindu</option>
            <option value="BUDDHA">Buddha</option>
            <option value="KHONGHUCU">Khonghucu</option>
            <option value="UNIVERSAL">Universal</option>
          </select>
        </div>

        <div className="sentinel-filter-group">
          <span className="muted sentinel-filter-label">
            Kategori:
          </span>
          <select
            className="sentinel-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">Semua Kategori ({items.length})</option>
            <optgroup label="Arah Negatif (Kesesatan)">
              <option value="SIHIR_PELET">Sihir, Santet &amp; Pelet</option>
              <option value="DUKUN_RAMALAN">Dukun &amp; Ramalan Tarot</option>
              <option value="PESUGIHAN_TUMBAL">Pesugihan &amp; Tumbal</option>
              <option value="KHODAM_JIN">Khodam &amp; Jin</option>
              <option value="BENDA_KERAMAT_JIMAT">Benda Keramat &amp; Jimat</option>
              <option value="KUBURAN_SESAJEN">Makam &amp; Sesajen</option>
              <option value="UMUM_SYIRIK">Kesyirikan Umum</option>
            </optgroup>
            <optgroup label="Arah Positif (Kebajikan & Hikmah)">
              <option value="TAUHID_DAKWAH">Dakwah Pemurnian Tauhid</option>
              <option value="AKHLAK_KARIMAH">Pendidikan Akhlak Karimah</option>
              <option value="KASIH_KRISTIANI">Kasih Kristiani &amp; Pengharapan</option>
              <option value="DHARMA_HINDU">Ajaran Dharma Hindu</option>
              <option value="DHARMA_BUDDHA">Dharma Buddha &amp; Kebaikan Universal</option>
              <option value="KEBAJIKAN_KHONGHUCU">Kebajikan Moral Khonghucu</option>
              <option value="UNIVERSAL_HIKMAH">Hikmah Kebijaksanaan Hidup</option>
            </optgroup>
            <optgroup label="Edukasi / Netral">
              <option value="BEBAS_SYIRIK">Bebas Syirik / Edukasi</option>
            </optgroup>
          </select>

          <span className="muted sentinel-filter-label sentinel-filter-label--offset">
            Level Risiko:
          </span>
          <select
            className="sentinel-select"
            value={selectedRiskLevel}
            onChange={(e) => setSelectedRiskLevel(e.target.value)}
          >
            <option value="ALL">Semua Level Risiko</option>
            <option value="CRITICAL_SYIRIK">Kritis (Syirik Nyata)</option>
            <option value="HIGH_SYIRIK_RISK">Tinggi (Bahaya Okultisme)</option>
            <option value="ADVISORY_SUPERSTITION">Peringatan (Khurafat/Takhayul)</option>
            <option value="DAKWAH_REFUTATION">Bantahan / Hikmah Positif</option>
            <option value="NOMINAL_CLEAR">Aman</option>
          </select>

          <span className="muted sentinel-filter-label sentinel-filter-label--offset">
            Status Tindakan:
          </span>
          <select
            className="sentinel-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING_REVIEW">Menunggu Telaah</option>
            <option value="VERIFIED_SYIRIK">Terverifikasi Melanggar</option>
            <option value="COUNTER_DAKWAH_QUEUED">Disposisi Bantahan Tauhid</option>
            <option value="REPORT_FILED">Laporan YouTube Terkirim</option>
            <option value="FALSE_POSITIVE_DISMISSED">Bukan Pelanggaran</option>
            <option value="WISDOM_QUEUED">Antrean Hikmah</option>
            <option value="AMPLIFY_RECOMMENDED">Rekomendasi Amplifikasi</option>
            <option value="SHARED_VIA_DAKWAH">Telah Diamplifikasi</option>
            <option value="ARCHIVED_REFERENCE">Arsip Referensi Luhur</option>
          </select>

          <span className="muted sentinel-filter-label sentinel-filter-label--offset">
            Urutan:
          </span>
          <select
            className="sentinel-select"
            value={selectedSortBy}
            onChange={(e) => setSelectedSortBy(e.target.value as "upload_date" | "relevance")}
          >
            <option value="upload_date">Video Terbaru (Upload Date)</option>
            <option value="relevance">Paling Relevan</option>
          </select>

          <label className="sentinel-checkbox-label">
            <input
              type="checkbox"
              checked={hideResolved}
              onChange={(e) => setHideResolved(e.target.checked)}
            />
            <span className={`sentinel-filter-state${hideResolved ? " sentinel-filter-state--active-success" : ""}`}>
              <IconText icon={<CheckIcon />}>Eliminasi yang Selesai / Dilaporkan</IconText>
            </span>
          </label>

          <label className="sentinel-checkbox-label">
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={(e) => setOnlyNew(e.target.checked)}
            />
            <span className={`sentinel-filter-state${onlyNew ? " sentinel-filter-state--active-warning" : ""}`}>
              <IconText icon={<SparkIcon />}>Hanya Temuan Baru</IconText>
            </span>
          </label>
        </div>

        <div className="sentinel-filter-group sentinel-filter-group--spread">
          <span className="muted">Menampilkan {visibleItems.length} dari {items.length} temuan di database</span>
          <div className="sentinel-view-mode-buttons">
            <button
              type="button"
              className={`sentinel-view-btn ${viewMode === "table" ? "sentinel-view-btn--active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <IconText icon={<AuditIcon />}>Tampilan Tabel</IconText>
            </button>
            <button
              type="button"
              className={`sentinel-view-btn ${viewMode === "grid" ? "sentinel-view-btn--active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <IconText icon={<ModulesIcon />}>Tampilan Kartu</IconText>
            </button>
          </div>
        </div>
      </div>

      {/* ── Monitored Items View ─────────────────────────────────────────────── */}
      {catalogError ? (
        <EmptyState
          title="Katalog YouTube Sentinel tidak tersedia"
          description={catalogError}
          action={<Button variant="secondary" onClick={() => void fetchCatalog()} disabled={loading}>{loading ? "Memuat…" : "Coba lagi"}</Button>}
        />
      ) : loading ? (
        <EmptyState title="Memuat katalog YouTube Sentinel" description="Data tersimpan sedang dimuat. Pemindaian tidak dimulai otomatis." />
      ) : visibleItems.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Katalog Sentinel kosong" : "Tidak ada konten yang cocok"}
          description={items.length === 0 ? "Tidak ada hasil tersimpan. Gunakan kontrol pemindaian manual jika Anda memiliki izin." : "Ubah kata kunci pencarian atau sesuaikan filter kategori dan risiko."}
        />
      ) : viewMode === "table" ? (
        <div className="sentinel-table-wrapper">
          <DataTable<YoutubeMonitoredItem>
            caption={
              <span>
                <IconText icon={<DocumentIcon size={16} />}><strong>Temuan YouTube Sentinel</strong> — {visibleItems.length} video terpantau di database</IconText>
              </span>
            }
            className="sentinel-table"
            columns={tableColumns}
            rows={visibleItems}
            rowKey={(item) => item.id}
            responsiveLabel="Daftar Temuan YouTube Sentinel"
            empty={
              <EmptyState
                title="Tidak ada konten yang cocok"
                description="Ubah kata kunci pencarian atau sesuaikan filter kategori dan risiko."
              />
            }
          />
        </div>
      ) : (
        <div className="sentinel-grid">
          {visibleItems.map((item) => (
            <article key={item.id} className="sentinel-card">
              <div className="sentinel-card-thumb-container">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="sentinel-card-thumb"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to placeholder color
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="sentinel-card-source-pill">{item.sourceType}</span>
                {item.durationText && (
                  <span className="sentinel-card-duration">{item.durationText}</span>
                )}
              </div>

              <div className="sentinel-card-body">
                <div className="sentinel-card-badges">
                  {item.isNew && (
                    <Badge tone="success"><IconText icon={<SparkIcon />}>BARU</IconText></Badge>
                  )}
                  <Badge tone={riskBadgeTone(item.riskLevel)}>
                    {item.riskLevel.replace(/_/g, " ")}
                  </Badge>
                  <Badge tone="info">{item.category.replace(/_/g, " ")}</Badge>
                  <Badge tone={statusTone(item.workflowStatus)}>
                    {item.workflowStatus.replace(/_/g, " ")}
                  </Badge>
                  <span className="muted sentinel-risk-score-label">
                    Skor: {item.riskScore}/100
                  </span>
                </div>

                <h4 className="sentinel-card-title">{item.title}</h4>

                <div className="sentinel-card-channel">
                  <span>{item.channelTitle}</span>
                  <span>{item.viewCountText}</span>
                </div>

                {/* Non-AI Heuristic Triggers Box */}
                {item.matchedRules.length > 0 && (
                  <div className="sentinel-rules-box">
                    <div className="sentinel-rules-title">
                      <span>Pemicu Heuristik (Tanpa AI)</span>
                      <span>Konfidensi: {Math.round(item.confidence * 100)}%</span>
                    </div>
                    {item.matchedRules.slice(0, 3).map((rule, idx) => (
                      <div key={idx} className="sentinel-rule-item">
                        • <strong>{rule.label}</strong>: &ldquo;{rule.excerpt}&rdquo;
                        <span className="sentinel-rule-weight">
                          {rule.weight > 0 ? `+${rule.weight}` : rule.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tauhid Guidance Box */}
                <div className="sentinel-tauhid-box">
                  {item.tauhidGuidance.arabicText && (
                    <div className="sentinel-arabic">{item.tauhidGuidance.arabicText}</div>
                  )}
                  <div className="sentinel-dalil-ref">
                    <IconText icon={<SourceIcon />}>{item.tauhidGuidance.dalilRef}</IconText>
                  </div>
                  <div className="sentinel-dalil-text">
                    &ldquo;{item.tauhidGuidance.translation}&rdquo;
                  </div>
                </div>

                {/* Operator Action Bar */}
                <div className="sentinel-card-actions">
                  <Button
                    variant="secondary"
                    onClick={() => setActiveModal({ type: "report", item })}
                  >
                    <IconText icon={<WarningIcon />}>Laporkan</IconText>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setActiveModal({ type: "counter_dakwah", item })}
                  >
                    <IconText icon={<CheckIcon />}>Bantahan Tauhid</IconText>
                  </Button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-button sentinel-video-link"
                  >
                    <IconText icon={<ArrowUpRightIcon />}>Buka YouTube</IconText>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Modal: Laporkan ke YouTube ───────────────────────────────────────── */}
      {activeModal?.type === "report" && activeModal.item && (
        <div className="sentinel-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="sentinel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sentinel-modal-head">
              <div>
                <span className="eyebrow">PANDUAN LAPORAN KONTEN</span>
                <h3>Laporkan Konten ke YouTube Trust &amp; Safety</h3>
              </div>
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                <IconText icon={<CloseIcon />}>Tutup</IconText>
              </Button>
            </div>

            <p className="sentinel-modal-copy">
              Salin draf pengaduan berikut untuk dilaporkan melalui fitur <strong>Report / Laporkan</strong> di antarmuka resmi YouTube:
            </p>

            <div className="sentinel-space-after-3">
              <strong className="sentinel-modal-label">Kategori Laporan yang Dipilih:</strong>
              <p className="eol-notice eol-notice--warning sentinel-modal-notice">
                {activeModal.item.reportPacket.policyReference} ({activeModal.item.reportPacket.reportedCategory})
              </p>
            </div>

            <div className="sentinel-space-after-4">
              <strong className="sentinel-modal-label">Teks Aduan Siap Salin:</strong>
              <textarea
                readOnly
                className="sentinel-search-input sentinel-modal-textarea--report"
                value={activeModal.item.reportPacket.generatedComplaint}
              />
            </div>

            <div className="button-row sentinel-actions-end">
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    activeModal.item!.reportPacket.generatedComplaint,
                  );
                  notify("Teks aduan berhasil disalin ke clipboard!");
                }}
              >
                <IconText icon={<CopyIcon />}>Salin Teks</IconText>
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  void handleAction(
                    activeModal.item!.id,
                    "REPORT_FILED",
                    "Aduan telah diserahkan melalui formulir pelaporan YouTube",
                  )
                }
              >
                Tandai Sebagai Terlaporkan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Disposisi Bantahan Dakwah Tauhid ───────────────────────────── */}
      {activeModal?.type === "counter_dakwah" && activeModal.item && (
        <div className="sentinel-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="sentinel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sentinel-modal-head">
              <div>
                <span className="eyebrow">DISPOSISI COUNTER-DAKWAH TAUHID</span>
                <h3>Bantahan Ilmiah &amp; Edukasi Syar&apos;iyyah</h3>
              </div>
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                <IconText icon={<CloseIcon />}>Tutup</IconText>
              </Button>
            </div>

            <p className="sentinel-modal-copy">
              Gunakan materi Tauhid berikut sebagai bahan respons komentar, konten sanggahan video, atau utas literasi umat:
            </p>

            <div className="sentinel-tauhid-box sentinel-space-after-4">
              {activeModal.item.tauhidGuidance.arabicText && (
                <div className="sentinel-arabic sentinel-arabic--large">
                  {activeModal.item.tauhidGuidance.arabicText}
                </div>
              )}
              <div className="sentinel-dalil-ref">
                  <IconText icon={<SourceIcon />}>{activeModal.item.tauhidGuidance.dalilRef}</IconText>
              </div>
              <div className="sentinel-dalil-text sentinel-modal-label">
                &ldquo;{activeModal.item.tauhidGuidance.translation}&rdquo;
              </div>
              <p className="sentinel-modal-principle">
                <strong>Prinsip Akidah:</strong> {activeModal.item.tauhidGuidance.theologicalPrinciple}
              </p>
            </div>

            <div className="sentinel-space-after-4">
              <strong className="sentinel-modal-label">Draf Komentar Bantahan Edukatif:</strong>
              <textarea
                readOnly
                className="sentinel-search-input sentinel-modal-textarea--counter"
                value={activeModal.item.counterDakwahBrief.suggestedCommentResponse}
              />
            </div>

            <div className="button-row sentinel-actions-end">
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    activeModal.item!.counterDakwahBrief.suggestedCommentResponse,
                  );
                  notify("Draf komentar dakwah disalin ke clipboard!");
                }}
              >
                <IconText icon={<CopyIcon />}>Salin Komentar</IconText>
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  void handleAction(
                    activeModal.item!.id,
                    "COUNTER_DAKWAH_QUEUED",
                    "Disposisi materi Tauhid ke tim media dakwah untuk dipublikasikan",
                  )
                }
              >
                Disposisikan ke Tim Dakwah
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Hikmah & Amplifikasi Kebaikan (Direction = POSITIVE) ──────── */}
      {activeModal?.type === "wisdom" && activeModal.item && (
        <div className="sentinel-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="sentinel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sentinel-modal-head">
              <div>
                <span className="eyebrow">KURASI KEBAJIKAN &amp; HIKMAH LUHUR</span>
                <h3>Amplifikasi Dakwah &amp; Nilai Kebijaksanaan</h3>
              </div>
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                <IconText icon={<CloseIcon />}>Tutup</IconText>
              </Button>
            </div>

            <p className="sentinel-modal-copy">
              Konten ini teridentifikasi sebagai pembawa nilai kebajikan luhur dari tradisi{" "}
              <strong>{activeModal.item.tradition}</strong>. Gunakan materi berikut untuk amplifikasi media atau rujukan edukasi:
            </p>

            {activeModal.item.wisdomGuidance && (
              <div className="sentinel-wisdom-box sentinel-space-after-4">
                {activeModal.item.wisdomGuidance.originalText && (
                  <div className="sentinel-arabic sentinel-arabic--large sentinel-arabic--positive sentinel-wisdom-original">
                    {activeModal.item.wisdomGuidance.originalText}
                  </div>
                )}
                <div className="sentinel-dalil-ref sentinel-dalil-ref--positive sentinel-wisdom-reference">
                  <IconText icon={<KnowledgeIcon />}>{activeModal.item.wisdomGuidance.scriptureRef}</IconText>
                </div>
                <div className="sentinel-wisdom-quote">
                  &ldquo;{activeModal.item.wisdomGuidance.translation}&rdquo;
                </div>

                <div className="sentinel-wisdom-detailed-grid">
                  <div className="sentinel-wisdom-card">
                    <h5><IconText icon={<SparkIcon />}>Nilai Luhur &amp; Intisari</IconText></h5>
                    <p className="sentinel-wisdom-core-value">
                      {activeModal.item.wisdomGuidance.coreValue}
                    </p>
                    <p className="sentinel-modal-detail">
                      Topik: <strong>{activeModal.item.wisdomGuidance.topic}</strong>
                    </p>
                  </div>
                  <div className="sentinel-wisdom-card">
                    <h5><IconText icon={<KnowledgeIcon />}>Panduan &amp; Arahan Operator</IconText></h5>
                    <p className="sentinel-wisdom-recommended-action">
                      {activeModal.item.wisdomGuidance.recommendedAction}
                    </p>
                  </div>
                </div>

                {activeModal.item.wisdomBrief && (
                  <div className="sentinel-wisdom-brief">
                    <div className="sentinel-wisdom-brief-title">
                  <IconText icon={<SparkIcon />}>Wawasan Kebijaksanaan (Wisdom Brief):</IconText>
                    </div>
                    <p className="sentinel-wisdom-brief-summary">
                      {activeModal.item.wisdomBrief.summary}
                    </p>
                    {activeModal.item.wisdomBrief.keyInsights && activeModal.item.wisdomBrief.keyInsights.length > 0 && (
                      <ul className="sentinel-wisdom-insights">
                        {activeModal.item.wisdomBrief.keyInsights.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeModal.item.amplifyPacket && (
              <div className="sentinel-space-after-4">
                <strong className="sentinel-modal-label">Draf Teks Amplifikasi &amp; Berbagi Media Sosial:</strong>
                <textarea
                  readOnly
                  className="sentinel-search-input sentinel-modal-textarea--amplify"
                  value={activeModal.item.amplifyPacket.suggestedShareCaption}
                />
                <div className="sentinel-amplify-tag-list">
                  {activeModal.item.amplifyPacket.suggestedHashtags.map((tag) => (
                    <span
                      key={tag}
                      className="sentinel-amplify-tag"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="button-row sentinel-actions-end">
              <Button
                variant="secondary"
                onClick={() => {
                  if (activeModal.item?.amplifyPacket) {
                    void navigator.clipboard.writeText(
                      `${activeModal.item.amplifyPacket.suggestedShareCaption}\n\n${activeModal.item.amplifyPacket.suggestedHashtags.join(" ")}`,
                    );
                    notify("Draf amplifikasi dan tagar disalin ke clipboard!");
                  }
                }}
              >
                <IconText icon={<CopyIcon />}>Salin Materi Amplifikasi</IconText>
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  void handleAction(
                    activeModal.item!.id,
                    "AMPLIFY_RECOMMENDED",
                    "Rekomendasikan konten untuk dipromosikan di saluran resmi Empire of the Light",
                  )
                }
              >
                <IconText icon={<SparkIcon />}>Rekomendasikan Amplifikasi</IconText>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Hubungkan / Catat Sebagai Partner (Mitra / Target Pantau) ── */}
      {activeModal?.type === "partner" && activeModal.item && (
        <div className="sentinel-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="sentinel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sentinel-modal-head">
              <div>
                <span className="eyebrow">INTEGRASI ENTITAS PARTNER &amp; KANAL</span>
                <h3>Catat Entitas Partner untuk Channel &ldquo;{activeModal.item.channelTitle}&rdquo;</h3>
              </div>
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                <IconText icon={<CloseIcon />}>Tutup</IconText>
              </Button>
            </div>

            <p className="sentinel-partner-intro">
              Hubungkan channel ini ke dalam <strong>Direktori Partner / Komunitas</strong> untuk tracking berkelanjutan, pemetaan afiliasi dakwah, atau investigasi terpusat.
            </p>

            <div className="sentinel-partner-form-grid">
              <div className="sentinel-partner-field">
                <label>Nama Entitas / Tokoh / Pemilik Channel:</label>
                <input
                  type="text"
                  value={partnerFormData.name}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
                  placeholder="Contoh: Yayasan Dakwah Sunnah / Padepokan Gaib X"
                />
              </div>

              <div className="sentinel-partner-field">
                <label>Organisasi / Perusahaan / Lembaga (Opsional):</label>
                <input
                  type="text"
                  value={partnerFormData.companyName}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, companyName: e.target.value })}
                  placeholder="Contoh: Majelis Taklim / Lembaga Spiritual"
                />
              </div>

              <div className="sentinel-partner-classification-grid">
                <div className="sentinel-partner-field">
                  <label>Tipe Partner:</label>
                  <select
                    value={partnerFormData.type}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, type: e.target.value as any })}
                  >
                    <option value="contact">Kontak Individu / Tokoh</option>
                    <option value="other">Komunitas / Padepokan / Lembaga</option>
                    <option value="invoice">Afiliasi Finansial</option>
                  </select>
                </div>

                <div className="sentinel-partner-field">
                  <label>Klasifikasi Entitas:</label>
                  <select
                    value={partnerFormData.isMitra ? "mitra" : "target"}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, isMitra: e.target.value === "mitra" })}
                  >
                    <option value="mitra">Mitra Dakwah / Rekanan Kebaikan</option>
                    <option value="target">Target Investigasi / Pantauan Syirik</option>
                  </select>
                </div>
              </div>

              <div className="sentinel-partner-field">
                <label>Catatan Investigasi / Keterangan Afiliasi:</label>
                <textarea
                  rows={3}
                  value={partnerFormData.notes}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, notes: e.target.value })}
                  placeholder="Catatan latar belakang, kontak WA, rekening, atau materi dakwah..."
                />
              </div>
            </div>

            <div className="button-row sentinel-actions-end">
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                Batal
              </Button>
              <Button
                variant="primary"
                disabled={linkingPartner || !partnerFormData.name.trim()}
                onClick={async () => {
                  setLinkingPartner(true);
                  try {
                    const res = await request<{ ok: boolean; message?: string }>(
                      API_PATHS.worldMonitorYoutubePartner,
                      {
                        method: "POST",
                        body: {
                          videoId: activeModal.item!.videoId,
                          createPartner: {
                            name: partnerFormData.name.trim(),
                            companyName: partnerFormData.companyName.trim() || undefined,
                            type: partnerFormData.type,
                            isMitra: partnerFormData.isMitra,
                            notes: partnerFormData.notes.trim() || undefined,
                          },
                        },
                      },
                    );
                    if (res.ok) {
                      notify(res.message || "Berhasil menautkan channel ke data Partner!");
                      setActiveModal(null);
                      void fetchCatalog();
                    }
                  } catch (err) {
                    notify(`Gagal menautkan Partner: ${err instanceof Error ? err.message : "Error"}`);
                  } finally {
                    setLinkingPartner(false);
                  }
                }}
              >
                {linkingPartner ? "Menyimpan Partner..." : <IconText icon={<PlusIcon />}>Simpan &amp; Tautkan ke Channel</IconText>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
