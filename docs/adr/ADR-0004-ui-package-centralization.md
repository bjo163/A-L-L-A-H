# ADR-0004 — UI Presentation Ownership in `@empire/ui`

**Status:** Accepted for implementation in this repository; final brand artwork and product visual acceptance remain separate review gates.
**Date:** 2026-10-22
**Owner:** UI maintainer role. **Reviewer:** product/design and accessibility reviewer roles; named human acceptance is recorded with the relevant release review.

## Context

Portal (`apps/portal`) and Command Center (`apps/command-center`) are separate products with different routing, domain data, permissions, and workflow. Their reusable visual language, however, must be owned once so that fixes to tokens, controls, patterns, brand assets, and accessibility behavior do not drift into separate app implementations.

The repository already contains `packages/ui`, shared CSS/token entry points, shared layouts and patterns, an asset manifest and generators, and consumer boundary audits. A number of product stylesheets remain because they still contain presentation for active product compositions. Deleting them before their visual behavior has moved into package-owned product profiles would break the centralization goal.

## Decision

1. `packages/ui` is the sole source of truth for shared and product-specific **presentation**: design tokens, themes, typography, CSS reset, primitives, patterns, shells, brand marks, icons, illustrations, motion, and product profiles.
2. Apps retain product-owned routing, data, copy, localization, authentication, permission filtering, domain status mapping, business workflows, and vendor runtime lifecycle. They compose package components and translate domain state into presentation props; they do not create parallel visual systems.
3. Product-specific visual differences live in package-owned, namespaced profiles (`portal.css` and `command-center.css`) and documented component variants. They may express editorial versus operational density and composition, but may not redefine shared semantic meaning, status colors, controls, or brand identity independently.
4. Vendor styles are an explicit opt-in adapter owned by the package. A vendor selector may be styled only under its adapter root (currently `.eol-map-frame`); vendor runtime, data, and DOM lifecycle remain app-owned.
5. The supported stylesheet contract is explicit and tested: Portal imports `@empire/ui/portal.css` once. Command Center imports the shared `@empire/ui/ui.css`, the opt-in MapLibre adapter after vendor CSS when a map is present, and `@empire/ui/command-center.css` once. Shared reset/token roots stay in the common entry; product selectors stay beneath their product shell. No app-owned CSS entry or inline style props are permitted by the current boundary audit.
6. Migrations are consumer-first and deletion-based: move a presentational rule or component to package ownership, migrate every active consumer in the same reviewed slice, verify the named consumer builds and the package catalog represents the API, then delete obsolete app-owned styling. Do not keep a forwarding duplicate or a shadow token after cutover. A product rule can remain in a package product profile while an active product composition still needs it.
7. Package APIs stay framework- and domain-neutral. Consumer-supplied slots/renderers may bridge routing and business composition, but shared patterns must not wrap a link renderer in another interactive element. Shared semantic HTML and ARIA contracts remain package-owned.
8. Breaking visual/API changes include a migration path and update both consumers, catalog fixtures, public exports, documentation, and boundary checks in one change.

## Exceptions

- Vendor CSS itself is not copied into `packages/ui`; only the package-owned opt-in adapter may skin vendor selectors within its root.
- Data-dependent inline presentation values (for example map coordinates, canvas dimensions, progress values, or validated layer colors) may be passed through documented props when CSS tokens cannot express them. This does not authorize app-owned static design declarations.
- Framework-required public asset placement may contain generated files, but the editable master stays in `packages/ui`; generated copies are checked against the package manifest.
- Product-specific composition and domain copy remain in their apps when they use package presentation contracts and do not recreate a generic visual component.

## Consequences

- A visual consistency fix has one package owner and can be validated against both product profiles.
- Apps can keep different information architecture and workflows while sharing the same token, control, typography, and accessibility contracts.
- Removing an app style requires evidence that its active consumer has moved; a stylesheet's continued presence inside the package is not automatically duplication when it is an intentional product profile.
- Package changes carry broader impact, so named exports, catalog coverage, consumer builds, duplicate/boundary audits, and rendered review evidence are part of acceptance.
- The current CSS cascade is kept in its verified import order. Introducing CSS cascade layers requires migrating all participating sheets and validating computed styles; layering only one entry is prohibited.
- This ADR establishes code ownership and migration policy. It does not select a final logo, grant trademark rights, or substitute for cross-route visual, keyboard, screen-reader, forced-color, and reduced-motion review.

## Enforcement and evidence

`pnpm audit:ui-boundary` enforces consumer stylesheet entries, product selector scope, shared class ownership, and the absence of app CSS/inline style props. `pnpm audit:ui-css` checks repeated declarations. UI assets are checked against their source/manifest. The required acceptance matrix is maintained in `docs/UI_REVIEW_MATRIX.md`, and the detailed implementation status and remaining gates stay in `docs/BLUEPRINT_UI_CENTRALIZATION.md`.

## Revisit when

- A third product has a legitimate presentation profile that the current ownership model cannot express without duplicating shared semantics.
- A vendor adapter requires a broader or differently isolated boundary.
- A measured cascade/performance issue justifies a coordinated import architecture change.
- The approved brand system or a documented product requirement changes the shared token/profile contract.
