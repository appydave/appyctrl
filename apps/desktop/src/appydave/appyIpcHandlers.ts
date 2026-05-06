import { ipcMain, WebContentsView, BrowserWindow, shell } from "electron";
import { validateAppyUrl, parseViewBounds } from "./externalBrowser.js";

const APPY_SHOW_WEBVIEW_CHANNEL = "appy:show-webview";
const APPY_HIDE_WEBVIEW_CHANNEL = "appy:hide-webview";
const APPY_RESIZE_WEBVIEW_CHANNEL = "appy:resize-webview";

const activeViews = new Map<number, WebContentsView>();

export function registerAppyIpcHandlers() {
  ipcMain.removeHandler(APPY_SHOW_WEBVIEW_CHANNEL);
  ipcMain.handle(APPY_SHOW_WEBVIEW_CHANNEL, (_event, rawParams: unknown) => {
    if (typeof rawParams !== "object" || rawParams === null) return null;
    const p = rawParams as Record<string, unknown>;
    const url = validateAppyUrl(p.url);
    const bounds = parseViewBounds(p.bounds);
    if (!url || !bounds) return null;

    const win =
      BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
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

    view.webContents.on("will-navigate", (_e, navigationUrl) => {
      const parsed = new URL(navigationUrl);
      if (parsed.origin !== new URL(url).origin) {
        _e.preventDefault();
        void shell.openExternal(navigationUrl);
      }
    });

    view.webContents.setWindowOpenHandler(({ url: newUrl }) => {
      void shell.openExternal(newUrl);
      return { action: "deny" };
    });

    void view.webContents.loadURL(url);
    activeViews.set(view.webContents.id, view);
    return view.webContents.id;
  });

  ipcMain.removeHandler(APPY_HIDE_WEBVIEW_CHANNEL);
  ipcMain.handle(APPY_HIDE_WEBVIEW_CHANNEL, (_event, rawViewId: unknown) => {
    const viewId = typeof rawViewId === "number" ? rawViewId : null;
    if (viewId === null) return;
    const view = activeViews.get(viewId);
    if (!view) return;
    const win =
      BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    win?.contentView.removeChildView(view);
    view.webContents.close();
    activeViews.delete(viewId);
  });

  ipcMain.removeHandler(APPY_RESIZE_WEBVIEW_CHANNEL);
  ipcMain.handle(
    APPY_RESIZE_WEBVIEW_CHANNEL,
    (_event, rawViewId: unknown, rawBounds: unknown) => {
      const viewId = typeof rawViewId === "number" ? rawViewId : null;
      if (viewId === null) return;
      const bounds = parseViewBounds(rawBounds);
      if (!bounds) return;
      const view = activeViews.get(viewId);
      view?.setBounds(bounds);
    },
  );
}
