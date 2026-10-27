---
type: Architecture
title: MDHero architecture and entry points
description: MDHero is a local-first Tauri 2 application with a Svelte 5 frontend and a shared Markdown renderer for the app and optional Quick Look host.
tags: [architecture, tauri, svelte, renderer]
sources:
  - resource: "README.md"
  - resource: "CONTRIBUTING.md"
  - resource: "package.json"
  - resource: "src/routes/+page.svelte"
  - resource: "src/lib/renderer/pipeline.ts"
  - resource: "src/lib/stores/tabs.ts"
  - resource: "src/lib/i18n/index.ts"
  - resource: "src-tauri/src/lib.rs"
  - resource: "quicklook/README.md"
code_refs:
  - "src/routes/+page.svelte"
  - "src/lib/renderer/pipeline.ts"
  - "src/lib/stores/tabs.ts"
  - "src/lib/i18n/index.ts"
  - "src-tauri/src/lib.rs"
  - "src/quicklook/preview.ts"
generated: { by: agent/pi, at: "2026-10-27T23:40:15Z" }
status: stable
---

## Scope
Backfilled from repository documentation and source on 2026-10-27; this is a source-based map, not an exhaustive audit.

## Entry points
- `src/routes/+page.svelte` coordinates tab activation, View/Split/Edit, keyboard shortcuts, save/close/quit guards, search, and presentation.
- `src/lib/stores/tabs.ts` owns per-tab content, edit buffers, dirty/conflict state, and session paths; `src/lib/stores/document.ts` feeds the active document view.
- `src/lib/components/` contains the editor, rendered reader, toolbar, tabs, and dialogs; `src/lib/tauri/` wraps native file operations and watcher events.
- `src-tauri/src/lib.rs` registers native commands/plugins and menu event routing; `commands.rs`, `menu.rs`, and `watcher.rs` implement platform-facing operations.

## Rendering and persistence
- `src/lib/renderer/pipeline.ts` combines markdown-it, highlight.js, KaTeX, and DOMPurify; Mermaid initialization/rendering is handled by the rendering components.
- Settings, locale, recent files, reading progress, and session metadata use localStorage. Restored sessions contain real filesystem paths, not unsaved buffers or paste/new/URL tabs.
- New UI strings belong in all five locale JSON files (en, de, es, fr, zh-CN); native labels are synchronized through the i18n menu-key list.

## Optional Quick Look host
Quick Look reuses the same renderer and extracted component styles. Build its extension before applying `src-tauri/tauri.quicklook.conf.json`; ordinary app builds do not embed it. The sandbox only grants the previewed file, so sibling relative images are intentionally unavailable. See `quicklook/README.md` for build and registration details.
