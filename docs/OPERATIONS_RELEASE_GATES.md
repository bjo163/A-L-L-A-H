# 100CENTER RELEASE AND CERTIFICATION GATES

All checkboxes start as NOT VERIFIED until evidence is attached to the repo.

- [ ] G00: pnpm workspace install produces committed lockfile, deterministic lint/test/build CI.
- [ ] G01: module-kernel contract validation, cycle/dependency/capability conflict tests.
- [ ] G02: local PostgreSQL connection and transactional module schema sync; tenant-scoped research records; backup/restore drills still required.
- [ ] G03: local username/password sessions, revocation, server RBAC and tenant checks are implemented; OIDC and negative-test evidence remain required for production.
- [ ] G04: local canonical API exposes OpenAPI and the Command Center uses `@empire/api-contract`; production ownership and full contract parity still require approval/evidence.
- [ ] G05: ResearchRun -> Workflow -> Job -> Evidence -> Approval -> Audit endpoints are implemented; live persisted acceptance evidence still required.
- [ ] G06: 100CENTER displays live health, modules, CAB and research data with permission-gated actions; browser acceptance evidence still required.
- [ ] G07: Next public portal publishes only reviewed content.
- [ ] G08: source-licensed corpus import, provenance and context-preserving knowledge search.
- [ ] G09: module install/upgrade/disable safely audited, dependency and rollback tested.
- [ ] G10: Coolify/Vercel production evidence, SLO, backup, restore, migration and rollback tested.

Current status: local PostgreSQL module schema sync, API session/RBAC, OpenAPI, research workflow and CAB Command Center screens are implemented. These gates remain unchecked until evidence is captured. This monorepo is not a production cutover for the external Gen2 service.
