# Local PostgreSQL setup

Empire API development uses PostgreSQL running on the developer machine. The API reads `DATABASE_URL` from the ignored root `.env` file and listens on `127.0.0.1:4000` by default.

## Existing local PostgreSQL

1. Create an empty local database, such as `eol`, and a local database role with permission to create tables and indexes.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to that local database. Keep the URL and all passwords out of Git.
3. Set separate `EMPIRE_OWNER_PASSWORD` and `EMPIRE_ARCHITECT_PASSWORD` values before first provisioning.
4. Run `pnpm install`.
5. Start the API. Active module schemas are created/synchronized automatically; check `http://127.0.0.1:4000/v1/readiness` after boot.

Example URL shape (replace all sample values locally):

```text
postgresql://postgres:replace-this-password@127.0.0.1:5432/eol
```

## Optional local container

The repository includes `infra/postgres.compose.yml`. In PowerShell, set a strong local-only password and start the container:

```powershell
$env:LOCAL_POSTGRES_PASSWORD = "replace-with-a-unique-local-password"
docker compose -f infra/postgres.compose.yml up -d
```

For this container, set `DATABASE_URL` to `postgresql://empire_local:<password>@127.0.0.1:5432/empire`. The PostgreSQL volume persists locally; protect it and make independent backups for any data you need to retain.

## Module schema synchronization

The API synchronizes active module model declarations during startup. Run `pnpm db:preflight` for a read-only change report, `pnpm db:sync` to install/sync, and `pnpm db:sync:smoke` for isolated PostgreSQL integration checks. Sync is serialized across replicas and transactional. It creates missing tables and adds safe new columns; it never drops data, changes an existing column type, or silently tightens nullability. A required new column on a populated table needs a declared database default or an explicit reviewed backfill/upgrade rule. Seed synchronization inserts missing records and does not reset existing user passwords or overwrite edited records.

The Fastify API currently uses the Empire Batteries Knex/Objection layer. Drizzle definitions in `packages/db` are a prototype and are not used by this runtime.
