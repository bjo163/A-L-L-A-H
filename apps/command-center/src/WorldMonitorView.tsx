import { useState } from "react";
import type { WorldMonitoringSnapshot } from "@empire/batteries-world-monitor";
import { Badge, Button, EmptyState, Icon, MangaEffect, MangaTelemetryHero, MetricGrid, Panel, RegionSummary, StatusIndicator, TextField } from "@empire/ui";
import { WorldGlobeMap } from "./WorldGlobeMap";
import { YoutubeSentinelView } from "./YoutubeSentinelView";

interface WorldMonitorViewProps {
  snapshot: WorldMonitoringSnapshot;
  search: string;
  onRefresh: () => void;
  refreshError?: string;
  /** Countdown in seconds until next auto-refresh. undefined = auto-refresh not running */
  nextRefreshIn?: number;
  notificationPermission: NotificationPermission | "unsupported";
  onEnableNotifications: () => void;
}

const monitoredLocations = [
  ["London", "london"], ["New York", "new-york"], ["Tokyo", "tokyo"], ["Nairobi", "nairobi"],
  ["São Paulo", "sao-paulo"], ["Delhi", "delhi"], ["Sydney", "sydney"], ["Reykjavík", "reykjavik"],
] as const;

type WorldSubTab = "systems" | "youtube";

export function WorldMonitorView({ snapshot, search, onRefresh, nextRefreshIn, refreshError, notificationPermission, onEnableNotifications }: WorldMonitorViewProps) {
  const [subTab, setSubTab] = useState<WorldSubTab>("systems");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>(undefined);

  const selectedRegion = selectedRegionId
    ? snapshot.regions.find((r) => r.id === selectedRegionId)
    : undefined;

  const visibleRegions = snapshot.regions.filter((r) =>
    `${r.name} ${r.code} ${r.status}`.toLowerCase().includes(search.toLowerCase())
  );

  const visibleSensors = snapshot.dnaSensors.filter((s) =>
    `${s.transliteration} ${s.code} ${s.capability} ${s.operationalTarget}`.toLowerCase().includes(search.toLowerCase())
  );

  const visibleFeeds = snapshot.telemetryFeeds.filter((feed) => {
    const matchesCategory = selectedCategory === "ALL" || feed.category === selectedCategory;
    const matchesSearch = `${feed.title} ${feed.detail} ${feed.regionCode} ${feed.source} ${feed.associatedDna}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalHeliogrid = snapshot.regions.some((region) => region.heliogridLoadMw !== null)
    ? `${snapshot.regions.reduce((acc, region) => acc + (region.heliogridLoadMw ?? 0), 0).toFixed(1)} MW`
    : "Unavailable";
  const metric = (value: number | null, suffix = "") => value === null ? "Unavailable" : `${value}${suffix}`;
  const regionTone = (status: string) => status === "nominal" ? "success" as const : status === "advisory" ? "warning" as const : status === "unavailable" ? "neutral" as const : "danger" as const;
  const systemState = snapshot.status === "operational" ? "ok" : snapshot.status === "unavailable" ? "unavailable" : "degraded";

  return (
    <>
      <div className="world-subtab-bar" role="tablist" aria-label="World Monitor views">
        <button type="button" role="tab" aria-selected={subTab === "systems"} className={`world-subtab-btn${subTab === "systems" ? " world-subtab-btn--active" : ""}`} onClick={() => setSubTab("systems")}>
          <Icon name="globe" size={14} /> World Systems
        </button>
        <button type="button" role="tab" aria-selected={subTab === "youtube"} className={`world-subtab-btn world-subtab-btn--sentinel${subTab === "youtube" ? " world-subtab-btn--active" : ""}`} onClick={() => setSubTab("youtube")}>
          <Icon name="activity" size={14} /> YouTube Sentinel <span className="world-subtab-badge">TAUHID</span>
        </button>
      </div>
      {subTab === "youtube" ? <YoutubeSentinelView searchQuery={search} /> : <>
      <MangaTelemetryHero
        eyebrow={<>SERVICE STATUS <StatusIndicator tone={systemState === "ok" ? "success" : systemState === "unavailable" ? "neutral" : "warning"}>{snapshot.globalAlertLevel === "unknown" ? "STATUS UNKNOWN" : `ALERT LEVEL ${snapshot.globalAlertLevel.toUpperCase()}`}</StatusIndicator></>}
        title="System and regional monitoring"
        description="API and database health are checked live. Regional infrastructure, energy, and DNA sensor sources are not connected yet."
        metadata={<><span><Icon name="clock" size={13}/> Updated {new Date(snapshot.timestamp).toLocaleTimeString()}</span><span><Icon name="globe" size={13}/> {snapshot.regions.length} Reference Regions</span><span><Icon name="spark" size={13}/> {totalHeliogrid} Heliogrid Load</span><span><Icon name="command" size={13}/> {snapshot.dnaSensors.length} DNA Mappings</span></>}
        pulse={snapshot.apiUptimeSeconds === null ? "N/A" : `${snapshot.apiUptimeSeconds}s`}
        sfx="RADAR!"
      />
      {refreshError && <p role="alert" className="eol-notice eol-notice--warning">Refresh failed: {refreshError} Showing the last successful snapshot.</p>}
{notificationPermission === "default" && <div className="world-notification-prompt"><span>Enable browser notifications for new World Monitor alerts.</span><Button variant="secondary" onClick={onEnableNotifications}>Enable notifications</Button></div>}

      {/* ── Globe Map ─────────────────────────────────────────────────────────── */}
      <section className="world-map-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">GEOSPATIAL OVERLAY</span>
            <h2>Regional Reference Locations</h2>
          </div>
          <div className="button-row world-map-actions">
            {nextRefreshIn !== undefined && (
              <span className="muted world-map-countdown">
                <Icon name="refresh" size={12} /> Auto in {nextRefreshIn}s
              </span>
            )}
            <Button variant="secondary" onClick={onRefresh}><Icon name="refresh" size={15}/>Refresh Pulse</Button>
          </div>
        </div>

        <WorldGlobeMap
          regions={snapshot.regions}
          selectedRegionId={selectedRegionId}
          onSelectRegion={(id) => setSelectedRegionId((prev) => (prev === id ? undefined : id))}
          mapLayers={snapshot.mapLayers}
        />

        {/* Selected region detail card */}
        {selectedRegion && (
          <RegionSummary
            name={selectedRegion.name}
            eyebrow={`${selectedRegion.code} · ${selectedRegion.lat.toFixed(2)}°, ${selectedRegion.lng.toFixed(2)}°`}
            status={selectedRegion.status.toUpperCase()}
            tone={regionTone(selectedRegion.status)}
            metrics={[
              { label: "Latency", value: metric(selectedRegion.latencyMs, " ms") },
              { label: "Uptime", value: metric(selectedRegion.uptimePercentage, "%") },
              { label: "Nodes", value: metric(selectedRegion.nodeCount) },
              { label: "Sensors", value: metric(selectedRegion.activeSensors) },
              { label: "Heliogrid", value: metric(selectedRegion.heliogridLoadMw, " MW") },
            ]}
            onClear={() => setSelectedRegionId(undefined)}
            clearLabel="Clear selection"
          />
        )}
      </section>

      {/* ── Global Metrics ───────────────────────────────────────────────────── */}
      <section>
        <div className="section-head">
          <h2>Global System Metrics</h2>
        </div>
        <MetricGrid columns={4} density="compact" items={[
          { label: "API / database status", value: snapshot.status.toUpperCase(), tone: systemState === "ok" ? "success" : systemState === "unavailable" ? "neutral" : "warning" },
          { label: "Verified regional nodes", value: snapshot.totalMonitoredNodes },
          { label: "Measured global latency", value: metric(snapshot.averageGlobalLatencyMs, " ms") },
          { label: "Heliogrid load", value: totalHeliogrid },
        ]} />
      </section>

      {/* ── Regional Nodes ───────────────────────────────────────────────────── */}
      <section>
        <div className="section-head">
          <div>
            <span className="eyebrow">DISTRIBUTED TOPOLOGY</span>
            <h2>Regional Reference Locations <span className="count-chip">{visibleRegions.length}</span></h2>
          </div>
          <span className="muted">Reference locations; live regional data unavailable</span>
        </div>
        <div className="agent-grid">
          {visibleRegions.map((region) => (
            <button
              key={region.id}
              className={`agent-card region-node-card${selectedRegionId === region.id ? " region-node-card--selected" : ""}`}
              onClick={() => setSelectedRegionId((prev) => (prev === region.id ? undefined : region.id))}
              aria-pressed={selectedRegionId === region.id}
            >
              <div className="agent-head">
                <span className="agent-symbol"><Icon name="globe" size={18}/></span>
                <Badge tone={regionTone(region.status)}>
                  {region.status.toUpperCase()}
                </Badge>
              </div>
              <h3>{region.name}</h3>
              <p className="agent-code">{region.code} · {region.lat.toFixed(2)}°, {region.lng.toFixed(2)}°</p>
              <div className="region-node-metrics">
                <div><span className="muted">Latency:</span> <strong>{metric(region.latencyMs, " ms")}</strong></div>
                <div><span className="muted">Uptime:</span> <strong>{metric(region.uptimePercentage, "%")}</strong></div>
                <div><span className="muted">Nodes:</span> <strong>{metric(region.nodeCount)}</strong></div>
                <div><span className="muted">Grid Load:</span> <strong>{metric(region.heliogridLoadMw, " MW")}</strong></div>
              </div>
            </button>
          ))}
        </div>
        {visibleRegions.length === 0 && (
          <EmptyState title="No regions match" description="Try a different search query." />
        )}
      </section>

      {/* ── DNA Sensor Matrix ────────────────────────────────────────────────── */}
      <section>
        <div className="section-head">
          <div>
            <span className="eyebrow">CATALOG MAPPINGS</span>
            <h2>Batteries DNA Catalog Mappings <span className="count-chip">{visibleSensors.length}</span></h2>
          </div>
          <Badge tone="info">Source: @empire/batteries-dna</Badge>
        </div>
        <div className="knowledge-grid">
          {visibleSensors.map((sensor) => (
            <MangaEffect as="details" interactive className="knowledge-card" key={sensor.dnaId}>
              <summary>
                <span className="knowledge-arabic">{sensor.arabic || <Icon name="spark" size={18}/>}</span>
                <span className="knowledge-title">
                  <strong>{sensor.transliteration}</strong>
                  <small>{sensor.dnaId} · {sensor.capability}</small>
                </span>
                <Badge tone={sensor.currentStatus === "healthy" ? "success" : "neutral"}>
                  {sensor.currentStatus.toUpperCase()}
                </Badge>
              </summary>
              <div className="knowledge-detail">
                <p>
                  <strong>Planned Monitoring Use</strong>
                  <br />
                  {sensor.operationalTarget}
                </p>
                <p>
                  <strong>Observed Ingest Events:</strong> {metric(sensor.observedEventsCount, " frames")}
                </p>
                <small>
                  Limitations: {sensor.limitations[0]} {sensor.limitations[1]}
                </small>
              </div>
            </MangaEffect>
          ))}
        </div>
        {visibleSensors.length === 0 && (
          <EmptyState title="No DNA sensors match" description="Try searching by name or capability." />
        )}
      </section>

      {/* ── Live Feed ────────────────────────────────────────────────────────── */}
      <section>
        <div className="section-head">
          <div>
            <span className="eyebrow">SITUATIONAL INTELLIGENCE</span>
            <h2>Telemetry &amp; Event Feed</h2>
          </div>
          {snapshot.telemetryFeeds.length > 0 && (
            <div className="button-row">
              {["ALL", "physical", "heliogrid", "cyber", "environmental"].map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "primary" : "secondary"}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.toUpperCase()}
                </Button>
              ))}
            </div>
          )}
        </div>
        {visibleFeeds.length ? (
          <div className="event-list event-list-large">
            {visibleFeeds.map((feed) => (
              <article key={feed.id} className="event-row event-row-expanded">
                <span className="event-marker"><Icon name="activity" size={16}/></span>
                <div className="event-main">
                  <div className="event-title">
                    <strong>{feed.title}</strong>
                    <Badge tone={feed.severity === "critical" ? "danger" : feed.severity === "warning" ? "warning" : "info"}>
                      {feed.severity.toUpperCase()}
                    </Badge>
                    <Badge tone="neutral">{feed.regionCode}</Badge>
                    <Badge tone="info">{feed.associatedDna}</Badge>
                  </div>
                  <p className="world-event-detail">
                    {feed.detail}
                  </p>
                  <small>
                    Source: {feed.source} · Category: {feed.category}
                  </small>
                </div>
                <time dateTime={feed.timestamp}>{new Date(feed.timestamp).toLocaleTimeString()}</time>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No verified telemetry events" description="No live event source is connected. Audit records are not exposed through this public endpoint." />
        )}
      </section>
      </>}
    </>
  );
}
