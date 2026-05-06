---
id: adr-0003
title: WebContentsView for embedded app rendering
status: accepted
date: 2026-05-06
phase: phase-3
---

# ADR-0003: Use WebContentsView for embedded app rendering

## Context

Phase 3 adds a click handler to the Application launcher sidebar. Apps with
`openExternal: false` must render inside the Electron window (main panel). Three
primitives exist:

| Primitive | Status in Electron 40.9.3 |
|-----------|--------------------------|
| `<webview>` HTML tag | Deprecated, requires `webviewTag: true` in webPreferences, security warts, scheduled for removal |
| `BrowserView` | Deprecated since Electron 30, replaced by WebContentsView |
| `WebContentsView` | Current recommended API (stable since Electron 28) |

Researcher one-shot confirmed: **no existing webview usage** in this codebase. Electron
version is 40.9.3. Zero migration cost to pick WebContentsView.

## Decision

**Use `WebContentsView`** for embedded app rendering.

- Created in the main process and added to `window.contentView` (Electron's root view)
- Positioned over the main panel area via bounds sent from the web renderer via IPC
- Destroyed on unmount / route navigation away from `/apps/$id`

## External browser path

`openExternal: true` reuses the **existing** `OPEN_EXTERNAL_CHANNEL` / `desktopBridge.openExternal()` 
already present in `preload.ts:119`. No new IPC channel needed for this path.
`window.appyBridge` is only needed for the embedded (WebContentsView) path.

## Consequences

- No `<webview>` tag anywhere in AppyCtrl — avoids the deprecated API entirely
- Main process owns view lifecycle (create on `appy:show-webview`, destroy on `appy:hide-webview`)
- Web side sends URL + container bounds via IPC; main process creates/positions the view
- Bounds calculation: web renderer sends `getBoundingClientRect()` of the main panel placeholder div
- Security: `nodeIntegration: false`, `contextIsolation: true` on WebContentsView's webPreferences
- In-webview navigation: `will-navigate` + `new-window` handlers route `target="_blank"` to `shell.openExternal`
