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

## Per-SHA release evidence

Create one record for each release candidate and do not mark a gate complete from
a different commit. Keep deployment, backup, and rollback evidence redacted.

| Candidate SHA (full 40 chars) | PR / CI run | Reviewer(s) | Risks and rollback reference | Record date |
| --- | --- | --- | --- | --- |
| Pending | Pending | Pending | Pending | Pending |

| Gate | Required evidence for the same SHA (link or repo-relative evidence path) | Status (Pending / Pass / Fail / Blocked) | Owner / date |
| --- | --- | --- | --- |
| Repository validation | `pnpm run validate` output and CI run | Pending | Pending |
| Typecheck | `pnpm run typecheck` output and CI run | Pending | Pending |
| Tests | workspace test output and negative-auth test results | Pending | Pending |
| Build | production build output and CI run | Pending | Pending |
| UI review | per-scenario screenshot and result rows in `UI_REVIEW_MATRIX.md`, same SHA | Pending | Pending |
| Authentication | negative auth, role, tenant-isolation, and private-document results | Pending | Pending |
| Deployment | deployed image digest, source SHA, HTTPS route and health/readiness responses | Pending | Pending |
| Backup and restore | redacted backup verification and isolated restore rehearsal evidence | Pending | Pending |
| Rollback | application and data rollback steps exercised against the candidate | Pending | Pending |

A release candidate is not ready while any required check is red, missing, or
based on another SHA. For Blocked, record the concrete dependency and owner;
blocked is not a pass. Never claim production readiness without deployment and
recovery evidence. Use the merge-commit promotion flow in AUTOMATION.md.
