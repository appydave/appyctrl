import { useEffect, useRef, useState } from "react";
import type { RegisteredApp } from "@t3tools/appydave-registry";
// Side-effect import: loads the `declare global { interface Window { appyBridge } }` augmentation
import "@t3tools/appydave-registry/bridge";

interface Props {
  app: RegisteredApp;
}

export function WebviewPane({ app }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewIdRef = useRef<number | null>(null);
  const [error, setError] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!window.appyBridge) return; // non-Electron env

    const rect = el.getBoundingClientRect();
    const bounds = {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };

    let cancelled = false;

    void window.appyBridge.showWebview({ url: app.url, bounds }).then((id) => {
      if (cancelled) {
        if (id !== null) void window.appyBridge?.hideWebview(id);
        return;
      }
      if (id === null) {
        setError(true);
        return;
      }
      viewIdRef.current = id;
    });

    return () => {
      cancelled = true;
      if (viewIdRef.current !== null) {
        void window.appyBridge?.hideWebview(viewIdRef.current);
        viewIdRef.current = null;
      }
    };
  }, [app.url, retryCount]);

  // ResizeObserver keeps the WebContentsView bounds in sync with the container
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !window.appyBridge) return;

    const observer = new ResizeObserver(() => {
      if (viewIdRef.current === null) return;
      const rect = el.getBoundingClientRect();
      void window.appyBridge?.resizeWebview(viewIdRef.current, {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  if (!window.appyBridge) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <p className="text-sm font-medium">{app.name}</p>
        <p className="text-xs opacity-60">{app.url}</p>
        <p className="text-xs">Open in Electron to use embedded view</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="font-medium">{app.name}</p>
        <p className="text-xs opacity-60">{app.url}</p>
        <p className="text-sm text-destructive">{errorReason ?? "Could not load"}</p>
        <button
          type="button"
          className="rounded bg-muted px-3 py-1 text-sm hover:bg-muted/80"
          onClick={() => {
            setError(false);
            setErrorReason(null);
            setRetryCount((n) => n + 1);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
