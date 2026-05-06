# AppyDave Feature Log

Append-only record of what we build and ship. One entry per session or feature batch.
Purpose: track our direction, spot where Theo might ship something overlapping with us.

Status values: `planned` | `in-progress` | `shipped` | `superseded` | `abandoned`
Superseded = Theo shipped it and we dropped ours. Abandoned = we decided not to build it.

---

## 2026-05-03 — Session 1 (fork strategy + docs)

### What we built

| Feature                     | Status  | Files                                                                  | Notes                                                                         |
| --------------------------- | ------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Fork strategy docs          | shipped | `.appydave/docs/`, `.docs/`                                            | Upstream sync philosophy, extensibility patterns, seam file rules             |
| Patch annotation convention | shipped | `auth.ts`, `context.ts`, `__root.tsx`, `.appydave/patches/manifest.md` | `[APPYDAVE-PATCH]` annotation system for deliberate upstream divergences      |
| fetch-timeout patch         | shipped | `apps/web/src/environments/primary/auth.ts`                            | Wraps bootstrap fetches with 8s AbortController — fixes dev-mode startup race |
| splash-pending patch        | shipped | `apps/web/src/routes/__root.tsx`                                       | Shows SplashScreen during bootstrap retry — prevents black screen             |
| Dev launcher script         | shipped | `scripts/appydave/dev.ts`                                              | Alternative to upstream dev-runner — polls backend before opening browser     |
| Upstream refresh runbook    | shipped | `.appydave/docs/upstream-refresh-runbook.md`                           | Documented process from first live run                                        |
| Upstream log                | shipped | `.appydave/logs/upstream-log.md`                                       | This logging system                                                           |
| AppyDave feature log        | shipped | `.appydave/logs/appydave-log.md`                                       | This file                                                                     |
| Gap analysis                | shipped | `.appydave/logs/gap-analysis.md`                                       | Overlap tracking between AppyDave and upstream                                |
| CLAUDE.local.md             | shipped | `CLAUDE.local.md`                                                      | Gitignored personal Claude instructions using correct location                |

### Planned (not yet started)

| Feature                    | Status  | Notes                                                                              |
| -------------------------- | ------- | ---------------------------------------------------------------------------------- |
| Branding — "AppyDave" name | planned | Change `APP_BASE_NAME`, new `AppyWordmark` component                               |
| Branding — logo/favicon    | planned | Replace `icon.icns`, `icon.ico`, `icon.png`, favicons — needs AppyDave logo assets |
| Color system               | planned | `apps/web/src/appydave/brand.css` token overrides                                  |
| Apps launcher sidebar      | planned | External URLs in Chromium, starts with Claude.ai                                   |
| Upgrade button             | planned | Conversational upstream sync via Claude Code agent                                 |

---

## 2026-05-03 — Session 2 (upstream process + skill)

### What we built

| Feature                   | Status  | Files                                                        | Notes                                                                                                                    |
| ------------------------- | ------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| t3-upstream-refresh skill | shipped | `.claude/skills/t3-upstream-refresh/SKILL.md`                | Local skill (project-only). Full 8-step refresh cycle including snapshot, rebase, logging, gap check, patch verify, push |
| t3code upstream snapshot  | shipped | `~/dev/upstream/repos.jsonl` + `~/dev/upstream/repos/t3code` | Registered + cloned — clean reference copy of upstream at all times                                                      |

### Video angles noted (for future video planning)

Three demo-worthy moments in the appyctrl story:

1. **Upstream visibility** — `git fetch` surfaces Theo's in-progress branches before they ship. You can watch what's coming.
2. **Branding that survives rebases** — swap visual identity without touching upstream files. Zero conflict on daily sync.
3. **Dynamic app launcher** — personal command centre, your apps accessible from one place.

### Planned (not yet started)

| Feature          | Status      | Notes                                                                 |
| ---------------- | ----------- | --------------------------------------------------------------------- |
| Design brief     | in-progress | Being done in a separate session — drives branding + color work       |
| Branding + color | planned     | Blocked on design brief. Wordmark, brand.css token overrides, favicon |
| Apps launcher    | planned     | Left sidebar, app registry, Chromium window launcher                  |
| Upgrade button   | planned     | WS RPC + Claude Code agent flow for conversational upstream sync      |

---

## 2026-05-05 — Phase 1 (Branding + Color System)

### What we built

| Feature | Status | Files | Notes |
| --- | --- | --- | --- |
| AppyDave theme tokens | shipped | `apps/web/src/appydave/themes/themes.css` | `:root` warm cream light + `:root.dark` warm dark; `--ac-status-*` tokens for all pill colors |
| AppyCtrlWordmark | shipped | `apps/web/src/appydave/AppyCtrlWordmark.tsx` | Two-color wordmark using `--appy-wordmark-appy` / `--appy-wordmark-ctrl` CSS vars |
| Sidebar wordmark swap | shipped | `apps/web/src/components/Sidebar.tsx` | Seam: `<AppyCtrlWordmark />` replaces upstream T3 branding |
| Status pill color reskin | shipped | `apps/web/src/components/Sidebar.logic.ts` | `text-[var(--ac-status-working)]` etc. — terracotta/amber/green palette |
| PlanSidebar color reskin | shipped | `apps/web/src/components/PlanSidebar.tsx` | Step icons + plan badge use status tokens |
| Theme CSS seam | shipped | `apps/web/src/main.tsx` | `import "./appydave/themes/themes.css"` |

### Deferred (Phase 1.5)

| Feature | Status | Files | Notes |
| --- | --- | --- | --- |
| 4 hardcoded-palette patches | deferred | TBD | Composer pending-input selection, model star, diff error text, chat composer plan-toggle — still using raw Tailwind palette |

### Key learnings captured (Lisa)

- `@variant dark` silently does nothing in plain CSS files — use explicit `:root.dark {}` selector
- Discover upstream systems before building parallel ones (grep first)

---

## 2026-05-06 — Phase 2 (Application Launcher — data + sidebar UI + modal)

### What we built

| Feature | Status | Files | Notes |
| --- | --- | --- | --- |
| `@t3tools/appydave-registry` package | shipped | `packages/appydave/src/registry.ts`, `package.json` | `RegisteredApp` type, storage helpers, validators, 2 seeded apps |
| `useAppRegistry` hook | shipped | `apps/web/src/appydave/apps/useAppRegistry.ts` | add/update/delete/getById, localStorage + cross-tab sync |
| `AppyAppsSection` | shipped | `apps/web/src/appydave/apps/AppyAppsSection.tsx` | Sidebar Applications section, header + add button + row list + modal |
| `AppyAppRow` | shipped | `apps/web/src/appydave/apps/AppyAppRow.tsx` | SidebarMenuItem with showOnHover edit action |
| `AppyAppModal` | shipped | `apps/web/src/appydave/apps/AppyAppModal.tsx` | shadcn Dialog — glyph/name/url/openExternal, URL validation, inline delete confirm |
| AppySplashScreen | shipped | `apps/web/src/appydave/AppySplashScreen.tsx` | AppyDave logo + AppyCtrlWordmark on bg-background |
| Sidebar seam (apps section) | shipped | `apps/web/src/components/Sidebar.tsx` | `<AppyAppsSection />` mounted between Projects and SidebarContent close |
| Splash seam | shipped | `apps/web/src/routes/__root.tsx` | `pendingComponent: AppySplashScreen` |

### Key learnings captured (Lisa)

- Contract-lock fanout: lock TypeScript contracts verbatim in planner briefs before parallel fanout
- Phantom `.claude-flow/` leakage: subagents must run gates from repo root, not `cd apps/web`
- `exactOptionalPropertyTypes` trap: use `...(val ? {field: val} : {})` not `field: val || undefined`

---

## 2026-05-06 — Phase 3 (App Launcher Rendering — WebContentsView)

### What we built

| Feature | Status | Files | Notes |
| --- | --- | --- | --- |
| `AppyDesktopBridge` contract | shipped | `packages/appydave/src/bridge.ts` | `showWebview` / `hideWebview` / `resizeWebview` + `Window.appyBridge` global |
| Preload bridge registration | shipped | `apps/desktop/src/appydave/appyBridge.ts` | `contextBridge.exposeInMainWorld("appyBridge", {...})` |
| WebContentsView IPC handlers | shipped | `apps/desktop/src/appydave/appyIpcHandlers.ts` | Show/hide/resize + navigation policy (cross-origin → shell.openExternal) |
| URL + bounds validators | shipped | `apps/desktop/src/appydave/externalBrowser.ts` | `validateAppyUrl`, `parseViewBounds` |
| `/apps/$id` route | shipped | `apps/web/src/routes/apps.$id.tsx` | TanStack file-based route |
| `WebviewPane` component | shipped | `apps/web/src/appydave/apps/WebviewPane.tsx` | IPC lifecycle, ResizeObserver, error/retry UI, non-Electron fallback |
| `handleActivate` wiring | shipped | `apps/web/src/appydave/apps/AppyAppsSection.tsx` | openExternal → `desktopBridge.openExternal`; embedded → navigate |
| ADR-0003 | shipped | `.appydave/kdd/decisions/adr-0003-webcontentsview-for-embedded-apps.md` | WebContentsView locked (Electron 40.9.3) |

### Delivery Review outcome

**FAIL** — 6 reject-class findings. See `.appydave/docs/delivery-review-phase-3.md`.
Phase 3.1 patch session required before this feature is production-ready.

### Deferred (Phase 3.1)

| Patch | Severity | Description |
| --- | --- | --- |
| P1 shell.openExternal validation | Critical | Validate URL before passing to OS shell |
| P2 devicePixelRatio | Critical | Retina display scaling missing |
| P3 activeViews cleanup | Critical | webContents.destroyed listener |
| P4 store win reference | Critical | Wrong window for removeChildView |
| P5 dedup guard | Critical | One view per URL in SHOW handler |
| P6 openInExternalBrowser | Critical | AC-8 contract mismatch |
| P7 did-fail-load | High | Network errors not shown in error UI |
| P8 try/catch new URL() | High | Crash vector in will-navigate handler |
| P9 channels.ts | High | Channel constant single source of truth |
| P10 externalBrowser.test.ts | High | Security gate has no tests |
