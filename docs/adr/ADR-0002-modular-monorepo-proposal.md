# ADR-0002 — MODULAR MONOREPO PROPOSAL

**Status:** PROPOSED, NOT APPROVED BY MOONWITNESS GEN2 OWNERS.

## Context
The user requested a unified React Vite/Next + Fastify + ORM system with Odoo-style modules, prioritizing operational 100CENTER rather than more fictional roles.

## Proposed choice
pnpm workspaces, Vite for admin, Next.js for public, Fastify for canonical/integration API, Drizzle ORM for Postgres, first-party declarative modules and explicit human approvals.

## Consequences
Fewer independent deployable components, one coherent capability catalog, typed schema, deterministic module dependency order, better local AI maintainability. Added responsibilities: schema migrations, module versioning, database ownership, tenant auth and high-quality integration tests.

## Rejected
Untrusted plugin marketplace; one AI model/server per persona; auto-applying schema DDL on module import; dual independently public APIs; direct admin database access; premature microservices.

## Migration condition
The frozen MoonWitness Gen2 API ownership is authoritative. For Gen2 integration, approve a separate ADR with capability owners, contract diff, security/rollback test and traffic migration. This ADR is only a repo-local engineering proposal.

## Rollout
Start with source-controlled scaffold, CI and private local Fastify. Production traffic stays on current Gen2 boundary until credentials, databases, backup and security gates pass.