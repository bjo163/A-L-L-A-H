export interface YoutubeScanGateOptions {
  maxRequests?: number;
  windowMs?: number;
  maxConcurrent?: number;
  maxTrackedOperators?: number;
  now?: () => number;
}

export interface YoutubeScanLease {
  allowed: boolean;
  reason?: "rate_limit" | "operator_concurrency" | "global_concurrency" | "identity_unavailable";
  remaining: number;
  retryAfterMs: number;
  release: () => void;
}

/**
 * Process-local protection for expensive YouTube crawls. Keep the map bounded and
 * fail closed when it is full; use a shared store before running multiple API replicas.
 */
export function createYoutubeScanGate(options: YoutubeScanGateOptions = {}) {
  const maxRequests = options.maxRequests ?? 5;
  const windowMs = options.windowMs ?? 10 * 60_000;
  const maxConcurrent = options.maxConcurrent ?? 3;
  const maxTrackedOperators = options.maxTrackedOperators ?? 10_000;
  const now = options.now ?? Date.now;
  const requests = new Map<string, number[]>();
  const activeOperators = new Set<string>();
  let activeScans = 0;

  function pruneExpired(at: number) {
    const cutoff = at - windowMs;
    for (const [operator, timestamps] of requests) {
      const current = timestamps.filter((timestamp) => timestamp > cutoff);
      if (current.length) requests.set(operator, current);
      else requests.delete(operator);
    }
  }

  function denied(
    reason: NonNullable<YoutubeScanLease["reason"]>,
    retryAfterMs: number,
    remaining = 0,
  ): YoutubeScanLease {
    return { allowed: false, reason, remaining, retryAfterMs: Math.max(1, retryAfterMs), release() {} };
  }

  return {
    acquire(operatorId: string): YoutubeScanLease {
      const operator = operatorId.trim();
      if (!operator) return denied("identity_unavailable", windowMs);

      const at = now();
      pruneExpired(at);
      const timestamps = requests.get(operator) ?? [];

      const remaining = Math.max(0, maxRequests - timestamps.length);
      if (activeOperators.has(operator)) return denied("operator_concurrency", 1_000, remaining);
      if (activeScans >= maxConcurrent) return denied("global_concurrency", 5_000, remaining);
      if (timestamps.length >= maxRequests) return denied("rate_limit", timestamps[0]! + windowMs - at);

      if (!requests.has(operator) && requests.size >= maxTrackedOperators)
        return denied("identity_unavailable", windowMs);

      timestamps.push(at);
      requests.set(operator, timestamps);
      activeOperators.add(operator);
      activeScans += 1;

      let released = false;
      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - timestamps.length),
        retryAfterMs: 0,
        release() {
          if (released) return;
          released = true;
          activeOperators.delete(operator);
          activeScans = Math.max(0, activeScans - 1);
        },
      };
    },
    get activeCount() { return activeScans; },
    get trackedOperatorCount() { return requests.size; },
  };
}
