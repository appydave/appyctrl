# AppyCtrl Patch Manifest

All deliberate divergences from upstream t3code. Every entry here corresponds to an
`[APPYDAVE-PATCH]` annotation in the source file.

Types:

- **bug-fix** — fixes a genuine upstream bug; remove when upstream ships its own fix
- **feature** — AppyDave-owned functionality; keep indefinitely
- **seam** — minimal wiring line in a seam file; re-apply after any rebase conflict

---

## Active patches

### bootstrap-cold-boot `bug-fix`

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Files**           | `apps/web/src/environments/primary/auth.ts`, `apps/web/src/environments/primary/context.ts` |
| **Added**           | 2026-05-05                                                                                  |
| **Upstream status** | No fix expected — would require either bootstrap-cache hint or sequencing window-after-backend |

**Read first:** `.appydave/docs/boot-sequence.md` — full debugging postmortem with UAT recipe.

**Root cause (three compounding bugs):**

1. **Vite 8 dev-proxy stall (load-bearing fix):** The first browser fetch through Vite's
   `/api` proxy takes ~20s unless an explicit `cache` hint is on the `RequestInit`.
   Verified via Playwright UAT at the real Vite endpoint: `fetch(url, { cache: "no-store" })`
   = ~4ms; `fetch(url, {})` or `fetch(url)` = ~20s. Backend itself responds in <2ms.
   This is a Vite/Chromium interaction with the dev proxy, NOT a backend issue.
2. **Hung proxy connections during boot window:** When Vite proxy opens an upstream
   connection while the backend is mid-boot, the connection can be held open indefinitely.
   `retryTransientBootstrap` is `await operation()`-driven, so a hung fetch blocks retry.
3. **Retry budget too short:** Cold-boot wall time measured at 20-23s on cleared turbo
   cache. Upstream's `BOOTSTRAP_RETRY_TIMEOUT_MS = 15_000` exhausts before backend ready.

**Fix (in `fetchWithBootstrapTimeout` and surrounding constant):**

- Always merge `cache: "no-store"` into init → eliminates the 20s stall.
- Race fetch against a 10s `Promise.race` timeout → guards against hung proxy connections.
- `BOOTSTRAP_RETRY_TIMEOUT_MS` 15s → 60s → headroom for cold turbo cache boots.

`fetchWithBootstrapTimeout` wraps:

- `fetchSessionState` (auth.ts) — `/api/auth/session`
- `exchangeBootstrapCredential` (auth.ts) — `/api/auth/bootstrap`
- `fetchPrimaryEnvironmentDescriptor` (context.ts) — `/.well-known/t3/environment`

**Upstream test breakage (known tradeoff):**

`apps/web/src/authBootstrap.test.ts` and `apps/web/src/environments/primary/bootstrap.test.ts`
assert exact init shapes (`toHaveBeenCalledWith(url, { credentials: "include" })`). With
our patch, init records as `{ credentials: "include", cache: "no-store" }` so ~10 of
those tests fail. The tests verify implementation (call shape), not behaviour. The cache
hint is required for the app to function in a real browser. Failures are deliberate.

**Remove when:**

- Upstream restructures dev-mode startup so the Electron window only opens after the
  backend is ready (one-line fix in `apps/desktop/src/main.ts:2204`), OR
- Upstream adds `cache: "no-store"` (or any cache hint) to their bootstrap fetches, OR
- Vite/Chromium fix the proxy stall.

**Rebase risk:** medium — touches three call sites in two files plus a constant. The
`fetchWithBootstrapTimeout` helper is colocated with related upstream constants; if
upstream restructures `retryTransientBootstrap` we'll need to re-thread the wrapper.

---

### splash-pending `bug-fix`

|                     |                                        |
| ------------------- | -------------------------------------- |
| **Files**           | `apps/web/src/routes/__root.tsx`       |
| **Added**           | 2026-05-03                             |
| **Re-applied**      | 2026-05-05                             |
| **Upstream status** | Missing feature in upstream, not filed |

**Root cause:** TanStack Router renders nothing during `beforeLoad` unless a
`pendingComponent` is set. Without this, the user sees a pure black screen during the
20+s bootstrap retry window. `pendingComponent: SplashScreen` shows the T3 loading
logo while bootstrap retries.

**Remove when:** upstream adds `pendingComponent` to the root route, or restructures
startup so `beforeLoad` resolves quickly enough that a pending state is unnecessary.

**Rebase risk:** low — one-line addition + one import; conflict only if upstream edits
the same root route definition block.

---

## Removed patches

### fetch-timeout `bug-fix` — retired 2026-05-05

**Lifetime:** 2026-05-03 → 2026-05-05.

Original 8s `AbortController`-based wrapper. Two problems:

1. Injected `signal` into init object — broke upstream tests assuming exact init shape.
2. Solved the wrong root cause: assumed fetches "hang indefinitely" because backend
   accepts TCP before auth routes are ready. UAT later proved Vite proxy returns 502 fast
   when backend is fully down. The real hang was Vite-stall + cold-boot race compounding,
   not pure auth-route lag.

**Replaced by:** `bootstrap-cold-boot` (above) — same call sites, but `Promise.race`
instead of `AbortController` (preserves init shape), `cache: "no-store"` merged in, and
60s overall budget.

### splash-pending `bug-fix` — retired 2026-05-05 morning, RE-APPLIED 2026-05-05 afternoon

Briefly removed when we mistakenly believed upstream PR #2204 had fixed the underlying
cold-boot race. PR #2204 was server-side performance only; the dev-mode window-before-backend
race in `main.ts:2204` is unchanged. Re-applied with same one-line addition.
