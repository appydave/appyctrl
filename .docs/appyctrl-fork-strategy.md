# AppyCtrl Fork Strategy

`appyctrl` is a fork of [pingdotgg/t3code](https://github.com/pingdotgg/t3code). This doc captures
the philosophy for keeping that fork sustainable while adding AppyDave-specific features.

---

## Upstream relationship

```
pingdotgg/t3code  (upstream remote)
       │
       │  daily rebase
       ▼
appydave/appyctrl  (origin/main — single branch, all custom work)
```

Single-branch model. All AppyDave customisations live on `main`. No long-lived feature branches
for appyctrl-specific work — they create rebase friction.

---

## Daily sync model: rebase, not merge

**Preferred**: each morning, rebase `main` onto the latest `upstream/main`.

```bash
git fetch upstream
git rebase upstream/main
git push --force-with-lease origin main
```

**Why rebase over merge:**

- Your commits always sit visibly on top. `git log` reads cleanly: upstream history, then
  AppyDave delta.
- `git diff upstream/main HEAD` always shows exactly what you've changed — useful when
  a new upstream PR touches the same area as your customisations.
- Merge accumulates merge commits that blur the boundary over time.

**The cost:** force-push to origin is required after every rebase. `--force-with-lease` is
safe here (solo developer, no one else pulling from `appydave/appyctrl`).

---

## The "Upgrade" button (planned feature)

A button inside the appyctrl UI that triggers the daily sync in a semi-automated way,
using T3 Code's built-in Claude Code integration to handle conflicts.

### Intended flow

1. User clicks **Upgrade** in the UI.
2. Server runs `git fetch upstream`.
3. Attempts `git rebase upstream/main`.
4. **No conflicts** → push succeeds, UI shows "Up to date with t3code vX".
5. **Conflicts detected** → server launches a Claude Code session with a prompt that:
   - Explains which files conflict
   - Shows the diff of AppyDave's changes (`git diff upstream/main HEAD -- <file>`)
   - Instructs Claude to preserve AppyDave customisations while integrating upstream intent
   - On resolution, completes the rebase and reports back
6. UI shows a summary of what changed upstream (commit list, files touched).

### Conflict surface areas to guard

These are the files most likely to conflict as upstream evolves:

| Area                    | Files                                | AppyDave intent              |
| ----------------------- | ------------------------------------ | ---------------------------- |
| Branding                | `apps/web/src/` styles, layout shell | AppyDave design system       |
| Left nav / app switcher | new component (TBD)                  | Chrome window / app registry |
| Settings panel          | upstream adds features here          | Upgrade button lives here    |
| `packages/contracts/`   | upstream adds RPC methods            | extend, don't replace        |

---

## Three planned AppyDave additions

### 1. Branding

Apply the AppyDave design system to the UI shell: colours, fonts, logo, favicon.
Source of truth: AppyDave design system (accessible via the `brand-dave:brand` skill and
`/appydave-brand/design-system/`).

Scope:

- CSS variables / Tailwind theme tokens
- App title / window title
- Favicon and any splash assets
- Minimal — avoid overriding component internals; prefer CSS variables so upstream component
  changes don't conflict

### 2. Upgrade button

See section above. Likely placement: Settings → About, or a small icon in the header bar.

Backend: a new WS RPC method (e.g. `server.upgradeFromUpstream`) that triggers the fetch/rebase
flow and streams progress events back to the client.

### 3. Left-side app switcher / menu

A persistent left sidebar (or collapsible panel) that lists registered applications and
opens each in a separate Chrome window (or browser tab, or Electron window).

Concepts:

- **App registry** — a persistent list of AppyDave apps (name, URL/path, icon). Stored in
  server settings or a local JSON file.
- **Window launcher** — clicking an app entry opens it (new Electron window or external
  browser tab depending on context).
- **Active indicator** — highlights which app is currently focused.

This is intentionally appyctrl-specific infrastructure — upstream t3code has no equivalent,
so conflicts here are unlikely.

---

## Keeping customisations rebase-friendly

The goal is to minimise rebase friction so the daily sync stays low-effort.

- **Additive over replacement**: add new files/components rather than editing upstream ones.
  A new `AppySidebar.tsx` conflicts less than a modified `Sidebar.tsx`.
- **CSS variables at the root**: branding via token overrides, not class-level changes spread
  across many files.
- **New RPC methods, not modified ones**: extend `WS_METHODS` / `WsRpcGroup` rather than
  changing existing method shapes.
- **Settings extension pattern**: add new settings keys; don't restructure existing ones.
- **Commit discipline**: each AppyDave change in its own commit, with a clear prefix like
  `feat(appydave):` or `chore(appydave):`. Makes `git log upstream/main..HEAD` readable and
  makes conflict attribution obvious during rebase.

---

## Morning upgrade ritual (manual until button exists)

```bash
cd ~/dev/ad/apps/appyctrl
git fetch upstream
git rebase upstream/main
# resolve any conflicts, then:
git push --force-with-lease origin main
```

Check `git log upstream/main..HEAD --oneline` after to confirm your delta is intact.
