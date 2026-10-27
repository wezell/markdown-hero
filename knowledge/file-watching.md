---
type: Architecture
title: Live file reload and conflict handling
description: "Saved files in all open tabs are watched through reference-counted parent-directory watches, while active editing buffers are retained and conflicting saves require confirmation."
tags: [watcher, reload, conflicts, files]
generated: { by: agent/pi, at: "2026-10-27T23:42:07Z" }
status: stable
code_refs: [src-tauri/src/watcher.rs, src/lib/tauri/watcher.ts, src/lib/tauri/files.ts, src/lib/stores/tabs.ts]
sources:
  - resource: "src-tauri/src/watcher.rs"
  - resource: "src/lib/tauri/watcher.ts"
  - resource: "src/lib/tauri/files.ts"
  - resource: "src/lib/stores/tabs.ts"
  - resource: "src/routes/+page.svelte"
  - resource: "tests/unit/watcher.test.ts"
  - resource: "tests/unit/reload-file.test.ts"
  - resource: "tests/unit/tabs-disk-changed.test.ts"
---

## Event path
- Opening a real file or completing Save As calls `watchFile`; closing unwatches its current real path, including a path rebound during Save As.
- Rust `WatcherState` uses one notify debouncer (500 ms), watching each parent directory non-recursively once with reference counting. Watching directories rather than individual files survives atomic replacement saves.
- Only registered file paths generate `file-changed`. The frontend installs one session-wide listener and coalesces each path independently for 100 ms.
- `reloadFile` resolves/reads/renders the file, updates its owning tab, and repaints the document store only if that tab is active. Background-file changes must not replace another tab's view.
- `paste://`, `new://`, and `url://` paths are not watchable. A pasted document becomes watchable after its first successful save.

## Editing conflicts
`updateTabContent` keeps `editContent` when `isEditing` is true, updates the disk baseline, and sets dirty/conflict flags when the buffers differ. A later save with `diskChanged` asks before overwriting. This also applies to an editor that had no local edits before the disk changed: its existing editing buffer is retained.

## Current limits, not guarantees
- Own-save events are suppressed for 1500 ms after `lastSavedAt`. This is time-based, not content-based; an independent external write in that interval can be missed.
- Buffer preservation is keyed to `isEditing`, not `dirty`. Do not assume unsaved edits remain protected after switching back to View: the non-editing update branch replaces `editContent` and clears dirty state.
- Reload failures are logged and leave existing content in place; they do not display a dedicated reload-error dialog.
- These edge cases were found by reading source during backfill, not a fresh native external-change experiment.

## Checks
`tests/unit/watcher.test.ts` checks per-file debounce, own-save suppression, and teardown; `reload-file.test.ts` checks owning/active-tab routing and watch lifecycle; `tabs-disk-changed.test.ts` checks preservation and conflict flags. Rust `watcher.rs` unit tests cover reference counting.

# Related Concepts
- [Editing, pasted documents, and replace behavior](editing.md): Updates the disk baseline while the editor handles buffer preservation and overwrite guards.
- [MDHero architecture and entry points](architecture.md): Connects native directory watches to the owning tab and active document view.
