# Delivery Review — Phase 3 (App Launcher Rendering)

**Date**: 2026-05-06
**Scope**: Phase 3 implementation — 15 files, 396 insertions (commits fbd37613 → 63da4e42)
**Verdict**: **FAIL → patch required before shipping**
**Dimensions**: BH:FAIL | EC:CONDITIONAL PASS | AA:CONDITIONAL PASS | AR:CONDITIONAL PASS | CQ:CONDITIONAL PASS | UT:CONDITIONAL PASS

---

## Required Patches (P1–P10)

| # | Patch | Severity | File(s) |
|---|-------|----------|---------|
| P1 | Validate URL in `setWindowOpenHandler` before `shell.openExternal` | Critical/Security | `appyIpcHandlers.ts` |
| P2 | Multiply bounds by `window.devicePixelRatio` (Retina fix) | Critical/Visual | `WebviewPane.tsx` |
| P3 | `webContents.once("destroyed")` to clean `activeViews` | Critical/Memory | `appyIpcHandlers.ts` |
| P4 | Store `win` reference in `activeViews` at show-time; use at hide-time | Critical/Crash | `appyIpcHandlers.ts` |
| P5 | Dedup guard in SHOW handler — one view per URL | Critical/Memory | `appyIpcHandlers.ts` |
| P6 | Add `openInExternalBrowser` to `appyBridge` OR update spec (AC-8 mismatch) | Critical/Contract | `bridge.ts`, `appyBridge.ts` |
| P7 | `did-fail-load` listener → IPC back to renderer for error UI | High/UX | `appyIpcHandlers.ts`, `WebviewPane.tsx` |
| P8 | `try/catch` around `new URL()` in `will-navigate` handler | High/Crash | `appyIpcHandlers.ts` |
| P9 | Extract channel constants to `packages/appydave/src/channels.ts` | High/Maintenance | `appyBridge.ts`, `appyIpcHandlers.ts` |
| P10 | `externalBrowser.test.ts` — pure function coverage (security gate) | High/Security | new file |

## Medium Patches

| Issue | Fix |
|-------|-----|
| `_e.preventDefault()` on event named `_e` | Rename to `e` |
| Error state "Could not load" has no reason | Pass reason string through error state |
| Retry button missing `type="button"` | Add attribute |
| `preload.ts` not in `check-seams.sh` SEAM_FILES | Add to array |
| `[APPYDAVE-PATCH]` on AppyDave-owned `AppyAppsSection.tsx` | Remove annotation, add plain comment |
| No explicit `partition: "persist:..."` on WebContentsView | Add `partition: \`persist:appydave-app-${id}\`` |
| `void navigate()` swallows errors | Add `.catch(console.error)` in dev |
| ViewBounds inline return type in `externalBrowser.ts` | Import `ViewBounds` from `bridge.ts` |

## Findings Index

### Critical (must fix — reject class)
- DVR-BH-001: `activeViews` never cleaned on external webContents destroy
- DVR-BH-002: Wrong window for `removeChildView` under focus change
- DVR-BH-003: Ghost webview on retry race (double view stacking)
- DVR-BH-005: devicePixelRatio not applied — broken on every Retina Mac
- DVR-BH-008: `shell.openExternal` called with unvalidated URL (security hole)
- DVR-EC-001: Unhandled IPC rejection in mount effect (void swallows)
- DVR-EC-002: Double-view stacking on rapid A→B navigation
- DVR-AA-001: AC-8 contract mismatch — `openInExternalBrowser` does not exist

### High
- DVR-BH-004: `close()` called before `removeChildView` when win is null
- DVR-BH-006: SSRF via http:// to private IPs (no blocklist)
- DVR-BH-007: `will-navigate` misses SPA in-page navigation
- DVR-EC-003: `getFocusedWindow()` null path in HIDE handler
- DVR-EC-004: React Strict Mode leaks a renderer process per mount (no dedup)
- DVR-EC-005: URL-change cleanup leaves old view alive during IPC round-trip
- DVR-EC-006: ResizeObserver fires with stale viewId after URL change
- DVR-AA-002: `loadURL` failures not propagated to error UI
- DVR-CQ-001: Channel constants duplicated across process boundary
- DVR-UT-001: `validateAppyUrl` has no tests (security gate)
- DVR-UT-002: `parseViewBounds` has no tests

## What was GOOD

- Security posture on initial load: `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`
- Seam discipline held throughout — all patches annotated and in manifest
- `cancelled` flag correctly handles primary unmount-before-resolve race
- `ipcMain.removeHandler()` before `handle()` prevents double-registration
- TypeScript clean — 13/13 typecheck tasks pass
- Researcher → contract-lock → fanout pattern produced zero integration rework

## Next step

Phase 3.1 patch session — 2-way coder fanout:
- **Coder-A**: `appyIpcHandlers.ts` (P1, P3, P4, P5, P7, P8, P9)
- **Coder-B**: `WebviewPane.tsx` (P2), `bridge.ts` + `appyBridge.ts` (P6), medium CQ fixes
- **Coder-C**: `externalBrowser.test.ts` (P10), component tests (UT-003–006)

Then: re-run delivery-review focused on patches only.
