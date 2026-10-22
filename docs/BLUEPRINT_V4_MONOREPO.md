# GENESIS v4.0 — EMPIRE OF THE LIGHT MODULAR MONOREPO

**Status:** DESIGN PROPOSAL + SCAFFOLD; not a production deployment, not approved in Gen2 architecture.

## Tech decision
- **pnpm workspaces + Turborepo** for controlled module/package dependencies.
- **React + Vite + TypeScript**: authenticated 100CENTER operations SPA.
- **Next.js App Router**: separate public portal, SSR and content.
- **Fastify 5 + TypeScript**: one controlled local Empire API boundary with generated OpenAPI at `/openapi.json` and a shared `@empire/api-contract` client.
- **PostgreSQL + Empire Batteries (Knex/Objection)**: API persistence with declarative, additive module schema synchronization at startup. `packages/db` Drizzle definitions are a prototype and are not used by the API runtime.
- **Module Kit**: first-party manifests, dependency sorting, capability owner checks, isolation, lifecycle proposals.
- **Local AI**: optional tool adapter with provenance and human approvals; no auto-authorization.

## Target directory layout
```text
apps/
  command-center/             # Vite React operations
  portal/                     # Next public SSR
  api/                        # Fastify API and module host
packages/
  ui/                      # shared React primitives and design tokens
  module-kit/                 # Manifest validation + deterministic resolver
  db/                         # Drizzle schema prototype; API runtime uses Batteries models
  api-contract/               # shared API paths, DTOs and fetch client
modules/
  kernel/ research/ scripture/ journey/ mission/ governance/ ziil/
config/modules.json          # allowlisted bootstrap modules
data/ schemas/               # existing 71 UNILEX, AGE, G.O.D.99/WINGS10, 4-source registries
```

## Canonical data and API ownership

For shared UI ownership, design foundations, user journeys and phased delivery, see the [UI Blueprint and long-term checklist](BLUEPRINT_UI.md). UI phases depend on the engineering and authorization gates below.

One source of truth for domain data. Fastify owns the local Empire API and its persistence boundary. UI never reads PostgreSQL directly. The Next public portal never exposes private tenant data. Modules cannot access each other's private DB tables; use typed contracts and owned services.

### Gen2 compatibility
The local Command Center and research workflow use this repository's Fastify API as their canonical local API. The external MoonWitness Gen2 service and its public production ownership remain separate; any public cutover or data migration still requires an approved ADR and tested rollout.

## Odoo-like modules (not Odoo itself)
- A module has `id,version,owner,dependencies,capabilities,permissions,models,uiSlots,state`.
- The registry validates manifest shape, missing/cyclic deps, conflicts and topological order.
- Only committed first-party code can be enabled; no arbitrary code download/execution.
- Lifecycle target: AVAILABLE -> VALIDATED -> INSTALLED -> ENABLED, then upgrade/disable/rollback, with human approvals and audit.
- Active module model declarations create missing tables and add safe columns automatically at startup. Destructive or data-dependent changes require a versioned, reviewed module upgrade rule.
- `kernel` cannot be disabled; target modules stay `scaffold_only` until API, DB, permissions and tests exist.
- Module dependencies map to required *interfaces*; never construct one microservice per module.

## Core modules
| Module | Job | Initial maturity |
|---|---|---|
| kernel | health, module metadata, actor/session boundary | executable bootstrap |
| research | ResearchRun/workflows/jobs/evidence bridge | bootstrap-ready locally |
| scripture | UNILEX + four independently sourced scriptures | scaffold |
| journey | SELF, COMMUNITY, GLOBAL Journey/Path | scaffold |
| mission | missions, assignments, duties, 99 personas/10 WINGS | scaffold |
| governance | AMANAH, SHURA, MIZAN, review and permission | bootstrap-ready locally |
| ziil | safety, rights, recovery, safeguarding | scaffold |

## Architecture guarantees
- **Public API:** only one authorized public door; versioned OpenAPI and SDK.
- **Identity:** provisioned local username/password sessions, least-privilege server RBAC, tenant-scoped research records. OIDC remains a production identity follow-up.
- **Persistence:** local PostgreSQL primary store; transactional schema sync, backups, retention and tested restore procedures.
- **Events:** idempotency, append-only audit, trace/correlation, safe retries and cancellation.
- **Knowledge:** four scripture source families retain witness, edition, language, license and source; no forced doctrinal equivalence.
- **AI:** cannot claim religious authority, divine messages, supernatural control or calculate salvation.
- **Observability:** health != readiness != mission completion.
- **Web:** public portal is read-only published material; command center admin requires authentication.

## Operational delivery stages
G-M0: monorepo structure + manifests + validators + code skeleton.
G-M1: package lock + typecheck + build + CI + local PostgreSQL module schema sync.
G-M2: server-verified local session/RBAC/tenant + module catalog state persistence; OIDC remains a production follow-up.
G-M3: tenant-scoped ResearchRun -> Workflow -> Job -> Evidence loop using canonical API.
G-M4: Command Center login, CAB approvals and execution, ResearchRun/Evidence drilldown, access logging.
G-M5: UNILEX/corpus source import and source-restricted search.
G-M6: Human-approved mission/Journey/ZIIL modules and public portal.
G-M7: backups, monitoring, deployed smoke, rollback, certification.

## Release gate
Never call the ecosystem operational until an authorized human can log in, submit a real mission, receive evidence, inspect audit history, resume after restart, revoke access, and verify database backups/restore and safe rollout.

## Open ADR decisions
- Is this monorepo a Gen2 application consumer or a formally migrated API/domain owner?
- Actual IdP, tenant roles, domain names and CORS.
- PostgreSQL hosting, schema/migration owner and data-retention plan.
- Copyright-cleared scripture editions for ingestion.
- Blue/green deployment/cutover preserving current CC and API behavior.
