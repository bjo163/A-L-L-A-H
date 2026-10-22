# Automation: dev → main

Repository: https://github.com/bjo163/A-L-L-A-H

## Daily work

Only two working branches are used: `dev` and `main`.
Commit work directly on `dev` and push. After CI, Docker builds, and the development
release succeed, GitHub Actions opens or updates the pull request from `dev` to `main`
and enables auto-merge. GitHub merges it using a **merge commit** when required checks
pass, preserving the ancestry of the long-lived `dev` branch.
Do not squash, rebase, delete `dev`, or force-push either branch.
After the stable release succeeds on `main`, GitHub Actions merges `origin/main`
back into `dev` to keep the long-lived branches synchronized.

```sh
git switch dev
git pull --ff-only origin dev
# edit and validate
git add <files>
git commit -m "feat(portal): describe the change"
git push origin dev
```

CI rejects PRs to `main` from any branch other than this repository's `dev`.
The repository setup script makes Branch policy, Quality checks, and CodeQL required before merging.
Promotion runs only after the full `dev` validation and prerelease workflow succeeds;
the `main` branch protection still blocks auto-merge until required checks pass.

## Checks

- Locked dependency installation using pnpm from `packageManager` and Node from `.node-version`.
- Registry/schema validation, module tests, release automation tests, all workspace tests.
- Production builds, TypeScript checks, high/critical production dependency audit.
- CodeQL on pushes/PRs and weekly security scan; weekly audit includes development dependencies.
- Actions are pinned to commit hashes. Workflow permissions are read-only except release publishing and CodeQL uploads.

Local equivalent: `pnpm install --frozen-lockfile`, `pnpm validate`, `pnpm module:test`,
`node --test scripts/tests/*.test.mjs`, `pnpm exec turbo run test`, `pnpm build`,
`pnpm typecheck`, `pnpm audit --prod --audit-level high`.

## Automatic version and changelog

Every **successful push** to `dev` or `main` publishes one GitHub Release.
PR checks and manual CI runs never publish. Failed CI blocks a release; rerun the failed run after fixing any transient problem.

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

Run once with an authenticated GitHub CLI admin account:

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
