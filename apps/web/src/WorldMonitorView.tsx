import { lazy, Suspense, useState } from "react";
import type { WorldMonitoringSnapshot } from "@empire/batteries-world-monitor";
import { Badge, Button, EmptyState, Grid, LoadingState, MangaTelemetryHero, MapFrame, MetricGrid, RegionSelectCard, RegionSummary, SectionHeading, SensorDisclosure, StatusIndicator, Tabs, TelemetryEventList, GlobeIcon, ClockIcon, SparkIcon, CommandIcon, RefreshIcon, ActivityIcon } from "@empire/ui";

const WorldGlobeMap = lazy(async () => ({ default: (await import("./WorldGlobeMap")).WorldGlobeMap }));
const YoutubeSentinelView = lazy(async () => ({ default: (await import("./YoutubeSentinelView")).YoutubeSentinelView }));

interface WorldMonitorViewProps {
  snapshot: WorldMonitoringSnapshot;
  search: string;
  sentinelToken: string | null;
  sentinelPermissions: { read: boolean; scan: boolean; review: boolean; schedule: boolean };
  onRefresh: () => void;
  refreshError?: string;
  /** Countdown in seconds until next auto-refresh. undefined = auto-refresh not running */
  nextRefreshIn?: number;
  notificationPermission: NotificationPermission | "unsupported";
  onEnableNotifications: () => void;
}

type WorldSubTab = "systems" | "youtube";

export function WorldMonitorView({ snapshot, search, sentinelToken, sentinelPermissions, onRefresh, nextRefreshIn, refreshError, notificationPermission, onEnableNotifications }: WorldMonitorViewProps) {
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
  const stateLabel = (state: typeof snapshot.ingestionStatus) => ({
    healthy: "Healthy", degraded: "Degraded", unavailable: "Unavailable", unknown: "Unknown",
  })[state];
  const stateTone = (state: typeof snapshot.ingestionStatus) => ({
    healthy: "success" as const, degraded: "warning" as const,
    unavailable: "neutral" as const, unknown: "neutral" as const,
  })[state];
  const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : "No successful fetch recorded";
  const formatAttempt = (value: string | null) => value ? new Date(value).toLocaleString() : "Unknown";
  const numberWithUnit = (value: number | null, unit: string) => value === null ? "Unknown" : `${value}${unit}`;
  const sourceTone = (state: typeof snapshot.ingestionStatus) => state === "healthy" ? "success" as const : state === "degraded" ? "warning" as const : "neutral" as const;

  return (
    <Tabs
      label="World Monitor views"
      value={subTab}
      onValueChange={setSubTab}
      listClassName="world-subtab-bar"
      tabClassName="world-subtab-btn"
      selectedTabClassName="world-subtab-btn--active"
      items={[
        { value: "systems", label: <><GlobeIcon size={14} /> World Systems</>, content: <>
      <MangaTelemetryHero
        eyebrow={<>SERVICE STATUS <StatusIndicator tone={systemState === "ok" ? "success" : systemState === "unavailable" ? "neutral" : "warning"}>{snapshot.globalAlertLevel === "unknown" ? "STATUS UNKNOWN" : `ALERT LEVEL ${snapshot.globalAlertLevel.toUpperCase()}`}</StatusIndicator></>}
        title="System and regional monitoring"
        description="API and database health are checked live. Provider freshness and coverage below reflect recorded source runs and observations. Regional reference locations, energy, and DNA sensor mappings are not live-connected nodes."
        metadata={<><span><ClockIcon size={13}/> Snapshot {new Date(snapshot.timestamp).toLocaleString()}</span><span><GlobeIcon size={13}/> {snapshot.regions.length} Reference Regions</span><span><SparkIcon size={13}/> {totalHeliogrid} Heliogrid Load</span><span><CommandIcon size={13}/> {snapshot.dnaSensors.length} DNA Mappings</span></>}
        pulse={snapshot.apiUptimeSeconds === null ? "N/A" : `${snapshot.apiUptimeSeconds}s`}
        sfx="RADAR!"
      />
      {refreshError && <p role="alert" className="eol-notice eol-notice--warning">Refresh failed: {refreshError} Showing the last successful snapshot.</p>}
{notificationPermission === "default" && <div className="world-notification-prompt"><span>Enable browser notifications for new World Monitor alerts.</span><Button variant="secondary" onClick={onEnableNotifications}>Enable notifications</Button></div>}

      <section aria-label="Provider data health">
        <SectionHeading layout="compact" eyebrow="PROVIDER DATA" title="Freshness and coverage" aside={<span className="muted">Snapshot time: {new Date(snapshot.timestamp).toLocaleString()}</span>} />
        <MetricGrid columns={4} density="compact" items={[
          { label: "Ingestion", value: stateLabel(snapshot.ingestionStatus), tone: stateTone(snapshot.ingestionStatus), detail: "Provider run status" },
          { label: "Freshness", value: stateLabel(snapshot.freshnessStatus), tone: stateTone(snapshot.freshnessStatus), detail: `${snapshot.observations.length} returned observations` },
          { label: "Coverage", value: stateLabel(snapshot.coverageStatus), tone: stateTone(snapshot.coverageStatus), detail: `${snapshot.sources.filter((source) => source.status === "success" && source.records !== null && source.records > 0).length} of ${snapshot.sources.length} active sources returned records` },
          { label: "Hazard level", value: snapshot.hazardAlertLevel.toUpperCase(), tone: snapshot.hazardAlertLevel === "red" ? "danger" : snapshot.hazardAlertLevel === "yellow" ? "warning" : snapshot.hazardAlertLevel === "green" ? "success" : "neutral", detail: "Based on available observations; unknown is not clear" },
        ]} />
        {snapshot.sources.length ? <div className="knowledge-grid" aria-label="Provider source status">
          {snapshot.sources.map((source) => {
            const providerFreshness = source.freshnessSeconds === null || source.freshnessSlaSeconds === null
              ? "unknown"
              : source.freshnessSeconds > source.freshnessSlaSeconds ? "degraded" : source.status === "success" ? "healthy" : "degraded";
            return <SensorDisclosure key={source.source} name={source.source} identity={<>{source.category} · {source.tier}</>} status={`${stateLabel(providerFreshness)} · ${source.status}`} tone={sourceTone(providerFreshness)}>
            <p><strong>Last attempt:</strong> {formatAttempt(source.lastAttemptAt)} · <strong>Last successful fetch:</strong> {formatDate(source.lastSuccessAt)}</p>
            <p><strong>Freshness:</strong> {numberWithUnit(source.freshnessSeconds, " s")} · <strong>Freshness target:</strong> {numberWithUnit(source.freshnessSlaSeconds, " s")} · <strong>Latest fetch duration:</strong> {numberWithUnit(source.durationMs, " ms")}</p>
            <p><strong>Records in latest run:</strong> {numberWithUnit(source.records, "")} · <strong>Fetched points:</strong> {numberWithUnit(source.fetchedPoints, "")}</p>
            <p><strong>Coverage:</strong> {source.coverage === null ? stateLabel(source.coverageStatus) : `${(source.coverage * 100).toFixed(1)}% (${stateLabel(source.coverageStatus)})`}</p>
            <p><strong>Recent failure rate:</strong> {source.errorRate === null ? "Unknown" : `${(source.errorRate * 100).toFixed(1)}%`} · <strong>Failure streak:</strong> {numberWithUnit(source.failureStreak, "")} · <strong>Parse errors:</strong> {numberWithUnit(source.parseErrors, "")}</p>
            <p><strong>Fallback activated:</strong> {source.fallbackActivated === null ? "Unknown" : source.fallbackActivated ? "Yes" : "No"}</p>
          </SensorDisclosure>;
          })}
        </div> : <EmptyState title="Provider status unknown" description="No active provider inventory is available in this snapshot." />}
      </section>

      {/* ── Globe Map ─────────────────────────────────────────────────────────── */}
      <section className="world-map-section">
        <SectionHeading layout="compact" eyebrow="GEOSPATIAL OVERLAY" title="Regional Reference Locations" aside={<div className="button-row world-map-actions">
            {nextRefreshIn !== undefined && (
              <span className="muted world-map-countdown">
                <RefreshIcon size={12} /> Auto in {nextRefreshIn}s
              </span>
            )}
            <Button variant="secondary" onClick={onRefresh}><RefreshIcon size={15}/>Refresh Pulse</Button>
          </div>} />

        <Suspense fallback={<MapFrame title="Interactive region map" state="loading" stateTitle="Loading map adapter" description="The regional reference list below remains available." />}>
          <WorldGlobeMap
            regions={snapshot.regions}
            selectedRegionId={selectedRegionId}
            onSelectRegion={(id) => setSelectedRegionId((prev) => (prev === id ? undefined : id))}
            mapLayers={snapshot.mapLayers}
          />
        </Suspense>

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
        <SectionHeading layout="compact" title="Global System Metrics" />
        <MetricGrid columns={4} density="compact" items={[
          { label: "API / database status", value: snapshot.status.toUpperCase(), tone: systemState === "ok" ? "success" : systemState === "unavailable" ? "neutral" : "warning" },
          { label: "Verified regional nodes", value: snapshot.totalMonitoredNodes },
          { label: "Measured global latency", value: metric(snapshot.averageGlobalLatencyMs, " ms") },
          { label: "Heliogrid load", value: totalHeliogrid },
        ]} />
      </section>

      {/* ── Regional Nodes ───────────────────────────────────────────────────── */}
      <section>
        <SectionHeading layout="compact" eyebrow="DISTRIBUTED TOPOLOGY" title={<>Regional Reference Locations <span className="count-chip">{visibleRegions.length}</span></>} aside={<span className="muted">Reference locations; live regional data unavailable</span>} />
        <Grid minItemWidth="lg">
          {visibleRegions.map((region) => (
            <RegionSelectCard
              key={region.id}
              name={region.name}
              code={region.code}
              coordinates={`${region.lat.toFixed(2)}°, ${region.lng.toFixed(2)}°`}
              status={region.status.toUpperCase()}
              tone={regionTone(region.status)}
              selected={selectedRegionId === region.id}
              onSelect={() => setSelectedRegionId((prev) => (prev === region.id ? undefined : region.id))}
              metrics={[
                { label: "Latency", value: metric(region.latencyMs, " ms") },
                { label: "Uptime", value: metric(region.uptimePercentage, "%") },
                { label: "Nodes", value: metric(region.nodeCount) },
                { label: "Grid Load", value: metric(region.heliogridLoadMw, " MW") },
              ]}
            />
          ))}
        </Grid>
        {visibleRegions.length === 0 && (
          <EmptyState title="No regions match" description="Try a different search query." />
        )}
      </section>

      {/* ── DNA Sensor Matrix ────────────────────────────────────────────────── */}
      <section>
        <SectionHeading layout="compact" eyebrow="CATALOG MAPPINGS" title={<>Batteries DNA Catalog Mappings <span className="count-chip">{visibleSensors.length}</span></>} aside={<Badge tone="info">Source: @empire/batteries-dna</Badge>} />
        <div className="knowledge-grid">
          {visibleSensors.map((sensor) => (
            <SensorDisclosure
              key={sensor.dnaId}
              name={sensor.transliteration}
              identity={<>{sensor.dnaId} · {sensor.capability}</>}
              symbol={sensor.arabic || undefined}
              status={sensor.currentStatus.toUpperCase()}
              tone={sensor.currentStatus === "healthy" ? "success" : "neutral"}
            >
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
            </SensorDisclosure>
          ))}
        </div>
        {visibleSensors.length === 0 && (
          <EmptyState title="No DNA sensors match" description="Try searching by name or capability." />
        )}
      </section>

      {/* ── Live Feed ────────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading layout="compact" eyebrow="SITUATIONAL INTELLIGENCE" title="Telemetry & Event Feed" aside={snapshot.telemetryFeeds.length > 0 ? (
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
        ) : undefined} />
        <TelemetryEventList events={visibleFeeds.map((feed) => ({
          id: feed.id,
          title: feed.title,
          severity: feed.severity.toUpperCase(),
          severityTone: feed.severity === "critical" ? "danger" as const : feed.severity === "warning" ? "warning" as const : "info" as const,
          region: feed.regionCode,
          sourceTag: feed.associatedDna,
          detail: feed.detail,
          source: feed.source,
          category: feed.category,
          timestamp: feed.timestamp,
          timestampLabel: new Date(feed.timestamp).toLocaleTimeString(),
        }))} empty={<EmptyState title="No verified telemetry events" description="No live event source is connected. Audit records are not exposed through this public endpoint." />} />
      </section>
        </> },
        { value: "youtube", label: <><ActivityIcon size={14} /> YouTube Sentinel <span className="world-subtab-badge">TAUHID</span></>, disabled: !sentinelPermissions.read, content: sentinelPermissions.read ? <Suspense fallback={<LoadingState label="Loading YouTube Sentinel…" />}><YoutubeSentinelView searchQuery={search} token={sentinelToken} permissions={sentinelPermissions} /></Suspense> : <p role="note" className="eol-notice">Izin sentinel:read diperlukan untuk melihat YouTube Sentinel.</p> },
      ]}
    />
  );
}
