# Brand brief and lockup rules

Status: working brief for package implementation and concept review. It does not approve a final trademark, logo, or external-use license.

## Product meaning

- **Empire of the Light** is the parent identity for a family of human-governed learning, research, and operations products. The product language emphasizes clear sources, inspectable evidence, and accountable decisions; it does not claim religious or divine authority.
- **A-L-L-A-H** means **Accountable Life, Learning & Action Hub**. The Portal is its public research and architecture surface. The acronym describes the project; it is not an authority claim.
- **100CENTER** is the operator workspace for reviewing missions, research, readiness, approvals, and audit records under permission. It belongs to the same identity family as the Portal and must not appear to be a separate company or autonomous authority.

## Visual direction

Keep one master mark across products. Distinguish Portal and 100CENTER with editable product names and descriptors, not unrelated marks. Use the package palette and type tokens. Marks remain simple enough for a 16px favicon candidate, while visible names stay as live text for accessibility, localization, and font licensing.

The current catalog compares three provisional concepts:

- **Aperture**: focused entry and the passage of light. Check that its nested geometry stays open at small sizes and does not read as a generic hexagon.
- **Orbit**: connected systems and coordination. It is the current working mark and generated asset source, but orbital marks are common and the thin ellipses may merge at small sizes.
- **Monogram**: compact reference to the A-L-L-A-H identity. Check that it is not mistaken for a generic letter A or a product-specific initial.

No concept is final. The catalog simulates Portal, operator workspace, dialog, and 32px favicon contexts so reviewers can compare the same candidate in the same surfaces. Score concepts with the weighted rubric in `docs/BLUEPRINT_UI_CENTRALIZATION.md`; record the reviewer, date, rationale, and any rejected trade-off before selecting a master.

## Lockup composition

- **Horizontal**: mark to the left of editable name and descriptor. Use for Portal headers and workspace sidebars.
- **Stacked**: mark above editable name and descriptor. Use only where the available width favors vertical composition; keep alignment and clear space consistent.
- **Mark only**: `LogoMark`, decorative when a visible adjacent name is already present. Standalone favicon/app-icon outputs provide their own accessible title where the platform supports it.
- **Product lockups**: pair A-L-L-A-H with a Portal descriptor and 100CENTER with an operator-workspace descriptor. Do not redraw the master for product names.

Do not skew, stretch, crop, add outlines or shadows to the SVG, recolor paths independently, combine two candidate marks, or place the mark on a background that removes its contrast. The **provisional package lockup rule** is a minimum clear space equal to one quarter of the rendered mark box's side (`X = 0.25 × mark side`); the package applies a 12 CSS px gap to both horizontal and stacked lockups. At the current 34px compact, 39px regular, and 44px stacked mark sizes, that gap exceeds X (8.5px, 9.75px, and 11px). This gap is measured from the SVG viewport box to the adjacent live text; shell padding and surrounding content need their own layout spacing. It is an implementation baseline, not an approved final identity specification.

The current source review shows a 34px compact mark with a 12px computed gap in the Command Center login. Minimum display size is not yet approved: standard geometry should not be assumed legible below the sizes actually reviewed, and the optical source/16px favicon need comparison on light, dark, grayscale, and busy backgrounds before any final minimum is published. Numeric clear space and minimum size remain open in C02-09; full visual review and final concept selection remain open in C02-03/C02-13. Full-brand, monochrome, inverse, and small optical source outputs come from package-owned geometry and are declared in `assets/asset-manifest.json`; their availability does not mean colors or Orbit concept are approved.

## Source and licensing

`assets/source/brand/orbit.svg` is editable and generates the current Orbit React mark, full-brand/monochrome/inverse standalone marks, and 48px+ app-icon variants. `assets/source/brand/orbit-small.svg` is its package-owned optical correction for LogoMark small sizes and 16/24/32px standalone outputs, including the favicon. Generated files are validated for source/hash drift. Product names remain live text; no outlined wordmark is distributed. Font licenses are tracked in `licenses/`. Asset provenance does not grant rights to the project name or to external reuse; record the repository and trademark review before public brand release.
