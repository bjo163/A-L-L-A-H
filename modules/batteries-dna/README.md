# Batteries DNA

`@empire/batteries-dna` is the workspace registry for 99 English-first package descriptors linked to the Asma records in the existing batteries-base lexicon seed. The registry applies the source handling guidance in `docs/UNILEX_SPEC.md`; those 99 records are not represented as entries in the 71-concept UNILEX seed.

The catalog contains 91 draft project analogies connected with `inspiredBy` and eight reference-only records without a software mapping. English ASCII slugs are unique; Arabic preserves source identity, and transliteration is an editorial convention under review. The 91 capability IDs are proposed identifiers in metadata, not implemented software functions. Their uniqueness does not establish that every analogy is semantically distinct or theologically appropriate; those mappings remain open to product and qualified scholarly review.

## Packages

Each record has its own private workspace package directly under the repository's `packages/` directory, such as `packages/batteries-dna-basir` (`@empire/batteries-dna-basir`). This makes all 99 packages visible beside the other first-party packages in the workspace explorer. It exports a frozen metadata descriptor from its package root and the JSON manifest from `./manifest`. These descriptors do not execute monitoring, grant permissions, or register as runtime modules. Runtime use requires a separately designed, reviewed implementation and explicit module allowlisting.

Package slugs are unique. The source list has two distinct Arabic entries at positions 48 (`الْمَجِيدُ`, lexicon code `majid`) and 65 (`الْمَاجِدُ`, legacy lexicon code `majid2`). Their packages are `@empire/batteries-dna-majid` and `@empire/batteries-dna-maajid`; the latter uses `aa` to mark the long vowel and distinguish the source form. Each manifest retains its exact Arabic and legacy lexicon code. Package slugs also normalize older Indonesian spellings, while registry lookup continues to accept legacy codes.

Eight entries are marked `reference_only`, including the two Majid forms and Malik al-Mulk. They have no `projectMapping` and no assigned capability. The other 91 proposed capability identifiers are unique, and each has an explicit bounded scope. This is an identifier and contract check, not proof that all 91 analogies describe distinct or appropriate functions.

The registry offers `listBatteriesDna()` and `getBatteriesDna(key)`. Lookup accepts the English package slug, legacy lexicon code, DNA ID, or package name and returns `undefined` when no record matches.

## Fusion recipe and backend preload

`@empire/batteries-dna-fusion` is the single composition engine. `config/batteries-dna-fusion.json` lists all 99 DNA packages as required components. On API startup, the backend reads and integrity-checks every package manifest, then keeps the frozen metadata fusion in memory. `GET /v1/dna/fusion` reports the recipe and all preloaded components. This stage preloads metadata only; it does not invoke monitoring or enable proposed software capabilities.

```js
import { getBatteriesDna, listBatteriesDna } from "@empire/batteries-dna";

const records = listBatteriesDna();
const basir = getBatteriesDna("basir");
const legacyLookup = getBatteriesDna("bashir"); // Legacy lexicon code remains accepted.
```

## Source and maintenance

The source of truth for the 99 records is `packages/batteries-base/src/data/asmaul-husna.ts`. Regenerate the catalog, package manifests, and exports after an approved source change:

```sh
pnpm dna:generate
pnpm dna:validate
```

The catalog identifies its list basis and source references. The familiar 99-name enumeration is included as a seed, not represented as the hadith's own explicit list or as the only scholarly compilation. All generated packages are private, `DRAFT_REVIEW`, and non-runtime. Review source references, Arabic spelling, transliteration, English meanings, and each project analogy before treating any record as approved.
