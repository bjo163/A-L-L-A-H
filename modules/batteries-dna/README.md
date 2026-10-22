# Batteries DNA

`@empire/batteries-dna` is the single registry for 99 English-first metadata records linked to the Asma records in the existing batteries-base lexicon seed. The registry applies the source handling guidance in `docs/UNILEX_SPEC.md`; those 99 records are not represented as entries in the 71-concept UNILEX seed.

The catalog contains 91 draft project analogies connected with `inspiredBy` and eight reference-only records without a software mapping. English ASCII slugs are unique; Arabic preserves source identity, and transliteration is an editorial convention under review. The 91 capability IDs are proposed identifiers in metadata, not implemented software functions. Their uniqueness does not establish that every analogy is semantically distinct or theologically appropriate; those mappings remain open to product and qualified scholarly review.

## Registry

All records live in `catalog.json` and are exposed through `listBatteriesDna()` and `getBatteriesDna(key)`. The records are metadata only; they do not execute monitoring, grant permissions, or register as runtime modules. Runtime use requires a separately designed and reviewed implementation with explicit module allowlisting.

Registry slugs are unique. The source list has two distinct Arabic entries at positions 48 (`الْمَجِيدُ`, lexicon code `majid`) and 65 (`الْمَاجِدُ`, legacy lexicon code `majid2`); the latter uses `aa` to mark the long vowel and distinguish the source form. Every record retains its exact Arabic and legacy lexicon code. Slugs normalize older Indonesian spellings, while registry lookup continues to accept legacy codes.

Eight entries are marked `reference_only`, including the two Majid forms and Malik al-Mulk. They have no `projectMapping` and no assigned capability. The other 91 proposed capability identifiers are unique, and each has an explicit bounded scope. This is an identifier and contract check, not proof that all 91 analogies describe distinct or appropriate functions.

Registry lookup accepts the English slug, legacy lexicon code, DNA ID, or previous package-name alias and returns `undefined` when no record matches. The API serves this catalog at `GET /v1/dna/registry`; it loads one catalog and does not import or preload a package per record.

```js
import { getBatteriesDna, listBatteriesDna } from "@empire/batteries-dna";

const records = listBatteriesDna();
const basir = getBatteriesDna("basir");
const legacyLookup = getBatteriesDna("bashir"); // Legacy lexicon code remains accepted.
```

## Source and maintenance

The source of truth for the 99 records is `packages/batteries-base/src/data/asmaul-husna.ts`. Regenerate the catalog after an approved source change:

```sh
pnpm dna:generate
pnpm dna:validate
```

The catalog identifies its list basis and source references. The familiar 99-name enumeration is included as a seed, not represented as the hadith's own explicit list or as the only scholarly compilation. All records are `DRAFT_REVIEW` and non-runtime. Review source references, Arabic spelling, transliteration, English meanings, and each project analogy before treating any record as approved.
