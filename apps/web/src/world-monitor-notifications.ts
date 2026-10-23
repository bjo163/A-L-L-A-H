export interface WorldMonitorAlertNotification {
  id: string;
  level: string;
  title: string;
  detail: string;
  observedAt?: string;
  category?: string;
}

export interface WorldMonitorNotificationPreferences {
  categories: Record<string, boolean>;
  quietHours: { enabled: boolean; start: string; end: string };
}

export const WORLD_MONITOR_NOTIFICATION_CATEGORIES = ["atmosphere", "space-weather", "earthquake", "disaster"] as const;

export const DEFAULT_WORLD_MONITOR_NOTIFICATION_PREFERENCES: WorldMonitorNotificationPreferences = {
  categories: Object.fromEntries(WORLD_MONITOR_NOTIFICATION_CATEGORIES.map((category) => [category, true])),
  quietHours: { enabled: false, start: "22:00", end: "07:00" },
};

export interface WorldMonitorAlertPollerOptions {
  fetchAlerts: () => Promise<WorldMonitorAlertNotification[]>;
  getPermission: () => NotificationPermission;
  getPreferences: () => WorldMonitorNotificationPreferences;
  notify: (title: string, body: string) => void;
  now?: () => Date;
}

export function createWorldMonitorAlertPoller(options: WorldMonitorAlertPollerOptions) {
  let active = true;
  let baseline: string | undefined;
  let previous: WorldMonitorAlertNotification[] | null = null;
  const knownLevels = new Map<string, string>();
  const now = options.now ?? (() => new Date());

  return {
    async poll() {
      if (!active) return;
      try {
        const current = await options.fetchAlerts();
        if (!active) return;
        if (previous === null) {
          previous = current;
          baseline = now().toISOString();
          for (const alert of current) knownLevels.set(alert.id, alert.level);
          return;
        }
        notifyNewWorldMonitorAlerts(
          previous,
          current,
          options.getPermission(),
          options.notify,
          baseline,
          options.getPreferences(),
          now(),
          knownLevels,
        );
        previous = current;
      } catch {
        // Keep the last successful comparison baseline through transient failures.
      }
    },
    stop() { active = false; },
  };
}

function minuteOfDay(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

export function isWorldMonitorQuietNow(quietHours: WorldMonitorNotificationPreferences["quietHours"], now = new Date()): boolean {
  if (!quietHours.enabled) return false;
  const start = minuteOfDay(quietHours.start);
  const end = minuteOfDay(quietHours.end);
  if (start === null || end === null || start === end) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return start < end ? current >= start && current < end : current >= start || current < end;
}

export function notifyNewWorldMonitorAlerts(
  previous: WorldMonitorAlertNotification[],
  current: WorldMonitorAlertNotification[],
  permission: NotificationPermission,
  notify: (title: string, body: string) => void,
  observedAfter?: string,
  preferences: WorldMonitorNotificationPreferences = DEFAULT_WORLD_MONITOR_NOTIFICATION_PREFERENCES,
  now = new Date(),
  knownLevels?: Map<string, string>,
): number {
  if (permission !== "granted") return 0;
  const severity: Record<string, number> = { normal: 0, advisory: 1, critical: 2 };
  const previousById = new Map(previous.map((alert) => [alert.id, alert]));
  const observedAfterMs = observedAfter ? Date.parse(observedAfter) : Number.NEGATIVE_INFINITY;
  const fresh = current.filter((alert) => {
    if (alert.category && preferences.categories[alert.category] === false) return false;
    if (observedAfter && (!Number.isFinite(observedAfterMs) || !alert.observedAt || Date.parse(alert.observedAt) <= observedAfterMs)) return false;
    const before = previousById.get(alert.id) ?? (knownLevels?.has(alert.id) ? { level: knownLevels.get(alert.id)! } : undefined);
    return !before || (severity[alert.level] ?? 0) > (severity[before.level] ?? 0);
  });
  if (knownLevels) for (const alert of current) {
    const before = knownLevels.get(alert.id);
    if (!before || (severity[alert.level] ?? 0) > (severity[before] ?? 0)) knownLevels.set(alert.id, alert.level);
  }
  if (!fresh.length) return 0;
  const allowed = isWorldMonitorQuietNow(preferences.quietHours, now) ? fresh.filter((item) => item.level === "critical") : fresh;
  if (!allowed.length) return 0;
  const alert = allowed.find((item) => item.level === "critical") ?? allowed[0];
  notify(`World Monitor: ${alert.level.toUpperCase()}`, `${alert.title} — ${alert.detail}`);
  return allowed.length;
}
