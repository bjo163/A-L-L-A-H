# Vector icon provenance

The inline SVG paths in `src/primitives/Icon.tsx` were drawn for this repository on 22 October 2026 as part of the UI centralization work. They were created from scratch for this package; no third-party icon font, SVG collection, external URL, raster artwork, or copied library implementation was used.

The paths are implementation candidates and have not received product-owner art direction, legal review, or an explicit asset license grant. The repository currently has no root `LICENSE` file, so this note does not grant a license for external reuse or redistribution. Keep use within the repository until the project owner records the applicable asset and repository license. Record future edits and approvals here.

## Style family and enforcement

The current candidate family is **Empire Line v1**: `0 0 24 24` viewBox, `currentColor`, 1.8-unit stroke, round line caps, and round joins. Individual icon paths must not override those stroke properties. `asset-manifest.json` records the contract and `scripts/validate-ui-assets.mjs` checks it in CI. A future exception requires an explicit design decision and a separately named family in the manifest before that icon is added.

License status remains unresolved for reuse outside this repository. The recorded provenance is original repository-authored SVG paths with no third-party library or copied implementation; do not describe this provenance note as a license grant.
