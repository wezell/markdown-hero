# Local workflow

- After code changes, always rebuild the production app, reinstall it at `/Applications/MDHero.app`, and launch it. Do not stop at source changes or tests.
- Build with `npm run tauri -- build --bundles app --config '{"build":{"beforeBuildCommand":"npm run build"}}'` (the installed pnpm currently rejects this project's lockfile configuration).
- Quit the running app normally before replacing it. Never force-quit or discard unsaved documents; ask the user if an unsaved-changes prompt blocks installation.
- Verify the installed app's signature and that it launches. Keep the previous app as a temporary backup until installation succeeds.

# Project memory (OKF)

- Persistent project knowledge lives in `knowledge/` (OKF v0.2). Start substantial tasks with `okf search "<topic>" knowledge --limit 3 --json`; inspect relevant hits with `okf show <id> knowledge --json`.
- Before subsystem edits, check governing concepts with `okf search --for-path <repo-relative-path> knowledge --json`. Do not dump or scan the entire knowledge directory.
- Update existing concepts rather than duplicating them. Record durable decisions, constraints, discoveries, and completed work with source references and agent generation metadata; never claim human verification or store secrets/chat transcripts.
- End substantial tasks with a knowledge review and `okf validate knowledge --strict --drift` (zero errors/warnings). The local build/install runbook is `knowledge/local-workflow.md`.
