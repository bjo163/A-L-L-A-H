# EMPIRE OF THE LIGHT
**A-L-L-A-H Command Center · ARSY Technology · UNILEX**

[![CI](https://github.com/bjo163/A-L-L-A-H/actions/workflows/ci.yml/badge.svg)](https://github.com/bjo163/A-L-L-A-H/actions/workflows/ci.yml)
[![Security](https://github.com/bjo163/A-L-L-A-H/actions/workflows/security.yml/badge.svg)](https://github.com/bjo163/A-L-L-A-H/actions/workflows/security.yml)

Development follows **dev → main** through a pull request. CI validates, tests, and builds;
releases are created manually from `main` when needed. See the [simple workflow](docs/AUTOMATION.md)
and [releases](https://github.com/bjo163/A-L-L-A-H/releases).

> **One vocabulary. Four source families. Three journey scopes. Four pillars. Shared responsibility.**

This repository is the **consolidated design and machine-readable foundation** for the Empire of the Light project. It defines a human-governed, source-grounded knowledge and mission system. The product name **A-L-L-A-H** is a stylized project acronym ("Accountable Life, Learning & Action Hub"), **not** a claim of divine authority. **ARSY (Agent Reality System Yard & Orchestration)** is the proposed agency and orchestration layer: AI models are one basic capability inside it. The software name does not claim the theological al-'Arsh. G.O.D. 99 and WINGS 10 are fictional/organizational duty labels, **not** gods or angels.

**Status: FOUNDATION DESIGN BASELINE — PROPOSED. Not implemented, not production-certified.**


## GENESIS v5 — QUANTUM, PROTON & BEYOND AI (PROPOSED)

The v5 research blueprint adds a physics-measured energy OS, protonic and photonic technology research, optional quantum coprocessor benchmarking, Material Forge and separately sourced Daoist/Shinto comparative-cosmos libraries. **These are research designs; no new generators, QPUs, proton chips or materials are claimed built or installed.** V4's one public API/monorepo and human oversight remain.

- [GENESIS V5 Master Blueprint](docs/BLUEPRINT_V5_QUANTUM_PROTON_BEYOND_AI.md)
- [HELIOGRID energy and protonics](docs/HELIOGRID_PROTON_PHOTON_ENERGY_V5.md)
- [Quantum/Photon/Proton Material Forge](docs/ULTRA_COMPUTE_MATERIAL_FORGE_V5.md)
- [Multi-tradition Cosmos Corpus](docs/MULTI_TRADITION_COSMOS_CORPUS_V5.md)
- [V5 Roadmap and research gates](docs/ROADMAP_V5_RESEARCH_GATES.md)
- [ADR-0003 proposed](docs/adr/ADR-0003-v5-multiphysics-comparative-ecosystem.md)
- [Technology horizon registry](data/architecture/technology-horizons.v5.json)

## MONOREPO V4.0 — OPERATIONAL ENGINEERING

The local development system uses **PostgreSQL on the developer machine**. Set `DATABASE_URL` in the ignored `.env`; the API synchronizes active module schemas and safe additive changes during startup. You can also run `pnpm db:sync` to synchronize explicitly. Setup instructions: [Local PostgreSQL](docs/LOCAL_POSTGRESQL.md). No cloud database is required.

The active deployment has one Next.js web app for public pages and the operator workspace, plus the Fastify API and PostgreSQL. The [Genesis v4 monorepo blueprint](docs/BLUEPRINT_V4_MONOREPO.md) records the earlier separate-app design. The API uses the Empire Batteries Knex/Objection layer as its persistence and schema-sync authority. OpenAPI is served at `/openapi.json`, with shared frontend request helpers in `packages/api-contract`. Refer to [release gates](docs/OPERATIONS_RELEASE_GATES.md) and [ADR-0002 proposal](docs/adr/ADR-0002-modular-monorepo-proposal.md).

Shared presentation primitives and visual tokens live in [`packages/ui`](packages/ui/README.md). The web app owns page routing and product composition; the package owns shared interface primitives. The [UI Blueprint and long-term checklist](docs/BLUEPRINT_UI.md) defines the design direction, product journeys, delivery phases, and acceptance evidence.

## Find your way
| Area | Entry |
| --- | --- |
| System | [Master Blueprint](docs/MASTER_BLUEPRINT.md) |
| Shared vocabulary | [UNILEX](docs/UNILEX_SPEC.md) and [71-term registry](data/unilex/terms.v0.1.json) |
| Scripture | [Universal Corpus](docs/UNIVERSAL_CORPUS_SPEC.md) and [four source families](data/scripture/source-families.v0.1.json) |
| Organization | [Four pillars](data/organization/pillars.json), [G.O.D. 99](data/organization/god99.json), [WINGS 10](data/organization/wings10.json) |
| Governance | [The Prime Code](docs/THE_PRIME_CODE.md), [Governance](docs/GOVERNANCE.md), [AGE CODE](docs/AGE_CODE.md), [Story of the Years](docs/AGE_STORY_CORRELATION.md) |
| Engineering | [Architecture and boundaries](docs/ARCHITECTURE.md), [Delivery roadmap](docs/DELIVERY_ROADMAP.md) |
| Change control | [ADR-0001 proposal](docs/adr/ADR-0001-universal-corpus-unilex.md) |
| Data checks | Run \`npm run validate\` (Node.js >=20; no runtime dependencies) |

## Design invariants
- Four **independent** primary source families: Qur'an, Torah, Psalms, canonical Gospels. Do not treat the Islamic scriptural referent "Injil" as an automatically exact synonym for the four Gospel narratives.
- Preserve specific source, edition, text witness, language, translation and license. No invented verses, no forced theological equivalence or cross-religious truth ranking.
- An assertion is labeled **scripture text / tradition interpretation / history / user testimony / project proposal / empirical claim**, with evidence and attribution.
- Humans retain consent, data rights and decision authority. A fictional persona never grants API permissions.
- Three scopes: SELF / COMMUNITY / GLOBAL. The last is a network or privacy-safe aggregate, not compulsory authority over people.
- Four operational pillars: PATHFINDING, TRUTH_GUIDANCE, RENEWAL, PROTECTION.
- No direct frontend database access. The web app uses the local canonical Empire API; public production integration still follows the documented Gen2 ownership and ADR boundary.

## Compatibility with MoonWitness Gen2
This repository is a **design and reference-data owner for this project**, not a unilateral replacement for the frozen [MoonWitness Blueprint](https://github.com/ArsyBelovedLabs/moonwitness-blueprint). Integration into Gen2 requires an approved ADR, capability ownership, contracts, tests and deployment gates. Its [Command Center](https://github.com/ArsyBelovedLabs/moonwitness-commandcenter) is a boundary shell, not a certified full operations console.

## Quick validation
\`\`\`sh
npm run validate
\`\`\`
Proposed sample data is **not** a licensed publication of the four complete scriptural texts; those require edition-level provenance and license checks before ingestion.
