# GENESIS MONOREPO — DEVELOPER HANDOFF

Node >=22.12, pnpm 11.24, and local PostgreSQL are required for API operations.

## Local start

1. Clone `bjo163/empire-of-the-light`.
2. Activate pnpm using Corepack or the specified package manager version.
3. Run `pnpm install` to link workspace packages.
4. Copy `.env.example` to `.env`, replace the sample values locally, and keep `.env` private.
5. Start a local PostgreSQL instance and set its URL in `DATABASE_URL`.
6. Optional: run `pnpm db:preflight` to inspect changes, `pnpm db:sync` to install active module schemas, or `pnpm db:sync:smoke` to validate the synchronizer in a temporary PostgreSQL schema. Normal API startup performs the same sync automatically.
7. Start the API with `pnpm --filter @empire/api dev` at `127.0.0.1:4000`.
8. Start 100CENTER with `pnpm --filter @empire/command-center dev` at `127.0.0.1:5173`. Sign in with a provisioned operator account. CAB and Research actions follow server-side permissions.
9. Start the public portal with `pnpm --filter @empire/portal dev` at `127.0.0.1:3300`.
10. Read the API contract at `http://127.0.0.1:4000/openapi.json`.

## Database

The API uses the Empire Batteries Knex/Objection persistence layer against PostgreSQL. Active modules declare their models; Batteries creates missing tables and safely adds compatible columns at startup under a PostgreSQL advisory lock and transaction. It never automatically drops columns or rewrites existing types. Unsafe drift blocks startup with a specific repair requirement. The separate `packages/db` Drizzle package is a schema prototype and is not used by the API runtime.

## Security

The API listens on loopback by default. Privileged accounts require separate `EMPIRE_OWNER_PASSWORD` and `EMPIRE_ARCHITECT_PASSWORD` values when first provisioned. There is no shared default account password. Login issues a short-lived revocable bearer session; only the token hash is stored. The Command Center keeps its session in tab-scoped browser storage.

Keep database URLs and bootstrap passwords in private environment configuration. Do not place credentials in frontend `VITE_`/`NEXT_PUBLIC_` variables or commit them. The portal has no direct database access.

## Scope and readiness

The research workflow stores tenant-scoped runs, human approvals, workflow/job state, source evidence with provenance, and audit events. CAB decisions and execution history are available in the authenticated Command Center. OIDC, production deployment, backup/restore drills, licensed corpus import, and production certification remain separate release gates.
