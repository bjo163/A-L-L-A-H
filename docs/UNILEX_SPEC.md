# UNILEX — UNIVERSAL LEXICON
**Status:** proposed, versioned vocabulary; initial registry: 71 concepts.
**Promise:** One language layer. Many traditions. No forced equivalence.

## Four vocabulary lanes
1. UNIVERSAL: context-neutral human values (TRUTH, TRUST, JUSTICE, CONSENT).
2. SCRIPTURE: attributed tradition-specific theological referents (e.g. Al-'Arsh; Amanah; Injil).
3. TEXT_SOURCE: extant textual witnesses/families (Torah, Psalms, canonical Gospels, Qur'an).
4. PROJECT: software and fictional organizational vocabulary (ARSY, 100CENTER, RĀ’ID, ZIIL).

Each concept has a stable ID, preferred labels and definitions keyed by BCP 47 language tags. **English (`en`) is the canonical product and API language**; Indonesian (`id`) is the first-class initial localization. Add further locales without changing concept IDs. Arabic, Hebrew, Greek, and other source-language headwords must remain source forms with transliteration, edition/context references, and qualified linguistic review; they are not replaced by English labels. UI copy is localized independently from API identifiers and canonical concepts.

## Data model and ownership
- UNILEX is the canonical multilingual concept registry. Its stable IDs, domains, definitions, alternate labels, source references, typed relations, and review status define vocabulary; it is not a free-form string translation table.
- `batteries-base` stores and serves application data. Its lexicon table may cache approved/seeded UNILEX terms, but must retain a stable concept ID and locale-keyed labels/definitions rather than treating project prose as scripture or authority.
- Keep source meaning and project mapping separate. A scripture-lane concept describes an attributed theological sense with citations and review. A project-lane concept describes a software capability. Connect inspiration only with `inspiredBy`; do not put software behavior into the theological definition.
- For the 99 Asma records, retain Arabic and transliteration as source identity. English labels in `term` and technical attributes/domains are product metadata. Any software association must be explicitly marked as an analogy/inspiration and scoped to observed, authorized inputs. It must never claim divine attributes for software.
- Missing locale text is missing, not guessed. Search may return a fallback label while preserving the requested locale and noting the fallback.

## Relationship vocabulary
- relatedTo: thematic relationship, **not synonym**.
- inspiredBy: a project concept takes inspiration; it does not inherit supernatural authority.
- distinctFrom: must not be treated as equivalent.
- exactMatch: only with demonstrably same scope/sense after review.
- closeMatch: similar but meaningful differences.
- narrowerThan/broaderThan: subsumption, not hierarchy of people.

## Red lines
- Al-'Arsh ≠ ARSY Technology.
- The Islamic referent Injil ≠ automatic exactMatch to canonical four Gospel texts.
- Torah as an extant text family ≠ guaranteed identity with every use of Taurat in Islamic theology.
- Mizan in eschatology ≠ software operational score.
- Persona "G.O.D." ≠ deity; WING agent ≠ angel.
- Divine concept labels never confer roles, permissions or operational authority.
- An AI must not invent or erase differences to provide a "universal" answer.

## Editorial governance
DRAFT_REVIEW → SOURCE_CHECK → LINGUISTIC_REVIEW → APPROVED → DEPRECATED.
Approved status asserts **terminology quality within scope**, never doctrinal authority.
Every term edit records editor, issue, supporting citation, semantic version, review decision, migration impact and audit evidence. Keep immutable historical IDs; never reuse.

## AI and search integration
The search layer uses concept IDs and language-specific forms, not naive word matching.
A query resolves candidate senses then sources; response retains contextual uncertainty and conflict. Cross-source alignments have a relation type, confidence and reviewers; neither exactMatch nor a "true religion" rank may be generated automatically.

## Initial data
Registry: \`data/unilex/terms.v0.1.json\`; schema: \`schemas/unilex.schema.json\`. This is a **seed registry** requiring source/linguistic review, not a completed dictionary of scripture. English is canonical for product operations; English and Indonesian labels/definitions are maintained as locale-keyed content, with source language preserved where applicable.
