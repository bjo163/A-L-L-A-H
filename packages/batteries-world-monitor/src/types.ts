export type RegionStatus = "nominal" | "advisory" | "alert" | "critical";
export type AlertLevel = "green" | "yellow" | "orange" | "red";

export interface WorldRegion {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  status: RegionStatus;
  latencyMs: number;
  uptimePercentage: number;
  nodeCount: number;
  activeSensors: number;
  heliogridLoadMw: number;
}

export interface DnaSensorMapping {
  dnaId: string;
  code: string;
  arabic: string;
  transliteration: string;
  capability: string;
  operationalTarget: string;
  currentStatus: "healthy" | "calibrated" | "degraded";
  observedEventsCount: number;
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
  status: "operational" | "degraded" | "critical";
  timestamp: string;
  globalAlertLevel: AlertLevel;
  averageGlobalLatencyMs: number;
  totalMonitoredNodes: number;
  regions: WorldRegion[];
  dnaSensors: DnaSensorMapping[];
  telemetryFeeds: TelemetryFeedItem[];
}
