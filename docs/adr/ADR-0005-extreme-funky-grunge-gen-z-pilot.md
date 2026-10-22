# ADR-0005 — Extreme Funky Grunge Gen Z Visual Pilot

**Status:** Accepted for an isolated catalog pilot; production-wide adoption pending visual and accessibility review.  
**Date:** 2026-10-23  
**Owner:** `packages/ui`  
**Decision:** Extreme intensity · Dual theme · Pilot-first.

## Context

The repository already has a centralized `@empire/ui` package, semantic design tokens, dark/light themes, manga effects, a visual catalog, and a Portal fixture. Replacing the system wholesale would duplicate existing capabilities and risk breaking product behavior.

The current `Empire Ink` moodboard favors a quieter canvas and restrained decoration. The product direction is now intentionally being explored at a more expressive intensity inspired by three pillars: Funky, Grunge, and Gen Z. This is an evolution to validate, not an automatic approval of a final logo, palette, or every decorative effect.

## Decision

1. **Intensity: Extreme.** Use bold editorial typography, hard edges, rough textures, high-contrast graphic shapes, collage, deliberate asymmetry, and expressive manga/SFX treatments.
2. **Theme: Dual theme.** Light and dark are both first-class. Use the existing semantic token/theme system; do not introduce a second global palette or hard-code product-wide colors.
3. **Strategy: Pilot-first.** Prototype the direction in the UI catalog using existing shared primitives. Do not apply the extreme profile to production routes until the pilot passes review.
4. **One shared design DNA.** `packages/ui` owns tokens, components, effects, accessibility contracts, and product profiles. Applications retain routing, domain data, permissions, localized product copy, and workflows.
5. **Distinct product expressions.** The Portal can be expressive and editorial; MoonWitness can be lunar/cinematic; Command Center remains scan-friendly and operational. Shared components and semantic status meanings remain consistent.
6. **Decoration is optional.** Textures, skew, hard shadows, SFX, and motion must not obscure content, focus, status meaning, or actions. Respect reduced motion and forced-colors mode.
7. **No duplicate UI foundation.** Reuse current primitives, manga components, tokens, catalog, asset pipeline, and validation scripts. Do not create a parallel component library.

## Audit findings

Repository audit on the `dev` branch found:

- `packages/ui/src/tokens.css` and `themes.css` already define palette and semantic roles for dark/light themes.
- `packages/ui/src/primitives` and `packages/ui/src/patterns` already provide reusable controls, layouts, navigation, and manga-related patterns.
- `MangaEffect`, `MangaPageIntro`, `MangaOrbit`, `MangaSfx`, and `MangaTelemetryHero` already exist.
- `packages/ui/catalog` includes a theme-aware visual catalog, Portal home fixture, Command Center fixtures, and a manga effect review.
- `apps/portal` consumes `@empire/ui`; root validation scripts include UI boundary, token, asset, SVG, contrast, and motion checks.
- `docs/adr/ADR-0004-ui-package-centralization.md` establishes `packages/ui` as the sole presentation owner.
- `AGENTS.md` and `docs/AUTOMATION.md` require development work on `dev`, with promotion through a PR to `main`.

This ADR adds a scoped art-direction experiment; it does not claim the production portal or every shared component has already adopted the new direction.

## Pilot acceptance gates

- [ ] Compare the pilot in both light and dark themes.
- [ ] Review wide, tablet, and narrow/mobile layouts.
- [ ] Confirm long headings and localized copy do not clip or overflow.
- [ ] Check keyboard focus, target sizes, contrast, forced colors, and reduced motion.
- [ ] Confirm semantic status colors are not replaced by decorative brand colors.
- [ ] Run `pnpm --filter @empire/ui typecheck` and `pnpm --filter @empire/ui catalog:build`.
- [ ] Run root UI boundary, token, asset, SVG, contrast, motion, and CSS audits.
- [ ] Capture and review deterministic screenshots before any production-route adoption.

## Consequences

The catalog can test a more extreme expression without changing the live Portal. If approved, the next slice will promote only the validated design decisions into package-owned tokens and product profiles, then migrate one Portal surface. If rejected, the pilot can be removed without changing product behavior.

The final master logo remains subject to its separate concept/provenance review. Visual direction does not imply trademark clearance or approval for external brand use.
