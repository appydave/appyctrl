# AppyCtrl Patch Manifest

All deliberate divergences from upstream t3code. Every entry here corresponds to an
`[APPYDAVE-PATCH]` annotation in the source file.

Types:

- **bug-fix** — fixes a genuine upstream bug; remove when upstream ships its own fix
- **feature** — AppyDave-owned functionality; keep indefinitely
- **seam** — minimal wiring line in a seam file; re-apply after any rebase conflict

---

## Active patches

### theme-css-entry `seam`

|                     |                                                 |
| ------------------- | ----------------------------------------------- |
| **Files**           | `apps/web/src/main.tsx`                         |
| **Added**           | 2026-05-05 (phase-1)                            |
| **Upstream status** | N/A — AppyDave-owned wiring line, not a bug fix |

One seam line on `main.tsx`: `import "./appydave/themes/themes.css"` overrides
shadcn light + dark token palette with AppyDave warm cream / warm dark. Theme
state itself is owned by upstream's `apps/web/src/hooks/useTheme.ts` (storage
key `t3code:theme`, toggles `.dark` class) — we just reskin via tokens.

**Rebase risk:** low — single import line near the other CSS imports. Conflicts
only if upstream reshuffles imports, in which case re-thread our line.

### status-pill-colors `seam`

|                     |                                                                      |
| ------------------- | -------------------------------------------------------------------- |
| **Files**           | `apps/web/src/components/Sidebar.logic.ts` (resolveThreadStatusPill) |
| **Added**           | 2026-05-05 (phase-1 polish)                                          |
| **Upstream status** | N/A — AppyDave-owned brand reskin                                    |

`resolveThreadStatusPill()` returns Tailwind class strings for Working / Connecting /
Pending Approval / Awaiting Input / Plan Ready / Completed pills. Upstream uses raw
Tailwind palette literals (`text-sky-600 dark:text-sky-300/80`, etc.) which bypass
shadcn tokens and produce cold T3 blue/violet/indigo even when our themes.css has
overridden the rest of the palette. We swap each to a CSS variable arbitrary value
(`text-[var(--ac-status-working)]`, `bg-[var(--ac-status-pending)]`, etc.) where the
variables are defined in `apps/web/src/appydave/themes/themes.css` for both light
and dark.

Light palette: terracotta (working), brand-amber (pending/plan-ready), deep amber
(awaiting), warm green (completed).
Dark palette: brand-yellow (working), brand-amber (pending/plan-ready), brand-gold
(awaiting), warm green (completed).

**Rebase risk:** medium — the function body is one of the more active upstream
files. Resolution shape on conflict: keep upstream's logic + state shape, re-apply
the colorClass/dotClass swaps. The annotation is at the top of the function body
to make it visible during conflict resolution.

### plan-sidebar-colors `seam`

|                     |                                           |
| ------------------- | ----------------------------------------- |
| **Files**           | `apps/web/src/components/PlanSidebar.tsx` |
| **Added**           | 2026-05-05 (phase-1 polish)               |
| **Upstream status** | N/A — AppyDave-owned brand reskin         |

Three swaps in `PlanSidebar.tsx`: `stepStatusIcon()` (lines 35, 42 — completed +
inProgress badges), the "PLAN" header `<Badge>` (line 143), and the per-step row
background tints (lines 215–216). All move from raw Tailwind palette
(`bg-emerald-500/15`, `bg-blue-500/15`, `text-blue-400`) to `--ac-status-*` token
arbitrary values that resolve to AppyDave colors per theme.

**Rebase risk:** low — PlanSidebar is comparatively stable, and the three change
sites are in self-contained blocks. Resolution shape: keep upstream's structural
edits, re-apply the three colour-class swaps.

### splash-appy-logo `seam`

|                     |                                                            |
| ------------------- | ---------------------------------------------------------- |
| **Files**           | `apps/web/src/routes/__root.tsx`                           |
| **Added**           | 2026-05-06 (phase-2 polish)                                |
| **Upstream status** | N/A — AppyDave-owned brand                                 |

Co-located with the existing `splash-pending` patch on `__root.tsx`. The
`pendingComponent` for the root route now points to `AppySplashScreen` (lives at
`apps/web/src/appydave/AppySplashScreen.tsx`) instead of the upstream
`SplashScreen`. The new component renders the AppyDave logo
(`apps/web/public/appydave-splash.png`, copied from `appydave.com/apps/web/public/`)
plus the AppyCtrlWordmark on the theme-aware `bg-background` canvas. Upstream's
`SplashScreen.tsx` is left untouched so the rebase target file is unchanged.

**Rebase risk:** low — touches the same line as `splash-pending` (one import +
one component reference). Conflicts only if upstream changes the root route
definition. Resolution shape: keep upstream changes, re-apply both patches'
references to `AppySplashScreen`.

### sidebar-apps-section `seam`

|                     |                                       |
| ------------------- | ------------------------------------- |
| **Files**           | `apps/web/src/components/Sidebar.tsx` |
| **Added**           | 2026-05-05 (phase-2)                  |
| **Upstream status** | N/A — AppyDave-owned feature          |

One import + one render line, mounted between the Projects `</SidebarGroup>` and the
closing `</SidebarContent>` (line ~2710). The component lives at
`apps/web/src/appydave/apps/AppyAppsSection.tsx` and owns the entire Applications
section: header label, "+" add button, list of `<AppyAppRow>` items pulled from
`useAppRegistry()`, and the `<AppyAppModal>` for add/edit/delete. Pre-seeded with
two apps (Claude.ai + AngelEye) on first load.

**Rebase risk:** low — the seam edit is a sibling component append at the bottom
of the Projects section's container. Only conflicts if upstream restructures the
SidebarContent flex chain. Resolution shape: keep upstream's restructure, re-add
the `<AppyAppsSection />` line in equivalent position.

### sidebar-wordmark `seam`

|                     |                                                                 |
| ------------------- | --------------------------------------------------------------- |
| **Files**           | `apps/web/src/components/Sidebar.tsx`                           |
| **Added**           | 2026-05-05 (phase-1, supersedes earlier AppyDave wordmark seam) |
| **Upstream status** | N/A — AppyDave-owned brand                                      |

`<AppyWordmark />` (AppyDave brand, removed) → `<AppyCtrlWordmark />` (AppyCtrl brand).
Single import + single element swap. Earlier patch annotation updated to phase-1
form.

**Rebase risk:** low — only conflicts if upstream changes the surrounding `<Link>`
structure. Resolution shape: keep upstream's structure, swap the wordmark element.

### bootstrap-cold-boot `bug-fix`

|                     |                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| **Files**           | `apps/web/src/environments/primary/auth.ts`, `apps/web/src/environments/primary/context.ts`    |
| **Added**           | 2026-05-05                                                                                     |
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

### theme-init · settings-appearance-nav `seam` — retired 2026-05-05 (same-day)

Briefly added during phase-1 implementation when I didn't realise upstream already had
a complete theme system at `apps/web/src/hooks/useTheme.ts` with a Theme dropdown in
Settings → General. My duplicate switcher (Settings → Appearance + own localStorage
key `appydave.theme` + `initializeTheme()` call from main.tsx) competed with upstream's,
producing inconsistent state. Removed entirely; upstream Theme dropdown is the single
source of truth. AppyDave reskin is purely token-level via `themes.css`.

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
