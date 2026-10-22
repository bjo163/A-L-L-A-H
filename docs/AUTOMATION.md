# Automation: dev → main

Repository: https://github.com/bjo163/A-L-L-A-H

## Daily work

Only two working branches are used: `dev` and `main`.
Commit work directly on `dev` and push. After the quality gate and development
release succeed, GitHub Actions opens or updates the pull request from `dev` to `main`
and enables auto-merge. GitHub merges it using a **merge commit** when required checks
pass, preserving the ancestry of the long-lived `dev` branch.
Do not squash, rebase, delete `dev`, or force-push either branch.
After the stable release succeeds on `main`, GitHub Actions merges `origin/main`
back into `dev` to keep the long-lived branches synchronized.

Validation jobs cancel an older run for the same branch/event or PR when a newer
revision arrives. Release publishing has its own serialized queue and is never
cancelled by this optimization. Cancelled validations do not publish a prerelease.

```sh
git switch dev
git pull --ff-only origin dev
# edit and validate
git add <files>
git commit -m "feat(web): describe the change"
git push origin dev
```

CI rejects PRs to `main` from any branch other than this repository's `dev`.
The repository setup script makes Branch policy and Quality checks required before merging.
Promotion runs only after the `dev` quality gate and prerelease workflow succeeds;
the `main` branch protection still blocks auto-merge until required checks pass.

## Checks

- One required Quality checks job installs the locked dependencies, runs repository
  validation and focused workflow tests, runs workspace tests, and builds the apps.
  TypeScript checks are included in the build. Newer runs cancel older runs for the
  same branch or PR.
- The separate Docker image builds, disposable database startup, duplicate typecheck,
  and per-commit dependency audit are removed from the gate. CodeQL continues to run
  on PRs, direct pushes to `main`, and weekly scans while also serving as a non-gating
  security report after the simplified branch protection is applied. Dependency
  audits remain available through weekly or manual scans.
- Actions are pinned to commit hashes. Workflow permissions are read-only except release publishing and CodeQL uploads.

Local equivalent: `pnpm install --frozen-lockfile`, `pnpm validate`,
`node --test scripts/tests/*.test.mjs`, `pnpm exec turbo run test`, and `pnpm build`.

## Automatic version and changelog

Every **successful push** to `dev` or `main` publishes one GitHub Release.
PR checks and ordinary manual CI runs never publish. Failed CI blocks a release;
rerun the failed run after fixing any transient problem.

GitHub suppresses push workflows caused by GITHUB_TOKEN, which can leave an
automated merge without a main release. `Complete promotion` listens for successful
dev CI completion, verifies the associated dev-to-main PR has merged, and
dispatches main CI with `publish_main=true` and its exact `source_sha`. It only reads
trusted repository metadata and never executes artifacts or code from a PR. Main CI
then runs the quality gate before publishing and synchronizing dev. The dispatcher
skips a commit already published or currently being validated; the release ledger
also deduplicates stable publication by source SHA under the shared release queue.
The same explicit inputs can recover a missing main release manually; ordinary
manual runs remain validation-only.

- `dev`: `v0.2.1-dev.12` (example; unique workflow run number).
- `main`: `v0.2.1`, `v0.2.2`, etc.; every stable release increments the patch.
- The root package version is the baseline. To advance the major/minor series, change it deliberately on `dev` before promotion; the next stable release increments that baseline's patch.
- Tags and GitHub Releases are the authoritative release ledger. Source branches keep the baseline version, avoiding bump commits, recursive CI, and dev/main changelog merge conflicts.
- The attached `A-L-L-A-H-<version>.tar.gz` includes the exact tested source, with root `package.json` stamped to the release version, plus `VERSION`, `CHANGELOG.md`, and `release.json`. Workspace package versions are independent and remain unchanged.
- GitHub's default source ZIP/tar links represent the original commit. Use the explicitly attached archive for stamped release files.
- The release changelog includes all commits since the previous ancestor release of the same channel; the first release includes the existing history.
- `feat:` and `fix:` organize notes; ordinary commit messages also appear. They do not alter bump size.
- Publishing is serialized across both channels with a queue. Reruns reuse their release identity and repair partial asset uploads instead of incrementing again.
- CI jobs may finish out of push order. Stable version numbers reflect publication order, and metadata records the exact source SHA.

No PAT or deployment secret is required: publishing uses the scoped `GITHUB_TOKEN`.
No production deployment or database migration is automatic because no deployment target is configured.
Dependency update branches are intentionally not created while the two-branch rule applies; handle audit findings on `dev`.

## Repository settings

Run once with an authenticated GitHub CLI admin account. Rerun after changing the
required checks so GitHub stops blocking on the old CodeQL requirement:

```sh
node scripts/configure-repository.mjs --dry-run
node scripts/configure-repository.mjs
```

This installs branch protection, restricts merge methods, enables auto-merge, and enables vulnerability alerts.
Workflow YAML alone does **not** prevent a direct push or merge of failed checks; GitHub branch protection must also be installed.

Keep `main` as default, permit merge commits only, disable automatic branch deletion,
require Branch policy and Quality checks on `main`, block deletion/force push on both branches,
and enable vulnerability alerts and secret scanning where available.
The main rule does not require the head to be up to date: GitHub CI tests the PR merge result,
which supports a long-lived dev branch without continuous back-merges solely to satisfy the rule.
