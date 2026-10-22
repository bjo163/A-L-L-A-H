# Execution Plan — One UI Foundation, Two Consumers

**Repository:** `bjo163/A-L-L-A-H`  
**Branch policy:** `dev` → reviewed PR → `main`  
**Owner of visual implementation:** `packages/ui` / `@empire/ui`  
**Consumers in this plan:** Portal and Command Center  
**Status:** active implementation; stylesheet-entry enforcement, product-selector scoping enforcement, CSS duplicate enforcement, and Command Center theme bootstrap are implemented. Full CI Quality checks, all three Docker image builds, and CodeQL passed on commit `547715943a9b35bc6c268daa023d11a8ba03f9ff`. Full browser visual acceptance and compiled CSS output inspection remain open.
**Related authority:** [UI Centralization Blueprint](BLUEPRINT_UI_CENTRALIZATION.md), [UI Blueprint](BLUEPRINT_UI.md), [ADR-0004](adr/ADR-0004-ui-package-centralization.md), [ADR-0005](adr/ADR-0005-extreme-funky-grunge-gen-z-pilot.md).

## 1. Executive decision

Use one shared stylesheet entry, `@empire/ui/ui.css`, for both production consumers. It is owned by `packages/ui/src/ui.css` and imports foundations, tokens, themes, shared patterns, brand assets/styles, product-scoped styles, and opt-in adapters.

Portal and Command Center are **two consumers, not two design-system owners**. They must not grow separate copies of buttons, typography foundations, semantic colors, focus treatment, status meaning, icons, or shared surface primitives.

The product contexts remain intentionally different:

- **Portal:** public, editorial, explanatory, expressive, responsive, and discoverability-oriented.
- **Command Center:** authenticated/operator-oriented, information-dense, scan-friendly, status-aware, and action-oriented.
- **Shared foundation:** consistent tokens, accessible primitives, semantic states, icon family, control behavior, responsive rules, and theme semantics.

The target is not pixel-identical pages. The target is a single, auditable system with named product profiles and no unexplained parallel implementation.

## 2. Current state and immediate correction

The repository already has the intended central stylesheet at `packages/ui/src/ui.css`. Its imports include both:

- `./products/portal-manga.css`
- `./products/command-center.css`

Portal already imports `@empire/ui/ui.css` from `apps/portal/app/layout.tsx`.

Command Center has been aligned to that entry in `apps/command-center/app/layout.tsx`. Its previous import from `apps/command-center/src/App.tsx` was removed so the stylesheet has one deliberate import point at the app root layout, rather than two competing import sites.

**What this establishes:** source ownership and intended stylesheet loading are aligned in code.  
**What it does not establish:** successful production builds, absence of cascade regressions, visual parity across all routes, accessibility acceptance, or a production release. Those require the gates below.

## 3. Architecture contract

### 3.1 Ownership table

| Concern | Single owner | Consumer responsibility |
|---|---|---|
| Raw palette and semantic design tokens | `packages/ui/src/tokens.css` and its token modules | Do not invent local color constants for shared concepts |
| Light/dark mapping and theme behavior | `packages/ui/src/themes.css`, shared theme utilities | Select and persist theme through shared APIs |
| Global baseline and common component styles | `packages/ui/src/styles.css` and shared pattern files | Do not add application-wide resets or base element themes |
| Shared stylesheet entry | `packages/ui/src/ui.css` | Import once at each app's root layout |
| Portal editorial composition | `packages/ui/src/products/portal-manga.css` and shared patterns | Supply page content, links, localization and domain data |
| Command Center operational composition | `packages/ui/src/products/command-center.css` and shared patterns | Supply live data, permissions, actions and workflow state |
| Reusable primitives and patterns | `packages/ui/src/**` and public exports | Compose and configure; avoid parallel visual primitives |
| Routing, auth/session, API, permissions, business rules | respective app/API packages | Keep domain logic out of the UI package |
| Map runtime and vendor lifecycle | Command Center feature code; visual adapter in package | Keep vendor initialization local, share only reusable presentation |
| Generated brand/icon outputs | package source + manifest/generator | Never hand-edit a second application-specific master |

### 3.2 Import contract

1. Each Next.js consumer imports `@empire/ui/ui.css` exactly once at its root layout.
2. Do not also import the same global stylesheet from a page, feature, or client component.
3. Product styles are loaded through the shared entry; consumers do not import product CSS files directly.
4. Do not create `apps/portal/globals.css` or `apps/command-center/style.css` as a second visual source.
5. Vendor CSS must be opt-in where practical and isolated behind a named adapter/scope.
6. A stylesheet import check is necessary but not sufficient: built CSS and computed styles still need inspection.

### 3.3 CSS boundary contract

- Portal selectors must be scoped to `.eol-public-shell` or an explicitly approved document-level behavior.
- Command Center selectors must be scoped to `.eol-workspace-shell` or `.eol-auth-layout`.
- Shared primitives must use semantic tokens and shared state contracts.
- Status meanings cannot be remapped per product. Product profiles may alter spacing and ornament, not the meaning of success/warning/error/pending.
- Avoid broad element selectors in product files unless explicitly documented and reviewed.
- Keep `:where()`-based product roots where intended to avoid accidental specificity escalation.
- Every exception needs a reason, owner, affected consumer, and removal/review condition.
- Do not “fix” a conflict by stacking another override at the end of a stylesheet without first locating the source of the cascade.

## 4. Delivery phases and gates

### Phase 0 — Lock the baseline and contract

**Purpose:** agree on what is shared and what is product-specific before broad edits.

Tasks:
- [ ] Record current `dev` commit and active PR/CI state.
- [ ] Verify the only production entry import in Portal and Command Center root layouts.
- [ ] Enumerate all global/product CSS files and confirm no consumer-owned presentation stylesheet has reappeared.
- [ ] Map each shared token and component to its canonical file/export.
- [ ] Classify existing differences as intentional product profile, legitimate runtime/vendor styling, or accidental drift.
- [ ] Record current screenshots before further visual changes.
- [ ] Link this plan to the centralization checklist; do not duplicate or silently reset existing `UI-Cxx-yy` status.

**Exit gate:** a reviewer can explain where a visual rule belongs and why; baseline artifacts are identifiable by commit, route, theme, locale and viewport.

### Phase 1 — Reliable shared stylesheet loading

**Purpose:** guarantee both consumers load the same package entry exactly once.

Tasks:
- [x] Ensure Portal root layout imports `@empire/ui/ui.css`.
- [x] Ensure Command Center root layout imports `@empire/ui/ui.css`.
- [x] Remove the duplicate Command Center import from `src/App.tsx`.
- [x] Run package and application typechecks/builds after the import change. Verified by CI run [39856531963](https://github.com/bjo163/A-L-L-A-H/actions/runs/39856531963) on commit `1c848708b6bf79555cebceb4fc41463db50e72a9`.
- [x] Verify both Next.js production builds compile without CSS ordering/build errors. Both Portal and Command Center production builds completed successfully in the same CI run; this confirms compilation, not full computed-style correctness.
- [x] Confirm no direct app import of `portal-manga.css` or `command-center.css`. The UI boundary validator enforces root-layout-only `@empire/ui/ui.css` imports and rejects alternate consumer CSS imports.
- [ ] Capture the compiled CSS order and check for duplicate loading in built output.

**Exit gate:** both production builds succeed; one intended global import per app; the shared entry resolves in both consumers.

### Phase 2 — Tokens and theme contract

**Purpose:** make visual meaning stable regardless of product context.

Tasks:
- [ ] Inventory any remaining raw hex/rgb/hsl values in product CSS and classify each as palette source, data visualization, vendor requirement, or exception.
- [ ] Replace shared-concept literals with canonical semantic tokens.
- [ ] Confirm light/dark mappings for text, backgrounds, surfaces, borders, links, focus, controls, and status states.
- [ ] Check alpha overlays, gradients, shadows, manga textures, maps, disabled states, and artwork in rendered context; opaque token-pair audits alone do not prove these combinations.
- [ ] Verify theme bootstrap avoids a wrong-theme flash and behaves safely when browser storage is unavailable.
- [ ] Ensure theme changes do not alter semantic status meaning or hide focus.

**Exit gate:** token audit and computed-style review agree; all declared exceptions have rationale; both themes are readable on both consumers.

### Phase 3 — Shared primitive and pattern parity

**Purpose:** eliminate duplicate visual concepts without forcing the apps into identical layouts.

Audit and converge these categories:
- [ ] Typography hierarchy: eyebrow, page title, section heading, body, helper text, metadata, code and numeric data.
- [ ] Actions: button variants, links styled as actions, icon buttons, disabled/loading/focus/hover states.
- [ ] Surfaces: panel/card/section/selected/raised/inset; avoid unnecessary nested cards.
- [ ] Form controls: labels, help text, validation, required state, disabled state, busy state.
- [ ] Feedback: loading, empty, partial/stale data, error, forbidden, retry and confirmation.
- [ ] Status: shared tone-to-color mapping and non-color cues.
- [ ] Navigation: active, hover, focus, collapsed/mobile, breadcrumbs and route focus behavior.
- [ ] Data presentation: metrics, tables, event lists, key/value groups and long payloads.
- [ ] Icons/brand: named exports, optical sizes, decorative vs labelled contract and accessible names.
- [ ] Motion: reduced-motion behavior and nonessential animation limits.

For each concept, choose one canonical component/pattern or document why two APIs serve genuinely different semantics. Deprecate duplicates only after all consumers have migrated and tests prove no remaining usage.

**Exit gate:** no unexplained second implementation of the same visual concept; shared state semantics are consistent; no app-level design primitive is added to replace a package primitive.

### Phase 4 — Portal production migration

**Purpose:** preserve the public journey while making visual decisions package-owned.

Surfaces:
- [ ] Root shell, header, navigation, language selector, footer and skip link.
- [ ] Home hero, identity/ecosystem sections, Explorer/flow and calls to action.
- [ ] Systems atlas and related links.
- [ ] Roadmap, readiness content and source links.
- [ ] Loading, not-found and recoverable error states.

For each surface, verify content order, heading landmarks, link destinations, ID/EN wrapping, focus behavior, anchor offsets, theme, and responsive layout. Expressive manga/Grunge decoration must not obscure the message or turn status into decoration.

**Exit gate:** every public route has a reviewed screenshot/state set and working navigation; no consumer CSS is needed to reproduce the package-owned presentation.

### Phase 5 — Command Center production migration

**Purpose:** ensure the operational product inherits the same foundation without sacrificing scanability or operator safety.

Surfaces:
- [ ] Authentication/session restoration and login/error states.
- [ ] Workspace shell: sidebar, active nav, mobile/collapsed navigation, header, search, connection/status and logout.
- [ ] Overview: health, readiness, metrics, modules and activity.
- [ ] World Monitor: map, legend, attribution, region selection, feed, stale/unavailable and list fallback.
- [ ] Continuum: entity/agent presentation and controlled invocation form.
- [ ] Directory: empty/loading/error states, role/status and long names.
- [ ] Knowledge: Arabic/script/transliteration, source notes and long text.
- [ ] Audit: event list, filters, timestamps, payload disclosure and pagination.
- [ ] CAB: change details, review/decision, confirmation and rollback information.
- [ ] Research: question/scope, evidence, review states, actions and provenance.
- [ ] Collaboration and Business views: ensure their surfaces use package patterns consistently.
- [ ] Verify permission-based visibility and server-returned statuses remain domain-owned and are not inferred from visual styles.

Operational-specific acceptance:
- Critical action is visually distinct from secondary/destructive action.
- Busy/disabled state prevents accidental repeat submissions where required.
- Error and rollback/recovery messages are visible and actionable.
- Data freshness, partial availability, stale data and unavailable sources are not visually conflated.
- Dense tables and forms remain usable at 320px+ widths and zoom.
- Map failure does not remove the essential information available in the list/summary fallback.

**Exit gate:** every Command Center view has its state and responsive evidence; workflow and permission behavior remains intact; product-specific styling is package-owned.

### Phase 6 — Visual, responsive and accessibility acceptance

**Purpose:** validate actual rendered behavior, not just source structure.

Required matrix:
- Consumers: Portal and Command Center.
- Theme: light and dark.
- Viewport: 320/375 mobile, 768 tablet, 1024 compact desktop, 1440 desktop; include 200% zoom review for critical forms/navigation.
- Locale/content: Indonesian and English; short and deliberately long labels/content.
- State: default, hover, keyboard focus, selected, disabled, loading, empty, partial/stale, error, permission denied, confirmation where relevant.
- Environment: normal theme, reduced motion, forced-colors emulation; assistive-technology review for critical controls.

Tasks:
- [ ] Store deterministic screenshots with route, commit, theme, locale, viewport, and state metadata.
- [ ] Check clipped/overlapping text, horizontal overflow, sticky header offsets, stacking layers, focus visibility, touch targets and contrast.
- [ ] Review rendered gradients, transparent surfaces, illustration overlays and status colors in context.
- [ ] Keyboard-test menus, forms, dialogs, tabs, disclosures, table actions and navigation focus restoration.
- [ ] Confirm loading/error announcements are not duplicated and decorative art is hidden from assistive technology.
- [ ] Review motion with reduced-motion enabled.
- [ ] Record defects, severity, owner, and re-test evidence; no “looks good” closure without artifacts.

**Exit gate:** all critical surfaces pass, no open P0/P1 accessibility or interaction defects, and screenshots/review record are linked to the commit.

### Phase 7 — Automated enforcement and regression protection

**Purpose:** stop visual ownership from drifting back into the apps.

Tasks:
- [x] Keep `pnpm audit:ui-css`, `pnpm audit:ui-boundary`, and product selector-scope audit green. The boundary, product-scope, duplicate-CSS, token, SVG/assets, contrast, and motion audits passed within `pnpm validate` on commit `547715943a9b35bc6c268daa023d11a8ba03f9ff`.
- [x] Add/extend a test that checks exactly one shared stylesheet import per consumer root layout. `scripts/validate-ui-boundary.mjs` checks both root imports, rejects imports from other app files, verifies the product CSS entries occur once, and checks the declared cascade order.
- [x] Detect direct product stylesheet imports from apps and reject new consumer-owned CSS files except documented runtime/vendor exceptions. The current validator rejects direct app CSS imports and app-owned presentation stylesheets.
- [ ] Check exported shared components and CSS selectors against actual consumer use before deleting compatibility APIs.
- [x] Run package tests, application tests, typecheck, build, root validation, dependency audit and Docker image builds. CI run [39857806762](https://github.com/bjo163/A-L-L-A-H/actions/runs/39857806762) passed quality checks and API, Portal, and Command Center Docker image builds; security run [39857806782](https://github.com/bjo163/A-L-L-A-H/actions/runs/39857806782) passed CodeQL.
- [x] Ensure tests catch invalid/missing tokens and accidental cross-product selector leakage where feasible. Token-reference audit and product selector-scope audit are now part of `pnpm validate`; rendered-context contrast and visual leakage still require browser acceptance.
- [x] Treat static audits as guardrails, not substitutes for browser screenshot review. The Definition of Done and review matrix keep browser, assistive-technology, and product sign-off as separate gates.

**Exit gate:** the relevant CI workflow is green for the latest commit, including both app builds and Docker builds; exceptions are documented and scoped.

### Phase 8 — Review, release and governance

**Purpose:** merge only after technical and visual evidence agrees.

Tasks:
- [ ] Update PR with actual scope, validation commands/results, screenshots, and remaining limitations.
- [ ] Confirm changes target `dev`; no direct push to `main`, no bypassing required checks.
- [ ] Keep PR draft until required build/test and visual evidence are ready.
- [ ] Request product/UI review for intentional visual changes and accessibility review for critical surfaces.
- [ ] Resolve all P0/P1 defects and any failing checks; do not call skipped or pending checks successful.
- [ ] Merge only through the repository's required `dev` → `main` process after approval.
- [ ] Record release/version and follow-up issues using existing repo automation; no Vercel deployment is part of this plan.

**Exit gate:** reviewed PR, green required checks, evidence complete, no unresolved critical defects, and release state accurately reported.

## 5. Test and evidence strategy

### Required command classes

Use the repository's current scripts as defined in `package.json`; do not invent substitute command names. At minimum, verify:
- Root validation and UI CSS/boundary/asset/SVG/contrast audits.
- `@empire/ui` typecheck/build and catalog build where relevant.
- Portal typecheck/build and tests.
- Command Center typecheck/build and tests.
- Root module tests, repository script tests and Turbo tests.
- Dependency audit at the configured severity.
- Docker Compose validation and API, Portal and Command Center image builds.

For each command, record exact command, commit SHA, exit code, and timestamp. A command not run is **not verified**. A workflow still running is **pending**. A skipped job is not a pass.

### Evidence artifact naming

Use a stable path pattern such as:

`docs/ui-evidence/<YYYY-MM-DD>/<consumer>/<route>/<theme>-<locale>-<viewport>-<state>.png`

Add a short index/manifest with:
- commit SHA and route;
- viewport dimensions, theme and locale;
- fixture/account state (never secrets);
- expected outcome;
- reviewer and date;
- defects found and retest links.

Do not include access tokens, real personal data, production secrets or sensitive customer records in screenshots.

## 6. Definition of done

The work is complete only when **all** are true:

1. Both apps import the shared stylesheet once at root layout.
2. All product presentation CSS is owned by `packages/ui`, apart from documented vendor/runtime exceptions.
3. Shared tokens and components have one canonical implementation.
4. Portal and Command Center retain their intentional product profiles and all existing routes/workflows.
5. Light/dark, responsive, localization, keyboard, reduced-motion, forced-colors and critical error states have evidence.
6. Static audits, package tests, both app builds, root CI and Docker image builds pass on the same reviewed commit.
7. No P0/P1 visual, accessibility or workflow defect remains open.
8. PR review and release status are explicit; no merge or deployment is inferred from a commit alone.

## 7. Risks and mitigation

| Risk | Mitigation |
|---|---|
| Global CSS is imported more than once or in different order | Root-layout-only import contract plus automated boundary test and built CSS review |
| Portal overrides bleed into Command Center | Mandatory product-root scoping, CSS boundary audit, screenshots of both consumers |
| A new override hides rather than fixes the source conflict | Trace selector and computed-style origin before editing; document intentional exceptions |
| Visual consistency makes operations too decorative | Named editorial/operational profiles; keep forms, tables, error states and critical actions restrained |
| Dark/light looks correct in tokens but fails with alpha/gradients | Rendered-context contrast review and screenshots in both themes |
| Shared API migration breaks a route or workflow | One surface per slice, preserve domain logic, test real navigation/actions and error recovery |
| CSS removal deletes dynamic/runtime styles | Inventory class hooks and vendor lifecycle first; delete only after consumer/test search |
| Large migration becomes unreviewable | Small commits within `dev`, explicit phase gates, avoid unrelated refactors |
| CI pass is mistaken for visual acceptance | Separate automated CI gate from human-reviewed visual/accessibility gate |
| Branding is treated as approved because SVG exists | Keep concept/provenance/trademark review independent from UI engineering acceptance |

## 8. Immediate next actions

1. Verify the latest commit containing the Command Center import consolidation and run the CI workflow.
2. Check whether the existing centralization checklist already covers each item before creating new checklist IDs.
3. Capture current Portal and Command Center baseline screenshots in light/dark and mobile/desktop.
4. Validate build output and computed styles for both consumers.
5. Fix any evidenced regressions in the canonical package source, not by adding consumer-local CSS.
6. Proceed through phases 2–7 in small reviewable slices and keep [PR #6](https://github.com/bjo163/A-L-L-A-H/pull/6) in Draft until its stated gates are met.

**Current truth (2026-10-23):** both consumers use the shared root-layout entry; the Command Center bootstraps the stored theme before first paint; the import contract is enforced automatically. Full CI Quality checks, dependency audit, product CSS selector-scope audit, duplicate-CSS audit, typechecks/builds, and API/Portal/Command Center Docker image builds passed on commit `547715943a9b35bc6c268daa023d11a8ba03f9ff`; CodeQL also passed. Compiled CSS inspection, fresh post-change screenshots, full authenticated route/state visual review, assistive-technology review, and product/design sign-off remain open. The full two-consumer design-system migration is **not yet certified complete**.
