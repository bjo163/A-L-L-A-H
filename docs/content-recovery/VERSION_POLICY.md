# LOST ARCHIVES version and authority policy

**Status:** operational proposal for recovery review; no recovered narrative is approved by this document.

## Evidence boundary

GitHub issues and repository files currently establish only locator metadata for the examples below. A filename, chat/export order, retry marker, poster number, or `V4` label is not evidence that an artifact is the final text, an approved quote, or the authoritative narrative. Do not copy or reconstruct missing source content from these clues. Personal Library material requires an authorized user export and an approved destination classification before ingestion.

## Selecting an editorial draft

1. Preserve each received source byte-for-byte as an immutable artifact; record a SHA-256 only when the bytes are actually available. Keep OCR, transcription, translation, image derivatives, and poster renders as separate artifacts linked with `derivedFrom`.
2. Record source locator, acquisition path and time, source-declared author/editor, asset type, language, rights/consent, privacy class, chronology, completeness, and evidence links. Use `UNKNOWN` for missing values; never infer a person from repository ownership or a filename.
3. Distinguish `occurredAt` (in-universe event time), `observedAt` (testimony/observation time), `recordedAt` (when a record was made), `createdAt` (artifact creation), `exportedAt` (export time), and `publishedAt`. Preserve precision, timezone, uncertainty range, and source for each value. One timestamp must not stand in for another.
4. A human editorial owner may nominate a source as `preferred_for_editorial_draft` only after inspecting the source and recording rationale, decision time, and reviewer identity. This label is not publication approval. Conflicting sources remain `CONFLICT` until a human resolves them; absent evidence remains `UNKNOWN`.
5. Compare text, quotations, poster artwork, and generated derivatives independently. Provide non-destructive diffs/merge proposals that point to exact source IDs and spans. Never overwrite originals or silently propagate a text change to an image/poster.
6. Keep fictional retcons, personal testimony, independently reviewed research corrections, and scriptural/source quotations in separate epistemic classes. A user quotation is never rewritten as approved without an attributable decision tied to the exact version.
7. Record alternate titles, aliases, spelling/typo variants, and same-name arcs as explicit crosswalks. Do not merge records solely because titles look similar.

## Reconciliation examples (locators only)

The machine-readable ledger at `data/moonwitness/version-map.json` contains three deliberately unresolved examples drawn from issues #69 and #70 and the temporal example described in #40. It records no narrative text and chooses no preferred version. Add source bytes, hashes, author rationale, and reviewed decisions only after authorized materials and human review are available.

## Compatibility with revision and canon workflows

This policy treats revisions as immutable snapshots, consistent with the intended snapshot/audit work in #21. A candidate version or proposed reconciliation is not canonical state; #38 requires a separately reviewed canon decision. Timeline values retain their temporal dimension and uncertainty as required by #40. No recovery action itself authorizes public release.
