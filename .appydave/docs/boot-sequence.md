# AppyCtrl Dev-Mode Boot Sequence — Debugging Postmortem

**Read this BEFORE touching the bootstrap fetch patches. Multiple sessions have re-debugged
this same problem from scratch. Don't be the next.**

---

## TL;DR — the actual bug

In dev-mode (`bun run dev:desktop`), the first browser fetch through Vite 8's dev proxy
takes **exactly ~20 seconds** unless an explicit `cache` hint is on the `RequestInit`.
Backend itself responds in <2ms (verified by direct curl AND direct browser fetch).

This breaks the bootstrap flow because:

- `__root.tsx` `beforeLoad` calls `Promise.all([envReady, authState])`
- Each calls `retryTransientBootstrap(operation)` which awaits `fetch(url, init)`
- A 20s fetch × N retries blows past the upstream `BOOTSTRAP_RETRY_TIMEOUT_MS = 15_000` budget
- Renderer ends in `Something went wrong. Bootstrap fetch timed out`

**The fix lives in `apps/web/src/environments/primary/auth.ts` —
`fetchWithBootstrapTimeout` always merges `cache: "no-store"` into init.**

---

## What `cache: "no-store"` actually fixes

UAT against a real Electron renderer (Playwright at `http://127.0.0.1:5733`):

| `fetch()` call shape                     | Latency  |
| ---------------------------------------- | -------- |
| `fetch(url)` — no init                   | **~20s** |
| `fetch(url, undefined)`                  | **~20s** |
| `fetch(url, {})`                         | **~20s** |
| `fetch(url, { method: "GET" })`          | **~20s** |
| `fetch(url, { credentials: "include" })` | ~4ms     |
| `fetch(url, { cache: "no-store" })`      | ~4ms     |
| `fetch(url, { cache: "default" })`       | ~3ms     |
| `fetch(url, { keepalive: false })`       | ~4ms     |
| Direct fetch to backend (port 13773)     | ~2ms     |
| `curl` to Vite proxy (port 5733)         | ~1ms     |

The 20s only fires from a real browser, only through the Vite proxy, and only when fetch
has no `cache` hint (or explicitly only `method` / no other options). Adding _any_ of
`cache: *`, `keepalive: false`, or `credentials: "include"` switches Chromium to a code
path that doesn't get stuck.

We don't have a published Vite/Chromium issue link — it appeared with Vite 8's proxy
implementation. Document and move on.

---

## The full bootstrap flow (so you don't have to re-derive it)

```
Electron main.ts:2204 (whenReady → bootstrap)
  ├─ startBackend()                        # spawns server child process
  └─ if isDevelopment:
       mainWindow = createWindow()         # opens window IMMEDIATELY
       void waitForBackendWindowReady(...) # ⚠ result is fire-and-forget logged

Backend cold-start (typical):  ~7s warm cache, ~20-23s cold cache (turbo cleared)
Window opens at ~0s, backend listens at ~7-23s → race window of 7-23s.

Renderer flow once Vite loads:
  __root.tsx beforeLoad
    └─ Promise.all([
         ensurePrimaryEnvironmentReady()   # → resolveInitialPrimaryEnvironmentDescriptor()
                                           #   → fetchPrimaryEnvironmentDescriptor()
                                           #     → retryTransientBootstrap(fetch /.well-known/t3/environment)
         resolveInitialServerAuthGateState() # → bootstrapServerAuth()
                                             #   → fetchSessionState()
                                             #     → retryTransientBootstrap(fetch /api/auth/session)
       ])

retryTransientBootstrap (auth.ts):
  while elapsed < BOOTSTRAP_RETRY_TIMEOUT_MS:
    try:    return await operation()
    catch:  if isTransientBootstrapError(e): sleep 500ms; retry
            else: throw

isTransientBootstrapError treats as transient:
  - BootstrapHttpError with status ∈ {502, 503, 504}
  - TypeError (network error)
  - DOMException with name === "AbortError"
```

When backend isn't up:

- **Vite proxy returns 502 fast** (~4ms, verified) — retry handles this.
- **Vite proxy can ALSO hang** if the upstream connection establishes mid-boot — fetch
  never completes; retry blocks forever inside `await operation()`.
- **Vite + browser-cache interaction** adds ~20s per fetch even when backend is up.

These three failure modes compound. Fix all three or it doesn't work.

---

## What our patches do (today)

### `bootstrap-cold-boot` (auth.ts + context.ts)

1. **`cache: "no-store"` on every bootstrap fetch** — eliminates the 20s Vite/Chromium
   stall. THIS is the load-bearing fix.
2. **Per-request 10s timeout via `Promise.race`** — guards against the hung-proxy case so
   `retryTransientBootstrap` isn't blocked forever inside a single `await`.
3. **`BOOTSTRAP_RETRY_TIMEOUT_MS` 15s → 60s** — gives the retry loop enough budget for
   genuinely cold boots (measured 20-23s wall time on cold turbo cache).

We do NOT inject `signal` into the init object — Promise.race wraps the whole fetch
externally. The underlying fetch keeps running past the timeout (acceptable in dev).

### `splash-pending` (`__root.tsx`)

- `pendingComponent: SplashScreen` so the user sees the T3 splash instead of a black
  screen during the retry window.

---

## Failure modes seen and false leads (so you don't chase them)

| Symptom                                          | Real cause                                            | False lead chased                                                       |
| ------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Black screen at startup                          | Router has no pendingComponent                        | (not a false lead — `splash-pending` patch fixes it)                    |
| `Bootstrap fetch timed out` error                | Vite 20s stall + retry exhaust                        | "AbortController doesn't propagate"; "retry budget too small alone"     |
| 200 OK in network tab, but route stays on splash | Promise.race wins before fetch resolves on slow proxy | "React Strict Mode double-render"; "singleton being reset"; "dedup bug" |
| CORS errors in playwright                        | Wrong origin (localhost vs 127.0.0.1)                 | "Backend CORS misconfigured"                                            |
| Tests pass but app fails                         | Tests mock fetch — they never exercise Vite proxy     | "Patches solve a non-problem"                                           |
| Looks fine after manual reload                   | Backend warm; cold-boot race only on first load       | "Bug fixed"                                                             |

**Critical lesson: unit tests with mocked fetch CANNOT diagnose this. You MUST UAT in a
real browser against the real Vite proxy with a backend cold-booting.** Use Playwright
MCP at `http://127.0.0.1:5733` (NOT `http://localhost:5733` — Electron loads `127.0.0.1`,
and the dev-server origin check rewrites the URL only when origins match).

---

## Why these patches break upstream tests

`apps/web/src/authBootstrap.test.ts` and `apps/web/src/environments/primary/bootstrap.test.ts`
assert exact init shapes:

```ts
expect(fetchMock).toHaveBeenCalledWith("http://localhost:5735/api/auth/session", {
  credentials: "include",
});
```

Our patch always merges `cache: "no-store"` into init, so calls record as
`{ credentials: "include", cache: "no-store" }` and these assertions fail.

These tests test the **implementation** (call shape), not the **behaviour** (auth flow).
The cache hint is required for the app to actually function in a real browser. We accept
the test failures as a known tradeoff and document them in the patch manifest.

If upstream ever moves the cache hint into their own code, our patch can be dropped.

---

## How to UAT this fix yourself

```bash
# Kill everything, clear caches
pkill -f "Electron"; pkill -f "node scripts/dev-runner"; pkill -f vite; pkill -f tsdown
rm -rf .turbo apps/*/.turbo packages/*/.turbo

# Start dev:desktop fresh (cold)
bun run dev:desktop > /tmp/cold-boot.log 2>&1 &

# Wait for Vite, then drive a browser at the renderer URL
# (use Playwright MCP — DO NOT navigate to localhost, use 127.0.0.1)
# Expect: SplashScreen appears, then /pair page renders within ~25s

# What success looks like:
#   Page URL: http://127.0.0.1:5733/pair
#   Heading: "Pair with this environment"
#   Network tab: 2-3 pending fetches initially (cold), then 200 OK retries
```

If the renderer reaches `/pair`, you're good. If it shows
`Something went wrong. Bootstrap fetch timed out`, the patch broke or upstream changed
the bootstrap fetch path. Check that `fetchWithBootstrapTimeout` is still called in
`fetchSessionState`, `exchangeBootstrapCredential`, AND `fetchPrimaryEnvironmentDescriptor`.

---

## Sessions where we re-debugged this

- 2026-05-03 — Initial patch (8s AbortController + splash-pending). Worked at the time.
- 2026-05-05 (morning) — Patches dropped after misreading upstream PR #2204 as a fix.
  PR #2204 was server-side perf only; the dev-mode race in main.ts:2204 is unchanged.
  Re-discovered: 20s Vite proxy stall, 23s cold boot exceeding 15s upstream budget,
  hung proxy connections during boot window. Re-applied patches with `cache: "no-store"`
  as the load-bearing change.

If you find yourself in this file because the bootstrap is failing again, FIRST check:

1. Is `fetchWithBootstrapTimeout` still wrapping the three call sites?
2. Is `cache: "no-store"` still in the merged init?
3. Did upstream change `BOOTSTRAP_RETRY_TIMEOUT_MS` or the bootstrap fetch path?
4. UAT via Playwright at `http://127.0.0.1:5733` before changing anything.
