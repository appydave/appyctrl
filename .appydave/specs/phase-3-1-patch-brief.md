# Phase 3.1 — Patch Session Brief

**Status**: ready to execute
**Trigger**: Phase 3 delivery review returned FAIL (6 reject-class findings)
**Topology**: 3-way coder fanout → integrator gates → re-review
**Estimated wall time**: ~30 min

---

## Context (read this first)

AppyCtrl is a fork of `pingdotgg/t3code` (Theo Browne's T3). We maintain **seam discipline**:

- Only specific upstream files may be touched; each gets 1 import + 1 composition line + `[APPYDAVE-PATCH]` annotation
- All custom code lives in `appydave/` subdirs or `packages/appydave/`
- Every commit: `bun fmt && bun lint && bun typecheck && bun run test`
- Run all gates from **repo root** `/Users/davidcruwys/dev/ad/apps/appyctrl` — never `cd apps/web && ...`

Phase 3 shipped the Application launcher click handler:

- `openExternal: true` → `window.desktopBridge.openExternal(url)` (browser)
- `openExternal: false` → TanStack route `/apps/$id` → `WebviewPane` → `WebContentsView` via IPC

The delivery review found 10 required patches. The architecture is sound; all issues are in Electron lifecycle and security boundaries.

---

## Files involved in patches

```
apps/desktop/src/appydave/appyIpcHandlers.ts   ← Coder-A (6 patches here)
apps/desktop/src/appydave/appyBridge.ts        ← Coder-B (1 patch)
packages/appydave/src/bridge.ts                ← Coder-B (1 patch)
packages/appydave/src/channels.ts              ← Coder-A creates (new file)
apps/web/src/appydave/apps/WebviewPane.tsx     ← Coder-B (2 patches)
apps/desktop/src/appydave/externalBrowser.ts   ← Coder-C reads (for test)
apps/desktop/src/appydave/externalBrowser.test.ts ← Coder-C creates (new file)
apps/web/src/appydave/apps/WebviewPane.test.tsx   ← Coder-C creates (new file)
```

---

## Fanout topology

Launch 3 coders in parallel. Briefs below are self-contained.

---

## CODER-A BRIEF — appyIpcHandlers.ts (7 patches)

**File to edit**: `apps/desktop/src/appydave/appyIpcHandlers.ts`
**New file to create**: `packages/appydave/src/channels.ts`

Read `apps/desktop/src/appydave/appyIpcHandlers.ts` before editing.
Read `apps/desktop/src/appydave/appyBridge.ts` before editing channels.

### Patch A1: Extract channel constants to shared file

Create `packages/appydave/src/channels.ts`:

```ts
export const APPY_SHOW_WEBVIEW_CHANNEL = "appy:show-webview";
export const APPY_HIDE_WEBVIEW_CHANNEL = "appy:hide-webview";
export const APPY_RESIZE_WEBVIEW_CHANNEL = "appy:resize-webview";
```

In `appyIpcHandlers.ts`: replace the 3 local const declarations with:

```ts
import {
  APPY_SHOW_WEBVIEW_CHANNEL,
  APPY_HIDE_WEBVIEW_CHANNEL,
  APPY_RESIZE_WEBVIEW_CHANNEL,
} from "@t3tools/appydave-registry/channels.js";
```

Also update `packages/appydave/package.json` to add `"./channels"` export entry (same pattern as the existing `"./bridge"` entry added in Phase 3).

### Patch A2: Store `win` reference in activeViews

Change the Map type and storage:

```ts
// Before
const activeViews = new Map<number, WebContentsView>();

// After
const activeViews = new Map<number, { view: WebContentsView; win: BrowserWindow }>();
```

In the SHOW handler, after `win.contentView.addChildView(view)`:

```ts
activeViews.set(view.webContents.id, { view, win });
```

In the HIDE handler, change resolution to use stored win:

```ts
// Before
const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
win?.contentView.removeChildView(view);
view.webContents.close();

// After
const { view, win } = activeViews.get(viewId)!;
win.contentView.removeChildView(view);
view.webContents.close();
```

In the RESIZE handler, change to use stored view:

```ts
// Before
const view = activeViews.get(viewId);
view?.setBounds(bounds);

// After
const entry = activeViews.get(viewId);
entry?.view.setBounds(bounds);
```

### Patch A3: Clean activeViews on webContents destroy

In the SHOW handler, after `activeViews.set(...)`, add:

```ts
view.webContents.once("destroyed", () => {
  activeViews.delete(view.webContents.id);
});
```

### Patch A4: Dedup guard — one view per URL

In the SHOW handler, after validating `url` and `bounds` (before creating the view), add:

```ts
// Check if a view for this URL already exists
for (const [existingId, { view: existingView }] of activeViews) {
  if (!existingView.webContents.isDestroyed() && existingView.webContents.getURL() === url) {
    return existingId;
  }
}
```

### Patch A5: Validate URL in setWindowOpenHandler (security)

In the SHOW handler's `setWindowOpenHandler`:

```ts
// Before
view.webContents.setWindowOpenHandler(({ url: newUrl }) => {
  void shell.openExternal(newUrl);
  return { action: "deny" };
});

// After
view.webContents.setWindowOpenHandler(({ url: newUrl }) => {
  const safeUrl = validateAppyUrl(newUrl);
  if (safeUrl) void shell.openExternal(safeUrl);
  return { action: "deny" };
});
```

### Patch A6: try/catch in will-navigate handler

```ts
// Before
view.webContents.on("will-navigate", (_e, navigationUrl) => {
  const parsed = new URL(navigationUrl);
  if (parsed.origin !== new URL(url).origin) {
    _e.preventDefault();
    void shell.openExternal(navigationUrl);
  }
});

// After
view.webContents.on("will-navigate", (e, navigationUrl) => {
  try {
    const parsed = new URL(navigationUrl);
    if (parsed.origin !== new URL(url).origin) {
      e.preventDefault();
      const safeUrl = validateAppyUrl(navigationUrl);
      if (safeUrl) void shell.openExternal(safeUrl);
    }
  } catch {
    e.preventDefault();
  }
});
```

Note: rename `_e` to `e` (it IS used — the underscore prefix was wrong).

### Patch A7: did-fail-load listener → send error IPC back to renderer

After `void view.webContents.loadURL(url)`, add:

```ts
view.webContents.once("did-fail-load", (_e, errorCode, errorDescription) => {
  // Send error back to renderer so WebviewPane can show error UI
  const senderContents = event.sender; // capture event from handler outer scope
  if (!senderContents.isDestroyed()) {
    senderContents.send("appy:webview-load-failed", {
      viewId: view.webContents.id,
      errorCode,
      errorDescription,
    });
  }
});
```

**Important**: The `event` from the IPC handler is available in the outer scope (`_event` parameter). Rename it to `event` to use it here.

Also add a new IPC send registration at the top of `registerAppyIpcHandlers` (or expose an `onWebviewLoadFailed` listener in `appyBridge.ts` — see Coder-B Patch B3).

---

## CODER-B BRIEF — bridge.ts + appyBridge.ts + WebviewPane.tsx (3 patches)

Read each file before editing.

### Patch B1: devicePixelRatio scaling in WebviewPane

**File**: `apps/web/src/appydave/apps/WebviewPane.tsx`

In the mount effect bounds calculation:

```ts
// Before
const bounds = {
  x: Math.round(rect.left),
  y: Math.round(rect.top),
  width: Math.round(rect.width),
  height: Math.round(rect.height),
};

// After
const dpr = window.devicePixelRatio;
const bounds = {
  x: Math.round(rect.left * dpr),
  y: Math.round(rect.top * dpr),
  width: Math.round(rect.width * dpr),
  height: Math.round(rect.height * dpr),
};
```

Apply the same fix in the ResizeObserver callback (same pattern, same 4 lines).

### Patch B2: Add openInExternalBrowser to appyBridge (AC-8 contract)

**File**: `packages/appydave/src/bridge.ts`

Add to `AppyDesktopBridge` interface:

```ts
openInExternalBrowser(url: string): Promise<void>;
```

**File**: `apps/desktop/src/appydave/appyBridge.ts`

Add channel constant (or import from channels.ts once Coder-A creates it):

```ts
const APPY_OPEN_EXTERNAL_CHANNEL = "appy:open-external";
```

Add to the `contextBridge.exposeInMainWorld("appyBridge", {...})` object:

```ts
openInExternalBrowser: (url: string) =>
  ipcRenderer.invoke(APPY_OPEN_EXTERNAL_CHANNEL, url),
```

**File**: `apps/desktop/src/appydave/appyIpcHandlers.ts` (coordinate with Coder-A)

Add to `registerAppyIpcHandlers()`:

```ts
const APPY_OPEN_EXTERNAL_CHANNEL = "appy:open-external";
ipcMain.removeHandler(APPY_OPEN_EXTERNAL_CHANNEL);
ipcMain.handle(APPY_OPEN_EXTERNAL_CHANNEL, async (_event, rawUrl: unknown) => {
  const url = validateAppyUrl(rawUrl);
  if (!url) return;
  await shell.openExternal(url);
});
```

Also add `APPY_OPEN_EXTERNAL_CHANNEL` to `packages/appydave/src/channels.ts`.

### Patch B3: Error listener for did-fail-load in WebviewPane

**File**: `apps/web/src/appydave/apps/WebviewPane.tsx`

Add to the `AppyDesktopBridge` interface call — expose `onWebviewLoadFailed` in bridge:

In `appyBridge.ts`, add:

```ts
onWebviewLoadFailed: (listener: (data: { viewId: number; errorCode: number; errorDescription: string }) => void) => {
  const handler = (_event: Electron.IpcRendererEvent, data: unknown) => {
    listener(data as { viewId: number; errorCode: number; errorDescription: string });
  };
  ipcRenderer.on("appy:webview-load-failed", handler);
  return () => ipcRenderer.removeListener("appy:webview-load-failed", handler);
},
```

Add to `bridge.ts` interface:

```ts
onWebviewLoadFailed(listener: (data: { viewId: number; errorCode: number; errorDescription: string }) => void): () => void;
```

In `WebviewPane.tsx`, add a third `useEffect` after the viewId is stored:

```ts
useEffect(() => {
  if (!window.appyBridge) return;
  const unsubscribe = window.appyBridge.onWebviewLoadFailed(({ viewId, errorDescription }) => {
    if (viewId === viewIdRef.current) {
      setError(true);
      setErrorReason(errorDescription);
    }
  });
  return unsubscribe;
}, []);
```

Add `errorReason` state: `const [errorReason, setErrorReason] = useState<string | null>(null);`

Update error UI to show reason:

```tsx
<p className="text-sm text-destructive">{errorReason ?? "Could not load"}</p>
```

Also add `type="button"` to the Retry button element.

---

## CODER-C BRIEF — Tests (2 new test files)

### Test file 1: `apps/desktop/src/appydave/externalBrowser.test.ts`

Read `apps/desktop/src/appydave/externalBrowser.ts` first.

Check how existing desktop tests are structured — look at any `*.test.ts` file in `apps/desktop/src/` for the import pattern and test runner (Vitest).

Write tests for `validateAppyUrl`:

- Valid `https://` URL → returns normalized href
- Valid `http://` URL → returns normalized href
- `file:///etc/passwd` → returns null
- `javascript:alert(1)` → returns null
- `data:text/html,<h1>x</h1>` → returns null
- `ftp://example.com` → returns null
- Non-string (number, null, undefined, object) → returns null
- Malformed string `"not a url"` → returns null
- Empty string `""` → returns null
- URL with credentials `https://user:pass@host/` → returns the URL (currently accepted — document the behavior)

Write tests for `parseViewBounds`:

- Valid `{x:0, y:0, width:100, height:100}` → returns object
- `width: 10` → accepted; `width: 9` → returns null
- `height: 10` → accepted; `height: 9` → returns null
- Negative `x` → returns null
- Negative `y` → returns null
- `NaN` for any field → returns null
- Non-object input (null, string, number) → returns null
- Missing fields `{}` → returns null (all NaN)
- String-coercible numbers `{x:"5", y:"5", width:"100", height:"100"}` → document whether accepted or rejected

### Test file 2: `apps/web/src/appydave/apps/WebviewPane.test.tsx`

Read `apps/web/src/appydave/apps/WebviewPane.tsx` first.
Check how existing web component tests are structured — look at any `*.test.tsx` in `apps/web/src/`.

Mock `window.appyBridge` as undefined for the non-Electron fallback tests.

Write tests:

1. **Non-Electron fallback**: when `window.appyBridge` is undefined, renders app name, URL, and explanatory message
2. **Error state**: when `window.appyBridge.showWebview` resolves to null, renders error panel with "Could not load" and Retry button
3. **Retry**: clicking Retry button clears error state (verify via re-render)
4. **Type attribute**: Retry button has `type="button"`

---

## Watch out for (all coders)

- **`exactOptionalPropertyTypes`**: never write `field: x || undefined`. Use `...(x ? { field: x } : {})`.
- **Run gates from repo root** `/Users/davidcruwys/dev/ad/apps/appyctrl`, not `cd apps/web && ...`
- **Don't run `bun fmt`** — integrator runs it once at end.
- **Sibling-slice typecheck failures are expected** during parallel work — integrator runs final gates.
- **`.js` extensions on relative imports** in `apps/desktop/src/` — this package uses `moduleResolution: node16`. Imports must be `"./foo.js"` not `"./foo"`.
- **Coordinate on `appyIpcHandlers.ts`**: Coder-A owns it, Coder-B's Patch B2 also touches it. If running truly in parallel, Coder-A does the A7+openExternal handler, Coder-B provides the spec for what to add and the integrator reconciles.

---

## After all 3 coders complete — integrator steps

```bash
# 1. Merge the three slices (resolve any conflicts in appyIpcHandlers.ts)

# 2. Update channels.ts import in appyBridge.ts (Coder-B may still have local constants)

# 3. Run full gates from repo root:
bun fmt
bun lint
bun typecheck
bun run test

# 4. check-seams.sh
bash .appydave/scripts/check-seams.sh

# 5. Add preload.ts to SEAM_FILES in check-seams.sh:
#    Open .appydave/scripts/check-seams.sh
#    Add "apps/desktop/src/preload.ts" to the SEAM_FILES array

# 6. Remove [APPYDAVE-PATCH] annotation from AppyAppsSection.tsx handleActivate
#    Replace with plain comment: // Phase 3: branch on openExternal flag
#    Remove from patches/manifest.md (it's an AppyDave-owned file, not a seam)

# 7. Commit:
git add -p
git commit -m "fix(appydave): phase-3.1 — Electron lifecycle patches + security fixes"

# 8. Re-run delivery review (delivery-review skill or manual)
#    Focus on P1–P10 patches only — verify all 10 ACs
```

---

## Phase 3.1 ACs (verify before closing)

| #   | Verify                                                                                          |
| --- | ----------------------------------------------------------------------------------------------- |
| 1   | Click openExternal=false → embedded view loads, sidebar visible                                 |
| 2   | Click openExternal=true → opens in browser, main panel unchanged                                |
| 3   | Toggle openExternal in modal → next click uses new behaviour                                    |
| 4   | Unreachable URL → custom error panel with reason + Retry button                                 |
| 5   | Retry button has type="button"                                                                  |
| 6   | On Retina Mac (or simulate 2× DPR): view fills the correct area                                 |
| 7   | `window.open("javascript:alert(1)")` in DevTools on loaded page → denied, no shell.openExternal |
| 8   | `window.appyBridge.openInExternalBrowser(url)` exists and works                                 |
| 9   | check-seams.sh: preload.ts now in SEAM_FILES                                                    |
| 10  | No regression in Phase 2 ACs (modal, add/edit/delete still works)                               |

---

## Reference files (read these if you need context)

- `apps/desktop/src/appydave/appyIpcHandlers.ts` — current Phase 3 implementation
- `apps/desktop/src/appydave/appyBridge.ts` — preload bridge
- `apps/desktop/src/appydave/externalBrowser.ts` — validators
- `packages/appydave/src/bridge.ts` — TypeScript contract
- `apps/web/src/appydave/apps/WebviewPane.tsx` — React component
- `.appydave/docs/delivery-review-phase-3.md` — full DVR findings
- `.appydave/patches/manifest.md` — all active patches

---

## Known pre-existing test failures (not your problem)

`apps/web/src/authBootstrap.test.ts` and `apps/web/src/environments/primary/bootstrap.test.ts` — 10 failures due to the `bootstrap-cold-boot` patch adding `cache: "no-store"` to fetch calls. These are documented in the manifest and are deliberate. Do not attempt to fix them.
