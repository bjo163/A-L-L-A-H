# @empire/ui changelog

## Unreleased · 2026-10-22

### Added

- Shared layout, typography, field, action, navigation, data, review, map, timeline, resource-state, and authentication patterns.
- `AuthLayout`, `NavItem`, `NavGroup`, `DataTable`, `EventList`, `Pagination`, `Disclosure`, `ListDetail`, and review pattern exports.
- Shared vector icon registry, `LogoMark`, `BrandLockup`, theme tokens, map aliases, and catalog fixtures.
- `DonutChart` for reusable, accessible distribution charts with semantic status tones.

### Changed

- Decorative `MangaOrbit` rings are static to avoid perpetual animation of artwork that conveys no changing state; the no-longer-meaningful ring `variant` prop was removed. `MangaEffect.spin` was removed because its pseudo-element had no generated content and never produced a visible effect. Loading and active-state indicators retain their motion. Consumers should remove the obsolete props; neither changed the visible result after this cleanup.

### Consumer migration notes

- Portal keeps Next.js routing and language/theme persistence in app code; use router-neutral package patterns and `buttonClassName` for links.
- Command Center keeps Vite local view state, API permissions, and MapLibre runtime in app code; use package patterns for presentation and native interaction semantics.
- Native control refs and attributes remain forwarded. `ConfirmDialog` restores opener focus and requires client-owned callbacks.
- `ResourceState` children remain mounted for `partial` and `stale` states so consumers can preserve usable content.

### Verification

- `pnpm --filter @empire/ui build`
- `pnpm --filter @empire/ui catalog:build`
- `pnpm --filter @empire/portal build`
- `pnpm --filter @empire/command-center build`

All commands passed in the current workspace; the Command Center build reports only a non-failing chunk-size warning.
