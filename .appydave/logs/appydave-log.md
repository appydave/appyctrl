# AppyDave Feature Log

Append-only record of what we build and ship. One entry per session or feature batch.
Purpose: track our direction, spot where Theo might ship something overlapping with us.

Status values: `planned` | `in-progress` | `shipped` | `superseded` | `abandoned`
Superseded = Theo shipped it and we dropped ours. Abandoned = we decided not to build it.

---

## 2026-05-03 — Session 1 (fork strategy + docs)

### What we built

| Feature | Status | Files | Notes |
|---------|--------|-------|-------|
| Fork strategy docs | shipped | `.appydave/docs/`, `.docs/` | Upstream sync philosophy, extensibility patterns, seam file rules |
| Patch annotation convention | shipped | `auth.ts`, `context.ts`, `__root.tsx`, `.appydave/patches/manifest.md` | `[APPYDAVE-PATCH]` annotation system for deliberate upstream divergences |
| fetch-timeout patch | shipped | `apps/web/src/environments/primary/auth.ts` | Wraps bootstrap fetches with 8s AbortController — fixes dev-mode startup race |
| splash-pending patch | shipped | `apps/web/src/routes/__root.tsx` | Shows SplashScreen during bootstrap retry — prevents black screen |
| Dev launcher script | shipped | `scripts/appydave/dev.ts` | Alternative to upstream dev-runner — polls backend before opening browser |
| Upstream refresh runbook | shipped | `.appydave/docs/upstream-refresh-runbook.md` | Documented process from first live run |
| Upstream log | shipped | `.appydave/logs/upstream-log.md` | This logging system |
| AppyDave feature log | shipped | `.appydave/logs/appydave-log.md` | This file |
| Gap analysis | shipped | `.appydave/logs/gap-analysis.md` | Overlap tracking between AppyDave and upstream |
| CLAUDE.local.md | shipped | `CLAUDE.local.md` | Gitignored personal Claude instructions using correct location |

### Planned (not yet started)

| Feature | Status | Notes |
|---------|--------|-------|
| Branding — "AppyDave" name | planned | Change `APP_BASE_NAME`, new `AppyWordmark` component |
| Branding — logo/favicon | planned | Replace `icon.icns`, `icon.ico`, `icon.png`, favicons — needs AppyDave logo assets |
| Color system | planned | `apps/web/src/appydave/brand.css` token overrides |
| Apps launcher sidebar | planned | External URLs in Chromium, starts with Claude.ai |
| Upgrade button | planned | Conversational upstream sync via Claude Code agent |
