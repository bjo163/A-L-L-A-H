# GENESIS DELIVERY ROADMAP
**Canonical execution backlog:** GitHub [issue #37](https://github.com/bjo163/A-L-L-A-H/issues/37)
and its linked issues are the issue-level backlog. This document is a high-level
outcome map only; it does not maintain a second task status. Check the live issue
before acting because its body contains dated audit snapshots.

**Priorities:** working, testable foundations before screens, scores or 109 agent replicas.

| Phase | Purpose and scope | Exclusions | Dependencies / blockers | Exit evidence |
|---|---|---|---|---|
| G00 | Establish reproducible repository, registry, module, UI, and CI baselines. | Does not certify a product or license source texts. | Local maintainers; source-rights review remains open. | Frozen-lockfile CI passes; registry and boundary validators pass; baseline and license gaps are documented. |
| G01 | Assign Gen2 capability/data owners and approve integration contracts. | No unilateral Gen2 cutover, duplicate API, or production migration. | Relevant Gen2 owners and an approved ADR. | Approved ADR names owners, source of truth, contracts, tenant/privacy rules, migration and rollback plan. |
| G02 | Ingest a small corpus of rights-cleared editions with provenance and source-bound retrieval fixtures. | No unlicensed complete books or forced theological equivalence. | License, edition, language, and community/editorial review. | Rights records, immutable source fixtures, provenance checks, and source-restricted retrieval tests. |
| G03 | Define Actor/Journey/Path contracts, consent transitions, event history, and tenant isolation. | No autonomous authority or cross-tenant data access. | G01 ownership and reviewed schemas. | Versioned schemas, transition tests, durable events, and negative tenant-isolation evidence. |
| G04 | Govern role assignment, revocation, appeal, human approval, and audit. | Persona labels do not grant permissions or create 109 running agents. | Named human owners, policy review, and G03 contracts. | Role uniqueness/eligibility tests, revocation and appeal evidence, and audited approval path. |
| G05 | Add bounded local AI retrieval with citations and reviewed tool permissions. | No uncited claims, unbounded tools, or AI-only approvals. | Licensed corpus, citation contracts, and G04 approval gates. | Adversarial fixtures pass; citations resolve to source records; tool allowlist and human review are exercised. |
| G06 | Run an approved 100CENTER pilot through the official API/SDK boundary. | No external production cutover or private-data exposure. | G01–G05 contracts, access approval, and representative test environment. | Same-SHA end-to-end evidence for create, review, run, suspend, repair, and retire. |
| G07 | Establish operational readiness for a production deployment. | No production-readiness claim from local CI alone. | Authorized hosting, credentials, qualified operators, and G06 acceptance. | Threat model, SLOs, tracing, deploy evidence, backups/restores, disaster recovery, and rollback rehearsal. |

No target dates are set because there is no verified schedule commitment. Link remote issues or milestones to these phases only after checking existing GitHub records; do not create duplicate remote tracking.

## Repository evidence boundary

Repository validation currently checks the 71 bilingual UNILEX concepts, four source-family records, four pillars, 99 organizational persona slots, 10 WINGS, first-party module manifests, and UI boundaries/assets. CI also runs API and web builds, workspace tests, disposable PostgreSQL auth/tenant tests, and schema-sync upgrade/rollback smoke tests. These checks establish repository and local implementation evidence only.

The phases below define measurable exit outcomes for the broader ecosystem. They do
not mirror the status of GitHub issues or mark any milestone complete. A passing
validator or local build is not an implemented licensed corpus or production
certification. Use issue #37 and linked issue state for current execution progress.

## Open local and owner tasks
- Approve data licensing matrix and languages for each edition.
- Review source-family vs theological referent distinctions.
- Adopt vocabulary migration contract/owner under formal Gen2 ADR.
- Build fixture corpus and test ambiguity of "Injil", "Taurat", "Arsy", "Mizan".
- Implement fully scoped mandate and human approval gates.
- Test 99 slots and 10 WINGS uniqueness with no permission side effects.
- Update the one-door API, SDK and 100CENTER only after authorized integration.
