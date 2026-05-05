# Spec — Application Launcher (Phases 2 + 3)

**Status:** approved · **Phases:** 2 (data + UI + modal, no rendering) → 3 (webview + external bridge) · **Depends on:** Phase 1 (themes) · **Blocks:** none

---

## Goal

Add an "Applications" section to the sidebar where the user can register external web apps (Cloud kind only for v1). Clicking an app opens it in an Electron `<webview>` in the main panel by default; the user can opt-in per app to open in an external `BrowserWindow` instead.

## Non-goals

- Local kind (dev server with port + start command) — POC supports it; **defer**
- Hybrid kind — defer
- Icon/color picker for apps — glyph (1–2 chars) is enough for v1
- App settings/per-app credentials — defer
- Drag-to-reorder apps — defer

## Pre-seeded registry (v1)

```ts
[
  { id: "claude-ai",  name: "Claude.ai", url: "https://claude.ai",         glyph: "C", openExternal: false },
  { id: "angel-eye",  name: "AngelEye",  url: "http://localhost:5050/",     glyph: "AE", openExternal: false },
]
```

## Data model

```ts
// packages/appydave/src/registry.ts (NEW package file)
export type RegisteredApp = {
  id: string;             // slug, derived from name on creation
  name: string;           // "Claude.ai"
  url: string;            // "https://claude.ai" — must start with http(s)://
  glyph?: string;         // 1-2 chars displayed in sidebar
  openExternal: boolean;  // true = BrowserWindow instead of in-panel webview
};

export type AppRegistry = ReadonlyArray<RegisteredApp>;
```

**Storage (Phase 2):** localStorage key `appydave.appRegistry`, JSON-serialised. Seeded with the two entries above on first load if key missing.

**Storage (Phase 3+, deferred):** server settings under `appydave.appRegistry` namespace. Out of scope for this spec.

## Phase 2 — Sidebar UI + Modal

### Files

#### Seam edits

| File | Edit | Patch id |
|---|---|---|
| `apps/web/src/components/Sidebar.tsx` | One import + one composition: render `<AppyAppsSection />` between Projects section and Settings footer | `sidebar-apps-section` |

#### Additive

```
packages/appydave/src/
  registry.ts                          # Types + storage helpers (load, save, seed)

apps/web/src/appydave/
  apps/
    AppyAppsSection.tsx                # Sidebar section header + list
    AppyAppRow.tsx                     # One row: glyph + name + edit-on-hover button
    AppyAppModal.tsx                   # Add/Edit modal using shadcn Dialog
    useAppRegistry.ts                  # Reads registry from localStorage; provides add/update/delete
```

### Sidebar section structure

- Section header: small uppercase label "Applications" + `+` icon button (opens modal in add mode)
- Rows below header — one per registered app
- Hover state on row reveals settings icon at right (opens modal in edit mode for that app)
- Click on row body → navigates to `/apps/$id` (Phase 3 route)

### Modal (`AppyAppModal.tsx`)

Built on shadcn `Dialog`. Used in add and edit modes.

**Fields (in render order):**

1. **Glyph** — 1–2 char text input, width ~48px, optional, max length 2
2. **Name** — text input, required, placeholder "Claude.ai"
3. **URL** — text input, required, validation: must match `/^https?:\/\//`, placeholder "https://example.com"
4. **Open in external browser instead** — checkbox, default off. Hint text below: "Opens in a separate Chromium window instead of in the main panel."

**Footer buttons:**

- Edit mode: `Delete` (left, destructive style) · spacer · `Cancel` · `Save changes`
- Add mode: `Cancel` · `Add application`

**Behaviour:**

- Escape key dismisses (cancel)
- Cmd/Ctrl + Enter submits
- Click outside closes (cancel)
- On save: writes to localStorage, dispatches change event so other parts of UI re-read
- On delete (edit mode only): confirmation toast/alert, then removes from registry

### Phase 2 acceptance criteria

1. Sidebar shows "Applications" section with two pre-seeded entries on first run
2. Clicking `+` opens add modal; submitting valid data persists across reload
3. Hover row → settings icon appears; click opens edit modal pre-filled
4. Edit modal can update or delete; both persist
5. URL field rejects non-http(s) URLs with inline error
6. localStorage key `appydave.appRegistry` survives reload, can be inspected in devtools
7. `check-seams.sh` reports one new seam edit (Sidebar)
8. No new RPC method, no server changes

## Phase 3 — Main-panel webview + external bridge

### Files

#### Seam edits

| File | Edit | Patch id |
|---|---|---|
| `apps/desktop/src/main.ts` | Wire `appyBridge.openInExternalBrowser(url)` IPC handler. One import + one ipcMain.handle line. | `bridge-open-external` |

#### Additive

```
packages/appydave/src/
  bridge.ts                            # AppyDesktopBridge interface

apps/desktop/src/appydave/
  appyBridge.ts                        # Preload: window.appyBridge = { openInExternalBrowser }
  externalBrowser.ts                   # Main-process IPC handler — uses Electron shell.openExternal or new BrowserWindow

apps/web/src/routes/
  apps.$id.tsx                         # New route — renders WebviewPane for the app id

apps/web/src/appydave/apps/
  WebviewPane.tsx                      # <webview src={app.url} /> with loading/error states
```

### Click behaviour

When user clicks a sidebar app row:

```
if (app.openExternal) {
  window.appyBridge.openInExternalBrowser(app.url);
} else {
  navigate({ to: "/apps/$id", params: { id: app.id } });
}
```

### Webview vs external — implementation

**Webview (default):**
- Use Electron `<webview>` tag (NOT iframe — Claude.ai blocks iframe via X-Frame-Options)
- Sandboxed, supports devtools via right-click
- `src={app.url}`, `partition="persist:appy-apps"` for shared cookie storage across apps in this session

**External BrowserWindow:**
- New Electron `BrowserWindow` with the URL
- Or simpler: `shell.openExternal(url)` (opens in user's default browser, not Chromium-controlled)
- Decision (defer to implementation): start with `shell.openExternal` — simpler, no window lifecycle management. If user wants Chromium-with-devtools alternative, upgrade to `new BrowserWindow`.

### Phase 3 acceptance criteria

1. Click app row with `openExternal=false` → main panel renders the app in a webview, sidebar stays put, route is `/apps/$id`
2. Click app row with `openExternal=true` → app opens in external browser; main panel does NOT change
3. Toggling `openExternal` in modal changes click behaviour for that app immediately
4. Webview persists cookies across app reloads (verified by signing into Claude.ai once and checking session survives a route change away and back)
5. `<webview>` errors (network unreachable, etc.) show a fallback panel with retry button
6. `check-seams.sh` reports one new seam edit (`apps/desktop/src/main.ts`)

## Cross-phase notes

- Both phases use the same `RegisteredApp` type — defined in Phase 2, consumed in Phase 3 unchanged
- Sidebar section component built in Phase 2 doesn't need to know about webview/external at all — only `useAppRegistry` and the click handler do; that handler upgrades from "navigate" to "navigate or openExternal" in Phase 3
- No URL allow-list / security policy in v1 — assumed all entries are user-authored and trusted. Future hardening: domain allow-list per-app
