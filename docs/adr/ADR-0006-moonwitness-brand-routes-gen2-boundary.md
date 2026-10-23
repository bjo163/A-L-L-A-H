# ADR-0006 PROPOSAL — MOONWITNESS BRAND, ROUTE OWNERSHIP & GEN2 BOUNDARY

**Status:** Proposed; maintainer and relevant MoonWitness Gen2 owner approval pending. No cutover authorized.
**Date:** 2026-10-23
**Scope:** This repository's public web routes and a future, separately approved Gen2 integration.
**Decision owners:** Repository maintainer, MoonWitness Gen2 API owner, security/tenant owner (names to be recorded on approval).

## Context

The repository contains a public MoonWitness experience and a private operator workspace, alongside a local Empire API used by this application. The frozen MoonWitness Gen2 contract remains authoritative for external Gen2 production. Brand concepts and crew personas must not silently acquire API capabilities or permissions.

This ADR makes ownership explicit for review. It does not assert that this repository owns or replaces the external Gen2 service, its data, or public API.

## Proposed brand hierarchy

- **Empire of the Light** is the parent project and repository umbrella.
- **MOONWITNESS** is the public product experience and public-facing narrative/content surface.
- **SHADOW** is the editorial and operator-workspace context. SHADOW is not a separate identity provider, permission system, or API.
- **100CENTER** is the human-governed operations and governance infrastructure/UI. It provides no authority by brand or persona alone.

Product names describe user-facing context; they do not define security principals or data tenancy.

## Canonical routes and ownership

| Route | Owner / purpose | Access boundary |
| --- | --- | --- |
| `/` | MOONWITNESS public landing experience, served by `apps/web` | Public |
| `/stories`, `/systems`, `/roadmap` | Public MOONWITNESS editorial/system information in `apps/web` | Public; only publish approved public content |
| `/workspace` | Existing SHADOW / 100CENTER operator application, served by `apps/web` | Private operations; API authorization remains mandatory |
| `/shadow` | Not canonical and not currently established as an alias | Do not add absent a separate route review proving redirect/alias semantics, auth parity, canonical links, and no parallel session/API behavior |

The public site and operator workspace may share a web deployment and design package, but must preserve separate route composition and access behavior. A page being served publicly does not make its data public. Do not expose tenant records, operator metadata, drafts, or private research in public routes.

## Capability, data, and API ownership

1. **One external Gen2 public door:** where integrating with MoonWitness Gen2, use the owner-approved `moonwitness-api` HTTPS/OpenAPI contract and its official SDK. Do not create a second public Gen2 API, have browser/SDK code connect to private databases, or proxy around its authorization.
2. **Local application boundary:** this repository's Fastify API and PostgreSQL are the local application's implementation boundary. This local API is not thereby the external Gen2 API or authoritative Gen2 datastore. The public and workspace clients call only approved API contracts; persistence is server-side.
3. **Models:** each domain model and capability has one named owner, one versioned contract, and an explicit tenant/privacy classification. Current local model ownership is recorded by the API/module contracts and their `owner` metadata. New or migrated models require a named owner before implementation; the logical D01–D10 blueprint domains do not imply separate services.
4. **Public narrative/editorial content:** MOONWITNESS public copy and publication decisions belong to the editorial content owner; public publication is an explicit reviewed projection, never a direct read of private operator or tenant tables.
5. **SHADOW workflow:** editorial drafts, approvals, and operator workflow remain under the owning capability and its authorization rules. “SHADOW”, a crew slot, G.O.D. 99, WINGS 10, or any other persona is descriptive/fictive assignment metadata only.
6. **100CENTER:** owns operator-facing workflow composition, not independent copies of domain records or permissions. It consumes API/SDK contracts and renders server-authorized data.
7. **Authorization:** authenticated identity, active tenant membership, scoped RBAC/mandates, consent, and server-side policy checks grant access. Crew/persona labels must never authenticate, authorize, select a tenant, or elevate privileges. Denied requests remain denied regardless of UI visibility.

Before any cross-system Gen2 model/API change, record the Gen2 capability owner, schema/API version and compatibility policy, source of truth, tenant/security classification, data mapping, retention/deletion obligations, and contract tests in the implementing change.

## Gen2 integration and migration plan

This is a staged proposal; only the first stage is in scope absent further approval:

1. **Inventory/read-only design:** map the existing approved Gen2 routes, SDK, models, and owners; compare them with local contracts. No production writes or traffic change.
2. **Versioned adapter:** after owner approval, implement a server-side adapter to the approved Gen2 API. Pin supported contract versions, validate requests/responses, preserve tenant and identity context, redact secrets/PII in logs, and fail closed on unsupported versions. Do not duplicate Gen2 persistence.
3. **Compatibility validation:** run contract/negative-authorization tests and migration rehearsals against an isolated non-production environment. Establish data mapping, idempotency, ordering, reconciliation, backup, observability, and success/abort thresholds. Any schema migration is additive/expand-contract where feasible and has a tested down/restore plan.
4. **Limited pilot:** only after written maintainer, Gen2 API-owner, security/privacy, and operational approval, route a bounded test cohort through the adapter. Keep the current public/API route and data source authoritative during the pilot; no silent dual-write.
5. **Separate cutover decision:** a traffic or source-of-truth cutover requires a new explicit approval/release decision with evidence. This ADR does not grant it.

### Rollback

For an approved pilot, rollback means stop new adapter traffic, restore routing to the previously authoritative API/client path, disable writes to the new integration, and reconcile any accepted writes from the audit/idempotency log. Restore data only from a verified backup when reconciliation cannot safely recover it. Keep the adapter and new schema dormant until the owner approves retry or removal. Rollback must not delete or rewrite Gen2 data. The exact runbook, thresholds, backup evidence, and tested procedure are prerequisites to a pilot; they are not yet certified by this design document.

## Approval and consequences

**Pending:** named maintainer approval; MoonWitness Gen2 API/capability owner approval; security/privacy and tenant owner review; confirmation of model owners and public content publication owner. Record reviewers, date, and any accepted amendments here before changing status to Accepted.

Until then, this is a reviewable proposal only. Existing route behavior and approved API contracts remain in force. No `/shadow` alias, parallel authentication/API, Gen2 ownership transfer, schema migration, production traffic shift, or public cutover is approved here.

Expected benefit: route/content ownership and security responsibilities are reviewable before schema/API work. Cost: cross-system work waits for named owners, versioned contracts, and operational evidence. Revisit if the Gen2 contract or product route map changes.

## Acceptance checklist

- [x] Parent/product/infrastructure brand relationship recorded as a proposal.
- [x] Canonical public and operator routes documented; `/shadow` is explicitly non-canonical absent review.
- [x] Local vs external Gen2 API/data boundaries and single-door rule stated.
- [x] Models/content ownership and tenant/security responsibilities mapped.
- [x] Crew/persona fiction explicitly excluded from authentication and API authorization.
- [x] Versioning, migration, pilot, and rollback conditions documented.
- [x] Unapproved cutover explicitly excluded.
- [ ] Maintainer and relevant Gen2/security owners approve and sign this ADR.
- [ ] Schema/API implementation changes cite the accepted ADR and pass contract/security review.
