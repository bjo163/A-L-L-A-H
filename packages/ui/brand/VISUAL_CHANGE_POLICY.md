# Visual change policy — review proposal

Status: **proposed for product/design agreement; not yet approved**. This policy makes the visual-centralization baseline reviewable without treating historical screenshots as an unchangeable design target. The UI package owns implementation; product/design reviewers decide whether an intentional change is acceptable.

## Decision rule

For every screenshot or behavior difference, classify it before accepting the result:

1. **Intentional system change** — the difference implements a named package token, component, product profile, accessibility correction, or documented art-direction decision. Record its rationale and representative evidence.
2. **Preserved product behavior** — the difference is not part of the approved visual change and must retain the existing information, actions, route behavior, domain meaning, or keyboard contract.
3. **Unresolved** — evidence cannot distinguish a defect from an intended change. Do not silently normalize it; record the surface and obtain review.

An intentional classification explains why a difference exists. It does not by itself approve its visual quality. A preservation classification does not freeze incidental historical CSS; it protects the user-visible contract.

## Change matrix

| Area | Intentional change allowed during centralization | Preserve unless separately approved | Acceptance evidence |
| --- | --- | --- | --- |
| Shared visual foundation | Replace app-local color, typography, spacing, radius, shadow, focus, motion, and density values with `packages/ui` roles; consolidate equivalent controls and state presentations. | Meaning of status, disabled/busy/error state, control label, reading order, and product data. Do not map a warning or danger to decorative brand color. | Token/contrast audits plus matched light/dark screenshots of the affected component and consumer. |
| Portal / workspace profiles | Make editorial Portal spacious and narrative; make 100CENTER operational and scan-oriented. Both use the same semantic tokens, brand family, controls, and focus behavior. | Portal and Command Center information architecture, copy, localization, route actions, permissions, and domain-specific workflow. A profile may change composition, not semantics. | Side-by-side product fixture, then route screenshots in supported theme, locale, and viewport. |
| Logo and iconography | Replace CSS/emoji/text glyph marks used as visual affordances with package-owned editable SVGs; introduce named small-size optical variants and explicit decorative/labelled behavior. | Visible product names remain editable text; icon-only actions retain an accessible name; no candidate is treated as final until reviewer, rights, and concept gates are recorded. | Brand concept sheet in the same Portal/workspace surfaces; small-size, grayscale, busy-background, light/dark review; asset manifest and provenance. |
| Illustration and motion | Remove duplicate or ineffective decoration; limit ornament to the package's named editorial/operational profiles; reduce redundant or continuous movement; honor reduced motion and pause offscreen activity. | Hero meaning, loading/progress communication, readable copy, pointer targets, focus targets, and state announcements. Decorative art cannot carry unique instructions or status. | Light/dark illustration fixtures, pointer/focus/long-copy review, reduced-motion check, and offscreen pause evidence. |
| Accessibility corrections | Change spacing or color where needed for readable contrast, visible focus, hit targets, or predictable sticky/anchor focus; corrections may visibly differ from old screenshots. | Keyboard reachability, accessible names, focus return, route/hash intent, and user data. Never preserve a known contrast or focus defect for screenshot parity. | Contrast/source audit plus browser keyboard and rendered evidence for the corrected state. |
| Responsive layout | Fix clipping, overflow, inaccessible controls, and unstable wrapping; use package-owned breakpoints and density behavior. | All content and actions remain reachable; no responsive state may silently drop product information or change a workflow. | Width/height matrix including narrow and short screens, overflow measurements, and screenshots. |
| Copy, data, and business states | Presentation wrappers may change to package patterns; product teams may supply translated text, live values, and domain status mapping. | Exact meaning, source/freshness, locale, authorization, and workflow outcome. UI centralization must not rewrite copy or business rules as a visual shortcut. | Route/state fixture with deterministic data and a product-owner comparison. |

## Recorded examples from this migration

These examples show how to classify differences; they are evidence of implementation history, not blanket approval of every final render.

| Difference | Classification | Reason and remaining gate |
| --- | --- | --- |
| Portal palette, typography, spacing, and control surfaces resolve through shared package tokens and themes. | Intentional system change | Establishes one design owner. Visual acceptance still requires the complete route/theme/locale/viewport matrix. |
| Portal's editorial hero and Command Center's operational telemetry composition differ while using package-owned patterns. | Intentional profile difference | Distinct product jobs justify composition differences; status and action semantics remain shared. |
| Roadmap CTA inverse text and deep feature-surface colors were corrected for light-theme contrast. | Intentional accessibility correction | Known contrast defects should not be preserved; the post-fix page screenshot remains a review gate. |
| Portal shell clipping changed so sticky headers work; hash navigation now scrolls and focuses after client navigation. | Intentional behavior correction | Restores the intended anchor/navigation interaction; Command Center authenticated anchor paths remain unreviewed. |
| Command Center's narrow root minimum was changed to avoid overflow at short 320px screens. | Intentional responsive correction | Preserves all controls and reachability at the actual available width; complete authenticated states remain open. |
| Sentinel category bars now use one shared action treatment instead of category-derived status colors, and its redundant banner pulse was removed while keeping the spinner. | Intentional semantic/motion correction | Categories are not success/warning states; the spinner alone communicates active progress. Authenticated visual review remains open. |
| Portal/Command Center copy, locale strings, route ownership, permission checks, API-derived state meaning, and workflow outcomes. | Preserve | The UI package changes presentation ownership, not business meaning or product content. |
| Provisional Orbit mark and any creator/trademark/reuse claim. | Unresolved | Source provenance and generated variants exist, but concept selection, rights-holder confirmation, and trademark review are still required. |

## Review record required for approval

Before closing UI-C00-12, product/design review should add a dated record here containing:

- reviewer name/role and surfaces reviewed;
- approved intentional changes and the corresponding screenshot/evidence paths;
- preserved behavior checks and any known deviations;
- unresolved items with owner and next gate;
- explicit approval or requested changes.

Until that record exists, this matrix is an implementation proposal only; keep UI-C00-12 unchecked. Do not claim pre-centralization visual parity where no comparable tracked source or screenshot exists.
