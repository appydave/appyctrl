export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShowWebviewParams {
  url: string;
  bounds: ViewBounds;
}

export interface AppyDesktopBridge {
  showWebview(params: ShowWebviewParams): Promise<number | null>; // returns viewId (webContents.id)
  hideWebview(viewId: number): Promise<void>;
  resizeWebview(viewId: number, bounds: ViewBounds): Promise<void>;
}

declare global {
  interface Window {
    appyBridge: AppyDesktopBridge;
  }
}
