# Docker Compose deployment

This is a self-hosted Compose baseline with three services: PostgreSQL, the API, and one Next.js web app. The web app serves the public site and the operator workspace at `/workspace`. There is no reverse proxy or TLS termination in this setup.

## Requirements and first start

- Docker Engine with the Compose plugin.
- A host that can reach the package registry and public monitoring sources during image build and API operation.
- A trusted host or private network. Do not expose these plain HTTP ports directly to the public internet; provide TLS and network access control outside this stack before public use.

From the repository root, copy `infra/docker.env.example` to `.env`. Set `POSTGRES_PASSWORD` to a long URL-safe random value (for example, generate 32 random bytes and encode them as hex), and set `FILE_STORAGE_SIGNING_SECRET` to at least 32 random bytes. Keep `.env` out of Git. Set `INTERNAL_API_ORIGIN` to the API address reachable from the web app container and set `CORS_ORIGINS` to the public web origin, including scheme and hostname.

For production, set `CORS_ORIGINS` to the full browser origin. For example, `https://cc.moonwitness.biz.id`. The app uses a same-origin `/api` path and its Next.js server forwards requests to `INTERNAL_API_ORIGIN`, keeping the API host out of browser requests. Configure TLS and public domain routing at the deployment proxy.

Start the stack:

For a new database, also set distinct `EMPIRE_OWNER_PASSWORD` and
`EMPIRE_ARCHITECT_PASSWORD` values in `.env` (or Coolify environment variables).
They provision the `4-lah` and `shadow` operator accounts. Existing accounts keep
their current passwords; the variables do not reset them on restart.

```sh
docker compose --project-directory . --env-file .env -f infra/compose.yaml config
docker compose --project-directory . --env-file .env -f infra/compose.yaml up -d --build
docker compose --project-directory . --env-file .env -f infra/compose.yaml ps
```

This Compose file exposes the web app and API only on the internal Compose network; it does not publish host ports. To open the site at `http://localhost:3300`, add an explicit local `ports` mapping for the web service or route it through a local proxy. Do not publish the API unless direct host access is needed; the web app uses `/api` on its own origin and forwards requests from its server to `INTERNAL_API_ORIGIN`. PostgreSQL has no published host port:

```sh
docker compose --project-directory . --env-file .env -f infra/compose.yaml build --no-cache web
docker compose --project-directory . --env-file .env -f infra/compose.yaml up -d web
```

The API runs its existing enabled-module schema synchronization during startup. Review database preflight and backup requirements in [AUTOMATION.md](AUTOMATION.md) before using this stack with existing or valuable data. Compose does not automatically apply the legacy dictionary migration.

## Health and logs

```sh
docker compose --project-directory . --env-file .env -f infra/compose.yaml ps
docker compose --project-directory . --env-file .env -f infra/compose.yaml logs --follow api
docker compose --project-directory . --env-file .env -f infra/compose.yaml logs --follow web
```

The API health check uses `/v1/readiness`, which also checks the current database schema. Keep the default single API instance: YouTube scan rate limits are process-local. Horizontal replicas require a shared limiter first.

If Compose reports `dependency api failed to start`, inspect the API log above:
the web app is waiting for API readiness. In particular,
`ERR_MODULE_NOT_FOUND` for `batteries-world-monitor/src/types.js` indicates an old
image whose World Monitor entry points at TypeScript source. The package now builds
and exports `dist/index.js`; rebuild the API and web app from the updated
source. Increasing the health-check timeout cannot repair a missing runtime module.
Fresh provisioning also creates `tenants` before `partners`, which references it.
If startup asks for `EMPIRE_OWNER_PASSWORD` or `EMPIRE_ARCHITECT_PASSWORD`, provide
the two first-provisioning passwords above and redeploy.

## Backup and restore

Take a PostgreSQL backup and a separate archive of uploaded private files before upgrades or schema changes. Store backups outside the Compose volumes and test restores on an isolated stack.

```sh
mkdir -p backups
docker compose --project-directory . --env-file .env -f infra/compose.yaml exec -T postgres pg_dump -U empire -d empire -Fc > backups/empire.dump
docker run --rm -v empire-of-the-light_private_files:/source:ro -v "${PWD}/backups:/backup" busybox tar czf /backup/private-files.tgz -C /source .
```

The second command assumes the default Compose project name (`empire-of-the-light`). If `COMPOSE_PROJECT_NAME` is customized, inspect `docker volume ls` and use that project's `private_files` volume name.

For a restore, stop all application services first and restore into a disposable/test stack or a deliberately selected empty database. Do not run a destructive restore against a live database as a routine update:

```sh
docker compose --project-directory . --env-file .env -f infra/compose.yaml stop api web
docker compose --project-directory . --env-file .env -f infra/compose.yaml exec -T postgres pg_restore -U empire -d empire --clean --if-exists < backups/empire.dump
docker run --rm -i -v empire-of-the-light_private_files:/target busybox sh -c 'tar xzf - -C /target' < backups/private-files.tgz
```

Restore the private-files archive into the corresponding volume with a one-off helper container, then run readiness and application smoke checks before reopening access. Retain the pre-restore backup until the restored application data and files have been verified.

## Stop and update

```sh
docker compose --project-directory . --env-file .env -f infra/compose.yaml down
docker compose --project-directory . --env-file .env -f infra/compose.yaml build --pull
docker compose --project-directory . --env-file .env -f infra/compose.yaml up -d --build
```

`down` preserves named volumes. `down -v` deletes the database and private-file volumes and must not be used as a normal stop command. Keep the previous image/build and the database/file backup available for rollback; an image rollback alone may not reverse a schema change.

CI builds all three application images and verifies API readiness against disposable
PostgreSQL. Public-domain access, browser workflows, and backup/restore still need
deployment-specific acceptance checks.
