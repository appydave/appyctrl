import { contextBridge, ipcRenderer } from "electron";
import {
  APPY_SHOW_WEBVIEW_CHANNEL,
  APPY_HIDE_WEBVIEW_CHANNEL,
  APPY_RESIZE_WEBVIEW_CHANNEL,
  APPY_OPEN_EXTERNAL_CHANNEL,
} from "@t3tools/appydave-registry/channels.js";

export function registerAppyBridge() {
  contextBridge.exposeInMainWorld("appyBridge", {
    showWebview: (params: unknown) => ipcRenderer.invoke(APPY_SHOW_WEBVIEW_CHANNEL, params),
    hideWebview: (viewId: number) => ipcRenderer.invoke(APPY_HIDE_WEBVIEW_CHANNEL, viewId),
    resizeWebview: (viewId: number, bounds: unknown) =>
      ipcRenderer.invoke(APPY_RESIZE_WEBVIEW_CHANNEL, viewId, bounds),
    openInExternalBrowser: (url: string) => ipcRenderer.invoke(APPY_OPEN_EXTERNAL_CHANNEL, url),
    onWebviewLoadFailed: (
      listener: (data: { viewId: number; errorCode: number; errorDescription: string }) => void,
    ) => {
      const handler = (_event: Electron.IpcRendererEvent, data: unknown) => {
        listener(data as { viewId: number; errorCode: number; errorDescription: string });
      };
      ipcRenderer.on("appy:webview-load-failed", handler);
      return () => ipcRenderer.removeListener("appy:webview-load-failed", handler);
    },
  });
}
