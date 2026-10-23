/** Project an API-backed metric to a user-facing value and explicit state. */
export function projectMetricState({ value, loading = false, error = "", permitted = true }) {
  if (!permitted) return { value: "Access needed", state: "access-needed" };
  if (loading) return { value: "…", state: "loading" };
  if (error || value === null || value === undefined) return { value: "—", state: "unavailable" };
  return { value, state: "available" };
}
