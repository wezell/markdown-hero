---
type: Process
title: "Local build, test, install, and memory workflow"
description: "After code changes, validate and rebuild the production macOS app, safely replace the installed app, relaunch it, and maintain sourced OKF project memory."
tags: [workflow, build, install, testing, okf]
generated: { by: agent/pi, at: "2026-10-27T23:42:07Z" }
status: stable
code_refs: [AGENTS.md, package.json, src-tauri/tauri.conf.json]
sources:
  - resource: "AGENTS.md"
  - resource: "package.json"
  - resource: "src-tauri/tauri.conf.json"
  - resource: "src-tauri/Cargo.toml"
  - resource: "CONTRIBUTING.md"
  - resource: "conversation:2026-10-27:user-always-rebuild-and-reinstall"
  - resource: "conversation:2026-10-27:user-adopt-okf-backfill-commit-push"
---

## Owner directives
The user explicitly requested automatic rebuild and reinstall after changes and adoption of OKF with backfilled project knowledge. `AGENTS.md` carries the actionable instructions for future sessions. These are recorded user requirements, not human verification of this agent-authored knowledge.

## Checks
- `npm test`: SvelteKit sync plus Vitest's Node-based unit suite.
- `npm run check`: Svelte/TypeScript checks; pre-existing warnings must be reported, not mistaken for a clean warning-free result.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`: Rust unit/security/watch bookkeeping tests.
- `cargo test --manifest-path src-tauri/Cargo.toml --test menu_window`: native menu test with its main-thread harness.
- Browser checks can exercise frontend editing but mock Tauri IPC; they do not replace packaged/native checks.

## Production build on this workstation
```sh
npm run tauri -- build --bundles app --config '{"build":{"beforeBuildCommand":"npm run build"}}'
```
The installed pnpm rejected the current lockfile/override configuration (`ERR_PNPM_VERIFY_DEPS_BEFORE_RUN`). This command bypasses that script runner without changing dependencies or the lockfile. Recheck after a package-manager upgrade rather than treating the workaround as universal.
Output: `src-tauri/target/release/bundle/macos/MDHero.app`. This app-only build does not include the optional Quick Look overlay or produce a distributable/notarized release.

## Safe installation
1. Ask MDHero to quit normally. Never force-quit or discard user documents; if a save prompt blocks quitting, ask the user.
2. Copy the completed bundle to a temporary app path under `/Applications`, ad-hoc sign it locally (`codesign --force --deep --sign -`), and verify with `codesign --verify --deep --strict`.
3. Move the old `/Applications/MDHero.app` to a temporary backup, then move the verified staged app into place; restore the backup if replacement fails.
4. Verify the installed signature, open the installed app, and confirm the `mdhero` process is running. Do not claim that launch verification tested every native feature.

## Persistent memory
`knowledge/` is an OKF v0.2 bundle, not a chat transcript. Search before authoring, inspect only relevant concepts, prefer updates over duplication, record source paths and agent generation metadata, and never mark agent notes human-verified. End substantial tasks with a knowledge review and `okf validate knowledge --strict --drift`. Source metadata uses `sources: [{ resource: "repo-relative/path" }]`, not bare strings; concepts also include `generated.by` and `generated.at`. No credentials, raw environment dumps, or unrelated conversation belong in Git.

# Related Concepts
- [Untrusted Markdown and privacy boundaries](security.md): Requires packaged builds for CSP-sensitive changes and safe installation without losing user work.
