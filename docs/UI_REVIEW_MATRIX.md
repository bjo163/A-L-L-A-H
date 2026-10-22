# UI review evidence matrix

Status values: **verified** means a reproducible source/build check passed; **open** means the review still needs a rendered browser or assistive-technology session.

| Surface | Evidence | Status | Limitation |
| --- | --- | --- | --- |
| `@empire/ui` package | Typecheck and production build | verified | Does not prove browser painting or AT announcements |
| UI catalog | Production Vite build; static fixtures for themes, icons, states, tables, maps, and long content | verified | Catalog was not sampled at every viewport in a browser session |
| Portal routes | Next production build; source audit for landmarks, language, skip link, theme persistence, and focus return; one live desktop visual spot review of `/` | verified | No screenshot artifact retained; other routes, light theme, mobile, and screen-reader pass open |
| Command Center views | Vite production build; source audit for shared navigation, states, forms, map adapter, language, and focus; one live desktop visual spot review of `/` | verified | No screenshot artifact retained; other views, light theme, mobile, and screen-reader pass open |
| Dark/light theme | Token contrast calculations and source theme mappings | verified | Artwork/overlay contrast in rendered routes open |
| Keyboard/focus | Native controls, shared focus rules, skip links, dialog and mobile-menu return focus | verified | Manual keyboard traversal in browser open |
| Reduced motion/forced colors | CSS media-query fallbacks in shared/product/map styles | verified | Browser/OS preference simulation open |
| Target browsers | Chromium desktop; Firefox/Safari and iOS/Android narrow viewports | open | Chrome on Windows was used for a single dark-theme desktop spot review of Portal `/` (`localhost:3300`) and Command Center overview (`localhost:5173`). Firefox, Safari, iOS/Android, and narrow viewport coverage remain open |

This matrix is evidence tracking, not an accessibility conformance claim. Close open rows with screenshots, browser version, OS/device, viewport, and observed result before marking final visual acceptance.

## Manual spot review — 2026-10-22

Portal `/` and Command Center overview were both loaded in Chrome on Windows at a desktop-sized viewport while the user's local servers were already running. The pages share the Orbit mark, dark ink surfaces, pink/lime accents, and dotted/ray decorative language. Portal uses a spacious editorial hero with a large illustration; Command Center uses a denser operational shell and status panel. The difference reads as two compositions from one family in this sample. This was a visual spot review only: no screenshot file was retained, no light theme or narrow viewport was sampled, and no other route/view or authenticated state was accepted from this observation.
