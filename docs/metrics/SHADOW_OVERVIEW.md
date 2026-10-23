# SHADOW overview metric map

This page records the data contract for the authenticated SHADOW overview. The
overview reports operational data only. It does not report editorial story
counts, published episodes, poster output, or audience telemetry; those sources
are not implemented as authoritative services yet.

| Overview card or panel | Authoritative source | Scope and meaning | Empty, loading, or unavailable behavior |
| --- | --- | --- | --- |
| Research runs | `GET /v1/research-runs`, `meta.total` (falls back to returned page length only when total is absent) | Active tenant; caller must have `research:read`. Total run records, not stories or published episodes. | `0` is a valid total; loading uses an ellipsis; missing data or refresh error is unavailable; missing permission is Access needed. |
| Open CAB items | `GET /continuum/cab/summary`, `active` | Current implementation is system-wide operational change control: CAB requests/reviews are not editorial content, and the summary query has no tenant filter. The route requires an authenticated session and `cab:read`; it does not establish or select a tenant. Whether global scope is the intended product policy has not been confirmed by the API/maintainer owner. Do not treat this as a tenant-specific metric until that policy is confirmed. | `0` is a valid total; loading uses an ellipsis; missing summary or refresh error is unavailable. |
| Enabled modules | `GET /v1/modules`, each item’s `enabled` flag | System module inventory. The numerator is enabled modules; the denominator is the full returned inventory, unaffected by current text search. | `0/0` is valid when the API returns an empty inventory; loading uses an ellipsis; refresh error suppresses the prior count and reports unavailable. |
| API health | `GET /health`, `status` | API process health only. Database readiness is separately represented by readiness status; neither is user activity or publication health. | Loading uses the current checking state; refresh error reports unavailable because the combined refresh did not produce a new snapshot. |
| Continuum API status | `GET /continuum`, `status` | Status exposed by the Continuum API for callers with `continuum:read`; it does not mean Story Studio or Poster Forge is available. | Access needed without permission; loading while fetching; unavailable if missing or refresh fails. |
| API capabilities | `GET /v1/capabilities`, `capabilities` | Capability names advertised by the API; these are not counts of stories or audiences. | Empty array is explicitly “No capabilities available”; loading/error have separate labels and errors suppress stale capability names. |
| Recent signals | `GET /continuum/chronicles`, returned `data` page | Recent Continuum audit/chronicle events for callers with `continuum:read`; only the first five returned events are previewed. This is not audience telemetry. | Empty page is “No recent signals”; loading, permission denial, and refresh error have distinct states. |

The dashboard refresh currently collects several endpoints together. While it
is in progress, health and Continuum cards show checking/loading, metric cards
show loading, and activity/module lists show loading states. If that refresh
fails, values from the previous snapshot must not be presented as current:
count cards switch to unavailable, capability/event previews suppress stale
entries, and the module list reports the refresh error. The last-check timestamp
remains visible to show when the preceding snapshot was collected.

The CAB route's global scope is inferred from the current handler: its summary
queries are unfiltered and the route has no tenant hook. No product/owner
decision confirming that scope was found during this implementation tranche.

## Coverage

`apps/web/tests/overview-metrics.test.mjs` protects the metric-source wiring and
the explicit zero, permission-denied, loading, and unavailable branches. These
source-contract checks do not replace browser evidence with authorized test
accounts; that UI review remains tracked in `docs/UI_REVIEW_MATRIX.md`.
