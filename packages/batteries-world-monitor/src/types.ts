export type RegionStatus = "nominal" | "advisory" | "alert" | "critical" | "unavailable";
export type AlertLevel = "green" | "yellow" | "orange" | "red" | "unknown";

export interface WorldRegion {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  status: RegionStatus;
  latencyMs: number | null;
  uptimePercentage: number | null;
  nodeCount: number | null;
  activeSensors: number | null;
  heliogridLoadMw: number | null;
}

export interface DnaSensorMapping {
  dnaId: string;
  code: string;
  arabic: string;
  transliteration: string;
  capability: string;
  operationalTarget: string;
  currentStatus: "healthy" | "calibrated" | "degraded" | "unavailable";
  observedEventsCount: number | null;
  limitations: readonly string[];
}

export interface TelemetryFeedItem {
  id: string;
  category: "physical" | "cyber" | "environmental" | "heliogrid";
  regionCode: string;
  title: string;
  detail: string;
  severity: "info" | "advisory" | "warning" | "critical";
  timestamp: string;
  source: string;
  associatedDna: string;
}

export interface WorldMonitoringSnapshot {
  status: "operational" | "degraded" | "critical" | "unavailable";
  timestamp: string;
  globalAlertLevel: AlertLevel;
  averageGlobalLatencyMs: number | null;
  totalMonitoredNodes: number;
  apiUptimeSeconds: number | null;
  databaseStatus: "available" | "unavailable" | "unknown";
  regions: WorldRegion[];
  dnaSensors: DnaSensorMapping[];
  telemetryFeeds: TelemetryFeedItem[];
}
