---
type: Policy
title: Untrusted Markdown and privacy boundaries
description: "Treat documents as untrusted input and preserve renderer sanitization, restricted native filesystem/opening capabilities, scoped assets, and telemetry-free update checks."
tags: [security, csp, privacy, renderer, quicklook]
generated: { by: agent/pi, at: "2026-10-27T23:42:07Z" }
status: stable
governance: constraint
code_refs: [src/lib/renderer/pipeline.ts, src/lib/components/MarkdownRenderer.svelte, src-tauri/src/commands.rs, src-tauri/tauri.conf.json, src-tauri/capabilities/default.json, src/lib/stores/updater.ts, src/quicklook/preview.ts]
sources:
  - resource: "CONTRIBUTING.md"
  - resource: "SECURITY.md"
  - resource: "package.json"
  - resource: "src-tauri/tauri.conf.json"
  - resource: "src-tauri/capabilities/default.json"
  - resource: "src-tauri/src/commands.rs"
  - resource: "src/lib/stores/updater.ts"
  - resource: "quicklook/README.md"
---

## Required boundaries
- Keep Mermaid `securityLevel: "strict"` and sanitize generated SVG before insertion. Do not ban `foreignObject` indiscriminately: it removes diagram labels.
- DOMPurify is pinned to `~3.3.3`; the documented reason is that 3.4 strips HTML inside Mermaid `foreignObject` labels. Revisit with explicit rendering evidence, not an untested dependency bump.
- Preserve the production Content Security Policy and narrow native command/capability boundaries. Filesystem commands validate permitted text extensions; executable/script opening is blocked.
- Asset protocol scope begins empty. Native `allow_assets` canonicalizes and partitions paths within the document tree/git checkout or explicitly pinned folders; do not widen it to arbitrary filesystem access.
- Quick Look shares the renderer, but must embed its own CSP; remote/relative-image limitations are deliberate. A dev web server is not evidence that the packaged app's CSP is correct.

## Privacy and fork caveat
Automatic update checks query GitHub at most daily, compare versions locally, and send no installed-version/OS/identifier parameters. Settings can disable the automatic check; manual Check for Updates still works. Signed updater artifacts remain verified before installation.
The current checkout's Git remote is the wezell fork, but the code/config still check and download upstream vaibhav-kakde-in/mdhero releases. Do not assume fork pushes change the update channel.

## Verification standard
Source documentation in `CONTRIBUTING.md` lists the security regression tests. A green unit suite alone does not establish that a sanitizer change is safe: exercise a real payload and all Mermaid diagram types in a packaged build. This backfill did not perform a new security audit.

# Related Concepts
- [MDHero architecture and entry points](architecture.md): Constrains native commands, rendering hosts, assets, and updater network behavior.
