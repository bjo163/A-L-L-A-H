# Repository working rules

- Work on `dev`; promote through a PR from `dev` to `main`.
- Use only `dev` and `main` for now. Do not create feature, release, or dependency-bot branches.
- Preserve both long-lived branches. Merge PRs with a merge commit, never squash/rebase.
- Never force-push or bypass required checks.
- Follow `docs/AUTOMATION.md` for validation and versioning. Release tags are the version ledger; do not add automated version bump commits to either source branch.
- Never commit `.env`, credentials, generated build directories, or local databases.

## Efficient execution

- Treat the user's latest request and the relevant existing diff as the working brief. Do not restate either before acting.
- Start work immediately. Inspect only the files, local instructions, and prior changes needed for the task; do not repeat repository context already provided.
- Find before reading: use targeted searches and small file ranges. Do not scan the whole repository, print complete large files, or reload context already available unless the task requires it.
- Batch independent reads and investigations. Keep dependent edits and checks sequential.
- For a well-scoped change, identify the target file first, read its local context, then edit. Escalate to wider discovery only when the first target cannot satisfy the request.
- Make reasonable implementation choices without asking about routine details. Ask only when a missing decision blocks the work or could change its scope materially.
- Make the smallest complete change that satisfies the request. Do not add abstractions, documentation, refactors, dependencies, or features that are not needed to finish it.
- Preserve unrelated uncommitted changes. Inspect them only when they overlap the requested work.
- Keep progress updates to one short note when useful. Do not narrate routine tool calls, repeat a plan, or provide a plan for a small well-defined task.
- Complete the requested change before reporting. Do not stop at a proposal when implementation is requested.
- Choose validation by risk. For text-only or instruction-only edits, inspect the diff. For localized code edits, run the narrowest relevant check when requested or required by repository rules. Run full validation only for broad, integration, release, security, or user-requested verification.
- Stop validation after the requested and relevant checks pass. Do not run equivalent checks twice.
- Do not create a separate skill, script, checklist, or configuration merely to optimize one ordinary task. Add reusable workflow assets only when they serve repeated work.
- In the final response, use at most four short bullets: changed files, result, validation, and any blocker or follow-up. Omit generic summaries, repeated context, and empty sections.
- Minimize output: use targeted searches, concise command output, and avoid printing large files or generated data unless needed.
