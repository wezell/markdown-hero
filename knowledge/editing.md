---
type: Architecture
title: "Editing, pasted documents, and replace behavior"
description: "Per-tab edit buffers support View, Split, and Edit; pasted Markdown remains unsaved until Save As, and replacements use the editor undo history."
tags: [editor, paste, replace, undo, tabs]
generated: { by: agent/pi, at: "2026-10-27T23:42:06Z" }
status: stable
code_refs: [src/lib/components/Editor.svelte, src/lib/components/PasteModal.svelte, src/lib/components/SearchOverlay.svelte, src/lib/utils/text-search.ts, src/lib/stores/tabs.ts, src/lib/tauri/files.ts, src/routes/+page.svelte]
sources:
  - resource: "src/lib/components/Editor.svelte"
  - resource: "src/lib/components/PasteModal.svelte"
  - resource: "src/lib/components/SearchOverlay.svelte"
  - resource: "src/lib/utils/text-search.ts"
  - resource: "src/lib/stores/tabs.ts"
  - resource: "src/lib/tauri/files.ts"
  - resource: "src/routes/+page.svelte"
  - resource: "tests/unit/pasted-document.test.ts"
  - resource: "tests/unit/text-search.test.ts"
  - resource: "tests/unit/unsaved-prompt.test.ts"
---

## Document lifecycle
- `content` is the tab's loaded/saved baseline; `editContent` is the working buffer; `isEditing`, `dirty`, and `diskChanged` have distinct roles.
- `paste://` tabs initially display rendered Markdown, but Edit and Split are enabled. They start dirty and remain dirty even after reverting to the original pasted text, until saved to a real path.
- The first save of `paste://` and `new://` tabs calls `saveAsNewDocument`: ask for a path, write successfully, then rebind the existing tab, start watching, update recents/title. Cancellation and write failure must not discard the buffer.
- `url://` tabs remain read-only. Fake tab paths have no filesystem base directory.
- Close and quit use explicit Save/Discard/Cancel guards; unexpected or failed prompt results are Cancel. Save As cancellation aborts a close/quit that requested saving.
- Each active editing tab gets its own keyed Editor instance; do not share its local text mirror between tabs.

## Find and replace
- Cmd/Ctrl+F opens the shared find bar. Replace and Replace All are enabled only in Edit/Split, operate on Markdown source, and leave saving to the normal save flow.
- Matching is literal, case-insensitive, and non-overlapping. Regex syntax and replacement tokens such as `$&` are not interpreted. Empty replacement deletes matches.
- Replace targets the active match and advances past the inserted text, wrapping as needed; Replace All works on the original match set, not recursively on inserted text.
- Source offsets come from an escaped Unicode regular expression over the original string: lowercasing the whole source can change its length (for example İ) and corrupt replacements.
- In Split, the Editor owns match counts and highlighting; mark.js must not search the rendered preview instead.
- Replacements create a single undo step. The editor keeps at most 200 snapshots; consecutive typing is grouped for 500 ms, while whitespace/paste/cut/newlines/Tab create boundaries.
- Native Undo/Redo menu events route Rust → page hooks → focused Editor; other inputs use native undo. History is scoped to a mounted editor and is not persisted across restarts.

## Regression coverage
`tests/unit/pasted-document.test.ts`, `reload-file.test.ts`, `text-search.test.ts`, `editor-per-tab.test.ts`, and `unsaved-prompt.test.ts` cover lifecycle, literal/Unicode replacement, tab isolation, and destructive-action guards.

# Related Concepts
- [MDHero architecture and entry points](architecture.md): Implements the per-tab editing and source-search path in the application.
