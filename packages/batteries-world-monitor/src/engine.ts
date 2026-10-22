import { getBatteriesDna } from "@empire/batteries-dna";
import type { DnaSensorMapping, TelemetryFeedItem, WorldMonitoringSnapshot, WorldRegion } from "./types";

const DEFAULT_REGIONS: WorldRegion[] = [
  {
    id: "reg-ap-se",
    name: "Asia-Pacific South (Jakarta/SG)",
    code: "AP-SE",
    lat: -6.2088,
    lng: 106.8456,
    status: "nominal",
    latencyMs: 18,
    uptimePercentage: 99.98,
    nodeCount: 42,
    activeSensors: 14,
    heliogridLoadMw: 124.5,
  },
  {
    id: "reg-ap-ne",
    name: "Asia-Pacific North (Tokyo)",
    code: "AP-NE",
    lat: 35.6762,
    lng: 139.6503,
    status: "nominal",
    latencyMs: 24,
    uptimePercentage: 99.99,
    nodeCount: 36,
    activeSensors: 12,
    heliogridLoadMw: 98.2,
  },
  {
    id: "reg-eu-c",
    name: "Europe Central (Frankfurt)",
    code: "EU-C",
    lat: 50.1109,
    lng: 8.6821,
    status: "nominal",
    latencyMs: 31,
    uptimePercentage: 99.95,
    nodeCount: 48,
    activeSensors: 16,
    heliogridLoadMw: 142.0,
  },
  {
    id: "reg-eu-w",
    name: "Europe West (London)",
    code: "EU-W",
    lat: 51.5074,
    lng: -0.1278,
    status: "nominal",
    latencyMs: 35,
    uptimePercentage: 99.97,
    nodeCount: 30,
    activeSensors: 10,
    heliogridLoadMw: 88.4,
  },
  {
    id: "reg-us-e",
    name: "Americas East (N. Virginia)",
    code: "US-E",
    lat: 38.9072,
    lng: -77.0369,
    status: "nominal",
    latencyMs: 42,
    uptimePercentage: 99.94,
    nodeCount: 64,
    activeSensors: 20,
    heliogridLoadMw: 210.6,
  },
  {
    id: "reg-us-w",
    name: "Americas West (Oregon)",
    code: "US-W",
    lat: 43.8041,
    lng: -120.5542,
    status: "nominal",
    latencyMs: 45,
    uptimePercentage: 99.96,
    nodeCount: 38,
    activeSensors: 12,
    heliogridLoadMw: 115.3,
  },
  {
    id: "reg-sa-e",
    name: "South America (São Paulo)",
    code: "SA-E",
    lat: -23.5505,
    lng: -46.6333,
    status: "advisory",
    latencyMs: 82,
    uptimePercentage: 99.82,
    nodeCount: 22,
    activeSensors: 8,
    heliogridLoadMw: 64.1,
  },
  {
    id: "reg-me-c",
    name: "Middle East (Dubai)",
    code: "ME-C",
    lat: 25.2048,
    lng: 55.2708,
    status: "nominal",
    latencyMs: 29,
    uptimePercentage: 99.98,
    nodeCount: 28,
    activeSensors: 9,
    heliogridLoadMw: 85.0,
  },
];

const DNA_SENSOR_TARGETS: Array<{ code: string; operationalTarget: string; initialStatus: "healthy" | "calibrated" | "degraded" }> = [
  { code: "basir", operationalTarget: "Global Observability & Telemetry Ingestion Pulse", initialStatus: "healthy" },
  { code: "matin", operationalTarget: "Regional Node Availability & Grid Resilience", initialStatus: "healthy" },
  { code: "hayy", operationalTarget: "System Heartbeat & Microservice Liveness", initialStatus: "healthy" },
  { code: "hafiz", operationalTarget: "Audit Ledger Protection & Boundary Safeguards", initialStatus: "healthy" },
  { code: "khabir", operationalTarget: "Spatiotemporal Anomaly Detection & Situational Awareness", initialStatus: "calibrated" },
  { code: "nur", operationalTarget: "Command Center HUD & Visual Projection", initialStatus: "healthy" },
  { code: "alim", operationalTarget: "Cross-Stream Sensor Fusion & Correlation Matrix", initialStatus: "healthy" },
  { code: "sami", operationalTarget: "Inbound Event Stream & Telemetry Listener", initialStatus: "healthy" },
];

export function resolveDnaSensors(): DnaSensorMapping[] {
  return DNA_SENSOR_TARGETS.map((target) => {
    const dna = getBatteriesDna(target.code);
    return {
      dnaId: dna?.id ?? `dna-${target.code}`,
      code: target.code,
      arabic: dna?.arabic ?? "",
      transliteration: dna?.transliteration ?? target.code,
      capability: dna?.capability ?? `${target.code}-monitoring`,
      operationalTarget: target.operationalTarget,
      currentStatus: target.initialStatus,
      observedEventsCount: Math.floor(Math.random() * 50) + 120,
      limitations: dna?.limitations ?? [
        "This is a project analogy inspiredBy a lexicon record, not a theological definition or equivalent.",
        "The package has no independent authority, user permissions, or divine capability.",
      ],
    };
  });
}

export function generateTelemetryFeeds(): TelemetryFeedItem[] {
  const now = new Date();
  const iso = (offsetMinutes: number) => new Date(now.getTime() - offsetMinutes * 60000).toISOString();

  return [
    {
      id: "evt-01",
      category: "physical",
      regionCode: "AP-SE",
      title: "Seismic Activity Monitored (M 4.2)",
      detail: "Sunda Strait sub-duct zone tremor registered within safe structural limits; regional nodes fully operational.",
      severity: "info",
      timestamp: iso(2),
      source: "USGS / BMKG Feed Aggregator",
      associatedDna: "dna-basir",
    },
    {
      id: "evt-02",
      category: "heliogrid",
      regionCode: "ME-C",
      title: "Solar Array Peak Absorption",
      detail: "Heliogrid desert arrays operating at 104% nominal generation efficiency. Surpluses routed to battery reserves.",
      severity: "info",
      timestamp: iso(7),
      source: "Heliogrid Telemetry Core",
      associatedDna: "dna-matin",
    },
    {
      id: "evt-03",
      category: "cyber",
      regionCode: "SA-E",
      title: "Subsea Cable Latency Variance",
      detail: "Atlantic subsea link reported elevated jitter (+18ms). Traffic rerouted automatically via secondary transatlantic backbones.",
      severity: "advisory",
      timestamp: iso(15),
      source: "BGP Telemetry Stream",
      associatedDna: "dna-khabir",
    },
    {
      id: "evt-04",
      category: "environmental",
      regionCode: "US-W",
      title: "Atmospheric Micro-Grid Calibration",
      detail: "Dry season atmospheric sensors in Pacific Northwest report clear conditions; thermal cameras calibrated.",
      severity: "info",
      timestamp: iso(22),
      source: "NOAA Weather API",
      associatedDna: "dna-alim",
    },
    {
      id: "evt-05",
      category: "cyber",
      regionCode: "EU-C",
      title: "Gateway Health Pulse Synchronized",
      detail: "Zero dropped frames across 48 local nodes; cryptographic audit ledger confirmed intact.",
      severity: "info",
      timestamp: iso(30),
      source: "Fastify API Telemetry Layer",
      associatedDna: "dna-hayy",
    },
  ];
}

export function getWorldMonitoringSnapshot(): WorldMonitoringSnapshot {
  const regions = DEFAULT_REGIONS;
  const dnaSensors = resolveDnaSensors();
  const telemetryFeeds = generateTelemetryFeeds();

  const totalNodes = regions.reduce((acc, r) => acc + r.nodeCount, 0);
  const avgLatency = Math.round(regions.reduce((acc, r) => acc + r.latencyMs, 0) / regions.length);
  const hasAdvisory = regions.some((r) => r.status === "advisory");
  const hasCritical = regions.some((r) => r.status === "critical");

  const alertLevel = hasCritical ? "red" : hasAdvisory ? "yellow" : "green";

  return {
    status: hasCritical ? "critical" : hasAdvisory ? "degraded" : "operational",
    timestamp: new Date().toISOString(),
    globalAlertLevel: alertLevel,
    averageGlobalLatencyMs: avgLatency,
    totalMonitoredNodes: totalNodes,
    regions,
    dnaSensors,
    telemetryFeeds,
  };
}
