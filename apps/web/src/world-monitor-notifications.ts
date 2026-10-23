export interface WorldMonitorAlertNotification {
  id: string;
  level: string;
  title: string;
  detail: string;
  observedAt?: string;
}

export function notifyNewWorldMonitorAlerts(
  previous: WorldMonitorAlertNotification[],
  current: WorldMonitorAlertNotification[],
  permission: NotificationPermission,
  notify: (title: string, body: string) => void,
  observedAfter?: string,
): number {
  if (permission !== "granted") return 0;
  const severity: Record<string, number> = { normal: 0, advisory: 1, critical: 2 };
  const previousById = new Map(previous.map((alert) => [alert.id, alert]));
  const observedAfterMs = observedAfter ? Date.parse(observedAfter) : Number.NEGATIVE_INFINITY;
  const fresh = current.filter((alert) => {
    if (observedAfter && (!Number.isFinite(observedAfterMs) || !alert.observedAt || Date.parse(alert.observedAt) <= observedAfterMs)) return false;
    const before = previousById.get(alert.id);
    return !before || (severity[alert.level] ?? 0) > (severity[before.level] ?? 0);
  });
  if (!fresh.length) return 0;
  const alert = fresh.find((item) => item.level === "critical") ?? fresh[0];
  notify(`World Monitor: ${alert.level.toUpperCase()}`, `${alert.title} — ${alert.detail}`);
  return fresh.length;
}
