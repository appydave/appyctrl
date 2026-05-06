import { contextBridge, ipcRenderer } from "electron";

const APPY_SHOW_WEBVIEW_CHANNEL = "appy:show-webview";
const APPY_HIDE_WEBVIEW_CHANNEL = "appy:hide-webview";
const APPY_RESIZE_WEBVIEW_CHANNEL = "appy:resize-webview";

export function registerAppyBridge() {
  contextBridge.exposeInMainWorld("appyBridge", {
    showWebview: (params: unknown) =>
      ipcRenderer.invoke(APPY_SHOW_WEBVIEW_CHANNEL, params),
    hideWebview: (viewId: number) =>
      ipcRenderer.invoke(APPY_HIDE_WEBVIEW_CHANNEL, viewId),
    resizeWebview: (viewId: number, bounds: unknown) =>
      ipcRenderer.invoke(APPY_RESIZE_WEBVIEW_CHANNEL, viewId, bounds),
  });
}
