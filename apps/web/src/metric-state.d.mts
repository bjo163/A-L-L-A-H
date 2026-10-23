export type MetricProjectionState = "access-needed" | "loading" | "unavailable" | "available";
export function projectMetricState(options: {
  value: string | number | null | undefined;
  loading?: boolean;
  error?: string;
  permitted?: boolean;
}): { value: string | number; state: MetricProjectionState };
