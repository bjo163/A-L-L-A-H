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

After a push to `dev`, `.github/workflows/promote.yml` waits for successful CI and
Security runs on that exact commit, opens or reuses one `dev → main` pull request,
and enables merge-commit auto-merge. Main branch protection requires all CI and
Security checks and zero manual approvals, so healthy pushes promote unattended.
After merge, CI synchronizes `main` back into `dev`. The stable release workflow
waits until CI and Security both succeed for that exact `main` SHA, then publishes
a stable release when eligible Conventional Commits exist.

One-time GitHub setup: enable auto-merge, allow Actions to create pull requests,
allow workflow token read/write permissions, and apply merge-only branch protection
from `node scripts/configure-repository.mjs`. These settings require a repository
administrator; workflows do not weaken protection or bypass checks.

## Required checks

The `CI` workflow's Quality checks job installs locked dependencies, runs repository
validation, typecheck, workspace tests, the release-planner unit tests, and builds the
apps. It also rejects pull requests unless they come from this repository's `dev`
branch into `main`. Two separate disposable PostgreSQL integration jobs run in
parallel with Quality checks. New runs replace older quality runs for the same branch
or pull request.

CodeQL and dependency auditing stay in the separate `Security` workflow and run on
both long-lived branches. Main requires the four CI contexts (`Branch policy`, both
PostgreSQL jobs, `Quality checks`) plus `CodeQL` and `Dependency audit`. It still
requires a PR, while manual approvals are set to zero for unattended promotion.
Security scans also run weekly or manually.
Rerun the setup script as an admin if GitHub shows unexpected required checks.

Run the same checks locally with:

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm exec turbo run test
pnpm exec node --test scripts/release-planner.test.mjs
pnpm build
```

For reproducible release evidence, capture the full commit SHA and the successful
CI run URL; a local pass does not substitute for a required GitHub check. Keep
production-only evidence (browser captures, deployed image and health checks,
backup/restore, and rollback) in the per-SHA release record. If a preview or
production environment is unavailable, leave those entries pending and record
the blocker; do not infer success from source inspection or CI.

## Releases

Stable releases are prepared and published by `.github/workflows/release.yml` after
CI and Security complete successfully for the merge to `main`. The annotated stable Git tag
and its GitHub Release are the version ledger; do not add version-bump commits to
`dev` or `main`. The root
`package.json` version (`0.2.0`) is historical package metadata, not the current
release version. The package is marked private and has no package publication
workflow; the GitHub repository itself is public.

Before proposing a release, inspect the commits since the latest stable tag and
prepare release notes from the actual changes. The workflow then calculates these
notes automatically from Conventional Commit messages. Apply Conventional Commit intent
conservatively: `fix:` or `perf:` suggests PATCH, `feat:` suggests MINOR, and `!`
or a `BREAKING CHANGE:` footer suggests MAJOR. For `0.x`, treat breaking changes as
MINOR because public compatibility has not reached `1.0`; `feat:` is PATCH unless
the release owner explicitly opts into a minor pre-1.0 release. Documentation,
tests, chores, refactors, builds and CI changes alone do not require a release.
Merge commits are containers, not release signals; review the commits and PR title
inside the promotion. If history is malformed, intent conflicts, or there are no
eligible changes, stop and ask the release owner rather than guessing.

The current stable baseline is `v0.2.5`; GitHub also has historical development
prereleases such as `v0.2.6-dev.386`. Stable tags use `vMAJOR.MINOR.PATCH`; prereleases,
if explicitly approved, use SemVer prerelease identifiers such as `v0.2.6-rc.1`
and never replace or move a stable tag. Confirm that the proposed version is valid,
strictly greater than the previous stable tag, and does not already exist. Tag the
exact verified `main` commit with an annotated tag, then create one GitHub Release
for that tag. Do not move or delete a published tag. If release publication fails
after tagging, inspect the tag and release state first; retry publication for the
same tag only when it still points to the verified commit. For a bad published
release, prefer a corrective release and document the recovery.

If the repository has no stable tag, do not infer an initial release from root
`package.json`; have the owner choose and document the initial baseline.

Dry review commands (read-only):

```sh
git fetch origin --tags
git log --format='%H %s%n%b' v0.2.5..origin/main
git tag --list 'v[0-9]*' --sort=-version:refname
```

The release workflow checks CI and Security runs for the exact main SHA, calculates a stable
version, refuses malformed history or a duplicate remote tag, prepares the bundle,
verifies checksums and archive contents, then creates one annotated tag and one
GitHub Release with assets. It retries partial publication on the same verified tag
and replaces assets only for that tag. Its write permission is scoped to that job. Stable
publication is automated; prerelease publication remains manual and owner-directed.
A read-only planner checks the current
local `main` against `origin/main` and calculates a candidate from commits since the
latest stable tag:

```sh
pnpm release:plan
```

It refuses to run on `dev`, on a stale/different main ref, without a stable baseline,
or when commit history is ambiguous. It does not query GitHub check results; confirm
required checks for the exact candidate SHA before manual publication. Planning
creates no tag or remote release.

For a local preview, after a successful GitHub run for the candidate SHA, an
operator may save the verified run details as JSON and prepare a local-only bundle:

```sh
pnpm release:prepare --checks-file .artifacts/verified-run.json
```

The evidence file must contain the candidate `commit`, numeric `runId`, matching
GitHub Actions `runUrl`, and successful required checks. Preparation requires `main` to match the locally fetched `origin/main`,
then writes `release.json`, `CHANGELOG.md`, a versioned source archive, and
`SHA256SUMS.txt` under `.artifacts/releases/<version>/`. The manifest records the
same commit and evidence. Existing output directories are never overwritten.
This command makes no tag, GitHub Release, package publication, or deployment.
If release history contains prereleases (such as
`v0.2.6-dev.386`), those are historical outputs; the checked-in workflow does not
automate prerelease publication.
Production deployment is not triggered because this repository has no configured
production target. Connect a verified hosting target and its deployment credential
before adding that step; a GitHub Release alone does not claim a production deployment.

## Verification and recovery

Run only after inspecting the relevant manifests and available local services:

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm typecheck
pnpm exec turbo run test
pnpm build
git diff --check
```

The CI workflow additionally runs disposable PostgreSQL authentication/tenant
integration and schema-sync rollback smoke jobs on GitHub-hosted runners. Do not
claim those remote jobs passed based on a local run. Record commit SHA and workflow
run URL for every required check.

Recovery: for failed CI, fix the candidate and rerun checks before promotion. For
an ambiguous version, stop without creating a tag. For failure after tag creation,
verify the tag object and target commit, then retry creation of the matching release
only if it is absent. If a release exists with missing or inconsistent artifacts,
stop publication and document the discrepancy; do not move or delete its tag. Use a
new corrective release for a published defect. Code rollback and database rollback
are separate decisions: confirm migration reversibility and restore evidence before
reverting production data. No production target is configured in this repository.

## Repository settings

Run once with an authenticated GitHub CLI admin account, and rerun if required
checks or branch protection change:

```sh
node scripts/configure-repository.mjs --dry-run
node scripts/configure-repository.mjs
```

Keep `main` as the default branch, allow merge commits only, require a PR with zero
approvals plus all four CI and both Security contexts on `main`, and block deletion and force-push on both
branches. The setup script's dry-run prints the proposed settings;
its write mode changes remote repository configuration and must be run only by an
authorized administrator. Verify the persisted rules after applying them.

## Per-SHA release record

Before promotion, record the candidate SHA, reviewers, risks, rollback plan, and
evidence for validation, typecheck, tests, build, UI screenshots, negative
authentication and tenant tests, deployment health, backup/restore, and rollback.
Every result must refer to that exact candidate SHA. Do not merge while required
checks are red or treat missing production evidence as a pass. The record template
is in OPERATIONS_RELEASE_GATES.md.
