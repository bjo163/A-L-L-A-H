# Empire Ink — working moodboard

**Status:** implementation direction for review; not the approved final brand specification.
**Owner:** `packages/ui` (`@empire/ui`).
**Provenance:** this board uses only repository-owned interface renders, package-owned SVG artwork, CSS/token samples, and the bundled typefaces listed in `assets/asset-manifest.json`. It includes no third-party moodboard images or untracked font assets. Space Grotesk and DM Mono license files are kept in `packages/ui/licenses/` under SIL Open Font License 1.1. The logo concepts remain provisional; this document does not grant trademark rights or approval for external reuse.

## Visual thesis

**Empire Ink** combines a quiet ink-colored canvas, deliberate editorial typography, hard-edged panels, and a small number of vivid light accents. The public Portal uses open space and evidence-led storytelling. 100CENTER uses compact, scan-friendly operational surfaces. Their layouts can differ while the mark, type roles, action hierarchy, status semantics, focus treatment, and shared component behavior remain recognizable as one family.

The current system is a working direction, not a reason to keep every historical effect. If an ornament competes with a heading, source, status, or action, remove the ornament first.

## Color roles

| Role | Package contract | Use | Keep separate from |
| --- | --- | --- | --- |
| Main brand and primary action | `--eol-color-accent`, `--eol-color-action-primary`, `--eol-color-accent-strong` | Rose carries the principal brand accent and the primary action; the strong role serves links where its contrast is needed. | Success, danger, or any domain status. |
| Supporting action and highlight | `--eol-color-surface-raised`, `--eol-color-gold` | Lime highlights a secondary action, selected surface, milestone, or decorative emphasis. | Warning semantics. Use the warning status family for warnings. |
| Information and keyboard focus | `--eol-color-focus`, info status tokens | Cyan marks focus and information-oriented details. | Brand-primary action and success. |
| Illustration palette | `--eol-manga-*`, system/domain tokens, and explicitly named feature-surface palette tokens | Violet, mint, blue, and deep teal may add meaning inside a documented illustration or feature surface. | General text, controls, and status meaning unless a semantic token explicitly maps them. |
| Status | `--eol-status-{neutral,info,success,warning,danger}-{foreground,surface,border}` | Use the same theme-aware foreground/surface/border triplet for each state. Keep a readable label or icon with the color. | Decorative brand accents. |

Shared brand and status decisions belong in `packages/ui/src/tokens.css`; `themes.css` maps the shared semantic roles. Product CSS may compose named package palette tokens into gradients, but must not invent another application palette. A source inventory still finds historic illustrative and category color literals inside package product CSS; those are package-owned today but are not all semantic tokens yet, so treat them as candidates for future tokenization rather than claiming this cleanup is complete.

## Type and reading hierarchy

- **Display:** Space Grotesk, `--eol-font-size-heading-1`, display line-height, and display tracking. Reserve the largest scale for one page-level idea, not every section.
- **Section headings:** Space Grotesk using the H2–H4 roles. Use accent color for a short phrase, not an entire paragraph or every heading.
- **Body and descriptions:** the shared sans role, relaxed line-height, and the package reading measure. Preserve readable sentence case and comfortable line length.
- **Metadata and dense labels:** DM Mono with the label tracking and small metadata roles. Keep it short, legible, and secondary to the actual content.
- **Metrics and identifiers:** tabular/lining numerals where values are compared. Long identifiers and localized strings wrap instead of forcing a wider page.
- **Other scripts:** use the package script fallback and line-height roles; check shaping and RTL in the page acceptance matrix before publishing a visual claim.

These are hierarchy roles, not separate app font stacks. A view can choose a component role, but may not redefine the underlying scale.

## Section and panel economy

1. Start a public editorial section as a flat section with a clear heading and generous vertical rhythm.
2. Use a card for a repeated, independently scannable entity (for example, a domain/system) or for a bounded, interactive choice. Do not put decorative cards inside cards.
3. Use a raised panel when content has a real boundary: a form, selected item, status summary, decision, source/evidence group, or primary callout. A border alone does not justify a panel.
4. In 100CENTER, group operational information into a small number of scan-ready panels. Keep related metrics in `MetricGrid`; avoid wrapping each metric in another panel.
5. A feature panel with an intentionally dark surface must use a foreground proven against every stop in its gradient. Theme selectors must not replace that foreground with the default page text color.
6. Use the editorial/operational rhythm and density tokens for spacing. Avoid per-page card-padding and section-gap overrides.

## Ink, shadow, and focus

- Dark ink and light paper are the base canvases; text and surface roles follow the active theme.
- Use the package elevation tokens for layered panels and dialogs. Reserve the small hard offset for a deliberately framed feature, illustration, or interactive manga treatment; do not stack a hard offset and a large soft shadow on the same element.
- Keep text shadow out of normal reading copy. Outline text only for a short display phrase where the fill/stroke remains legible in both themes.
- Focus is a separate, high-contrast 2px system using `--eol-color-focus` and the package focus offset. Never use hover color, decorative glow, or status color as the only focus cue.
- In forced colors, let system colors replace decorative surface fills while keeping labels, control boundaries, and focus visible.

## Official presentation profiles

| Profile | Public Portal / editorial | 100CENTER / operational |
| --- | --- | --- |
| Composition | `PublicShell`, `PageIntro`, `Container` reading/content widths, `Section` editorial rhythm, and long-form sequence. | `WorkspaceShell`, `PageIntro`, `Container` workspace width, explicit nav groups, scan-ready views, and operational Section rhythm. |
| Density | Comfortable reading width, larger section spacing, fewer simultaneous panels. | Compact gaps where data is dense; control hit targets remain at their shared sizes. |
| Ornament | Use manga rays, screentone, orbit, and SFX as bounded package artwork. A quiet section stays quiet. | Use telemetry/map motifs only where they explain live state or context; keep dashboards and forms primarily functional. |
| Shared invariant | One master family, type roles, semantic status, action hierarchy, focus behavior, and reusable primitives/patterns. | Same invariant. Operational density is a named profile, not an alternate design system. |

The profiles use `--eol-section-space-editorial`, `--eol-section-space-operational`, `--eol-section-gap-editorial`, `--eol-section-gap-operational`, `Container`, and `Section`. They may change rhythm and composition, not the meaning of a color, status, button, focus ring, or control.

## Cross-product samples reviewed

These existing renders were reviewed as a family comparison, not approval of Orbit or final page acceptance. The Roadmap light render exposed a dark-feature-panel/ dark-text contrast defect; the package now uses inverse foreground text and audited deep-surface tokens. A post-fix rendered screenshot remains part of the outstanding visual regression gate.

Reviewed renders: Portal home (desktop dark/light, EN/ID), 100CENTER login (desktop dark), and 100CENTER workspace shell (mobile light).

## Decision boundary

The palette and profile rules above document the implemented working direction. They do not select a final logo concept, approve a trademark, or close source ownership/legal review. The draft rule for intentional versus preserved visual changes is in `VISUAL_CHANGE_POLICY.md`; it still needs product/design agreement at UI-C00-12. Keep weighted candidate scoring, reviewer approval, and final spec freeze open at UI-C02-03, UI-C02-15, UI-C01-11, and UI-C01-12. Keep rendered route/state coverage open at UI-C16 and UI-C17 until screenshots are regenerated and accepted after the latest fixes.
