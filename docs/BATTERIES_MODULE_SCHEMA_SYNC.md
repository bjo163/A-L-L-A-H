# Batteries module schema synchronization

## Decision

Empire uses declarative, code-owned model schemas with Odoo-style plug-and-play installation. Knex remains the PostgreSQL driver and query builder; the application does not use Knex's migration-file runner as its schema installation mechanism.

When the API starts, it loads the allowlisted first-party module set, resolves dependencies, and asks Batteries to synchronize each enabled module's registered models. `pnpm db:sync` runs the same install/sync path without starting HTTP. `pnpm db:preflight` prints schema and declared data-upgrade checks without changing the database. Restarting is idempotent.

## Sync contract

The sync engine may:

- create a missing table with its primary key, declared columns, indexes, unique constraints and foreign keys;
- add a missing nullable column;
- add a missing required column when its database default safely populates existing rows;
- add missing declared indexes and unique constraints after checking existing data for conflicts;
- report the exact schema changes it applied.

By default, sync adds compatible schema only; it does not drop tables or columns, infer renames, rewrite existing types, tighten nullability on existing data, or replace user-edited seed content. Preflight checks primary keys, field types/nullability, duplicate values before unique indexes, and orphan/conflicting foreign keys. Unsafe drift stops startup and reports the table/column and the needed reviewed upgrade rule. No DDL or data repair may partially commit.

Models may explicitly declare a deterministic `uniqueConflictResolutions` policy for a unique constraint when legacy duplicate rows represent one logical record. Preflight reports this repair without writing. During the serialized sync transaction, Batteries keeps the row selected by the model's `keepBy` fields (descending, then `id`), removes superseded duplicates, and creates the unique index. Models without such a policy continue to block on duplicates. This mechanism is for idempotent, model-defined reconciliation; it does not infer a merge policy for arbitrary tables.

PostgreSQL advisory transaction locks serialize concurrent API replicas. The complete module installation and its seed operation run inside one transaction. Seeds use stable natural keys and insert-if-absent behavior; credentials are required only when creating the privileged local accounts and are never reset by restart.

## Current implementation and boundary

- `@empire/batteries` owns field-to-PostgreSQL mapping and safe additive schema reconciliation.
- `@empire/batteries-base` maps allowlisted manifest model IDs to statically imported classes, validates table ownership and declared dependency references, and owns idempotent local base records.
- API startup performs synchronization before registering routes; readiness checks the resulting required tables.
- `modules/*/manifest.json` declare their model IDs. The current local allowlist activates kernel, governance, and research; the other modules remain scaffold-only and their tables/routes are not installed.
- A kernel-owned module installation journal records module version and SHA-256 schema hash. Readiness checks that installed version/hash state against the active declarations.
- Model/database contract differences that need a data transform use typed, code-owned upgrade hooks referenced by stable IDs in the manifest, not Knex migration files. Each rule must include an explicit review decision, reviewer, timestamp and reference, plus preflight, transactional apply and postcondition verification. No current manifest needs a data transformation rule.

## Delivery plan to finish plug-and-play modules

1. **Foundation auto-install — implemented.** Boot-time schema creation, safe additive updates, serialization, transactions, idempotent seeds, and schema-based readiness. `db:sync` calls the same path.
2. **Module model registry — implemented.** Manifest model IDs resolve through static first-party registries; reference ownership must be provided by that module or its dependencies. Sync order follows the resolved module DAG. Untrusted package loading stays disabled.
3. **Preflight and schema journal — implemented.** `--dry-run` reports current/safe/blocked models. The kernel journal stores installed module version and schema hash; readiness checks active module records.
4. **Explicit upgrade rules — framework implemented, no production rules currently required.** Typed stable IDs carry from/to versions, explicit review metadata, read-only preflight, transactional apply, and verification. Rules must be declared by the module manifest and registered in code. Destructive auto-drops remain prohibited.
5. **Disable and uninstall lifecycle — partially implemented.** Disabled modules do not install their tables or register their routes, and their existing tables are retained. Operator-driven uninstall, job shutdown, and retention workflow remain to be added.
6. **Operational hardening — repeatable smoke path added; rollout drills pending.** `pnpm db:sync:smoke` creates a uniquely named temporary PostgreSQL schema, exercises fresh install, allowlisted module install, concurrent restart, idempotent seed behavior, editorial edit preservation, safe additive columns, unique-index conflict detection, blocked drift, reviewed version upgrades and rollback, then drops only its own schema. Existing legacy database, restore from backup, and large-table performance drills remain release gates.

## Rollout sequence

1. Back up any existing database.
2. Deploy the model sync code and start one API instance first. The schema changes are additive; any unsafe mismatch aborts and returns a clear error while the transaction rolls back.
3. Confirm `/v1/readiness` reports `schema: current`, then allow other replicas to start. Advisory locking serializes their no-op sync.
4. Use the saved backup and normal PostgreSQL restore procedure if a wider rollback is needed. The synchronizer does not attempt reverse destructive changes.

## Acceptance criteria

- A new empty database becomes usable without a migration command.
- Restart and concurrent startup produce no duplicate tables, seed records, or privilege changes.
- Existing rows survive additive sync unchanged.
- Unsafe schema drift fails before the API reports ready and leaves the database transaction unchanged.
- Optional module models are installed only when that allowlisted module and its dependencies are enabled.
- The module catalog, installed-schema journal, readiness and operator sync report agree on module/version/hash state.
- `--dry-run` produces a no-write preflight report and exits nonzero if it finds a blocker.
