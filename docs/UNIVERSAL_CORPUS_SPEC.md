# UNIVERSAL SCRIPTURE CORPUS — FOUR PRIMARY SOURCE FAMILIES
**Status:** Contract proposal. No full scripture publication or ingest claimed.

## Four source families
- SRC-TOR — textual **Torah/Pentateuch** traditions. Islamic *Tawrat/Taurat* is a distinct tradition-specific referent tracked in UNILEX.
- SRC-ZAB — **Psalms/Mazmur** textual traditions; numbering differs across some traditions and editions.
- SRC-INJ — four **canonical Gospel** texts in Christian textual traditions. Islamic *Injil* is a distinct referent; do not silently equate them.
- SRC-QUR — **Qur'an** textual traditions with mushaf/reading and edition identity; translations and tafsir remain distinct objects.

These are the first four families by project choice, **not** the assertion they exhaust all world traditions or can be merged into one text.

## Mandatory metadata
\`familyId\`, \`tradition\`, \`witnessId\`, \`editionId\`, \`title\`, \`languageTag\`, \`canonScope\`, \`passageRef\`, \`copyrightLicense\`, \`sourceUrl\`, \`integrityHash\`, \`ingestTimestamp\`. Optional: textual variant, translator, publisher, manuscript witness, provenance chain.
- \`ScripturalReferent\` denotes a claimed or narrated named scripture in a tradition.
- \`TextWitness\` denotes a physical/manuscript/textual witness.
- \`Edition\` is a particular released text/translation.
- \`Passage\` is a reference **within an edition and canonical scheme**.
- \`Claim\` records who made what statement.
- \`Interpretation\` attributes explanation to a person/school/time.
- \`Alignment\` links passages without collapsing disagreements.

## Evidence classes
SCRIPTURE_TEXT, TAFSIR/COMMENTARY, HADITH/TRADITION, HISTORICAL_CLAIM, USER_ATTESTED_BELIEF, PROJECT_ANALOGY, EMPIRICAL_RESULT, AI_HYPOTHESIS.
Claims carry provenance, not unqualified truth scores. Inferred similarity does not rewrite original sources. No forced harmonization, identity inference or divine revelation certification.

## Corpus pipeline
Acquire license-approved source → register witness & edition → checksum → normalize reference without overwriting original text → parse segments → validate verse/book scheme → attach provenance → release immutable corpus version → build derived lexical index and embeddings → compare/verify using source-bound citations.

## Search modes
1. UNIVERSAL_RESEARCH: parallel opt-in search across selected source families; display differences, confidence in retrieval and provenance.
2. TRADITION_SPECIFIC: source-constrained retrieval chosen by user.
3. PROPHETIC_MISSION_RESOLUTION: existing bounded Gen2 domain rule may prioritize a source for its narrowly defined workflow. It **must not** replace general corpus search policy.

## Licensing and safeguards
Do not redistribute copyright-protected translations without rights. Keep internal text/source integrity checks and retention/deletion obligations. Users cannot convert scripture retrieval into a fatwa, divine order, appointment of prophet, or final judgment engine.
