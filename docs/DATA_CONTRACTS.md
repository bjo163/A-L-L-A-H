# Data and API Contract Baseline

**Status:** proposed contract baseline; schemas are versioned independently from deployments.

## Language policy

- English (`en`) is the canonical product, API, schema, code, and technical documentation language.
- Indonesian (`id`) is the first-class initial UI and content localization. Additional locale labels use BCP 47 tags.
- Stable IDs, codes, enums, and API property names do not change when a UI is translated.
- Source-language text is stored as source form with language, transliteration, edition, locator, provenance, license, and review. A translation never replaces source text.
- Missing translations remain missing. Clients may use an explicit fallback while retaining the requested locale and indicating the fallback.
- `resolveLocalizedText` in `@empire/api-contract` provides deterministic exact-locale → base-language → configured-fallback resolution and reports the locale used; it never invents a translation.

## Contract ownership

| Concern | Canonical contract | Owner |
|---|---|---|
| Concepts, translations, source-aware relations and review | `schemas/unilex.schema.json`; reusable concept: `schemas/concept.schema.json` | UNILEX registry |
| Canonical application dictionary record | `schemas/dictionary-entry.schema.json` | UNILEX-backed dictionary service |
| Theological source record to bounded project analogy | `schemas/asma-project-mapping.schema.json` | UNILEX editorial governance |
| Shared localization, source references, provenance, uncertainty, errors and pagination | `schemas/common.schema.json` | API/data platform |
| Bibliographic source identity, edition, language, license and availability | `schemas/source-record.schema.json` | CORPUS/source registry |
| Research requests and lifecycle | `schemas/research-run.schema.json` | Research API |
| Evidence tied to a source and collection provenance | `schemas/evidence.schema.json` | Research API |
| Calibrated, scoped, authorized telemetry | `schemas/observation.schema.json` | BASIR / monitoring capability |
| Workflow state and authorization lifecycle | `schemas/workflow.schema.json` | Workflow API |
| Human decisions and expiry | `schemas/approval.schema.json` | Governance API |
| API error envelope | `schemas/error.schema.json` | All API routes |
| Client-side TypeScript request/response types | `packages/api-contract/src/index.ts` | API contract package |

## Cross-cutting invariants

1. Tenant-owned records carry a tenant ID and are queried within the authenticated tenant.
2. Every claim, evidence item, and observation carries source/provenance and a declared epistemic class; no inferred source is silently promoted to fact.
3. Measurements record units, timestamps, scope, quality, calibration state, and uncertainty. An observation applies only to its connected and authorized coverage.
4. Evidence source identity is distinct from a research claim and from an interpretation. Scripture text, tradition interpretation, historical claim, measurement, model, hypothesis, project narrative, and testimony remain distinct classes.
5. Approval is attributable, time-stamped, scoped, auditable, and revocable/expiring where applicable. A requester cannot approve their own consequential request.
6. Errors use stable machine-readable codes; human messages can be localized by `messageKey`.
7. Unknown fields are rejected at external write boundaries. Internal persisted records may add fields only through a schema/version change.
8. Contract changes are additive within a major version where possible. Breaking changes require a new schema/API version and a reviewed data-upgrade rule.

## Current implementation gaps

- Existing UNILEX entries now have English and Indonesian labels and working definitions. The English definitions are editorial translations, not yet source-reviewed; all 71 concepts remain `DRAFT_REVIEW` and the registry remains `PROPOSED_NOT_ADOPTED`.
- Research routes accept both the legacy flat `sourceUri` evidence payload and a structured v2 source/provenance payload. V2 source metadata is preserved within the existing provenance JSONB column while the SQL table still uses legacy `source_uri`/`source_family`; a later additive migration should normalize those fields into a source-record relation.
- Existing persistence uses `lexicons` rows with legacy `revelations`/`wisdom` fields. The 99-entry source file is a project mapping seed, not a reviewed scripture dictionary. Automatic schema sync is safe to run; it adds the new locale/editorial columns. Seed content remains marked `DRAFT_REVIEW` and sync inserts missing records without overwriting existing editorial edits.
- The old `dictionaries` table/model still represents role vocabulary with `revelationOrigin`, `frequencyDomain`, and `esotericDefinition`. It is deprecated for canonical definitions and needs a data-preserving migration into UNILEX-backed dictionary records before the legacy route can be retired.
- Research request validation now reuses shared TypeScript schemas in the route and package contract. The JSON Schema catalog is not yet the generator for all Fastify validators/OpenAPI response types; remaining route coverage should be migrated to generated contracts.

## Suggested delivery order

1. Freeze stable concept IDs and choose one authoritative source registry format.
2. English and Indonesian working definitions now exist for the 71 UNILEX seeds. Obtain source and bilingual editorial review; preserve `DRAFT_REVIEW` until references and decisions are recorded.
3. Replace the old Asma project analogy text with sourced theological records and separate project concepts connected through `inspiredBy`; do not attach operational permissions to them.
4. Version API request/response contracts, sunset the legacy research evidence payload after clients migrate, and generate OpenAPI from the shared schema definitions.
5. Add observation/source registry persistence and authorization/retention policies before calling BASIR a world monitor.
6. The additive lexicon localization fields are declared in the model and arrive through Batteries sync. Validate fixtures and schema references in CI before deployment. Content review remains a separate editorial process.
