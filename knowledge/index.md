---
okf_version: "0.2"
sources:
  - resource: "AGENTS.md"
generated: { by: agent/pi, at: "2026-10-27T23:42:00Z" }
---

# MDHero project memory

Source-backed OKF v0.2 notes, backfilled on 2026-10-27. Search with `okf search "<topic>" knowledge --limit 3 --json`, inspect relevant concepts with `okf show <id> knowledge --json`, and validate updates with `okf validate knowledge --strict --drift`. These notes distinguish source review from runtime verification; Git history remains the change ledger.

* [MDHero architecture and entry points](architecture.md) - MDHero is a local-first Tauri 2 application with a Svelte 5 frontend and a shared Markdown renderer for the app and optional Quick Look host.
* [Editing, pasted documents, and replace behavior](editing.md) - Per-tab edit buffers support View, Split, and Edit; pasted Markdown remains unsaved until Save As, and replacements use the editor undo history.
* [Live file reload and conflict handling](file-watching.md) - Saved files in all open tabs are watched through reference-counted parent-directory watches, while active editing buffers are retained and conflicting saves require confirmation.
* [Untrusted Markdown and privacy boundaries](security.md) - Treat documents as untrusted input and preserve renderer sanitization, restricted native filesystem/opening capabilities, scoped assets, and telemetry-free update checks.
* [Local build, test, install, and memory workflow](local-workflow.md) - After code changes, validate and rebuild the production macOS app, safely replace the installed app, relaunch it, and maintain sourced OKF project memory.
* [2026-10-27 editor improvements and OKF backfill](changes-2026-10-27.md) - Recorded toolbar cleanup, editable pasted documents, literal find/replace, undo integration, local installation verification, and the initial sourced OKF backfill.
