# World Monitor deployment checklist

## Before deployment

- [ ] Use only public, keyless source URLs; do not add API keys to `.env` or CI.
- [ ] Set `WORLD_MONITOR_INTERVAL_MS` between 300000 and 900000.
- [ ] Review alert thresholds (`WM_PM25_*`, `WM_KP_*`, `WM_QUAKE_*`, `WM_STALE_SECONDS`).
- [ ] Run `pnpm validate`, `pnpm typecheck`, production builds, and World Monitor tests.
- [ ] Confirm the database backup completed and can be restored to a temporary database.

## Health and runtime verification

- [ ] Check `/v1/health` and `/v1/readiness`.
- [ ] Check `/v1/world-monitor` and confirm `sources`, `observations`, `history`, `alerts`, and `databaseStatus`.
- [ ] Confirm scheduler logs show a successful ingest and that source runs have latency and record counts.
- [ ] Confirm `world_monitor_observations`, `world_monitor_source_runs`, and `world_monitor_aggregates` contain recent rows.

## YouTube Sentinel scan contract

The public browser-automation snippet has been retired. Operators use the
server-side scan endpoint instead; it searches YouTube and stages results for
review. It does not accept browser-scraped `{ query, items }` submissions or
treat submitted metadata as verified evidence.

- `POST /v1/world-monitor/youtube/scan` requires an authenticated session and
  the `sentinel:scan` permission. The web UI sends the session token through
  the shared API client; do not put credentials in scripts, query strings, or
  downloaded examples.
- The JSON body accepts `query` (required), `limit`, `forceLive`, `engine`
  (`innertube`, `playwright`, or `auto`), `sortBy` (`upload_date` or
  `relevance`), `onlyNew`, and `useBrowserAutomation`. The server performs the
  search; clients must not submit scraped items.
- The current in-process gate allows at most five scans per operator per ten
  minutes and three simultaneous scans per API process. These limits are
  process-local; deployments with multiple API replicas must use a shared gate
  before relying on them as a deployment-wide quota.
- Search results and deterministic risk classifications are unverified leads,
  not findings of platform policy violations. A reviewer must verify source
  metadata and evidence before recording a conclusion or external action.
- Operators must comply with YouTube's current Terms of Service, applicable
  access restrictions, privacy requirements, and local law. Stop scans if
  provider controls or terms disallow the selected retrieval method. Browser
  automation, when explicitly selected, runs server-side and is not a license
  to bypass access controls.

## Failure and rollback

- [ ] Simulate a source timeout and verify the fallback source and failed source run are recorded.
- [ ] Simulate an empty or malformed response and verify no invalid observation is stored.
- [ ] Stop the database and verify readiness becomes unavailable without exposing stale data as fresh.
- [ ] Roll back the application image/source revision, restore the last known-good database backup if schema changes require it, and re-run health checks.
- [ ] Keep the previous deployment available until scheduler and source health remain stable for one ingest interval.

## Drill evidence record

Run this checklist against an isolated disposable stack. Do not run destructive
restore or failure-injection steps against production. Keep credentials, private
source URLs, and raw private-file contents out of the evidence.

| Field | Record |
| --- | --- |
| Environment and date | Pending |
| Application source SHA / image digest | Pending |
| Backup identifier and checksum | Pending (redacted) |
| Restore target and row-count/digest comparison | Pending |
| Failure injected and expected behavior | Pending |
| Observed readiness, source-run, and scheduler results | Pending |
| Correlation ID and redacted error-log reference | Pending |
| Rollback action and post-rollback health result | Pending |
| Operator / reviewer | Pending |

Attach the command output or a protected evidence reference for each completed
step. A checked box without a matching run record is not restore or failure-path
evidence. Record any skipped step as blocked with its dependency and owner.
