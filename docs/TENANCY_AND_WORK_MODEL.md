# Tenancy, partners, and work records

## Ownership and access

- `users` is the global authentication identity. A login is not a tenant membership.
- `tenant_memberships` grants access to one tenant and carries the tenant-local membership role/status. Only `status=active` authorizes data access. The current application permission system remains global RBAC; tenant roles do not silently grant API permissions.
- Tenant-owned requests resolve from `X-Tenant-Id`. When the header is absent, the API accepts the request only when exactly one active membership exists. No active membership returns 403; multiple memberships require selection and return 400. An explicit tenant must match an active membership.
- `partners` are tenant-local companies/contacts. Linking `userId` associates a local partner profile with an active member but grants no access by itself. A partner's parent must belong to the same tenant. Existing partner rows are assigned to the seeded `empire-local` tenant without changing their IDs or contact data.
- Existing partner `tenant_id` values are backfilled before the API exposes tenant-filtered routes, then protected by a database check constraint. If an older install still has the former global unique constraint on `partners.user_id`, startup removes that constraint only after checking that the new per-tenant uniqueness is valid; it retains all rows and replaces the rule with `(tenant_id, user_id)` uniqueness.
- Tenant membership management is under `/v1/tenant-memberships`; an authorized user may add an existing active account or suspend/reactivate a membership. Membership rows are retained for audit and history.
- `/users`, Continuum, world-monitor telemetry, and CAB remain global system/admin or governance records. CAB has an independent approval/execution lifecycle; it is not a project task. Research runs remain in their existing approval/workflow lifecycle and can be referenced by a tenant task or document.

## Work records

The `work` module owns `workspaces`, `projects`, `tasks`, and `documents` and depends on `kernel` and `research`. Every query scopes by tenant. A workspace is the tenant-level collaboration container; a project belongs to one workspace. Task assignees must be active tenant members; referenced projects and research runs must belong to the same tenant. A task belongs to a project. A document belongs to a project and may refer to a task from that same project and/or a same-tenant research run.

Document rows are metadata and integrity records only. The API does not upload, fetch, or serve file bytes; an external storage provider and its authorization flow must be implemented before storage keys can be treated as downloadable links. Do not place credentials or signed URLs in `storageKey`.

The collaboration layer reuses `audit_logs` for append-only operational activity and `documents` for attachment metadata; it does not introduce duplicate activity or file records. The work module also owns tenant-scoped `comments`, `tags`, and polymorphic `tag_assignments`. `notification_outbox` stores idempotent delivery intents, while `notifications` is the per-user inbox. A worker claims outbox rows with PostgreSQL row locks and creates inbox notifications only for active members of the same tenant; external email/push delivery is not configured. Polymorphic entity references are checked against tenant-owned targets before they are exposed or written.

The API's file adapter stores bytes in a private local directory (`FILE_STORAGE_DIR`, default `./var/private-files`) with generated tenant-prefixed keys, a 25 MiB limit, SHA-256 verification, and non-executable attachment downloads. Authenticated tenant members request a 10-minute HMAC-signed link; the link is revoked by expiry or document archival. Configure `FILE_STORAGE_SIGNING_SECRET` with a random secret of at least 32 bytes for production. Local-disk storage is intended for the current single-host runtime; multi-instance deployments need a shared private object-storage adapter before horizontal scaling.

## CRM and business operations

The `work` module also owns the tenant-scoped business workflow: CRM opportunities linked to tenant partners; a product/service catalog with tenant-unique SKU; quotes and immutable line snapshots; accepted quotes create a sales order and copy the quoted lines in the same database transaction. Quote stages are `draft → sent → accepted|rejected|expired`; terminal quotes cannot be transitioned again. Amounts use PostgreSQL `numeric(20,4)` storage through the Batteries `decimal` field type. The API calculates quote totals from quantity, unit price, and a percentage tax rate rather than trusting submitted totals.

Operational invoices can link to a same-tenant sales order and must use that order's partner. Payment records are append-only; invoice rows are locked while applying a payment, overpayment is rejected, and invoice status is derived as issued, partially paid, or paid. Expenses are operational tracking records, not a general ledger or tax accounting system. Calendar activities may link to a tenant partner, opportunity, project, task, and active tenant member; timestamps are stored in UTC. All routes require the authenticated tenant context plus `work:read` or `work:write`, and creation/update actions enter `audit_logs`.

New tables: `crm_opportunities`, `catalog_items`, `sales_quotes`, `sales_quote_lines`, `sales_orders`, `sales_order_lines`, `operational_invoices`, `operational_payments`, `operational_expenses`, and `calendar_activities`. Schema sync creates these additive tables; it does not import or synthesize historical business data. This operational layer does not provide inventory reservation, tax compliance, ledger accounting, payment-gateway settlement, or recurring billing.

YouTube Sentinel observations stay global system telemetry. New partner associations are stored separately in `youtube_sentinel_partner_links`, scoped by tenant, so linking a contact cannot mutate global observations or expose contact details through the public monitoring endpoint. Legacy global partner IDs remain intact in their original column but are not imported because they do not record a tenant or operator; the public API ignores them.

## Legacy dictionary migration to UNILEX

The old `dictionaries` table remains as the source of truth during the cutover because `/users` and Continuum read its vocabulary. The 71-entry UNILEX seed registry is not a drop-in target: the old role vocabulary is not necessarily a universal concept, its legacy definition fields are unreviewed, and `lexicons` also contains a separate 99-entry project mapping. No automatic semantic equivalence is safe.

### Field preservation mapping

| Legacy field | Migration treatment |
| --- | --- |
| `id` | Preserve as `legacySourceId` in an import ledger; allocate a stable UNILEX concept ID only after identity review. |
| `code` | Preserve exactly as `legacyCode` and use as a deterministic source key; do not assume it is a UNILEX ID. |
| `term` | Copy verbatim into a locale-tagged legacy label only when its language is verified; otherwise retain it as an untagged source value in provenance. |
| `revelationOrigin` | Preserve verbatim as `legacyFields.revelationOrigin`; it is not accepted as source provenance until checked against a cited source. |
| `frequencyDomain` | Preserve verbatim as `legacyFields.frequencyDomain`; map to a canonical domain only by reviewed crosswalk. |
| `esotericDefinition` | Preserve verbatim as `legacyFields.esotericDefinition`; do not promote to an approved definition without editorial/source review. |
| `category`, timestamps | Preserve in the source snapshot and import ledger; assign review status `DRAFT_REVIEW`. |

### Required migration sequence

1. Run `pnpm --filter @empire/api db:sync` to add the empty ledger table. Startup schema sync never copies dictionary data.
2. Run `pnpm --filter @empire/api dictionary:migration:dry-run`. It reports source/ledger counts, a stable batch ID, and source-set hash without printing record contents or writing data.
3. After reviewing that report and taking the normal database backup, run `pnpm --filter @empire/api dictionary:migration:apply`. It copies every legacy row, including soft-deleted rows, into an immutable JSONB snapshot with a row hash and a `DRAFT_REVIEW` proposal. The source table is never updated or deleted. Re-running is idempotent; changed or vanished source rows stop the import for manual reconciliation.
4. `/users` dictionary and Continuum use the compatibility service. It reads the imported snapshots only when every current source row has a matching hash; otherwise it falls back to the live legacy table. This keeps reads stable while edits happen during cutover.
5. Review every record and create a human-approved crosswalk to a canonical UNILEX concept. Automatic matching by `code`, term, or meaning is prohibited. Keep unreviewed rows in the import ledger; do not write them into the canonical registry.
6. Verify counts, row hashes, and compatibility responses after import. Only a separate reviewed decision after domain, language, and source review may retire the legacy table and fallback.

The ledger and explicit copy-only importer are implemented. Canonical UNILEX mapping and legacy-table retirement remain editorial/schema decisions that must not be inferred by software.
