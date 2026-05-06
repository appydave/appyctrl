import { ipcMain, WebContentsView, BrowserWindow, shell } from "electron";
import { validateAppyUrl, parseViewBounds } from "./externalBrowser.js";
import {
  APPY_SHOW_WEBVIEW_CHANNEL,
  APPY_HIDE_WEBVIEW_CHANNEL,
  APPY_RESIZE_WEBVIEW_CHANNEL,
  APPY_OPEN_EXTERNAL_CHANNEL,
} from "@t3tools/appydave-registry/channels.js";

// A2: store win reference alongside view
const activeViews = new Map<number, { view: WebContentsView; win: BrowserWindow }>();

export function registerAppyIpcHandlers() {
  ipcMain.removeHandler(APPY_SHOW_WEBVIEW_CHANNEL);
  ipcMain.handle(APPY_SHOW_WEBVIEW_CHANNEL, (event, rawParams: unknown) => {
    if (typeof rawParams !== "object" || rawParams === null) return null;
    const p = rawParams as Record<string, unknown>;
    const url = validateAppyUrl(p.url);
    const bounds = parseViewBounds(p.bounds);
    if (!url || !bounds) return null;

    // A4: dedup guard — return existing viewId if same URL already loaded
    for (const [existingId, { view: existingView }] of activeViews) {
      if (!existingView.webContents.isDestroyed() && existingView.webContents.getURL() === url) {
        return existingId;
      }
    }

    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    if (!win) return null;

    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    view.setBounds(bounds);
    win.contentView.addChildView(view);

    // A2: store { view, win }
    activeViews.set(view.webContents.id, { view, win });

    // A3: clean up on destroy
    view.webContents.once("destroyed", () => {
      activeViews.delete(view.webContents.id);
    });

    // A6: try/catch in will-navigate, rename _e → e
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

    // A5: validate URL in setWindowOpenHandler
    view.webContents.setWindowOpenHandler(({ url: newUrl }) => {
      const safeUrl = validateAppyUrl(newUrl);
      if (safeUrl) void shell.openExternal(safeUrl);
      return { action: "deny" };
    });

    void view.webContents.loadURL(url);

    // A7: did-fail-load listener — notify renderer on load failure
    view.webContents.once("did-fail-load", (_e, errorCode, errorDescription) => {
      const senderContents = event.sender;
      if (!senderContents.isDestroyed()) {
        senderContents.send("appy:webview-load-failed", {
          viewId: view.webContents.id,
          errorCode,
          errorDescription,
        });
      }
    });

    return view.webContents.id;
  });

  ipcMain.removeHandler(APPY_HIDE_WEBVIEW_CHANNEL);
  ipcMain.handle(APPY_HIDE_WEBVIEW_CHANNEL, (_event, rawViewId: unknown) => {
    const viewId = typeof rawViewId === "number" ? rawViewId : null;
    if (viewId === null) return;
    const entry = activeViews.get(viewId);
    if (!entry) return;
    // A2: use stored win reference instead of getFocusedWindow
    const { view, win } = entry;
    win.contentView.removeChildView(view);
    view.webContents.close();
    activeViews.delete(viewId);
  });

  ipcMain.removeHandler(APPY_RESIZE_WEBVIEW_CHANNEL);
  ipcMain.handle(APPY_RESIZE_WEBVIEW_CHANNEL, (_event, rawViewId: unknown, rawBounds: unknown) => {
    const viewId = typeof rawViewId === "number" ? rawViewId : null;
    if (viewId === null) return;
    const bounds = parseViewBounds(rawBounds);
    if (!bounds) return;
    // A2: use entry.view instead of direct map value
    const entry = activeViews.get(viewId);
    entry?.view.setBounds(bounds);
  });

  // A7: openExternal IPC handler
  ipcMain.removeHandler(APPY_OPEN_EXTERNAL_CHANNEL);
  ipcMain.handle(APPY_OPEN_EXTERNAL_CHANNEL, async (_event, rawUrl: unknown) => {
    const url = validateAppyUrl(rawUrl);
    if (!url) return;
    await shell.openExternal(url);
  });
}
