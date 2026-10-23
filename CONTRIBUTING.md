# Contributing

## Branch and review flow

Work on `dev`; pushing a commit runs checks and opens or updates the promotion PR
automatically. GitHub merges it with a merge commit after required CI and Security
checks pass. Manual approval is not required. Do not push directly to `main`,
force-push, squash, rebase, or bypass branch rules. See [automation and versioning](docs/AUTOMATION.md).

## Local checks

Use Node.js `>=22.12.0` and pnpm `11.24.0`. Before review, run the checks relevant
to your change; CI runs:

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm typecheck
pnpm exec turbo run test
pnpm build
```

Do not include `.env`, credentials, generated build output, or local database files.
Sanitize logs and screenshots before attaching them.

## Data, sources, and architecture

Propose new concepts with a stable ID, English/Indonesian labels, narrow definition,
sources, sensitivity/context, relations, and reviewer. Never reuse deleted IDs.
Do not paste copyrighted book translations without licensing evidence; quote no long
source passages. If changing an existing sense, document compatibility and provide
an explicit migration when its meaning changes. Attribute theological claims; do
not silently present them as empirical facts. For Gen2 integration, obtain the
formal architecture decision and named capability owner before changing boundaries.

## Pull requests

Use the PR template to state purpose, checks, risks, migration/compatibility effects,
and user-visible release notes. New features should have observable acceptance
criteria. Security issues should follow [SECURITY.md](SECURITY.md), not a public
issue.
