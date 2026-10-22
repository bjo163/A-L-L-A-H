import { useState } from "react";
import type { WorldMonitoringSnapshot } from "@empire/batteries-world-monitor";
import { Badge, Button, EmptyState, Icon, MangaEffect, MangaTelemetryHero, Panel, TextField } from "@empire/ui";
import { WorldGlobeMap } from "./WorldGlobeMap";

interface WorldMonitorViewProps {
  snapshot: WorldMonitoringSnapshot;
  search: string;
  onRefresh: () => void;
  /** Countdown in seconds until next auto-refresh. undefined = auto-refresh not running */
  nextRefreshIn?: number;
}

export function WorldMonitorView({ snapshot, search, onRefresh, nextRefreshIn }: WorldMonitorViewProps) {
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

  const totalHeliogrid = snapshot.regions.reduce((acc, r) => acc + r.heliogridLoadMw, 0).toFixed(1);

  return (
    <>
      <MangaTelemetryHero
        eyebrow={<>PLANETARY PULSE <span className="live-pill" data-state={snapshot.status === "operational" ? "ok" : "degraded"}>● ALERT LEVEL {snapshot.globalAlertLevel.toUpperCase()}</span></>}
        title={`${snapshot.regions.length} regions in motion`}
        description="Live node health, latency, and energy signals—combined from bounded Batteries DNA telemetry."
        metadata={<><span><Icon name="clock" size={13}/> Updated {new Date(snapshot.timestamp).toLocaleTimeString()}</span><span><Icon name="globe" size={13}/> {snapshot.regions.length} Monitored Regions</span><span><Icon name="spark" size={13}/> {totalHeliogrid} MW Heliogrid Load</span><span><Icon name="command" size={13}/> {snapshot.dnaSensors.length} DNA Sensor Mappings</span></>}
        pulse={`${snapshot.averageGlobalLatencyMs}ms`}
        sfx="RADAR!"
      />

      {/* ── Globe Map ─────────────────────────────────────────────────────────── */}
      <section className="world-map-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">GEOSPATIAL OVERLAY</span>
            <h2>Global Node Map</h2>
          </div>
          <div className="button-row" style={{ alignItems: "center", gap: 12 }}>
            {nextRefreshIn !== undefined && (
              <span className="muted" style={{ fontSize: 11, fontFamily: "var(--eol-font-mono)" }}>
                Auto ↻ in {nextRefreshIn}s
              </span>
            )}
            <Button variant="secondary" onClick={onRefresh}><Icon name="refresh" size={15}/>Refresh Pulse</Button>
          </div>
        </div>

        <WorldGlobeMap
          regions={snapshot.regions}
          selectedRegionId={selectedRegionId}
          onSelectRegion={(id) => setSelectedRegionId((prev) => (prev === id ? undefined : id))}
        />

        {/* Selected region detail card */}
        {selectedRegion && (
          <Panel manga as="div" className="region-detail-card">
            <div className="region-detail-head">
              <div>
                <span className="eyebrow">{selectedRegion.code} · {selectedRegion.lat.toFixed(2)}°, {selectedRegion.lng.toFixed(2)}°</span>
                <h3>{selectedRegion.name}</h3>
              </div>
              <Badge tone={selectedRegion.status === "nominal" ? "success" : selectedRegion.status === "advisory" ? "warning" : "danger"}>
                {selectedRegion.status.toUpperCase()}
              </Badge>
            </div>
            <div className="metrics compact-metrics">
              <Panel manga as="article"><small>LATENCY</small><strong>{selectedRegion.latencyMs} ms</strong></Panel>
              <Panel manga as="article"><small>UPTIME</small><strong>{selectedRegion.uptimePercentage}%</strong></Panel>
              <Panel manga as="article"><small>NODES</small><strong>{selectedRegion.nodeCount}</strong></Panel>
              <Panel manga as="article"><small>SENSORS</small><strong>{selectedRegion.activeSensors}</strong></Panel>
              <Panel manga as="article"><small>HELIOGRID</small><strong>{selectedRegion.heliogridLoadMw} MW</strong></Panel>
            </div>
            <button className="text-button" onClick={() => setSelectedRegionId(undefined)} style={{ marginTop: 8 }}>
              <Icon name="close" size={14}/>Clear selection
            </button>
          </Panel>
        )}
      </section>

      {/* ── Global Metrics ───────────────────────────────────────────────────── */}
      <section>
        <div className="section-head">
          <h2>Global Telemetry Metrics</h2>
        </div>
        <div className="metrics world-metrics">
          <Panel manga as="article">
            <small>GLOBAL STATUS</small>
            <strong data-state={snapshot.status === "operational" ? "ok" : "degraded"}>
              {snapshot.status.toUpperCase()}
            </strong>
          </Panel>
          <Panel manga as="article">
            <small>TOTAL ACTIVE NODES</small>
            <strong>{snapshot.totalMonitoredNodes}</strong>
          </Panel>
          <Panel manga as="article">
            <small>AVG GLOBAL LATENCY</small>
            <strong>{snapshot.averageGlobalLatencyMs} ms</strong>
          </Panel>
          <Panel manga as="article">
            <small>HELIOGRID CAPACITY</small>
            <strong>{totalHeliogrid} MW</strong>
          </Panel>
        </div>
      </section>

      {/* ── Regional Nodes ───────────────────────────────────────────────────── */}
      <section>
        <div className="section-head">
          <div>
            <span className="eyebrow">DISTRIBUTED TOPOLOGY</span>
            <h2>Regional Observability Nodes <span className="count-chip">{visibleRegions.length}</span></h2>
          </div>
          <span className="muted">8 Major Global Hubs</span>
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
                <Badge tone={region.status === "nominal" ? "success" : region.status === "advisory" ? "warning" : "danger"}>
                  {region.status.toUpperCase()}
                </Badge>
              </div>
              <h3>{region.name}</h3>
              <p className="agent-code">{region.code} · {region.lat.toFixed(2)}°, {region.lng.toFixed(2)}°</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "12px 0", fontSize: "11px" }}>
                <div><span className="muted">Latency:</span> <strong>{region.latencyMs} ms</strong></div>
                <div><span className="muted">Uptime:</span> <strong>{region.uptimePercentage}%</strong></div>
                <div><span className="muted">Nodes:</span> <strong>{region.nodeCount}</strong></div>
                <div><span className="muted">Grid Load:</span> <strong>{region.heliogridLoadMw} MW</strong></div>
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
            <span className="eyebrow">FUSION MATRIX</span>
            <h2>Batteries DNA Sensor Mappings <span className="count-chip">{visibleSensors.length}</span></h2>
          </div>
          <Badge tone="info">Source: @empire/batteries-dna</Badge>
        </div>
        <div className="knowledge-grid">
          {visibleSensors.map((sensor) => (
            <MangaEffect as="details" interactive className="knowledge-card" key={sensor.dnaId}>
              <summary>
                <span className="knowledge-arabic">{sensor.arabic || "◈"}</span>
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
                  <strong>Operational Monitoring Target</strong>
                  <br />
                  {sensor.operationalTarget}
                </p>
                <p>
                  <strong>Observed Ingest Events:</strong> {sensor.observedEventsCount} frames
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
            <h2>Live Telemetry &amp; Event Stream</h2>
          </div>
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
        </div>
        {visibleFeeds.length ? (
          <div className="event-list event-list-large">
            {visibleFeeds.map((feed) => (
              <article key={feed.id} className="event-row event-row-expanded">
                <span className="event-marker">◉</span>
                <div className="event-main">
                  <div className="event-title">
                    <strong>{feed.title}</strong>
                    <Badge tone={feed.severity === "critical" ? "danger" : feed.severity === "warning" ? "warning" : "info"}>
                      {feed.severity.toUpperCase()}
                    </Badge>
                    <Badge tone="neutral">{feed.regionCode}</Badge>
                    <Badge tone="info">{feed.associatedDna}</Badge>
                  </div>
                  <p style={{ margin: "4px 0 6px", fontSize: "12px", color: "var(--eol-color-text)" }}>
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
          <EmptyState title="No telemetry events match" description="Try switching category filters or search terms." />
        )}
      </section>
    </>
  );
}
