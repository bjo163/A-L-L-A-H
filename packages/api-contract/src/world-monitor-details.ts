/** Versioned authenticated detail DTOs for the system-wide World Monitor feeds. */
const pageSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "items", "nextCursor"],
  properties: {
    schemaVersion: { type: "string", const: "1" },
    items: { type: "array", maxItems: 150 },
    nextCursor: { anyOf: [{ type: "string", maxLength: 512 }, { type: "null" }] },
  },
} as const;

const observation = {
  type: "object", additionalProperties: false,
  required: ["category", "source", "sourceTier", "observedAt", "fetchedAt", "status", "freshnessSeconds", "confidence"],
  properties: {
    category: { type: "string", maxLength: 64 }, source: { type: "string", maxLength: 160 },
    sourceTier: { type: "string", maxLength: 32 }, observedAt: { type: "string", format: "date-time" },
    fetchedAt: { type: "string", format: "date-time" }, status: { type: "string", maxLength: 24 },
    freshnessSeconds: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
    confidence: { anyOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] },
  },
} as const;

const alert = {
  type: "object", additionalProperties: false,
  required: ["category", "source", "kind", "level", "observedAt", "value"],
  properties: {
    category: { type: "string", maxLength: 64 }, source: { type: "string", maxLength: 160 },
    kind: { type: "string", enum: ["pm25", "geomagnetic", "earthquake", "disaster"] },
    level: { type: "string", enum: ["advisory", "critical"] }, observedAt: { type: "string", format: "date-time" },
    value: { type: "string", maxLength: 48 },
  },
} as const;

const history = {
  type: "object", additionalProperties: false,
  required: ["bucket", "metric", "observationCount"],
  properties: {
    bucket: { type: "string", format: "date-time" },
    metric: { type: "string", const: "observation_samples" },
    observationCount: { type: "integer", minimum: 0 },
  },
} as const;

export const WORLD_MONITOR_OBSERVATION_PAGE_SCHEMA = {
  ...pageSchema, properties: { ...pageSchema.properties, items: { type: "array", maxItems: 100, items: observation } },
} as const;
export const WORLD_MONITOR_ALERT_PAGE_SCHEMA = {
  ...pageSchema, properties: { ...pageSchema.properties, items: { type: "array", maxItems: 150, items: alert } },
} as const;
export const WORLD_MONITOR_HISTORY_PAGE_SCHEMA = {
  ...pageSchema, properties: { ...pageSchema.properties, items: { type: "array", maxItems: 100, items: history } },
} as const;

export interface WorldMonitorObservationPageItem {
  category: string; source: string; sourceTier: string; observedAt: string; fetchedAt: string;
  status: string; freshnessSeconds: number | null; confidence: number | null;
}
export interface WorldMonitorAlertPageItem {
  category: string; source: string; kind: "pm25" | "geomagnetic" | "earthquake" | "disaster";
  level: "advisory" | "critical"; observedAt: string; value: string;
}
export interface WorldMonitorHistoryPageItem { bucket: string; metric: "observation_samples"; observationCount: number }
export interface WorldMonitorPage<T> { schemaVersion: "1"; items: T[]; nextCursor: string | null }
