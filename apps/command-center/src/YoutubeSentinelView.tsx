import { useEffect, useMemo, useState } from "react";
import { API_PATHS, createApiClient } from "@empire/api-contract";
import type {
  SentinelDirection,
  SentinelTradition,
  YoutubeMonitoredItem,
  YoutubeRiskLevel,
  YoutubeScanSummary,
  YoutubeViolationCategory,
  YoutubeWorkflowStatus,
} from "@empire/batteries-world-monitor";
import { Badge, Button, DataTable, type DataTableColumn, EmptyState, Icon, MetricGrid, Panel, StatusIndicator } from "@empire/ui";

const api = createApiClient(import.meta.env.VITE_API_ORIGIN || "http://127.0.0.1:4000");

interface YoutubeSentinelViewProps {
  searchQuery?: string;
}

const AUTO_SCAN_QUERIES = [
  "pesugihan uang gaib",
  "kajian tauhid sunnah",
  "dukun santet online",
  "khotbah kristen kasih",
  "cek khodam gratis",
];

export function YoutubeSentinelView({ searchQuery = "" }: YoutubeSentinelViewProps) {
  const [items, setItems] = useState<YoutubeMonitoredItem[]>([]);
  const [summary, setSummary] = useState<YoutubeScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
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
    type: "report" | "counter_dakwah" | "wisdom" | "snippet";
    item?: YoutubeMonitoredItem;
    snippetCode?: string;
  } | null>(null);

  // Load initial catalog, then auto-scan if empty
  async function fetchCatalogAndAutoScan() {
    setLoading(true);
    try {
      const res = await api.request<{
        ok: boolean;
        items: YoutubeMonitoredItem[];
        summary: YoutubeScanSummary;
      }>(API_PATHS.worldMonitorYoutube);
      if (res.ok) {
        setItems(res.items);
        setSummary(res.summary);
        // Auto-scan if catalog is empty (first run / fresh server restart)
        if (res.items.length === 0) {
          setLoading(false);
          await runAutoScan();
          return;
        }
      }
    } catch {
      // In case of network error, proceed to auto-scan directly
      await runAutoScan();
      return;
    } finally {
      setLoading(false);
    }
  }

  // Run a multi-query automatic scan through default anti-syirik keywords
  async function runAutoScan() {
    setScanning(true);
    let totalScanned = 0;
    let crawlerModeUsed = "";
    for (let i = 0; i < AUTO_SCAN_QUERIES.length; i++) {
      const q = AUTO_SCAN_QUERIES[i];
      setScanProgress(`🔍 Memindai kata kunci ${i + 1}/${AUTO_SCAN_QUERIES.length}: "${q}"…`);
      try {
        const res = await api.request<{
          ok: boolean;
          scannedCount: number;
          crawlerMode?: string;
          items: YoutubeMonitoredItem[];
          summary: YoutubeScanSummary;
        }>(API_PATHS.worldMonitorYoutubeScan, {
          method: "POST",
          body: { query: q, limit: 8, forceLive: true, engine: "auto", sortBy: "upload_date" },
        });
        if (res.ok) {
          setItems(res.items);
          setSummary(res.summary);
          totalScanned += res.scannedCount;
          if (res.crawlerMode) crawlerModeUsed = res.crawlerMode;
        }
      } catch {
        // Continue to next query
      }
    }
    setScanProgress(null);
    setScanning(false);
    const modeLabel =
      crawlerModeUsed === "youtubei_innertube"
        ? "⚡ YouTube.js InnerTube"
        : crawlerModeUsed === "playwright_headless_browser"
        ? "🤖 Playwright Chromium"
        : "🌐 Live Fetch";
    notify(`✅ Auto-pemindaian selesai via ${modeLabel}: ${totalScanned} video dievaluasi dari ${AUTO_SCAN_QUERIES.length} kata kunci.`);
  }

  useEffect(() => {
    void fetchCatalogAndAutoScan();
  }, []);

  // Show temporary toast message
  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }

  // Trigger manual search/crawl scan for a specific query
  async function handleScan(targetQuery?: string) {
    const q = (targetQuery ?? queryInput).trim();
    if (!q) return;

    setScanning(true);
    setScanProgress(`🔍 Memindai: "${q}"…`);
    try {
      const res = await api.request<{
        ok: boolean;
        scannedCount: number;
        newItemsCount: number;
        crawlerMode?: "youtubei_innertube" | "playwright_headless_browser" | "http_live_fetch" | "fallback_synthetic";
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
          ? "⚡ YouTube.js (InnerTube Native Client)"
          : res.crawlerMode === "playwright_headless_browser"
          ? "🤖 Playwright Headless Browser (Chromium)"
          : res.crawlerMode === "http_live_fetch"
          ? "🌐 Live HTTP Network Fetch"
          : res.crawlerMode === "fallback_synthetic"
          ? "⚠️ Fallback Sintetik (Jaringan Dibatasi)"
          : "🔍 Heuristic";
        notify(`Pemindaian selesai via ${mode}: ${res.scannedCount} video dievaluasi.${res.diagnosticMessage ? " Info: " + res.diagnosticMessage : ""}`);
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
    try {
      const res = await api.request<{
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

  // Fetch automation crawler snippet
  async function handleOpenSnippet() {
    try {
      const res = await api.request<{ ok: boolean; script: string }>(
        `${API_PATHS.worldMonitorYoutubeSnippet}?query=${encodeURIComponent(queryInput)}`,
      );
      if (res.ok) {
        setActiveModal({ type: "snippet", snippetCode: res.script });
      }
    } catch {
      notify("Gagal memuat cuplikan skrip otomasi.");
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
            <span style={{ color: "var(--eol-color-text-muted)", fontFamily: "var(--eol-font-mono)", fontSize: 11 }}>
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
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                {item.direction === "POSITIVE" ? (
                  <Badge tone="success">✨ HIKMAH / POSITIF</Badge>
                ) : item.direction === "NEUTRAL" ? (
                  <Badge tone="neutral">ℹ️ NETRAL</Badge>
                ) : (
                  <Badge tone="danger">⚠️ ANCAMAN AKIDAH</Badge>
                )}
                {item.tradition && (
                  <span className={`sentinel-tradition-badge sentinel-tradition-badge--${item.tradition.toLowerCase()}`}>
                    {item.tradition}
                  </span>
                )}
                {item.isNew && (
                  <Badge tone="success">BARU</Badge>
                )}
                <span className="sentinel-card-source-pill" style={{ position: "static", fontSize: 9, padding: "1px 5px" }}>
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
                <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                  {item.matchedRules.slice(0, 2).map((r, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 10,
                        padding: "1px 5px",
                        background: r.weight > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                        color: r.weight > 0 ? "#f87171" : "#4ade80",
                        border: `1px solid ${r.weight > 0 ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                        borderRadius: 2,
                      }}
                    >
                      {r.weight > 0 ? `⚠️ ${r.label}` : `🛡️ ${r.label}`}
                    </span>
                  ))}
                  {item.matchedRules.length > 2 && (
                    <span style={{ fontSize: 10, color: "var(--eol-color-text-muted)", alignSelf: "center" }}>
                      +{item.matchedRules.length - 2} lagi
                    </span>
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 11, color: "var(--eol-color-text-muted)" }}>
                {item.durationText && <span>⏱️ {item.durationText}</span>}
                {item.publishedAt && <span>📅 {item.publishedAt}</span>}
                <span style={{ fontFamily: "var(--eol-font-mono)", opacity: 0.7 }}>ID: {item.videoId}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "channel",
        header: "Channel",
        cell: (item: YoutubeMonitoredItem) => (
          <div>
            <span style={{ fontWeight: 600 }}>{item.channelTitle}</span>
            <div style={{ fontSize: 11, color: "var(--eol-color-text-muted)" }}>
              {item.viewCountText}
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
              <div style={{ fontSize: 10, color: "#4ade80", marginTop: 4 }}>
                📖 {item.wisdomGuidance.scriptureRef}
              </div>
            ) : item.tauhidGuidance?.dalilRef ? (
              <div style={{ fontSize: 10, color: "var(--eol-color-text-muted)", marginTop: 4 }}>
                📜 {item.tauhidGuidance.dalilRef}
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
              style={{
                fontWeight: 700,
                fontFamily: "var(--eol-font-mono)",
                color: item.direction === "POSITIVE" ? "#10b981" : item.riskScore >= 70 ? "#ff4d4d" : item.riskScore >= 40 ? "#f59e0b" : "#10b981",
              }}
            >
              {item.direction === "POSITIVE" ? "100" : item.riskScore}
            </span>
            <span style={{ fontSize: 10, color: "var(--eol-color-text-muted)" }}>
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
            className="sentinel-select"
            style={{ fontSize: 11, padding: "3px 6px" }}
            value={item.workflowStatus}
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
          <span style={{ whiteSpace: "nowrap", fontSize: 11, color: "var(--eol-color-text-muted)" }}>
            {new Date(item.scannedAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Aksi",
        align: "end",
        cell: (item: YoutubeMonitoredItem) => (
          <div className="sentinel-table-actions" style={{ justifyContent: "flex-end" }}>
            {item.direction === "POSITIVE" ? (
              <>
                <button
                  type="button"
                  className="sentinel-table-btn"
                  title="Lihat Hikmah & Amplifikasi Kebaikan"
                  onClick={() => setActiveModal({ type: "wisdom", item })}
                  style={{ background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", borderColor: "rgba(34, 197, 94, 0.4)" }}
                >
                  ✨ Hikmah &amp; Amplify
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
                  🚩 Lapor
                </button>
                <button
                  type="button"
                  className="sentinel-table-btn"
                  title="Draf Bantahan Tauhid"
                  onClick={() => setActiveModal({ type: "counter_dakwah", item })}
                >
                  🛡️ Bantahan
                </button>
              </>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sentinel-table-btn"
              title="Buka Video di YouTube"
              style={{ textDecoration: "none" }}
            >
              ↗
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
      {toast && (
        <div role="status" className="eol-notice eol-notice--info" style={{ marginBottom: 16 }}>
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

      {/* ── Scanner Control Panel ────────────────────────────────────────────── */}
      <section className="sentinel-scanner-panel">
        <div className="sentinel-scanner-head">
          <div>
            <span className="eyebrow">AUTOMATED CRAWLER &amp; SENTINEL DISPATCHER</span>
            <h3>Pemindai Konten YouTube (Algoritma Heuristik Tanpa AI)</h3>
          </div>
          <div className="button-row">
            <Button variant="secondary" onClick={handleOpenSnippet}>
              <Icon name="document" size={14} /> Skrip Playwright / Crawler
            </Button>
            <Button variant="secondary" onClick={() => exportLedger("markdown")}>
              <Icon name="download" size={14} /> Ekspor Markdown
            </Button>
            <Button variant="secondary" onClick={() => exportLedger("json")}>
              <Icon name="copy" size={14} /> Unduh JSON
            </Button>
          </div>
        </div>

        <div className="sentinel-search-bar">
          <input
            type="text"
            className="sentinel-search-input"
            placeholder="Ketik kata kunci YouTube (contoh: pesugihan uang gaib, cek khodam live, jimat kebal)..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleScan()}
          />
          <Button variant="primary" onClick={() => void handleScan()} disabled={scanning}>
            {scanning ? "Sedang Memindai..." : "⚡ Jalankan Pemindaian Otomatis"}
          </Button>
        </div>

        <div className="sentinel-browser-status-bar">
          <div className="sentinel-engine-controls">
            <span className="muted" style={{ fontWeight: 700 }}>Engine Penelusuran:</span>
            <div className="sentinel-engine-buttons">
              <button
                type="button"
                className={`sentinel-engine-btn ${selectedEngine === "auto" ? "sentinel-engine-btn--active" : ""}`}
                onClick={() => setSelectedEngine("auto")}
              >
                ⚡ Auto (YouTube.js + Playwright)
              </button>
              <button
                type="button"
                className={`sentinel-engine-btn ${selectedEngine === "innertube" ? "sentinel-engine-btn--active" : ""}`}
                onClick={() => setSelectedEngine("innertube")}
              >
                🚀 YouTube.js (InnerTube Native - Sangat Cepat)
              </button>
              <button
                type="button"
                className={`sentinel-engine-btn ${selectedEngine === "playwright" ? "sentinel-engine-btn--active" : ""}`}
                onClick={() => setSelectedEngine("playwright")}
              >
                🤖 Playwright (Chromium Headless Browser)
              </button>
            </div>
          </div>
          <small className="sentinel-engine-note">
            {selectedEngine === "innertube" && "Menggunakan library LuanRT/YouTube.js untuk mengambil metadata langsung via InnerTube tanpa perlu membuka browser (sangat cepat & hemat memori)."}
            {selectedEngine === "playwright" && "Membuka browser Chromium headless nyata di latar belakang dan merender halaman pencarian YouTube."}
            {selectedEngine === "auto" && "Memprioritaskan YouTube.js InnerTube yang cepat, lalu fallback otomatis ke browser Playwright jika diperlukan."}
          </small>
        </div>

        {scanning && (
          <div className="sentinel-scanning-banner">
            <div className="sentinel-spinner" />
            <div>
              <strong>
                {scanProgress ?? "⚡ Menginisialisasi crawler YouTube..."}
              </strong>
              <p>
                {scanProgress
                  ? "Matriks evaluasi heuristik Tauhid berjalan otomatis pada setiap hasil..."
                  : "Menyiapkan koneksi ke YouTube InnerTube API..."}
              </p>
            </div>
          </div>
        )}

        <div className="sentinel-presets">
          <span className="muted" style={{ fontWeight: 700, marginRight: 4 }}>
            Preset Cepat:
          </span>
          {[
            { label: "💰 Pesugihan Uang Gaib", query: "pesugihan uang gaib tanpa tumbal" },
            { label: "🔮 Cek Khodam & Panggil Jin", query: "cek khodam live pengisian khodam" },
            { label: "🗡️ Jimat Kebal & Mustika", query: "jimat kebal bacok keris pusaka bertuah" },
            { label: "🃏 Ramalan Tarot & Zodiak", query: "baca kartu tarot ramalan nasib 2026" },
            { label: "⚡ Santet & Pelet Jarak Jauh", query: "santet jarak jauh pelet semar mesem" },
            { label: "🏛️ Ngalap Berkah Makam", query: "ngalap berkah makam keramat minta nomor" },
            { label: "🕌 Bantahan Ustadz Sunnah", query: "bahaya syirik ustadz membongkar trik dukun" },
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: "100%", marginBottom: 10 }}>
          <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>
            Arah Sentinel:
          </span>
          <div className="sentinel-direction-switcher">
            <button
              type="button"
              className={`sentinel-direction-tab ${selectedDirection === "ALL" ? "sentinel-direction-tab--active-all" : ""}`}
              onClick={() => setSelectedDirection("ALL")}
            >
              🌐 Semua Arah ({items.length})
            </button>
            <button
              type="button"
              className={`sentinel-direction-tab ${selectedDirection === "NEGATIVE" ? "sentinel-direction-tab--active-neg" : ""}`}
              onClick={() => setSelectedDirection("NEGATIVE")}
            >
              ⚠️ Kesesatan &amp; Khurafat ({items.filter((i) => i.direction === "NEGATIVE").length})
            </button>
            <button
              type="button"
              className={`sentinel-direction-tab ${selectedDirection === "POSITIVE" ? "sentinel-direction-tab--active-pos" : ""}`}
              onClick={() => setSelectedDirection("POSITIVE")}
            >
              ✨ Kebajikan &amp; Hikmah ({items.filter((i) => i.direction === "POSITIVE").length})
            </button>
          </div>

          <span className="muted" style={{ fontWeight: 700, marginLeft: "auto", fontSize: 13 }}>
            Tradisi Agama:
          </span>
          <select
            className="sentinel-select"
            value={selectedTradition}
            onChange={(e) => setSelectedTradition(e.target.value as SentinelTradition | "ALL")}
            style={{ minWidth: 160 }}
          >
            <option value="ALL">Semua Tradisi</option>
            <option value="ISLAM">🕌 Islam</option>
            <option value="KRISTEN">✝️ Kristen</option>
            <option value="KATOLIK">⛪ Katolik</option>
            <option value="HINDU">🕉️ Hindu</option>
            <option value="BUDDHA">☸️ Buddha</option>
            <option value="KHONGHUCU">☯️ Khonghucu</option>
            <option value="UNIVERSAL">🌟 Universal</option>
          </select>
        </div>

        <div className="sentinel-filter-group">
          <span className="muted" style={{ fontWeight: 700 }}>
            Kategori:
          </span>
          <select
            className="sentinel-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">Semua Kategori ({items.length})</option>
            <optgroup label="⚠️ Arah Negatif (Kesesatan)">
              <option value="SIHIR_PELET">Sihir, Santet &amp; Pelet</option>
              <option value="DUKUN_RAMALAN">Dukun &amp; Ramalan Tarot</option>
              <option value="PESUGIHAN_TUMBAL">Pesugihan &amp; Tumbal</option>
              <option value="KHODAM_JIN">Khodam &amp; Jin</option>
              <option value="BENDA_KERAMAT_JIMAT">Benda Keramat &amp; Jimat</option>
              <option value="KUBURAN_SESAJEN">Makam &amp; Sesajen</option>
              <option value="UMUM_SYIRIK">Kesyirikan Umum</option>
            </optgroup>
            <optgroup label="✨ Arah Positif (Kebajikan & Hikmah)">
              <option value="TAUHID_DAKWAH">Dakwah Pemurnian Tauhid</option>
              <option value="AKHLAK_KARIMAH">Pendidikan Akhlak Karimah</option>
              <option value="KASIH_KRISTIANI">Kasih Kristiani &amp; Pengharapan</option>
              <option value="DHARMA_HINDU">Ajaran Dharma Hindu</option>
              <option value="DHARMA_BUDDHA">Dharma Buddha &amp; Kebaikan Universal</option>
              <option value="KEBAJIKAN_KHONGHUCU">Kebajikan Moral Khonghucu</option>
              <option value="UNIVERSAL_HIKMAH">Hikmah Kebijaksanaan Hidup</option>
            </optgroup>
            <optgroup label="ℹ️ Edukasi / Netral">
              <option value="BEBAS_SYIRIK">Bebas Syirik / Edukasi</option>
            </optgroup>
          </select>

          <span className="muted" style={{ fontWeight: 700, marginLeft: 8 }}>
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

          <span className="muted" style={{ fontWeight: 700, marginLeft: 8 }}>
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

          <span className="muted" style={{ fontWeight: 700, marginLeft: 8 }}>
            Urutan:
          </span>
          <select
            className="sentinel-select"
            value={selectedSortBy}
            onChange={(e) => setSelectedSortBy(e.target.value as "upload_date" | "relevance")}
          >
            <option value="upload_date">📅 Video Terbaru (Upload Date)</option>
            <option value="relevance">🎯 Paling Relevan</option>
          </select>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 12, cursor: "pointer", fontSize: "0.85rem", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={hideResolved}
              onChange={(e) => setHideResolved(e.target.checked)}
            />
            <span style={{ color: hideResolved ? "var(--eol-manga-status-success-strong)" : "inherit", fontWeight: hideResolved ? 700 : 400 }}>
              🗑️ Eliminasi yang Selesai / Dilaporkan
            </span>
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 12, cursor: "pointer", fontSize: "0.85rem", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={(e) => setOnlyNew(e.target.checked)}
            />
            <span style={{ color: onlyNew ? "var(--eol-manga-status-warning-strong)" : "inherit", fontWeight: onlyNew ? 700 : 400 }}>
              ✨ Hanya Temuan Baru
            </span>
          </label>
        </div>

        <div className="sentinel-filter-group" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 4 }}>
          <span className="muted">Menampilkan {visibleItems.length} dari {items.length} temuan di database</span>
          <div className="sentinel-view-mode-buttons">
            <button
              type="button"
              className={`sentinel-view-btn ${viewMode === "table" ? "sentinel-view-btn--active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              📋 Tampilan Tabel
            </button>
            <button
              type="button"
              className={`sentinel-view-btn ${viewMode === "grid" ? "sentinel-view-btn--active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              🎴 Tampilan Kartu
            </button>
          </div>
        </div>
      </div>

      {/* ── Monitored Items View ─────────────────────────────────────────────── */}
      {visibleItems.length === 0 ? (
        <EmptyState
          title="Tidak ada konten yang cocok"
          description="Ubah kata kunci pencarian atau sesuaikan filter kategori dan risiko."
        />
      ) : viewMode === "table" ? (
        <DataTable<YoutubeMonitoredItem>
          caption={
            <span>
              📋 <strong>Temuan YouTube Sentinel</strong> — {visibleItems.length} video terpantau di database
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
                    <Badge tone="success">✨ BARU</Badge>
                  )}
                  <Badge tone={riskBadgeTone(item.riskLevel)}>
                    {item.riskLevel.replace(/_/g, " ")}
                  </Badge>
                  <Badge tone="info">{item.category.replace(/_/g, " ")}</Badge>
                  <Badge tone={statusTone(item.workflowStatus)}>
                    {item.workflowStatus.replace(/_/g, " ")}
                  </Badge>
                  <span className="muted" style={{ marginLeft: "auto", fontWeight: 700 }}>
                    Skor: {item.riskScore}/100
                  </span>
                </div>

                <h4 className="sentinel-card-title">{item.title}</h4>

                <div className="sentinel-card-channel">
                  <span>📺 {item.channelTitle}</span>
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
                    📜 {item.tauhidGuidance.dalilRef}
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
                    🚩 Laporkan
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setActiveModal({ type: "counter_dakwah", item })}
                  >
                    🛡️ Bantahan Tauhid
                  </Button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-button"
                    style={{ fontSize: 11, marginLeft: "auto" }}
                  >
                    Buka YouTube ↗
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
                Tutup ✕
              </Button>
            </div>

            <p style={{ fontSize: 12, lineHeight: 1.6 }}>
              Salin draf pengaduan berikut untuk dilaporkan melalui fitur <strong>Report / Laporkan</strong> di antarmuka resmi YouTube:
            </p>

            <div style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 12 }}>Kategori Laporan yang Dipilih:</strong>
              <p className="eol-notice eol-notice--warning" style={{ margin: "6px 0", fontSize: 12 }}>
                {activeModal.item.reportPacket.policyReference} ({activeModal.item.reportPacket.reportedCategory})
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong style={{ fontSize: 12 }}>Teks Aduan Siap Salin:</strong>
              <textarea
                readOnly
                className="sentinel-search-input"
                style={{ width: "100%", height: 110, marginTop: 6, fontSize: 11 }}
                value={activeModal.item.reportPacket.generatedComplaint}
              />
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    activeModal.item!.reportPacket.generatedComplaint,
                  );
                  notify("Teks aduan berhasil disalin ke clipboard!");
                }}
              >
                📋 Salin Teks
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
                Tutup ✕
              </Button>
            </div>

            <p style={{ fontSize: 12, lineHeight: 1.6 }}>
              Gunakan materi Tauhid berikut sebagai bahan respons komentar, konten sanggahan video, atau utas literasi umat:
            </p>

            <div className="sentinel-tauhid-box" style={{ marginBottom: 16 }}>
              {activeModal.item.tauhidGuidance.arabicText && (
                <div className="sentinel-arabic" style={{ fontSize: 18 }}>
                  {activeModal.item.tauhidGuidance.arabicText}
                </div>
              )}
              <div className="sentinel-dalil-ref">
                📜 {activeModal.item.tauhidGuidance.dalilRef}
              </div>
              <div className="sentinel-dalil-text" style={{ fontSize: 12 }}>
                &ldquo;{activeModal.item.tauhidGuidance.translation}&rdquo;
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--eol-color-text)" }}>
                <strong>Prinsip Akidah:</strong> {activeModal.item.tauhidGuidance.theologicalPrinciple}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong style={{ fontSize: 12 }}>Draf Komentar Bantahan Edukatif:</strong>
              <textarea
                readOnly
                className="sentinel-search-input"
                style={{ width: "100%", height: 95, marginTop: 6, fontSize: 11 }}
                value={activeModal.item.counterDakwahBrief.suggestedCommentResponse}
              />
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    activeModal.item!.counterDakwahBrief.suggestedCommentResponse,
                  );
                  notify("Draf komentar dakwah disalin ke clipboard!");
                }}
              >
                📋 Salin Komentar
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
                Tutup ✕
              </Button>
            </div>

            <p style={{ fontSize: 12, lineHeight: 1.6 }}>
              Konten ini teridentifikasi sebagai pembawa nilai kebajikan luhur dari tradisi{" "}
              <strong>{activeModal.item.tradition}</strong>. Gunakan materi berikut untuk amplifikasi media atau rujukan edukasi:
            </p>

            {activeModal.item.wisdomGuidance && (
              <div className="sentinel-wisdom-box" style={{ marginBottom: 16 }}>
                {activeModal.item.wisdomGuidance.originalText && (
                  <div className="sentinel-arabic" style={{ fontSize: 18, color: "#4ade80" }}>
                    {activeModal.item.wisdomGuidance.originalText}
                  </div>
                )}
                <div className="sentinel-dalil-ref" style={{ color: "#86efac" }}>
                  📖 {activeModal.item.wisdomGuidance.scriptureRef}
                </div>
                <div className="sentinel-wisdom-quote">
                  &ldquo;{activeModal.item.wisdomGuidance.translation}&rdquo;
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--eol-color-text)" }}>
                  <strong>Nilai Inti:</strong> {activeModal.item.wisdomGuidance.coreValue}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--eol-color-text-muted)" }}>
                  <strong>Saran Operator:</strong> {activeModal.item.wisdomGuidance.recommendedAction}
                </p>
              </div>
            )}

            {activeModal.item.amplifyPacket && (
              <div style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 12 }}>Draf Teks Amplifikasi &amp; Berbagi:</strong>
                <textarea
                  readOnly
                  className="sentinel-search-input"
                  style={{ width: "100%", height: 85, marginTop: 6, fontSize: 11 }}
                  value={activeModal.item.amplifyPacket.suggestedShareCaption}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {activeModal.item.amplifyPacket.suggestedHashtags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "#60a5fa",
                        borderRadius: 3,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
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
                📋 Salin Materi Amplifikasi
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
                ✨ Rekomendasikan Amplifikasi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Browser Automation Script Snippet ─────────────────────────── */}
      {activeModal?.type === "snippet" && (
        <div className="sentinel-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="sentinel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sentinel-modal-head">
              <div>
                <span className="eyebrow">HEADLESS BROWSER CRAWLER CODE</span>
                <h3>Skrip Browser Automation (Playwright / Chromium)</h3>
              </div>
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                Tutup ✕
              </Button>
            </div>

            <p style={{ fontSize: 12, lineHeight: 1.6 }}>
              Skrip otomasi headless ini dapat dijalankan langsung di terminal lokal atau server background untuk merayapi hasil pencarian YouTube dan menyuntikkannya otomatis ke API World Monitor tanpa AI:
            </p>

            <pre className="sentinel-code-snippet">
              <code>{activeModal.snippetCode}</code>
            </pre>

            <div className="button-row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
              <Button
                variant="primary"
                onClick={() => {
                  void navigator.clipboard.writeText(activeModal.snippetCode || "");
                  notify("Skrip browser automation disalin ke clipboard!");
                }}
              >
                📋 Salin Skrip Otomasi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
