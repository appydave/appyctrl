---
type: pattern
phase: phase-3
date: 2026-05-06
title: Managing WebContentsView lifecycle from a React renderer via IPC
description: Store {view, win} pairs, always listen for destroyed events, apply devicePixelRatio to bounds, deduplicate before create, validate URLs before openExternal
category: patterns
tags: [electron, webcontentsview, ipc, lifecycle, react, security]
kdd_phase_origin: "phase-3"
kdd_impact: high
kdd_hard_won: true
kdd_related_docs:
  - ../decisions/adr-0003-webcontentsview-for-embedded-apps.md
  - ../learnings/electron-webcontentsview-retina-trap.md
  - ../learnings/shell-openexternal-validation.md
---

# Managing WebContentsView Lifecycle from a React Renderer via IPC

## Context

Phase 3 implements embedded app rendering via Electron's `WebContentsView` API. A React renderer component on the web side sends `getBoundingClientRect()` and URL to the main process via IPC. The main process creates, positions, and destroys views in response. Without discipline, this pattern creates four common failure modes: zombie views from missing cleanup, retina scaling bugs, race conditions from duplicate view creation, and security holes in external URL handling.

## Pattern

### 1. Store {view, win} Pairs — Never Resolve Independently

Maintain a **Map keyed by URL** that holds both the view and its owning window:

```ts
const viewCache = new Map<string, { view: WebContentsView; win: BrowserWindow }>();

// CORRECT: resolve both together
ipcMain.handle("appy:show-webview", (event, { url, bounds }) => {
  let entry = viewCache.get(url);

  if (!entry) {
    // Create view with security defaults
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
      },
    });
    entry = { view, win: BrowserWindow.getFocusedWindow()! };
    viewCache.set(url, entry);
  }

  const { view, win } = entry;
  win.contentView.addChildView(view);
  view.setBounds(bounds);
  view.webContents.loadURL(url);
});

// WRONG: trying to fetch the window later at hide-time
// ipcMain.handle("appy:hide-webview", (event, { url }) => {
//   const view = viewCache.get(url)?.view; // ✗ What if the window closed externally?
//   const win = BrowserWindow.getFocusedWindow(); // ✗ Different window might be focused
//   win.contentView.removeChildView(view);
// });
```

At hide-time, always use the stored window:

```ts
ipcMain.handle("appy:hide-webview", (event, { url }) => {
  const entry = viewCache.get(url);
  if (entry) {
    const { view, win } = entry;
    win.contentView.removeChildView(view);
    // Don't destroy yet — wait for the destroyed event below
  }
});
```

**Why:** External crashes (application quit, window close, even a stray `electron --remote-debugging-port=9222`) can destroy the window without the main process receiving an event. If you try to fetch the window later by calling `BrowserWindow.getFocusedWindow()` or iterating all windows, you'll either get the wrong window or crash the lookup. Storing the pair at creation time is the only reliable anchor.

### 2. Always Listen for `webContents.once("destroyed")`

Add a cleanup listener when the view is created:

```ts
const view = new WebContentsView({...});
entry = { view, win };
viewCache.set(url, entry);

// Catch external crashes (app quit, remote debugging, etc.)
view.webContents.once("destroyed", () => {
  viewCache.delete(url);
});
```

**Why:** If the user quits Electron, closes the window via Cmd+Q, or a remote debugger connection closes the app, the view's webContents is destroyed. Without this listener, the Map entry persists as a zombie. On the next "show" for the same URL, you'll try to call `view.setBounds()` on a dead view and crash.

### 3. Apply devicePixelRatio to Bounds Before Sending to Main Process

The web renderer's `getBoundingClientRect()` returns **CSS pixels**, not device pixels. On macOS Retina (2×), WebContentsView.setBounds() expects **physical pixels**. Multiply by `window.devicePixelRatio`:

**React component (renderer side):**

```tsx
function EmbeddedAppPanel() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleShow = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio;

    // Send physical pixels to main process
    window.appyBridge.showWebview({
      url: "https://embedded-app.example.com",
      bounds: {
        x: Math.round(rect.left * dpr),
        y: Math.round(rect.top * dpr),
        width: Math.round(rect.width * dpr),
        height: Math.round(rect.height * dpr),
      },
    });
  };

  return <div ref={containerRef} />;
}
```

**Main process:**

```ts
ipcMain.handle("appy:show-webview", (event, { url, bounds }) => {
  // bounds are already in physical pixels — use directly
  view.setBounds(bounds); // ✓ renders at full size, not 1/4 size
});
```

**Why:** Without the multiplier, the view renders at 25% of the intended size on a Retina display, positioned in the top-left quadrant. The bounds calculation looks correct in inspector tools (which report CSS pixels), but the actual physical bounds are wrong.

### 4. Dedup Guard Before Create

Check if an identical URL already has a live view in the Map:

```ts
ipcMain.handle("appy:show-webview", (event, { url, bounds }) => {
  let entry = viewCache.get(url);

  if (entry) {
    // URL already loaded — just update bounds and bring to front
    const { view, win } = entry;
    if (!win.contentView.children.includes(view)) {
      win.contentView.addChildView(view);
    }
    view.setBounds(bounds); // in case the container resized
    return;
  }

  // First time — create new view
  const view = new WebContentsView({...});
  // ... rest of creation logic
});
```

**Why:** If the React component re-renders or the user clicks "show app" twice in quick succession, you'll create duplicate views for the same URL. This wastes memory and can cause flickering or input focus issues. The dedup check is cheap (Map lookup) and prevents the common race condition.

### 5. Validate URLs Before shell.openExternal

`setWindowOpenHandler` receives `url` directly from the loaded page's `window.open()` call. Validate before passing to `shell.openExternal`:

```ts
ipcMain.handle("appy:show-webview", (event, { url, bounds }) => {
  const view = new WebContentsView({...});

  // Validate app URL
  if (!isValidAppUrl(url)) {
    throw new Error(`Invalid app URL: ${url}`);
  }

  view.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
    // ✓ Validate popup URL too — user could have typed into browser console
    if (isValidAppUrl(popupUrl)) {
      shell.openExternal(popupUrl);
      return { action: "deny" };
    }
    // Deny file://, javascript:, or other dangerous schemes
    return { action: "deny" };
  });

  view.webContents.on("will-navigate", (event, url) => {
    // ✓ Same validation for navigation
    if (!isValidAppUrl(url)) {
      event.preventDefault();
    }
  });
});

function isValidAppUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    // Only allow http/https, with a known domain allowlist
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      ALLOWED_APP_DOMAINS.includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}
```

**Why:** This is a **security boundary**. Any page loaded in the webview can call `window.open("file:///etc/passwd")` or `window.open("javascript:alert('xss')")`. Without validation, you escalate web-page intent directly to the host system. Electron's security model assumes the main process is trusted; validate every URL before acting on it.

## Checklist for Implementation

- [ ] Map stores `{ view, win }` pairs — both resolved at creation time
- [ ] `view.webContents.once("destroyed", ...)` listener cleans the Map
- [ ] React component multiplies `getBoundingClientRect()` by `window.devicePixelRatio` before sending
- [ ] `Math.round()` is applied to all bounds values (no floating-point device pixels)
- [ ] Dedup check: existing entries are re-added and updated, not re-created
- [ ] `setWindowOpenHandler` validates `url` against allowlist + scheme whitelist
- [ ] `will-navigate` handler validates navigation targets
- [ ] Bounds are logged at show-time for easy debugging

## Related Learnings

- [Electron WebContentsView Retina Trap](../learnings/electron-webcontentsview-retina-trap.md)
- [shell.openExternal Validation](../learnings/shell-openexternal-validation.md)

## Origin

- Phase: phase-3
- ADR: [ADR-0003](../decisions/adr-0003-webcontentsview-for-embedded-apps.md)
