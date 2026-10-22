# UI review evidence matrix

Status values: **verified** means a reproducible source/build check passed; **open** means the review still needs a rendered browser or assistive-technology session.

| Surface | Evidence | Status | Limitation |
| --- | --- | --- | --- |
| `@empire/ui` package | Typecheck and production build | verified | Does not prove browser painting or AT announcements |
| UI catalog | Production Vite build; static fixtures for themes, icons, states, tables, maps, and long content | verified | Catalog was not sampled at every viewport in a browser session |
| Portal routes | Next production build; source audit for landmarks, language, skip link, theme persistence, and focus return; live desktop and responsive spot review on `/`, `/systems`, and `/roadmap` | open | Browser measurements cover dark theme at requested viewport widths 375/768/1440 and page intro/CTA bounds; other states, full language/theme matrix, keyboard, and screen-reader acceptance remain open; no screenshot artifact retained |
| Command Center views | Vite production build; source audit for shared navigation, states, forms, map adapter, language, and focus; live visual review of login `/` | open | Login is the only view reviewed this session; API and database indicators rendered `ok`, inputs and buttons were visible, and login/refresh buttons measured 44px. Authenticated views need a provisioned test session; no credentials were entered. No screenshot artifact retained |
| Dark/light theme | `node scripts/audit-ui-contrast.mjs`: 27 opaque role pairs per theme, WCAG luminance | verified | Alpha/gradient/artwork contrast and rendered route focus open |
| Keyboard/focus | Native controls, shared focus rules, skip links, dialog and mobile-menu return focus | verified | Manual keyboard traversal in browser open |
| Reduced motion/forced colors | CSS media-query fallbacks in shared/product/map styles | verified | Browser/OS preference simulation open |
| Target browsers | Chromium desktop; Firefox/Safari and iOS/Android narrow viewports | open | Chrome on Windows was used for a single dark-theme desktop spot review of Portal `/` (`localhost:3300`) and Command Center overview (`localhost:5173`). Firefox, Safari, iOS/Android, and narrow viewport coverage remain open |

This matrix is evidence tracking, not an accessibility conformance claim. Close open rows with screenshots, browser version, OS/device, viewport, and observed result before marking final visual acceptance.

## Manual spot review — 2026-10-22

Portal `/` and Command Center overview were both loaded in Chrome on Windows at a desktop-sized viewport while the user's local servers were already running. The pages share the Orbit mark, dark ink surfaces, pink/lime accents, and dotted/ray decorative language. Portal uses a spacious editorial hero with a large illustration; Command Center uses a denser operational shell and status panel. The difference reads as two compositions from one family in this sample. This was a visual spot review only: no screenshot file was retained, no light theme or narrow viewport was sampled, and no other route/view or authenticated state was accepted from this observation.

## Runtime follow-up — 2026-10-22

The user-provided local servers were already running. In Chrome on Windows, the Portal was inspected in dark theme at requested viewport widths 375, 768, and 1440 for `/`, `/systems`, and `/roadmap` (nine route/width combinations). No document horizontal overflow appeared: `scrollWidth` was 360/753/1425 CSS px while `innerWidth` was 375/768/1440 (the 15px difference is the browser scrollbar gutter). The Systems and Roadmap H1 bounds remained inside their intro panels. Inner-page CTA heights were 43–44px in computed layout (fractional layout rounds at some widths); home CTAs measured 48px. This is a geometry and visual spot check, not a full visual screenshot set or theme/language acceptance. The Command Center login at `localhost:5173/` rendered the package Orbit mark, native labeled username/password controls, remember-me checkbox, 44px login and refresh buttons, and API/Database status `ok`; no credentials were entered, so all post-auth views remain unreviewed. The Portal home screenshot showed the editorial hero art and compact shared header; its expressive art direction remains provisional pending the C01 brand/art-direction gate. Browser screenshots were inspected live but not retained as repository artifacts. The responsive matrix resets the temporary viewport override after sampling.

## Selector-scope follow-up — 2026-10-22

After namespacing Portal, Command Center, and the MapLibre adapter CSS, Chrome on Windows at 1280×720 rendered Portal `/` in dark and light themes, `/systems` and `/roadmap` in light theme, and Command Center login `/` in dark theme. The shared brand header, page intro, editorial artwork, login card, labeled fields, action buttons, and operational health row retained their styles. Portal theme preference was returned to dark after sampling. These observations validate representative shells and routes after the selector change; they do not cover authenticated Command Center views, forced-colors/reduced-motion simulation, narrow viewports, or every route in both themes. Screenshots were inspected live but no artifact file was retained.
## Navigation focus runtime follow-up — 2026-10-22

At `http://localhost:3300/` in the in-app browser at 1280×720 (dark theme), direct loading `/systems#arsy` initially exposed a focus gap: the browser scrolled to the H2 at a 102px top offset but left focus on `BODY`. `PageNavigationFocus` now schedules the existing URL hash after mount and gives hash destinations precedence over the generic heading when a client route changes. After reloading the running Portal, direct load focused the `#arsy` H2 (top 102.2px, computed scroll margin 102px); keyboard activation of the home-to-Systems anchor did the same and displayed the browser focus ring. A same-page `/#ekosistem` link focused its section, and a normal `/systems` client route focused the page H1. No screenshot file was retained.

Command Center's authenticated WorkspaceShell transitions and narrow viewport offsets have not been runtime-reviewed, so UI-C09-10/UI-C16-06 remain open.
