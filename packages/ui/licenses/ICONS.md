# Vector icon provenance

The inline SVG paths in `src/primitives/Icon.tsx` and `src/patterns/DomainSymbol.tsx` were drawn for this repository on 22 October 2026 as part of the UI centralization work. They were created from scratch for this package; no third-party icon font, SVG collection, external URL, raster artwork, or copied library implementation was used.

The paths are implementation candidates and have not received product-owner art direction, legal review, or an explicit asset license grant. The repository currently has no root `LICENSE` file, so this note does not grant a license for external reuse or redistribution. Keep use within the repository until the project owner records the applicable asset and repository license. Record future edits and approvals here.

## Style family and enforcement

The selected baseline family is **Empire Line v1**: `0 0 24 24` viewBox, `currentColor`, 1.8-unit stroke, round line caps, and round joins. The recommended display sizes are 16, 20, 24, and 32 CSS px; 20px is the default, while 24px matches the authoring grid. At 16px the shared stroke scales to 1.2 CSS px, which is the smallest approved implementation target. The catalog compares every icon at each size. `asset-manifest.json` records the family and size ladder, while `iconDisplaySizes` is the package source used by the catalog; the root `node scripts/validate-ui-assets.mjs` check rejects drift or sizes below 16px. Individual icon paths must not override the shared stroke properties. A future exception requires an explicit design decision and a separately named family in the manifest before that icon is added.

These are baseline display sizes, not per-size redrawn optical variants. Pixel-level legibility, forced-colors behavior, and both themes still require manual review under UI-C03-16.

License status remains unresolved for reuse outside this repository. The recorded provenance is original repository-authored SVG paths with no third-party library or copied implementation; do not describe this provenance note as a license grant.
