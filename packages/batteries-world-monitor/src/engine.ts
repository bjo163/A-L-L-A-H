import { getBatteriesDna } from "@empire/batteries-dna";
import type { DnaSensorMapping, WorldMonitoringSnapshot, WorldRegion } from "./types.js";


const REGION_REFERENCES: Omit<WorldRegion, "status" | "latencyMs" | "uptimePercentage" | "nodeCount" | "activeSensors" | "heliogridLoadMw">[] = [
  { id: "reg-ap-se", name: "Asia-Pacific South (Jakarta/SG)", code: "AP-SE", lat: -6.2088, lng: 106.8456 },
  { id: "reg-ap-ne", name: "Asia-Pacific North (Tokyo)", code: "AP-NE", lat: 35.6762, lng: 139.6503 },
  { id: "reg-eu-c", name: "Europe Central (Frankfurt)", code: "EU-C", lat: 50.1109, lng: 8.6821 },
  { id: "reg-eu-w", name: "Europe West (London)", code: "EU-W", lat: 51.5074, lng: -0.1278 },
  { id: "reg-us-e", name: "Americas East (N. Virginia)", code: "US-E", lat: 38.9072, lng: -77.0369 },
  { id: "reg-us-w", name: "Americas West (Oregon)", code: "US-W", lat: 43.8041, lng: -120.5542 },
  { id: "reg-sa-e", name: "South America (São Paulo)", code: "SA-E", lat: -23.5505, lng: -46.6333 },
  { id: "reg-me-c", name: "Middle East (Dubai)", code: "ME-C", lat: 25.2048, lng: 55.2708 },
];

const DNA_SENSOR_TARGETS: Array<{ code: string; operationalTarget: string }> = [
  { code: "basir", operationalTarget: "Global Observability & Telemetry Ingestion Pulse" },
  { code: "matin", operationalTarget: "Regional Node Availability & Grid Resilience" },
  { code: "hayy", operationalTarget: "System Heartbeat & Microservice Liveness" },
  { code: "hafiz", operationalTarget: "Audit Ledger Protection & Boundary Safeguards" },
  { code: "khabir", operationalTarget: "Spatiotemporal Anomaly Detection & Situational Awareness" },
  { code: "nur", operationalTarget: "100CENTER HUD & Visual Projection" },
  { code: "alim", operationalTarget: "Cross-Stream Sensor Fusion & Correlation Matrix" },
  { code: "sami", operationalTarget: "Inbound Event Stream & Telemetry Listener" },
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
      currentStatus: "unavailable",
      observedEventsCount: null,
      limitations: dna?.limitations ?? [
        "This is a project analogy inspiredBy a lexicon record, not a theological definition or equivalent.",
        "The package has no independent authority, user permissions, or divine capability.",
      ],
    };
  });
}

export function getWorldMonitoringSnapshot(): WorldMonitoringSnapshot {
  const regions: WorldRegion[] = REGION_REFERENCES.map((region) => ({
    ...region,
    status: "unavailable",
    latencyMs: null,
    uptimePercentage: null,
    nodeCount: null,
    activeSensors: null,
    heliogridLoadMw: null,
  }));

  return {
    status: "unavailable",
    timestamp: new Date().toISOString(),
    globalAlertLevel: "unknown",
    averageGlobalLatencyMs: null,
    totalMonitoredNodes: 0,
    apiUptimeSeconds: null,
    databaseStatus: "unknown",
    regions,
    dnaSensors: resolveDnaSensors(),
    telemetryFeeds: [],
    sources: [],
    observations: [],
    alerts: [],
    history: [],
    mapLayers: [
      { id: "osm", title: "OpenStreetMap", type: "raster", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap contributors" },
      { id: "nasa-gibs-modis", title: "NASA GIBS MODIS", type: "raster", url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg", attribution: "NASA GIBS" },
    ],
  };
}
