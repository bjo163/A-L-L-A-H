# UI review evidence matrix

Status values: **verified** means a reproducible source/build check passed; **open** means the review still needs a rendered browser or assistive-technology session.

| Surface | Evidence | Status | Limitation |
| --- | --- | --- | --- |
| `@empire/ui` package | Typecheck and production build | verified | Does not prove browser painting or AT announcements |
| UI catalog | Production Vite build; static fixtures for themes, icons, states, tables, maps, and long content | verified | Catalog was not sampled at every viewport in a browser session |
| Portal routes | Next production build; source audit for landmarks, language, skip link, theme persistence, and focus return | verified | Desktop/mobile screenshot and screen-reader pass open |
| Command Center views | Vite production build; source audit for shared navigation, states, forms, map adapter, language, and focus | verified | Desktop/mobile screenshot and screen-reader pass open |
| Dark/light theme | Token contrast calculations and source theme mappings | verified | Artwork/overlay contrast in rendered routes open |
| Keyboard/focus | Native controls, shared focus rules, skip links, dialog and mobile-menu return focus | verified | Manual keyboard traversal in browser open |
| Reduced motion/forced colors | CSS media-query fallbacks in shared/product/map styles | verified | Browser/OS preference simulation open |
| Target browsers | Chromium/Firefox/Safari desktop and iOS/Android narrow viewports | open | No browser session was started for this slice |

This matrix is evidence tracking, not an accessibility conformance claim. Close open rows with screenshots, browser version, OS/device, viewport, and observed result before marking final visual acceptance.
