export interface WorldMonitorAlertNotification {
  id: string;
  level: string;
  title: string;
  detail: string;
}

export function notifyNewWorldMonitorAlerts(
  previous: WorldMonitorAlertNotification[],
  current: WorldMonitorAlertNotification[],
  permission: NotificationPermission,
  notify: (title: string, body: string) => void,
): number {
  if (permission !== "granted") return 0;
  const severity: Record<string, number> = { normal: 0, advisory: 1, critical: 2 };
  const previousById = new Map(previous.map((alert) => [alert.id, alert]));
  const fresh = current.filter((alert) => {
    const before = previousById.get(alert.id);
    return !before || (severity[alert.level] ?? 0) > (severity[before.level] ?? 0);
  });
  if (!fresh.length) return 0;
  const alert = fresh.find((item) => item.level === "critical") ?? fresh[0];
  notify(`World Monitor: ${alert.level.toUpperCase()}`, `${alert.title} — ${alert.detail}`);
  return fresh.length;
}
