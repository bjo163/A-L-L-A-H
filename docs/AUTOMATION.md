# Simple workflow: dev → main

Use only the long-lived `dev` and `main` branches. Work on `dev`; promote through a
pull request from `dev` to `main`. Merge with a merge commit. Do not force-push,
squash, rebase, or bypass required checks.

## Daily work

```sh
git switch dev
git pull --ff-only origin dev
# edit and validate
git add <files>
git commit -m "feat(web): describe the change"
git push origin dev
```

When the `dev` checks pass, open a [promotion pull request](https://github.com/bjo163/A-L-L-A-H/compare/main...dev?expand=1).
Wait for `Branch policy` and `Quality checks`, then merge it using GitHub's **Create a merge commit** option.
GitHub Actions checks and builds the change; it does not create or merge pull requests.

After merging, update `dev` from `main`:

```sh
git fetch origin
git switch dev
git merge --no-edit origin/main
git push origin dev
```

## Required checks

The `CI` workflow runs one fast path: install the locked dependencies, run repository
validation, typecheck, run workspace tests, and build the apps. It also rejects pull requests
unless they come from this repository's `dev` branch into `main`. New runs replace
older runs for the same branch or pull request.

CodeQL and dependency auditing stay in the separate `Security` workflow. The
repository setup script requires only `Branch policy` and `Quality checks`; CodeQL
reports on pull requests and security scans also run weekly or manually. Rerun the
setup script as an admin if GitHub still shows CodeQL as a required check.

Run the same checks locally with:

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm exec turbo run test
pnpm build
```

For reproducible release evidence, capture the full commit SHA and the successful
CI run URL; a local pass does not substitute for a required GitHub check. Keep
production-only evidence (browser captures, deployed image and health checks,
backup/restore, and rollback) in the per-SHA release record. If a preview or
production environment is unavailable, leave those entries pending and record
the blocker; do not infer success from source inspection or CI.

## Releases

Releases are manual. After merging to `main`, create a GitHub Release with the next
stable `vX.Y.Z` tag pointing at the released `main` commit. Tags and GitHub Releases
are the version ledger. Do not add version-bump commits to `dev` or `main`.

## Repository settings

Run once with an authenticated GitHub CLI admin account, and rerun if required
checks or branch protection change:

```sh
node scripts/configure-repository.mjs --dry-run
node scripts/configure-repository.mjs
```

Keep `main` as the default branch, allow merge commits only, require `Branch policy`
and `Quality checks` on `main`, and block deletion and force-push on both branches.

## Per-SHA release record

Before promotion, record the candidate SHA, reviewers, risks, rollback plan, and
evidence for validation, typecheck, tests, build, UI screenshots, negative
authentication and tenant tests, deployment health, backup/restore, and rollback.
Every result must refer to that exact candidate SHA. Do not merge while required
checks are red or treat missing production evidence as a pass. The record template
is in OPERATIONS_RELEASE_GATES.md.
