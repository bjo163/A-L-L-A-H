# GENESIS DELIVERY ROADMAP
**Priorities:** working, testable foundations before screens, scores or 109 agent replicas.

| Phase | Target | Definition of done |
|---|---|---|
| G00 | Baseline docs & registry | 71 lexicon IDs, 4 source families, 4 pillars, 99 persona slots, 10 WINGS; deterministic validation on CI |
| G01 | Formal ADR + ownership | Approval by relevant Gen2 owners; API/data boundary, migration and rollback documented |
| G02 | Corpus ingestion | Four *licensed* sample editions + provenance, passages, variant numbering, source-restricted search, contradiction fixtures |
| G03 | Actor/Journey/Path | Versioned schemas, consent, state transitions, persistent event log and tenant isolation tests |
| G04 | Missions/WINGS/personnel | Restricted role assignment, approved human maintainer, revocation/appeal/safety review, audit |
| G05 | Local AI tools | Retrieval citations, disambiguation, adversarial prompt tests, tool allow-list, human approval |
| G06 | 100CENTER integrated pilot | End-to-end Path created, reviewed, run, suspended, repaired and retired via SDK/API |
| G07 | Production gate | Backups/restores, threat model, SLOs, tracing, DR, CI and live deploy evidence |

Current repository is at **G00 proposal baseline**. A passing JSON validator is NOT an implemented service, four ingested books, or production certification.

## Actionable development tasks
- Approve data licensing matrix and languages for each edition.
- Review source-family vs theological referent distinctions.
- Adopt vocabulary migration contract/owner under formal Gen2 ADR.
- Build fixture corpus and test ambiguity of "Injil", "Taurat", "Arsy", "Mizan".
- Implement fully scoped mandate and human approval gates.
- Test 99 slots and 10 WINGS uniqueness with no permission side effects.
- Update the one-door API, SDK and 100CENTER only after authorized integration.
