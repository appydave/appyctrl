#!/usr/bin/env node
/**
 * AppyDave dev launcher — sequences backend startup before opening the browser.
 *
 * Problem: the upstream dev-runner spawns turbo with --parallel, so Vite opens
 * the browser while the backend is still initialising. The auth bootstrap fetch
 * calls have no timeout, so they hang indefinitely if the backend accepts the
 * TCP connection before its auth routes are ready.
 *
 * Fix (zero upstream code changes):
 *   1. Set T3CODE_NO_BROWSER=1 so Vite's auto-open is suppressed.
 *   2. Spawn the existing dev-runner for the requested mode.
 *   3. Poll /api/auth/session until the backend is truly auth-ready.
 *   4. Open the browser ourselves once it is.
 *
 * Usage:
 *   node scripts/appydave/dev.ts            # web mode (default)
 *   node scripts/appydave/dev.ts dev:web    # explicit web mode
 */

import * as ChildProcess from "node:child_process";

const mode = process.argv[2] ?? "dev";
const SERVER_PORT = Number(process.env.T3CODE_PORT ?? 13773);
const WEB_PORT = Number(process.env.PORT ?? 5733);
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;
const BROWSER_URL = `http://localhost:${WEB_PORT}`;

const POLL_INTERVAL_MS = 250;
const POLL_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 1_000;

async function pollUntilAuthReady(baseUrl: string): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        signal: controller.signal,
        redirect: "manual",
      });
      clearTimeout(timer);
      if (response.ok) {
        return;
      }
    } catch {
      // backend not ready yet — keep polling
    }
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`Backend at ${baseUrl} did not become auth-ready within ${POLL_TIMEOUT_MS}ms`);
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  ChildProcess.spawn(cmd, [url], { detached: true, stdio: "ignore" }).unref();
}

const child = ChildProcess.spawn("node", ["scripts/dev-runner.ts", mode], {
  stdio: "inherit",
  env: { ...process.env, T3CODE_NO_BROWSER: "1" },
});

child.on("exit", (code) => process.exit(code ?? 0));

console.log(`[appydave] Waiting for backend to be auth-ready at ${SERVER_URL} …`);

pollUntilAuthReady(SERVER_URL)
  .then(() => {
    console.log(`[appydave] Backend ready — opening ${BROWSER_URL}`);
    openBrowser(BROWSER_URL);
  })
  .catch((err: unknown) => {
    console.error(`[appydave] ${err instanceof Error ? err.message : String(err)}`);
  });
