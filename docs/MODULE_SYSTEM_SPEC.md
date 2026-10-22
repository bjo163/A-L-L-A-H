# ODOO-INSPIRED MODULE SYSTEM — CONTRACT v1

Not an Odoo replacement or runtime package marketplace. First-party modules are versioned, audited code.

Example manifest:
```json
{"id":"research","version":"0.1.0","owner":"research","dependencies":["kernel"],"capabilities":["research-runs"],"permissions":["research:read"],"models":[],"uiSlots":["operations.research"],"state":"scaffold_only"}
```

## Kernel checks
1. Unique module IDs and semantic versions.
2. Every dependency exists; reject cycles and self-dependencies.
3. Duplicate capability owners rejected before boot.
4. Topological module startup; kernel first.
5. Explicit allowlist. A scaffold module is never treated as executable.
6. Active first-party modules register code-owned model classes; Batteries synchronizes additive schema at startup. Destructive or data-dependent upgrades require an explicit, reviewed module upgrade rule.
7. Lifecycle transitions, approval, compatibility and rollback recorded in persistent audit when implemented.
8. Permissions are **server-side**. A manifest never grants user privileges.

## Planned Odoo-like features
- Module catalog, versioned install/upgrade/disable, per-tenant enablement.
- Declared data models, menus/slots, policy hooks, navigation contributions.
- Dependency-aware schema sync, idempotent seed data with provenance, extension points.
- Dedicated settings inspector in 100CENTER, not a new global sidebar page.
- Activity log, background jobs, domain event/outbox and audit.
- Cross-module integration via typed contracts, never private SQL or route calls.

## Non-negotiable
No untrusted dynamic imports from user uploads. No self-updating production schemas. No module creates a public API outside canonical gateway. No filesystem access from UI, and no celestial/faith ranking assigned by software.

## Source rights
Four scripture source families are metadata only until license-reviewed editions and text witnesses have been ingested; system never equates Torah with all Islamic Tawrat uses or Christian canonical Gospels with every Islamic Injil sense.
