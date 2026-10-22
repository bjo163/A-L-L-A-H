# ENGINEERING ARCHITECTURE & BOUNDARIES

## Canonical Gen2 constraints
Frozen MoonWitness Gen2 blueprint is authoritative **for Gen2 implementations**:
- One public HTTPS/OpenAPI door: \`moonwitness-api\`.
- Reusable packages have single capability owners.
- UI and SDK do not connect directly to Postgres or private service databases.
- Domain data lives with authorized owner; job state persists durably.
- Any changed capability boundary, public contract, repository topology or production infrastructure requires approved ADR, tests, compatibility/rollback plan.

Repo \`empire-of-the-light\` is a cross-cutting **design/reference registry**, not a parallel backend, duplicate public API, or permission bypass.

## Proposed integrations
UNILEX vocabulary → approved data contracts in existing core/corpus capabilities.
Scripture source family registry → corpus owner; selected interpretation and source-resolution behavior remains bounded in prophetic domain.
Journey/Path capability ownership → to be designated in ADR before implementation.
ARSY agent runtime and orchestrator → role-bounded agents use approved adapters, tools, retrieval, compute and evidence workflows. AI inference is one optional capability; agents do not bypass authorization or human approval gates.
100CENTER renders operations through official SDK and API only.
G.O.D. 99/WINGS 10 → data registry and role assignment, not 109 containers or permanent running agents.

## Suggested implementation technology (not yet selected by ADR)
TypeScript and JSON Schema for cross-language contracts. Postgres for authoritative structured state with event log and scoped access. Derived search / embeddings are projections from versioned primary records. Local inference providers behind internal adapters, no direct unrestricted tool execution.

## Source boundary
Scientific evidence, scriptural text, historical traditions, user testimony and symbolic MoonWitness narrative exist on different epistemic tracks. Preserve them in model output and storage. A physical timeline cannot date claims of the unseen.
