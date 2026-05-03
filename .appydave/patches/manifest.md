# AppyCtrl Patch Manifest

All deliberate divergences from upstream t3code. Every entry here corresponds to an
`[APPYDAVE-PATCH]` annotation in the source file.

Types:
- **bug-fix** — fixes a genuine upstream bug; remove when upstream ships its own fix
- **feature** — AppyDave-owned functionality; keep indefinitely
- **seam** — minimal wiring line in a seam file; re-apply after any rebase conflict

---

## Active patches

### fetch-timeout `bug-fix`

| | |
|---|---|
| **Files** | `apps/web/src/environments/primary/auth.ts`, `apps/web/src/environments/primary/context.ts` |
| **Added** | 2026-05-03 |
| **Upstream status** | No fix expected — deliberate dev-mode design |

**Root cause:** `apps/desktop/src/main.ts:2084` deliberately creates the Electron window
before the backend is ready in dev mode. `waitForBackendWindowReady` result is `void`'d
(fire-and-forget logging only). The renderer loads immediately and calls
`fetch(/api/auth/session)` and `fetch(/.well-known/t3/environment)` with no timeout.
If the backend has accepted TCP but hasn't initialised auth routes yet, these calls hang
indefinitely — `retryTransientBootstrap`'s 15s timeout never fires because it only
triggers after `await operation()` resolves or rejects.

**Fix:** `fetchWithBootstrapTimeout` wraps `fetch()` with an 8s `AbortController`.
`AbortError` is treated as transient by `isTransientBootstrapError`, so
`retryTransientBootstrap` retries until the backend is genuinely ready.

**Remove when:** upstream adds per-request timeouts to `fetchSessionState` and
`exchangeBootstrapCredential`, or restructures dev-mode startup so the window only
opens after auth routes are ready.

**Rebase risk:** low — isolated to two files, no upstream churn expected here.

---

### splash-pending `bug-fix`

| | |
|---|---|
| **Files** | `apps/web/src/routes/__root.tsx` |
| **Added** | 2026-05-03 |
| **Upstream status** | Missing feature in upstream, not filed |

**Root cause:** TanStack Router renders nothing during `beforeLoad` unless a
`pendingComponent` is set. With `fetch-timeout` patch retrying for up to 15s, the
user would see a pure black screen. `pendingComponent: SplashScreen` shows the T3
loading logo during the wait.

**Remove when:** upstream adds `pendingComponent` to the root route, or restructures
startup so `beforeLoad` resolves quickly enough that a pending state is unnecessary.

**Rebase risk:** low — one line addition, conflict only if upstream edits the same
route definition block.

---

## Removed patches

_(none yet)_
