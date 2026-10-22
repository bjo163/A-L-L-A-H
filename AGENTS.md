# Repository working rules

- Work on `dev`; promote through a PR from `dev` to `main`.
- Use only `dev` and `main` for now. Do not create feature, release, or dependency-bot branches.
- Preserve both long-lived branches. Merge PRs with a merge commit, never squash/rebase.
- Never force-push or bypass required checks.
- Follow `docs/AUTOMATION.md` for validation and versioning. Release tags are the version ledger; do not add automated version bump commits to either source branch.
- Never commit `.env`, credentials, generated build directories, or local databases.
