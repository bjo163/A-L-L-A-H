# Moonwitness Signal Ledger

Character and Signal records are editorial data scoped to a tenant. A fictional persona is never an account, role, permission, or authorization principal. Real contributors require an explicit consent grant with a recorded scope and timestamp; revoked consent cannot be used to attach that contributor to new Signals.

Signal `contentCategory` preserves the distinction between fiction, user testimony, scriptural quotation, historical assertion, interpretation, empirical claim, and project concept. `editorialClassification` describes handling sensitivity (`public`, `internal`, `confidential`, or `restricted`); it does not claim truth or independent verification. Provenance, evidence links, claimed time, and observed time remain attributable source metadata.

Testimony starts private and pending consent. When a location is marked sensitive, its label and coordinates are withheld; only a `none` disclosure marker is accepted. Exact coordinates and exact-location fields are not part of the API contract. Ledger routes require an authenticated session, active tenant, and Moonwitness read/write permission.

The `ZIIL` module is the protection, privacy, safety, and accountability system. The `ZILL` entry is a separate fictional Moonwitness collection with slug `zill`. These names, namespaces, and permissions must not be conflated.
