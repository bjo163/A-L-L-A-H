# @empire/ui changelog

## Unreleased · 2026-10-22

### Added

- Shared layout, typography, field, action, navigation, data, review, map, timeline, resource-state, and authentication patterns.
- `AuthLayout`, `NavItem`, `NavGroup`, `DataTable`, `EventList`, `Pagination`, `Disclosure`, `ListDetail`, and review pattern exports.
- Shared vector icon registry, `LogoMark`, `BrandLockup`, theme tokens, map aliases, and catalog fixtures.
- `DonutChart` for reusable, accessible distribution charts with semantic status tones.
- `IllustrationFrame` and standard ratio presets for consistently sized and clipped product artwork.
- `PageIntro.meta` for non-interactive status and freshness information, kept separate from `actions`; `MangaPageIntro` inherits the slot and the Command Center health cluster now uses it.
- Optional `illustrated` presentation on `EmptyState` and `ErrorState`; each uses package-owned decorative SVG while keeping the message and recovery action primary.
- Illustration frames are pointer-transparent and their inner art subtree is inert, preventing artwork from becoming a focus stop or intercepting neighboring interactions.

### Changed

- `PortalOrbitHero` now renders its center symbol and optional watermark from the package `LogoMark`; replace the removed `watermark` node prop with `brandWatermark={false}` only when the mark should be hidden.
- Brand concept studies now use the package-owned lockup frame and typography; catalog CSS only supplies preview surfaces instead of duplicating product lockup geometry.
- Restrict `IconGlyphProps` to `className`, `size`, `label`, and `directional`; `DomainSymbolProps` to `name`, `size`, and `className`; and `LogoMarkProps` to `className`. Consumers should put interactions on a containing control rather than the SVG.
- Decorative `MangaOrbit` rings are static to avoid perpetual animation of artwork that conveys no changing state; the no-longer-meaningful ring `variant` prop was removed. `MangaEffect.spin` was removed because its pseudo-element had no generated content and never produced a visible effect. Loading and active-state indicators retain their motion. Consumers should remove the obsolete props; neither changed the visible result after this cleanup.

### Security

- SVG source validation now rejects JSX prop spreads inside vectors, namespaced/external references, external `url()` attributes, inline event handlers, and inline styles. Generated asset validation also blocks `feImage`; regenerated Orbit output exposes only a class-name prop.

### Consumer migration notes

- Portal keeps Next.js routing and language/theme persistence in app code; use router-neutral package patterns and `buttonClassName` for links.
- Command Center keeps Vite local view state, API permissions, and MapLibre runtime in app code; use package patterns for presentation and native interaction semantics.
- When migrating a status-only page-intro node, pass it through `meta`; reserve `actions` for controls or navigational actions.
- Native control refs and attributes remain forwarded. `ConfirmDialog` restores opener focus and requires client-owned callbacks.
- `ResourceState` children remain mounted for `partial` and `stale` states so consumers can preserve usable content.
- Empty/error illustrations are opt-in; existing states preserve their current plain presentation. Use illustrations only when they add orientation without replacing state copy.

### Verification

- `pnpm --filter @empire/ui build`
- `pnpm --filter @empire/ui catalog:build`
- `pnpm --filter @empire/portal build`
- `pnpm --filter @empire/command-center build`
- `pnpm audit:ui-boundary`
- `pnpm audit:ui-css`
- `git diff --check`

All commands passed in the current workspace; the Command Center build reports only a non-failing chunk-size warning.
