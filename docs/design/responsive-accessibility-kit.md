# Crew and Corpus responsive design kit

**Status: design reference only.** These documents are static visual concepts; they do not connect to an API, authenticate operators, verify sources, publish content, or establish that sample data is real.

- [Crew Constellation concept](mockups/crew-constellation.html)
- [Corpus / Mizan concept](mockups/corpus-mizan.html)

The concepts use original CSS geometry and abstract symbols. They contain no real personal data, external photography, licensed artwork, sacred-text quotations, or claims of verified research. Crew nodes are fictional editorial role labels, not people, accounts, team membership, or permissions. All Corpus/Mizan entries are explicit placeholders and must never be cited as evidence.

## Central ownership

- Shared colors, typography, spacing, focus rings, motion rules, contrast-safe surface pairs, and responsive primitives belong in `packages/ui` (`@empire/ui`). Product skins may provide MoonWitness color and manga/grunge treatments through owned tokens and components.
- Reusable navigation, status, empty/error/loading, provenance, and evidence-classification patterns should be implemented and reviewed centrally in `@empire/ui`; consumer apps compose them instead of inventing competing copies.
- Keep platform-specific behavior (for example, routing or authentication) in its owning app. A visual role, node, label, or fictional persona never grants authorization.
- The HTML files in this directory are standalone references, not production components or an alternate token source. Extract approved decisions into `@empire/ui` before product use.

## Viewport acceptance matrix

| Viewport width | Layout expectation | Acceptance check |
| --- | --- | --- |
| 320 px | Single-column content; compact/collapsible navigation; actions wrap; no horizontal page scroll | Labels, focus indicators, buttons, records, and empty/error copy remain readable and operable. |
| 390 px | Mobile-first single-column reading and detail panels; comfortable tap targets | Menu opens/closes with `aria-expanded`; controls do not obscure content or rely on hover. |
| 768 px | Tablet transition; Crew support panels and Corpus detail may stack below primary content | No clipped constellation nodes or provenance; responsive order preserves heading-to-content reading sequence. |
| 1440 px | Wide composition with bounded content width and paired primary/supporting panels | Long text stays readable; layout does not stretch controls or evidence metadata across the screen. |

Check intermediate widths around each breakpoint. The concept breakpoints are guidance, not a substitute for browser screenshots in the target application.

## Required shared states

- **Mobile navigation:** visible menu control, programmatic expanded/collapsed state, keyboard activation, and a predictable focus order. Keep private operator entry clearly identified and separate from public navigation.
- **Login:** explain that the operator workspace is private; label credentials and errors. In references, sign-in is a non-functional concept; production auth must use the owning authentication flow and never rely on hiding links.
- **Reader:** one primary page at a time; provide previous/next controls, current page position, accessible artwork description, and a clear return path. Never put real quotation or testimony in sample screens.
- **Loading:** announce asynchronous updates politely (for example, a `role="status"` region) and avoid motion as the only progress cue.
- **Empty:** state that no records are available and offer a valid next action where appropriate. Do not substitute fabricated people, sources, episodes, or counts.
- **Error / unavailable:** distinguish a failed request from a successful empty result, give a safe retry route, and avoid exposing sensitive details.

## Accessibility and theme checks

- **Contrast:** target WCAG 2.2 AA contrast: at least 4.5:1 for normal text and 3:1 for large text and meaningful UI boundaries. Verify every text/surface pair in both themes; pink, blue, yellow, and muted grays need explicit background pairings. Do not use color as the sole classification cue.
- **Keyboard and focus:** all actions work with keyboard; semantic links and buttons are used; focus follows visual reading order and remains visible with a strong outline. Do not remove the browser outline without an equivalent replacement.
- **Forced colors:** preserve system colors and borders using `forced-colors` support; do not depend on gradients, shadows, clip-path shapes, or color fills to convey meaning. Keep textual status labels visible.
- **Reduced motion:** honor `prefers-reduced-motion`; stop decorative motion and smooth scrolling. Loading must remain understandable without animation.
- **Responsive and assistive technology:** use reflow without horizontal scrolling at 320 CSS px, meaningful headings and landmarks, labelled inputs, accessible names, and status announcements. Ensure tap targets remain usable on touch devices.
- **Light and dark themes:** verify explicit foreground/background pairs and focus indicators in both themes. System preference may choose a default; a user override must remain stable while navigating.

## Content classification and provenance

Use both textual labels and distinct shapes so classification survives grayscale and forced-colors modes:

| Class | Suggested visual cue | Required production treatment |
| --- | --- | --- |
| Symbol / concept | Diamond or abstract geometry | Label as an editorial concept or interpretation; do not present as a factual source. |
| Quotation / testimony | Circle or quote marker | Preserve exact attribution, consent/rights status, privacy review, and withdrawal/correction path. Never invent or silently paraphrase a person's testimony. |
| Verified source | Square/check marker plus explicit “verified” text | Require edition/language/publisher or authoritative URL, stable locator, rights/license, reviewer and review date. A mock badge is not verification. |

Use faceless, abstract original geometry for crew and character concepts. Production assets need recorded authorship, source, license/permission, and review status before publication. No sample graphic or record in these references is approved production content.

## Review checklist before implementation

- [ ] Maintainer reviews both separate screens and the shared responsive/accessibility guidance.
- [ ] Product-specific tokens and reusable patterns are placed under `@empire/ui` ownership.
- [ ] Browser captures cover 320, 390, 768, and 1440 px in light and dark themes, including menu, login, reader, loading, empty, and error states.
- [ ] Keyboard-only, forced-colors, reduced-motion, contrast, and 320 px reflow checks have evidence from the implemented product.
- [ ] No sample person, quotation, source, metric, or capability is represented as real or verified.
