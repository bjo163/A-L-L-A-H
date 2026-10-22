# @empire/ui

Shared React primitives and visual tokens for the public portal and 100CENTER.

## Active centralization plan

The [UI centralization blueprint](../../docs/BLUEPRINT_UI_CENTRALIZATION.md) defines the target ownership of all product presentation, including brand SVGs, icons, illustrations, tokens, themes, component variants, page patterns, and layouts in this package. Portal and Command Center retain routing, product content, data, permissions, and workflows. Its `UI-Cxx-yy` checklist covers migration, acceptance evidence, and removal of duplicate visual implementations.

The centralization blueprint tracks the remaining migration and acceptance work. Existing contrast measurements are historical and must be rechecked against the final token/theme version before acceptance.

The visual catalog uses static local fixtures and does not call product APIs. Its responsive preview offers repeatable theme, density, language, and iframe viewport settings; use those settings when capturing comparison screenshots.

The catalog also includes a fabricated Portal homepage and one composition fixture for each Command Center category (Overview, World Monitor, Continuum, Directory, Knowledge, Audit, CAB, and Research). These previews exercise shared patterns only; application authorization, routing, and workflows remain outside the package.

### Density and interaction sizing

The package defines `comfortable` and `compact` density through inherited `data-density` tokens. Comfortable is the default. Compact reduces shared layout gaps, section rhythm, card spacing, and table row block padding; explicit `data-gap` layout props remain authoritative. Density does not change `--eol-control-size-sm/md/lg`, button/input minimum heights, or other interactive hit targets. The current control sizes are 36/44/48 CSS px; this is a sizing contract, not a claim that every 36px control meets every accessibility target-size criterion. Prefer the 44px medium size for primary form and action controls, and use small controls only where the surrounding design and target-size exceptions have been reviewed. Pattern-specific density may additionally tune its own non-interactive content, such as metric typography.

Run `pnpm audit:ui-css` to find repeated identical property declarations within the same selector and grouping context. The current audit passes across all 15 package stylesheets. A clean result only rules out identical declarations in matching cascade contexts; declarations with different values and rendered computed styles still need review.

`pnpm validate:ui-assets` checks the asset manifest against the inline SVG icon and brand inventories, font package versions and stylesheet imports, and the included font license texts. It scans `assets/generated/` and verifies the SHA-256 digest of each manifest entry, detecting unlisted, missing, and modified generated files. Seven generated SVG brand/icon outputs are checked in and hashed. The current brand concepts are exploratory and Orbit remains provisional.

## Current exports

- `Button` for consistent native button actions.
- `Panel` for semantic, reusable surface containers.
- `Container` for shared reading, content, and workspace widths with responsive gutters.
- `PageIntro`, `SectionHeading`, and `MetricGrid` for consistent page composition and both editorial and operational metric presentations.
- `MetricGrid` accepts 2–6 columns and label, value, detail, tone, and freshness; apps own business-state mapping and freshness copy. Five/six-column grids collapse to three, two, then one column at shared breakpoints.
- `MangaEffect` for reusable manga panel, screentone, speed-line, spin, reveal, and hover treatments.
- `MangaOrbit` for decorative orbit rings with the shared glow motion.
- `MangaPageIntro` for page headings with the shared manga frame and optional SFX lettering.
- `MangaTelemetryHero` for a shared status hero with a manga orbit, speed lines, and SFX lettering.
- `MangaSfx` for decorative, screen-reader-hidden manga onomatopoeia.
- `MangaLoadingState` for a shared manga-styled loading panel and motion.
- `MapFrame`, `MapLegend`, and `RegionSummary` for map source states and shared map information patterns.
- `RegionSelectCard` for accessible, controlled region selection with status and a compact metric summary; the Command Center World Monitor supplies region records and status mapping.
- `SensorDisclosure` and `TelemetryEventList` for shared operational sensor and event feed composition; consumers provide source values, status mapping, and filter behavior.
- `StatusIndicator` for a compact status label with a non-color shape cue and shared semantic tones.
- `Badge` for maturity and status labels.
- Named icon components (`HomeIcon`, `SearchIcon`, `ArrowRightIcon`, and the rest of the 52-glyph family), plus `IconName`, `IconComponent`, and `IconGlyphProps`, for the shared 24px SVG stroke family. Product consumers should import named components so unused glyphs can be tree-shaken. The generic `Icon` plus `iconNames`, `directionalIconNames`, and `iconGroups` remains for the catalog's data-driven icon gallery. Arrows, chevrons, and input/output glyphs mirror automatically in RTL; other glyphs do not. Icons are decorative by default; `label` is for an SVG that carries meaning without an adjacent accessible name.
- `LogoMark` for the shared SVG mark used by Portal and Command Center shells. Orbit is explicitly a provisional working mark; final identity approval, lockups, favicon exports, and optical-size variants remain open in the blueprint.
- `BrandLockup` for a shared product name/descriptor hierarchy around `LogoMark`, with regular/compact sizes and default/subtle name tones. The vector is decorative and hidden from assistive technology; visible product name and descriptor provide the accessible text inside links or static product identity.
- `IconText` for pairing visible content with a named icon React element at the start or end; it applies the requested optical size while keeping the glyph decorative.
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
| SectionHeading | Required title; optional eyebrow, aside, heading level, `section` or `compact` layout, and semantic class hooks | Shares heading anatomy and responsive stacking. The app supplies localized copy and actions. |
| MetricGrid | `editorial` or `operational` profile; `comfortable` or `compact` density; 2–6 columns; items with label, value, detail, tone, and freshness | Uses one shared anatomy for Portal summary bands and Command Center operational metrics. The app supplies all domain meaning; the editorial profile keeps the value-first band while the operational profile uses label-first cards. |
| MangaEffect | `as` semantic element; optional `panel`, `interactive`, `action`, `row`, `speedLines`, `screentone`, `spin`, and `reveal` flags; element attributes | Composes named manga treatments and transitions from the shared stylesheet. Applications supply content and layout-specific classes. `interactive` includes the common panel treatment. |
| MangaPageIntro | `PageIntro` content props plus optional `sfx` and `sfxClassName` | Uses the shared angular panel, halftone accent, and reveal treatment; optional SFX lettering stays decorative. Breadcrumbs, copy, and actions remain application content. |
| MangaTelemetryHero | Required `eyebrow`, `title`, `pulse`, and `sfx`; optional `description`, `metadata`, and `className` | Provides one shared telemetry hero composition, including its orbit, manga panel, reveal motion, and decorative SFX. |
| MangaSfx | Required `text`; optional `className` | Decorative manga onomatopoeia, hidden from assistive technology. It does not play audio. |
| MangaOrbit | Span attributes, optional `className`, and `primary`, `secondary`, or `tertiary` variant | Renders a decorative ring with shared glow animation and staggered timing; hidden from assistive technology. |
| MangaLoadingState | Required accessible `label`; optional `eyebrow`, `sfx`, and `className` | Announces a polite loading status and applies the same panel, speed-line, reveal, orbit, and shimmer treatments. |
| Badge | `neutral`, `info`, `success`, `warning`, `danger`; span attributes | Displays a text label. Color must accompany a meaningful label; long unbroken text wraps instead of widening its container. |
| Named icon components and `Icon` | Named components accept SVG props such as `size`, `className`, and `label`; generic `Icon` additionally requires a semantic `name` | Inline vector SVG using a 24 × 24 viewBox, `currentColor`, the shared stroke width and round joins. Icons are hidden from assistive technology unless `label` is supplied; icon-only controls still need an accessible name on the control. Use named components in app consumers to keep the registry out of their bundles. |
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
| FieldError | Paragraph attributes and children | Does not announce as an alert by default. Connect its ID through the control's `aria-describedby` and set `aria-invalid` when the error applies; opt into `role="alert"` only for an error that must interruptively announce. |
| Tabs | Controlled `items`, `value`, `onValueChange`, accessible `label`, orientation, and styling hooks | Uses a 44px minimum hit area by default through `--eol-control-size-md`; a consumer may override it for an intentional layout after reviewing touch usability. Arrow keys follow the declared orientation; Home/End select the first/last enabled tab. Exactly one tab is in the normal tab order. Every tab controls an existing linked panel element; inactive panel shells stay empty and hidden while only the selected panel content is mounted. Switching tabs remounts that content, so keep transient form state above `Tabs` when it must survive a switch. |
| ConfirmDialog | Controlled `open`, `title`, `description`, `confirmLabel`, `onConfirm`, `onOpenChange`; optional tone, busy, error, cancel label, and localized busy label | Uses `<dialog>.showModal()`, cycles Tab/Shift+Tab among visible dialog controls, and returns focus to the opener when closed. Escape closes unless busy. Pending requests set `aria-busy="true"`, disable both actions, and show the localized busy label; API errors render inside the modal. Set `busyLabel` and `cancelLabel` to match the consuming UI language. Server authorization remains authoritative. |
| buttonClassName | Variant and optional extra classes | Adds the shared action styles to an app-owned link while preserving its native routing and semantics. |

### Navigation adapters

`@empire/ui` does not own application routing. Portal consumers keep Next.js `Link` behavior and may use `buttonClassName` for shared action styling. Command Center keeps local view selection in application state and uses native buttons for its view switcher. `Breadcrumbs` and `SkipLink` remain router-neutral and use plain anchors, so the package serves both applications without importing a router runtime.

### Composition recipes and API maturity

- **Page intro:** `Container` → `MangaPageIntro` or `PageIntro` → app-owned actions → resource content. Keep route copy, permissions, and data mapping in the app.
- **Public Portal shell:** `PublicShell` owns skip link, header/main/footer landmarks; pass `BrandLockup`, router-aware navigation, action, and localized footer slots. `ResponsiveNavigation` owns the responsive menu disclosure and focus return while the app supplies links, route state, and language/theme controls.
- **Command Center shell:** `WorkspaceShell` owns the workspace grid, skip link, focusable main landmark, and small-screen navigation disclosure. Supply permission-filtered navigation and the operational topbar/content from the app. At narrow widths the package toggle closes on selection or Escape and returns focus; the app owns operator identity and permission decisions.
- **Theme:** render `ThemeBootstrap` in the document head to apply the stored `eol-theme` before first paint; use `ThemeControl` for the persistent light/dark switch. It falls back to the configured default when storage is unavailable, while the consumer supplies localized labels and icons.
- **Portal hero:** use `PortalOrbitHero` for the shared editorial hierarchy, orbital illustration, four positioned satellites, and sound-effect treatment. The Portal supplies bilingual copy, destination links, and accessible illustration summary.
- **Identity band:** use `IdentityCardGroup` for one featured identity plus supporting cards; supply labels, descriptions, and route actions from the product layer.
- **Portal domain cards:** use `PortalDomainCard` with a typed accent, vector icon, visible maturity badge, and app-provided action. Keep maturity-to-tone mapping and domain content at the consumer boundary.
- **Workflow/architecture:** use `WorkflowSteps` for ordered process cards and `ArchitectureLayers` for linked layer rows plus the orbit summary. Supply route-aware links through the renderer callback and keep layer labels, descriptions, and destination policy in the app.
- **System explorer:** use `ResponsiveTabs` for package-owned selection and breakpoint-aware keyboard orientation; render each content pane with `SystemDetailPanel`. Keep system data, translated copy, and status-tone mapping in the consumer.
- **Homepage wayfinding:** use `RoadmapPreview` for the checkpoint and stage-rung composition and `CallToAction` for the closing brand section. Keep translated labels, status meanings, links, and action styling at the consumer boundary.
- **System atlas:** use `SystemAtlas` for anchored architecture rows, `RepositoryOverview` for implementation context and module inventory, and `PageCrosslinks` for related destinations. Keep IDs, translated system records, and framework router links in the app adapter.
- **Portal domain data:** the application keeps one bilingual system catalog and feeds both domain cards and Explorer from it. Shared UI owns the visuals; the package does not become the source of product names, status facts, or research claims.
- **Roadmap/readiness:** use `RoadmapTimeline`, `ReadinessBoard`, and `ActionPanel` for numbered phases, dated repository snapshots, and the follow-up callout. Pass review dates explicitly; status values and all claims remain app-owned and must describe a snapshot rather than imply a live monitor.
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

`Badge` and `StatusIndicator` intentionally have different shapes: the first labels a compact item, while the second adds a non-color status cue. Both expose the same `data-tone` mapping owned by the package; `MetricGrid` uses that same mapping for its value color. Keep business status-to-tone selection in the consumer and keep tone-to-color presentation here.

Native form and action controls (`Button`, `IconButton`, `Switch`, `Checkbox`, `TextField`, `TextArea`, and `SelectField`) forward refs to their underlying element and preserve native attributes. `Field` composes labels, descriptions, and errors around a supplied control without replacing its controlled or uncontrolled behavior. Layout and content patterns accept `className` and native container attributes; polymorphic patterns document their `as` element contract in their exported props.

### Token layers

The entry stylesheet loads tokens from src/tokens.css. Raw palette values use the eol-palette namespace. Components consume semantic eol-color and eol-status aliases; layout tokens cover spacing, controls, reading width, section rhythm, grid gaps, and sidebar width. The shared `Section` pattern offers two named profiles: `editorial` uses fluid generous block spacing and wider content rhythm; `operational` uses compact repeated spacing. Compose it with `Container` to set reading/content/workspace width. These profiles only control spacing; they do not alter color, status meaning, or interaction. Typography tokens define the base size ladder, named heading sizes, display/heading tracking, line-height roles, font weights, script fallback, label tracking, and `--eol-font-numeric` (`tabular-nums lining-nums`) for stable metric alignment. Shared `Heading`, `PageIntro`, `SectionHeading`, and `MetricGrid` consume these named roles. Shape, focus, layer, elevation, icon, and motion tokens provide shared defaults. Motion declarations use named duration and easing tokens; animation keyframes use `--eol-motion-intensity-*` values for amplitudes and opacity, while reduced motion uses the shared `--eol-motion-reduced` duration and consumer-specific no-animation fallbacks. The shared `eol-spin` keyframe owns spinner rotation. Preserve the current visual timing by using purpose tokens such as `--eol-motion-interaction`, `--eol-motion-reveal`, and `--eol-motion-pulse` rather than adding product-local timing literals. `--eol-color-border` is a subtle divider for nonessential grouping; use `--eol-color-border-strong` for controls whose boundary needs to remain visible. Apps can define local aliases while they migrate; new shared primitives should not add one-off palette values. The catalog renders semantic color swatches, component states, and skeleton shapes for visual inspection. Its theme preview toggles the shared light and dark token palettes across the same component examples.

### Responsive layout contract

`Container` is the shared width and gutter owner: `reading` is 48rem, `content` is 76rem, and `workspace` is 90rem. All sizes use the same centered `min(max-width, viewport minus two gutters)` rule. Gutters switch from wide to medium at 68.75rem (1100px), then to narrow at 35.625rem (570px). The width roles describe content measure, not a guarantee that a child grid fits at every viewport; patterns must still collapse based on their own minimum useful column width.

Responsive changes are component-scoped, not a universal device taxonomy. Shared shell navigation changes at 800px for the public shell and 760px for the workspace shell. Reusable content patterns currently change at 720px for `ListDetail`, 640px for `SectionHeading`, 600px for map summaries, 520px for `ActionGroup`, and 1120/800/680/420px for progressively denser `MetricGrid` layouts. Decorative compositions may use additional local breakpoints. Preserve these named behavior boundaries when changing a pattern; do not add app overrides to compensate for a missing shared layout behavior. Review at 320, 375, 768, 1024, and 1440px plus both sides of each pattern's boundary before accepting a visual change.

### Contrast baseline

### Accessibility target

The shared target is **WCAG 2.2 Level AA**. Review scope covers 1.3.1/1.3.2 (semantic structure and meaningful sequence), 1.4.3/1.4.11 (text and non-text contrast), 1.4.10/1.4.12 (reflow and text spacing), 2.1.1/2.1.2 (keyboard and no trap), 2.4.3/2.4.6/2.4.7/2.4.11 (focus order, headings, visible focus, and focus not obscured), 2.5.5 (target size), 3.3.1/3.3.2 (error identification and labels), and 4.1.2/4.1.3 (name/role/value and status messages). Browser and assistive-technology review remains required for final sign-off; typechecks and source audits do not replace rendered verification.

`node scripts/audit-ui-contrast.mjs` calculates WCAG relative luminance for opaque roles resolved from `tokens.css` and `themes.css`. It checks 27 role pairs in both themes: body/subtle/muted text against background, surface, raised, inset, and action; links and strong accent text against background/surface; on-accent text against the primary action background; focus and strong/accent borders against background/surface; and all five status foregrounds against their matching status surfaces. Text/status pairs use 4.5:1; focus and control boundaries use 3:1. Current dark-theme minima are text/background 12.13:1, muted/surface 10.72:1, strong accent/background 9.93:1, status foreground/surface 7.43:1, focus/surface 10.50:1, and strong border/surface 3.62:1. Current light-theme minima are text/background 7.81:1, muted/surface 8.58:1, strong accent/background 5.09:1, status foreground/surface 6.11:1, focus/background 4.16:1, and strong border/surface 16.85:1. The main button's on-accent label is checked at 4.5:1; it measures 6.77:1 in dark and 5.63:1 in light. This is a static opaque-token audit, not a full route contrast claim: alpha colors, `color-mix`, gradients, artwork, disabled opacity, map overlays, browser painting, and rendered focus around every component still need visual review. Run the script after changing palette or semantic theme aliases.
### Theme and density support

The dark Empire palette is the default. tokens.css also provides a light semantic palette selected with data-theme="light" on the document root; the Portal exposes a persistent switch while Command Center remains dark. Portal light styling has had a desktop visual pass on the home, systems, and roadmap routes. Contrast across route-specific art and overlays, narrow screens, zoom, and high-contrast settings remains under review; this is not a full accessibility sign-off. Comfortable and compact density are supported through shared density tokens; compact density tightens layout rhythm while interactive hit targets keep their contracted sizes.

The shared stylesheet includes a `forced-colors: active` fallback that switches component surfaces, controls, selected tabs, and focus indicators to platform system colors. Browser and operating-system validation is still required before claiming forced-colors support as reviewed. The Command Center map adapter uses `MapFrame` states and retains a selectable region list when the map is unavailable or fails to load; a 12-second timeout prevents an indefinite loading presentation.

The catalog uses static, fabricated examples and local-only interactions. It makes no API requests and contains no tenant or production records; do not add real user data or credentials to its fixtures. The button section includes an app-owned anchor styled through `buttonClassName`, so consumers can inspect the shared variant without changing link semantics. The dialog preview simulates pending and error states locally and never submits data.

### Font delivery

`styles.css` self-hosts Space Grotesk Variable (Latin, Latin Extended, and Vietnamese subsets) and DM Mono 400/500 (Latin subset) through Fontsource packages. The fonts use `font-display: swap`; system sans/mono stacks remain fallbacks. This avoids Google Fonts runtime requests and keeps both applications consistent. The selected WOFF2 assets total about 78 KB before transfer compression; unicode ranges let browsers fetch only matching Space Grotesk subsets. The SIL Open Font License 1.1 texts are kept in `licenses/` beside this package's font dependencies.

`tokens.css` owns the shared base palette and component/layout tokens. `themes.css` maps palette values to semantic roles for dark and light themes. The shared `ui.css` import order is palette tokens → semantic themes → component styles and fonts. It owns `color-scheme` so product sheets cannot silently override native controls' theme. Product illustrations still have local color literals inside the package and remain part of the palette audit.

Portal imports `@empire/ui/portal.css`, which composes the shared entry and Portal presentation. Command Center imports `@empire/ui/ui.css`, the MapLibre vendor stylesheet, the opt-in `@empire/ui/adapters/maplibre.css` skin, then `@empire/ui/command-center.css`. The adapter owns `.maplibregl-ctrl-*` and `.wm-popup` presentation selectors and must follow the vendor stylesheet. It contains CSS only; MapLibre runtime stays an application dependency and is not loaded by Portal or the default UI entry. Command Center lazy-loads the map and YouTube Sentinel views when their tabs are selected. All authored product presentation CSS now lives under `packages/ui/src/products/`; apps keep routing, product data, authentication, API access, permissions, and domain workflows. The former `manga-theme.css` implementation was absorbed into `themes.css`; it has no remaining consumer or package subpath.

Portal and Command Center can have distinct editorial and operational compositions, but their authored visual rules and shared primitives are owned by the same package. Product-specific styles are package entries, not app-local copies.

### Current consumer map

| Consumer | Shared primitives currently used | Example |
| --- | --- | --- |
| Public portal | Badge, Container, named icons, IconText, MangaEffect, MangaLoadingState, MangaOrbit, MangaPageIntro, MangaSfx, MetricGrid, Panel, SectionHeading, Switch, Tabs, button class helper | Content widths, theme and external-link symbols, page introductions, loading art, orbit rings, panel effects, manga SFX lettering, and editorial summary metrics use package exports; the explorer selects system metadata with keyboard-accessible tab panels. |
| 100CENTER | Badge, Button, ConfirmDialog, EmptyState, ErrorState, FieldLabel, named icons, LoadingState, MangaEffect, MangaPageIntro, MangaTelemetryHero, MapLegend, Notice, Panel, RegionSummary, SelectField, TextArea, TextField | Overview, access-filtered navigation, workspace cards, search, sync, and World Monitor use package vectors and shared hero composition. MapLibre styling is an opt-in CSS adapter; map legend, region marker skin, and selected-region summary use package-owned patterns. Module, RFC, and Research Run lists retain distinct resource states. |
| UI catalog | Every exported primitive | Standalone visual and interaction examples; actions are fixtures and do not call product APIs. |

## Local component catalog

Run pnpm --filter @empire/ui catalog from the monorepo root and open http://127.0.0.1:4173. The catalog shows the current primitives and their visual states without adding a route to either product app. Its fixtures are examples, not live product data. Static Notice samples use `note` semantics to avoid announcing the entire gallery on page load; the two “Add update” controls insert live `status` and `alert` examples on demand.

## Long-term direction

Read the [UI Blueprint and checklist](../../docs/BLUEPRINT_UI.md) for the baseline audit, token and component contracts, user journeys, phased backlog, and evidence needed to close a task. Use its stable `UI-Uxx-xx` IDs when implementing or reviewing UI changes. The blueprint owns the roadmap; this README describes the package currently available.
