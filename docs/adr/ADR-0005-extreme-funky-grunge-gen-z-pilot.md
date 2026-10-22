# ADR-0005 — Extreme Funky Grunge Gen Z Direction

**Status:** Implemented on the production Portal surface in `dev`; pending PR review and CI validation.  
**Date:** 2026-10-23  
**Owner:** `packages/ui`  
**Decision:** Extreme intensity · Dual theme · Real product first.

## Context

The repository already has a centralized `@empire/ui` package, semantic design tokens, light/dark themes, manga effects, and a public Portal. The requested direction is an expressive evolution: Funky Grunge Gen Z, with bold editorial typography, rough graphic texture, high-contrast shapes, hard shadows, and manga-inspired accents. This must improve the real product rather than leave a demo as the deliverable.

## Decision

1. **Apply to the actual Portal.** Production route styles are authored in `packages/ui/src/products/portal-manga.css`, consumed by the Portal through `@empire/ui/ui.css`.
2. **Dual theme.** Light and dark remain first-class; use existing semantic tokens and theme attributes rather than a parallel palette.
3. **Extreme, not unusable.** Keep expressive typography, texture, hard edges, graphic accents, and asymmetry while protecting legibility, navigation, and real route actions.
4. **Shared design ownership.** `packages/ui` owns presentation primitives, tokens, effects, accessibility contracts, and product profiles. Apps retain routing, domain data, permissions, localization, and workflows.
5. **Distinct product contexts.** The Portal may be expressive and editorial; Command Center remains scan-friendly and operational. Shared components and semantic status meanings stay consistent.
6. **Accessibility is part of the implementation.** Preserve visible keyboard focus, adequate target sizes, responsive layouts, contrast, forced-colors compatibility, and reduced-motion preferences.
7. **No parallel UI foundation or fake interactions.** Reuse existing components and existing destinations. Catalog fixtures are not the production deliverable.

## Implementation scope

- Added a production-scoped visual refinement to the Portal styles: eyebrow treatment, typography rhythm, interactive action feedback, card edges/shadows, and mobile layout details.
- Kept styling scoped to `.eol-public-shell` so it does not unintentionally restyle unrelated products.
- Removed the catalog-only design pilot component and its associated catalog CSS/rendering.
- Preserved existing navigation, route actions, product content, and light/dark theme bootstrap.
- No Vercel deployment was attempted as part of this rollout.

## Validation gates

- [ ] Run root validation, package typecheck/build, and relevant tests after the production CSS change.
- [ ] Review screenshots in light and dark themes at desktop, tablet, and mobile widths.
- [ ] Check long/localized content, keyboard navigation, contrast, forced colors, and reduced motion.
- [ ] Verify the Portal's real navigation and action destinations remain functional.
- [ ] Resolve any failing CI/promotion workflow before merging to `main`.

## Consequences

The live Portal implementation now carries the intended direction in the development branch, rather than presenting it only in the catalog. This change is not yet merged to `main`; production release status must not be claimed until review and checks pass. The wider Command Center and other applications should be migrated only through their own scoped product styles, not by globally imposing the Portal's editorial treatment.

The final master logo remains subject to its separate concept/provenance review. Visual direction does not imply trademark clearance or approval for external brand use.
