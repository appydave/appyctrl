# AppyCtrl Dev-Mode Boot Sequence

Documents the startup race condition in `dev:desktop` mode and why the patches exist.

---

## How the desktop dev-mode boots

1. `bun run dev:desktop` → `dev-runner.ts` → `turbo` with `--parallel`
2. Turbo starts `@t3tools/desktop` (Electron) and `@t3tools/web` (Vite) simultaneously
3. Electron `main.ts` calls `startBackend()` — spawns the backend server as a child process
4. **`main.ts:2084`:** in dev mode, `mainWindow = createWindow()` fires immediately
5. `waitForBackendWindowReady` is called but its result is `void`'d — fire-and-forget logging only
6. The Electron window loads `http://127.0.0.1:5733` (Vite dev server)
7. The renderer runs TanStack Router `beforeLoad`, which calls:
   - `ensurePrimaryEnvironmentReady()` → `fetch(/.well-known/t3/environment)`
   - `resolveInitialServerAuthGateState()` → `fetch(/api/auth/session)`
8. If the backend has accepted TCP but hasn't initialised its Effect layers and auth routes
   yet, both fetches hang — no timeout, no error, no retry

## Why there is no external fix for desktop mode

The window creation at step 4 is a deliberate upstream design choice: show something
immediately in dev mode rather than waiting. The readiness gate (`waitForBackendWindowReady`)
exists but its result is explicitly ignored in the dev branch. There is no env var or
external script hook that can delay step 4 without editing `main.ts`.

The `scripts/appydave/dev.ts` wrapper script solves this for **web mode** (`bun run dev`)
by setting `T3CODE_NO_BROWSER=1` and controlling when the browser opens. It does not help
for desktop mode because Electron manages its own window lifecycle.

## The patches that protect against this

See `.appydave/patches/manifest.md` for full detail.

| Patch | What it does |
|-------|-------------|
| `fetch-timeout` | Wraps auth fetch calls with 8s AbortController so they fail fast and retry |
| `splash-pending` | Shows the T3 splash logo during `beforeLoad` instead of a black screen |

## What a proper upstream fix would look like

Option A (preferred): Gate the dev-mode window on `/api/auth/session` returning 200,
not just TCP or HTTP/302 from root. One line change in `main.ts`.

Option B: Add per-request timeouts inside `retryTransientBootstrap` natively, making
`fetch-timeout` patch unnecessary.

Either fix could be proposed as a PR to upstream. Until then the patches stay.
