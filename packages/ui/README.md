# @empire/ui

Shared React primitives and visual tokens for the public portal and 100CENTER.

## Active centralization plan

The [UI centralization blueprint](../../docs/BLUEPRINT_UI_CENTRALIZATION.md) defines the target ownership of all product presentation, including brand SVGs, icons, illustrations, tokens, themes, component variants, page patterns, and layouts in this package. Portal and Command Center retain routing, product content, data, permissions, and workflows. Its `UI-Cxx-yy` checklist covers migration, acceptance evidence, and removal of duplicate visual implementations.

The centralization blueprint tracks the remaining migration and acceptance work. Existing contrast measurements are historical and must be rechecked against the final token/theme version before acceptance.

## Current exports

- `Button` for consistent native button actions.
- `Panel` for semantic, reusable surface containers.
- `Container` for shared reading, content, and workspace widths with responsive gutters.
- `PageIntro`, `SectionHeading`, and `MetricGrid` for consistent page composition and both editorial and operational metric presentations.
- `MetricGrid` accepts label, value, detail, tone, and freshness; apps own business-state mapping and freshness copy.
- `MangaEffect` for reusable manga panel, screentone, speed-line, spin, reveal, and hover treatments.
- `MangaOrbit` for decorative orbit rings with the shared glow motion.
- `MangaPageIntro` for page headings with the shared manga frame and optional SFX lettering.
- `MangaTelemetryHero` for a shared status hero with a manga orbit, speed lines, and SFX lettering.
- `MangaSfx` for decorative, screen-reader-hidden manga onomatopoeia.
- `MangaLoadingState` for a shared manga-styled loading panel and motion.
- `MapFrame`, `MapLegend`, and `RegionSummary` for map source states and shared map information patterns.
- `StatusIndicator` for a compact status label with a non-color shape cue and shared semantic tones.
- `Badge` for maturity and status labels.
- `Icon`, `iconNames`, `directionalIconNames`, and `iconGroups` for the original shared 24px SVG stroke family. Arrows, chevrons, and input/output glyphs mirror automatically in RTL; other glyphs do not. Icons are decorative by default; `label` is for an SVG that carries meaning without an adjacent accessible name.
- `LogoMark` for the shared SVG mark used by Portal and Command Center shells. Orbit is explicitly a provisional working mark; final identity approval, lockups, favicon exports, and optical-size variants remain open in the blueprint.
- `BrandLockup` for a shared product name/descriptor hierarchy around `LogoMark`, with regular/compact sizes and default/subtle name tones. The vector is decorative and hidden from assistive technology; visible product name and descriptor provide the accessible text inside links or static product identity.
- `IconText` for pairing visible content with a decorative, optionally directional icon at the start or end.
- `activity`, `input`, and `output` are available as semantic names in the shared icon registry; add new glyphs to a named group and the catalog together.
- `Notice` for user-facing information that needs clear emphasis.
- `LoadingState`, `EmptyState`, and `ErrorState` for distinct resource states.
- `Skeleton` for decorative placeholders while content loads.
- `FieldLabel`, `TextField`, `TextArea`, and `SelectField` for native form controls with shared focus and invalid-state styling.
- `HelpText` and `FieldError` for supporting and validation text connected with native `aria-describedby` IDs.
- `Tabs` for controlled tab lists with roving focus, orientation-aware arrow keys, Home/End, disabled tabs, and linked panels.
- `ConfirmDialog` for consequential decisions using native modal semantics, a verified Tab/Shift+Tab focus cycle, and Escape behavior.
- `ui.css` as the official shared stylesheet entry for tokens, component styles, and the shared theme.
- `portal.css` and `command-center.css` for package-owned product composition; Command Center loads the vendor MapLibre stylesheet and the opt-in adapter before its product entry.
- `buttonClassName` for styling Next.js Link or an anchor with the shared action variants.

## Component contract

| Component | Variants and native attributes | Behavior |
| --- | --- | --- |
| Button | `primary`, `secondary`, `quiet`, `danger`; native button attributes | Renders a native button and defaults to `type="button"`. Loading state and its accessible label are owned by the consuming workflow. Long labels may wrap within the available width. |
| Panel | `as` semantic element, optional `manga` surface treatment, `className`, element attributes | Renders a surface; `manga` applies the shared ink border, offset shadow, and transition without taking over app layout. Refs are not part of the current contract. |
| Container | `as` semantic element; `reading`, `content`, or `workspace` width | Applies the shared max-width and responsive gutter tokens. Content and workflow remain in the app. |
| SectionHeading | Required title; optional eyebrow, aside, heading level, `section` or `compact` layout, and semantic class hooks | Shares heading anatomy and responsive stacking. Apps supply localized copy and actions. |
| SectionHeading | Required title; optional eyebrow, aside, heading level, `section` or `compact` layout, and semantic class hooks | Shares heading anatomy and responsive stacking. The app supplies localized copy and actions. |
| MetricGrid | `editorial` or `operational` profile; `comfortable` or `compact` density; 2/3/4 columns; items with label, value, detail, tone, and freshness | Uses one shared anatomy for Portal summary bands and Command Center operational metrics. The app supplies all domain meaning; the editorial profile keeps the value-first band while the operational profile uses label-first cards. |
| MangaEffect | `as` semantic element; optional `panel`, `interactive`, `action`, `row`, `speedLines`, `screentone`, `spin`, and `reveal` flags; element attributes | Composes named manga treatments and transitions from the shared stylesheet. Applications supply content and layout-specific classes. `interactive` includes the common panel treatment. |
| MangaPageIntro | `PageIntro` content props plus optional `sfx` and `sfxClassName` | Uses the shared angular panel, halftone accent, and reveal treatment; optional SFX lettering stays decorative. Breadcrumbs, copy, and actions remain application content. |
| MangaTelemetryHero | Required `eyebrow`, `title`, `pulse`, and `sfx`; optional `description`, `metadata`, and `className` | Provides one shared telemetry hero composition, including its orbit, manga panel, reveal motion, and decorative SFX. |
| MangaSfx | Required `text`; optional `className` | Decorative manga onomatopoeia, hidden from assistive technology. It does not play audio. |
| MangaOrbit | Span attributes, optional `className`, and `primary`, `secondary`, or `tertiary` variant | Renders a decorative ring with shared glow animation and staggered timing; hidden from assistive technology. |
| MangaLoadingState | Required accessible `label`; optional `eyebrow`, `sfx`, and `className` | Announces a polite loading status and applies the same panel, speed-line, reveal, orbit, and shimmer treatments. |
| Badge | `neutral`, `info`, `success`, `warning`, `danger`; span attributes | Displays a text label. Color must accompany a meaningful label; long unbroken text wraps instead of widening its container. |
| Icon | Required semantic `name`; optional `size`, `className`, and `label` | Inline vector SVG using a 24 × 24 viewBox, `currentColor`, 1.8px stroke and consistent round joins. It is hidden from assistive technology unless `label` is supplied; icon-only controls still need an accessible name on the control. |
| Notice | `info`, `success`, `warning`, `danger`; div attributes; role `status`, `alert`, or `note` | Defaults to `status`, except `danger` defaults to `alert`; override only when the message urgency and update behavior require it. Long identifiers wrap within the notice. |
| LoadingState | Required `label`; optional `busy`; div attributes except `aria-busy` | Announces loading politely and marks the region busy by default. Set `busy={false}` when the component reports completion. Pair with `Skeleton` when the expected content shape is known. |
| EmptyState | Required `title`; optional `description`, `action`; role `status` or `region` | Describes a successful query with no results; use only when the resource itself loaded successfully. Its title labels the state container by default; override `aria-labelledby` when another visible heading should name it. |
| ErrorState | Required `title`; optional `description`, `action`; role `alert` or `region` | Defaults to `role="alert"` for an actionable failure state; use `region` when the failure is already announced through another mechanism. Its title labels the state container by default; override `aria-labelledby` when another visible heading should name it. |
| Skeleton | `text`, `rect`, or `circle`; optional width and height | Decorative only (`aria-hidden`); the loading label remains the accessible announcement. |
| FieldLabel | Native label attributes and children | Use `htmlFor` with a control ID, or wrap the control so the browser provides the label association. |
| TextField | Native input attributes | Native input types, required/min/max constraints, read-only, disabled, and keyboard behavior are preserved. |
| TextArea | Native textarea attributes | Native multiline editing, read-only/disabled states, and constraints are preserved. |
| SelectField | Native select attributes and option children | Native select behavior, disabled state, validation state, and keyboard interaction are preserved. |
| Switch | Required controlled `checked` and `onCheckedChange`; button attributes and children | Renders a native button with `role="switch"` and `aria-checked`; the accessible name comes from its children or an explicit ARIA label. Disabled behavior and keyboard activation follow native button behavior. |
| HelpText | Paragraph attributes and children | Give it an ID and reference it from `aria-describedby` on the control. |
| FieldError | Paragraph attributes and children | Defaults to `role="alert"`; set the control's `aria-invalid` and include this ID in `aria-describedby` when the error applies. |
| Tabs | Controlled `items`, `value`, `onValueChange`, accessible `label`, orientation, and styling hooks | Uses a 44px minimum hit area by default through `--eol-control-size-md`; a consumer may override it for an intentional layout after reviewing touch usability. Arrow keys follow the declared orientation; Home/End select the first/last enabled tab. Exactly one tab is in the normal tab order. Every tab controls an existing linked panel element; inactive panel shells stay empty and hidden while only the selected panel content is mounted. Switching tabs remounts that content, so keep transient form state above `Tabs` when it must survive a switch. |
| ConfirmDialog | Controlled `open`, `title`, `description`, `confirmLabel`, `onConfirm`, `onOpenChange`; optional tone, busy, error, cancel label, and localized busy label | Uses `<dialog>.showModal()`, cycles Tab/Shift+Tab among visible dialog controls, and returns focus to the opener when closed. Escape closes unless busy. Pending requests set `aria-busy="true"`, disable both actions, and show the localized busy label; API errors render inside the modal. Set `busyLabel` and `cancelLabel` to match the consuming UI language. Server authorization remains authoritative. |
| buttonClassName | Variant and optional extra classes | Adds the shared action styles to an app-owned link while preserving its native routing and semantics. |

### Navigation adapters

`@empire/ui` does not own application routing. Portal consumers keep Next.js `Link` behavior and may use `buttonClassName` for shared action styling. Command Center keeps local view selection in application state and uses native buttons for its view switcher. `Breadcrumbs` and `SkipLink` remain router-neutral and use plain anchors, so the package serves both applications without importing a router runtime.

### Composition recipes and API maturity

- **Page intro:** `Container` → `MangaPageIntro` or `PageIntro` → app-owned actions → resource content. Keep route copy, permissions, and data mapping in the app.
- **Public Portal shell:** `PublicShell` owns skip link, header/main/footer landmarks; pass `BrandLockup`, router-aware navigation, action, and localized footer slots. `ResponsiveNavigation` owns the responsive menu disclosure and focus return while the app supplies links, route state, and language/theme controls.
- **Theme:** render `ThemeBootstrap` in the document head to apply the stored `eol-theme` before first paint; use `ThemeControl` for the persistent light/dark switch. It falls back to the configured default when storage is unavailable, while the consumer supplies localized labels and icons.
- **Portal hero:** use `PortalOrbitHero` for the shared editorial hierarchy, orbital illustration, four positioned satellites, and sound-effect treatment. The Portal supplies bilingual copy, destination links, and accessible illustration summary.
- **Identity band:** use `IdentityCardGroup` for one featured identity plus supporting cards; supply labels, descriptions, and route actions from the product layer.
- **Portal domain cards:** use `PortalDomainCard` with a typed accent, vector icon, visible maturity badge, and app-provided action. Keep maturity-to-tone mapping and domain content at the consumer boundary.
- **Workflow/architecture:** use `WorkflowSteps` for ordered process cards and `ArchitectureLayers` for linked layer rows plus the orbit summary. Supply route-aware links through the renderer callback and keep layer labels, descriptions, and destination policy in the app.
- **System explorer:** use `ResponsiveTabs` for package-owned selection and breakpoint-aware keyboard orientation; render each content pane with `SystemDetailPanel`. Keep system data, translated copy, and status-tone mapping in the consumer.
- **Homepage wayfinding:** use `RoadmapPreview` for the checkpoint and stage-rung composition and `CallToAction` for the closing brand section. Keep translated labels, status meanings, links, and action styling at the consumer boundary.
- **Operational list:** `FilterBar` → `DataTable`/`EventList`/`ListDetail` → `Pagination` → explicit `EmptyState` or `ErrorState`. Do not rebuild table headers, disclosure, or pagination semantics in product CSS.
- **Review workflow:** `FormSection` → shared native fields → `ReviewActions` → `ConfirmDialog` for consequential actions. Keep server authorization and workflow transitions in the app.
- **Map surface:** `MapFrame` → vendor map runtime owned by the app → `MapLegend`/`RegionSummary`; load the MapLibre adapter only in the Command Center product entry.

Avoid anti-patterns: importing product CSS into a primitive, copying token values into an app stylesheet, using color without a text cue, wrapping a native control in a second interactive control, or moving routing/permission/data policy into this package.

API maturity: primitives and patterns listed in the current contract are **stable** for this workspace; brand concepts and manga compositions remain **experimental** until final visual/provenance review; no export is **deprecated** at this time. Breaking changes require updating consumers, catalog fixtures, and migration notes in the same change.

## Adding and changing components

Promote a pattern when a real consumer workflow needs it, its interaction or accessibility behavior should stay consistent across applications, and its API can remain independent of product data, routing, and permissions. A primitive may be shared before a second product adopts it when native behavior or accessibility is difficult to reproduce safely; record its first consumer and review another adoption before expanding its API. Keep page composition, product language, artwork, and one-off layouts in the application. A shared component needs a typed contract, named states and keyboard behavior, a catalog example, and a consumer before it is considered ready.

`@empire/ui` is private and changes ship with this workspace; it has no independent published semver contract. Additive compatible changes can land with their consumer. For a breaking change, update all consumers, catalog examples, and this contract in the same change and include migration notes. If consumers ever need a staggered migration, retain the old export with a deprecation note for one migration cycle, then remove it only after a repository-wide usage check. Revisit public semver and a formal deprecation window before publishing the package independently.

### Stylesheet ownership and order

`ui.css` is the common public stylesheet entry; it imports tokens, semantic theme, component styles, and shared map patterns. `portal.css` composes that entry before `products/portal-globals.css` and `products/portal-manga.css`. Command Center imports the same `ui.css`, then the MapLibre vendor stylesheet, `adapters/maplibre.css`, and the package-owned `command-center.css`. MapLibre styling is opt-in and CSS-only; the runtime remains an application dependency. `MapFrame` exposes ready, loading, empty, stale, error, unavailable, and WebGL-unavailable states. Consumers import exported paths only; implementation CSS under `src/` is private to the package.

The primitives have no internal state or browser effects, except `ConfirmDialog`, which synchronizes a controlled `open` prop with the native dialog lifecycle. In Next.js App Router, `Tabs` and `Switch` need a Client Component owner because they require callbacks; `Button`, form controls, and layout primitives can render from a Server Component when no client event handler is passed. A `Button` click handler or controlled form event belongs to a Client Component. `ConfirmDialog` declares its own client boundary, but its callbacks must still be created by a client owner because functions cannot cross the Server-to-Client Component boundary. Static primitives and `buttonClassName` can be used in server-rendered UI. Form controls preserve native HTML validation and do not replace server-side validation. CSS is imported once by each consuming app. The package targets React 19, matching the applications; the portal uses Next.js transpilation and Vite consumes the workspace TypeScript source.

Native form and action controls (`Button`, `IconButton`, `Switch`, `Checkbox`, `TextField`, `TextArea`, and `SelectField`) forward refs to their underlying element and preserve native attributes. `Field` composes labels, descriptions, and errors around a supplied control without replacing its controlled or uncontrolled behavior. Layout and content patterns accept `className` and native container attributes; polymorphic patterns document their `as` element contract in their exported props.

### Token layers

The entry stylesheet loads tokens from src/tokens.css. Raw palette values use the eol-palette namespace. Components consume semantic eol-color and eol-status aliases; layout tokens cover spacing, controls, reading width, and sidebar width. Typography, shape, focus, layer, elevation, icon, and motion tokens provide shared defaults. `--eol-color-border` is a subtle divider for nonessential grouping; use `--eol-color-border-strong` for controls whose boundary needs to remain visible. Apps can define local aliases while they migrate; new shared primitives should not add one-off palette values. The catalog renders semantic color swatches, component states, and skeleton shapes for visual inspection. Its theme preview toggles the shared light and dark token palettes across the same component examples.

### Contrast baseline

### Accessibility target

The shared target is **WCAG 2.2 Level AA**. Review scope covers 1.3.1/1.3.2 (semantic structure and meaningful sequence), 1.4.3/1.4.11 (text and non-text contrast), 1.4.10/1.4.12 (reflow and text spacing), 2.1.1/2.1.2 (keyboard and no trap), 2.4.3/2.4.6/2.4.7/2.4.11 (focus order, headings, visible focus, and focus not obscured), 2.5.5 (target size), 3.3.1/3.3.2 (error identification and labels), and 4.1.2/4.1.3 (name/role/value and status messages). Browser and assistive-technology review remains required for final sign-off; typechecks and source audits do not replace rendered verification.

Static WCAG relative-luminance calculations for the opaque semantic tokens give these dark-theme ratios: text/background 16.91:1, muted/background 7.79:1, text/surface 15.56:1, muted/surface 7.17:1, accent/background 14.42:1, and every status foreground on its matching surface at least 8.91:1. In light theme: text/background 14.64:1, muted/background 5.48:1, text/surface 15.95:1, muted/surface 5.97:1, accent/background 4.61:1, and every status foreground on its matching surface at least 6.11:1. These text pairs exceed 4.5:1. The strong border on a light surface is 3.55:1 (above the 3:1 non-text target); the subtle group divider is not intended to identify a control boundary. This token-level baseline does not cover translucent overlays, artwork, browser rendering, focus indicators per route, or all text/background combinations. See the UI Blueprint for remaining contrast and visual review work.
### Theme and density support

The dark Empire palette is the default. tokens.css also provides a light semantic palette selected with data-theme="light" on the document root; the Portal exposes a persistent switch while Command Center remains dark. Portal light styling has had a desktop visual pass on the home, systems, and roadmap routes. Contrast across route-specific art and overlays, narrow screens, zoom, and high-contrast settings remains under review; this is not a full accessibility sign-off. Compact density is not supported. Revisit light coverage after route/accessibility review and revisit density only when measured operator tasks need it.

The shared stylesheet includes a `forced-colors: active` fallback that switches component surfaces, controls, selected tabs, and focus indicators to platform system colors. Browser and operating-system validation is still required before claiming forced-colors support as reviewed.

The catalog uses static, fabricated examples and local-only interactions. It makes no API requests and contains no tenant or production records; do not add real user data or credentials to its fixtures. The button section includes an app-owned anchor styled through `buttonClassName`, so consumers can inspect the shared variant without changing link semantics. The dialog preview simulates pending and error states locally and never submits data.

### Font delivery

`styles.css` self-hosts Space Grotesk Variable (Latin, Latin Extended, and Vietnamese subsets) and DM Mono 400/500 (Latin subset) through Fontsource packages. The fonts use `font-display: swap`; system sans/mono stacks remain fallbacks. This avoids Google Fonts runtime requests and keeps both applications consistent. The selected WOFF2 assets total about 78 KB before transfer compression; unicode ranges let browsers fetch only matching Space Grotesk subsets. The SIL Open Font License 1.1 texts are kept in `licenses/` beside this package's font dependencies.

`tokens.css` owns the shared base palette and component/layout tokens. `themes.css` maps palette values to semantic roles for dark and light themes. The shared `ui.css` import order is palette tokens → semantic themes → component styles and fonts. It owns `color-scheme` so product sheets cannot silently override native controls' theme. Product illustrations still have local color literals inside the package and remain part of the palette audit.

Portal imports `@empire/ui/portal.css`, which composes the shared entry and Portal presentation. Command Center imports `@empire/ui/ui.css`, the MapLibre vendor stylesheet, the opt-in `@empire/ui/adapters/maplibre.css` skin, then `@empire/ui/command-center.css`. The adapter owns `.maplibregl-ctrl-*` and `.wm-popup` presentation selectors and must follow the vendor stylesheet. It contains CSS only; MapLibre runtime stays an application dependency and is not loaded by Portal or the default UI entry. All authored product presentation CSS now lives under `packages/ui/src/products/`; apps keep routing, product data, authentication, API access, permissions, and domain workflows. The former `manga-theme.css` implementation was absorbed into `themes.css`; it has no remaining consumer or package subpath.

Portal and Command Center can have distinct editorial and operational compositions, but their authored visual rules and shared primitives are owned by the same package. Product-specific styles are package entries, not app-local copies.

### Current consumer map

| Consumer | Shared primitives currently used | Example |
| --- | --- | --- |
| Public portal | Badge, Container, Icon, IconText, MangaEffect, MangaLoadingState, MangaOrbit, MangaPageIntro, MangaSfx, MetricGrid, Panel, SectionHeading, Switch, Tabs, button class helper | Content widths, theme and external-link symbols, page introductions, loading art, orbit rings, panel effects, manga SFX lettering, and editorial summary metrics use package exports; the explorer selects system metadata with keyboard-accessible tab panels. |
| 100CENTER | Badge, Button, ConfirmDialog, EmptyState, ErrorState, FieldLabel, Icon, LoadingState, MangaEffect, MangaPageIntro, MangaTelemetryHero, MapLegend, Notice, Panel, RegionSummary, SelectField, TextArea, TextField | Overview, access-filtered navigation, workspace cards, search, sync, and World Monitor use package vectors and shared hero composition. MapLibre styling is an opt-in CSS adapter; map legend, region marker skin, and selected-region summary use package-owned patterns. Module, RFC, and Research Run lists retain distinct resource states. |
| UI catalog | Every exported primitive | Standalone visual and interaction examples; actions are fixtures and do not call product APIs. |

## Local component catalog

Run pnpm --filter @empire/ui catalog from the monorepo root and open http://127.0.0.1:4173. The catalog shows the current primitives and their visual states without adding a route to either product app. Its fixtures are examples, not live product data. Static Notice samples use `note` semantics to avoid announcing the entire gallery on page load; the two “Add update” controls insert live `status` and `alert` examples on demand.

## Long-term direction

Read the [UI Blueprint and checklist](../../docs/BLUEPRINT_UI.md) for the baseline audit, token and component contracts, user journeys, phased backlog, and evidence needed to close a task. Use its stable `UI-Uxx-xx` IDs when implementing or reviewing UI changes. The blueprint owns the roadmap; this README describes the package currently available.
