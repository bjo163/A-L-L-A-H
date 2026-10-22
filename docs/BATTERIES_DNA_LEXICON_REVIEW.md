# Batteries DNA Lexicon Review

**Review date:** 2026-10-22  
**Status:** contract and source-comparison audit complete; theological, Arabic, and product mappings remain `DRAFT_REVIEW` pending qualified human review.

## Source basis

The 99-record seed follows the widely circulated at-Tirmidhi enumeration. Sahih al-Bukhari 2736 gives the hadith about ninety-nine names without enumerating them: [Sahih al-Bukhari 2736](https://sunnah.com/bukhari:2736). Jami at-Tirmidhi 3507 contains a separate enumeration and its own grading/commentary: [Jami at-Tirmidhi 3507](https://sunnah.com/tirmidhi:3507). OpenArabic explains the distinction, the variation among compilations, and transliteration collisions: [OpenArabic, 99 Names of Allah](https://www.openarabic.org/99-names-of-allah/). Islamic Relief UK publishes a scholar-reviewed comparison with Arabic, transliteration, and meaning: [Islamic Relief UK, 99 Names of Allah](https://www.islamic-relief.org.uk/resources/knowledge-base/99-names-of-allah/). The catalog now carries these source references and explicitly states its list basis.

The Arabic source forms and the list's transliteration were compared with these references. Transliteration schemes vary, and stripped ASCII slugs are product identifiers rather than authoritative transliterations. The source Arabic is retained in every package manifest. An authoritative Qur'an text confirms the term al-Basir in context, for example [Qur'an 42:11](https://quran.com/42/11), which pairs al-Sami' and al-Basir; the system's monitoring analogy is limited to connected, authorized telemetry.

## Corrections made

- Entry 27's Arabic is `الْبَصِيرُ` and its source code remains `bashir`, but its transliteration was incorrectly written `Al-Bashir`. It is now `Al-Basir`; its registry slug is `basir`. Registry lookup still accepts the old source code `bashir`.
- Entry 13's `Al-Mushawwir` spelling was corrected to `Al-Musawwir`, matching the Arabic letter ṣād and the reviewed source spellings. Its registry slug is `musawwir`.
- Entry 84 contradicted its own note: it had the technical attribute `ResourceGovernance` while the note explicitly forbade treating Malik al-Mulk as software ownership or authority. It is now a reference-only record with no software capability.
- English package slugs now normalize the seed's Indonesian spellings (for example, `syahid` → `shahid`, `warits` → `warith`) while retaining the existing lexicon code in each manifest.

## Duplicate and function audit

- The source has 99 distinct lexicon codes and the workspace has exactly 99 package folders, names, and IDs. The validator checks these counts and uniqueness on each run.
- The transliteration list intentionally repeats some simplified Latin forms. Positions 48 (`الْمَجِيدُ`, `majid`) and 65 (`الْمَاجِدُ`, legacy code `majid2`) are distinct Arabic forms; positions 55 (`الْوَلِيُّ`) and 77 (`الْوَالِي`) are distinct too. OpenArabic explicitly documents both pairs and explains that its simplified transliteration omits vowel length. The package slugs disambiguate the first pair as `majid` and `maajid`; every manifest retains the Arabic form and source code.
- Eight packages are `reference_only` and have no project mapping: `mutakabbir`, `aliyy`, `majid`, `majid2`, `ahad`, `mutaali`, `malik_mulk`, and `dzul_jalal`. This avoids inventing a software function for a source entry whose seed note says it is theological reference only.
- The remaining 91 entries have proposed capability identifiers and bounded draft project analogies. Unique identifiers do not prove the ideas are semantically distinct: for example, contribution-recognition and gratitude-capture overlap, and capacity-planning analogies need product review. The catalog and manifest schemas now enforce the record-type contract and reject mappings on reference-only entries; the validator also enforces identifier uniqueness. It does not claim theological or semantic approval.
- These packages export metadata only. No package executes monitoring, decision-making, access control, or another operational function. Every entry is draft, non-runtime, permission-free, and grants no authority.

## Validation

`pnpm validate` validates the catalog and all 99 generated manifests against JSON Schema, then checks count, code-to-source correspondence, distinct package slugs and capability IDs, reference-only behavior, generated package imports, and existing monorepo contracts. JSON Schema validation does not determine whether a theological meaning or product analogy is correct. Content status remains draft until Arabic/transliteration receives qualified editorial review and each project analogy receives product review.
