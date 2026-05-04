# AppyCtrl Design Plan

Three visual/UX changes to apply to the appyctrl fork. Listed in implementation order
(each builds on the previous).

---

## 1. Branding — "AppyDave" name

**What the user sees:** "T3 Code DEV" in the title bar → "AppyDave DEV"

**Where the name comes from:**

- `apps/desktop/src/appBranding.ts` — `APP_BASE_NAME = "T3 Code"` → change to `"AppyDave"`
- This flows via `DesktopAppBranding` contract → `branding.ts` in web → `APP_DISPLAY_NAME`
  used as `document.title` in `main.tsx`
- The sidebar (`Sidebar.tsx` ~line 2404) hardcodes `<T3Wordmark />` SVG + `"Code"` text separately
  → need to replace `T3Wordmark` with an AppyDave wordmark component and "Code" with nothing
  (or the stage label only)

**Approach (additive):**

- `apps/desktop/src/appBranding.ts` — one-line seam edit: change the `APP_BASE_NAME` constant
- `apps/web/src/appydave/AppyWordmark.tsx` — new component: "Appy" in gold `#ccba9d`, "Dave" in
  yellow `#ffde59`, Bebas Neue / Oswald font, replaces `T3Wordmark` in the sidebar header
- The sidebar seam: `Sidebar.tsx` wordmark section needs to reference `AppyWordmark` instead
  of `T3Wordmark` + "Code" — minimal edit, or achieved via CSS override if the SVG is swapped
  at the Electron bridge level

**Font import needed:** Oswald + Bebas Neue via Google Fonts (in `appydave/brand.css`)

---

## 2. Color system — AppyDave warm dark theme

**What the user sees:** Current neutral dark (near-black/grey) → warm dark with gold/yellow accents

**Brand source:** AppyDave design system (warm cream is the _light_ brand default, but this app
is a developer tool that runs dark). Adaptation: use the warm dark variants as chrome, gold/yellow
as the primary/accent.

**Token mapping (current → AppyDave):**

| Role                 | Current                       | AppyDave                                           |
| -------------------- | ----------------------------- | -------------------------------------------------- |
| App chrome / body bg | `neutral-950 mix` (cold dark) | `#1a1515` (brand-chrome, warm dark)                |
| Card / surface       | cold neutral                  | `#25201e` (brand-dark-surface)                     |
| Primary CTA          | `oklch blue`                  | `#ffde59` (brand-yellow) with `#342d2d` foreground |
| Warm accent          | —                             | `#ccba9d` (brand-gold)                             |
| Muted text           | cold neutral-500              | `#7a6e5e` (brand-muted)                            |
| Border / divider     | cold neutral                  | `#3a2e2e` (warm dark border, derived)              |
| Foreground / text    | neutral-100                   | `#faf5ec` (brand-near-white, warm off-white)       |

**Approach:**

- `apps/web/src/appydave/brand.css` — new file, overrides CSS custom properties in `.dark`
  (the app defaults to dark mode)
- Import in `apps/web/src/main.tsx` after `./index.css` — one seam line
- Do NOT touch `index.css` — override only via the new file

---

## 3. Apps launcher — sidebar section

**What the user sees:** A new collapsible section in the left sidebar (below PROJECTS, above
Settings) listing external apps. Clicking an entry opens the URL in a Chromium window
(new Electron `BrowserWindow` or system default browser).

**Initial apps list:** Claude.ai (`https://claude.ai`)

**Layout position:** Between the thread/project list and the Settings footer button.
The existing sidebar footer (`SidebarChromeFooter`) has Settings at the bottom.
The new section sits just above it — in the main `SidebarContent` scroll area, pinned near bottom.

**Approach (fully additive):**

UI side (`apps/web/src/appydave/sidebar/`):

- `AppLauncherSection.tsx` — renders the APPS section header + list of app entries
- `useAppRegistry.ts` — reads the app list (initially hardcoded, later from server settings)
- Composed into `AppyShell` or injected as a sibling in the sidebar content

Desktop side (`apps/desktop/src/appydave/`):

- `appLauncher.ts` — IPC handler that opens a `BrowserWindow` to a given URL
- Wired into the bridge in `apps/desktop/src/main.ts` (seam edit — adds to the existing
  preload channel, or as a new `appyBridge` method)

Data:

- Start with a hardcoded registry: `[{ label: "Claude.ai", url: "https://claude.ai" }]`
- Future: stored in server settings under `appydave.appRegistry`

**No new RPC method needed for phase 1** — the URL open is a local desktop bridge call,
not a server round-trip.

---

## 4. Upgrade button — conversational upstream sync

**What the user sees:** A button (likely in Settings → About, or a small icon in the sidebar
footer near Settings) that triggers a guided conversation to pull the latest upstream t3code
changes into appyctrl.

**Why conversational, not silent:** A simple `git rebase` can hit conflicts — especially on
the seam files you've touched (`Sidebar.tsx`, `main.tsx`, etc.) or any upstream file you've
had to fix (e.g. auth, splash screen, routing). The button doesn't just run a script; it opens
a Claude Code session that can reason about the conflict, see your intent (AppyDave additions)
vs upstream's intent (new feature), and resolve it with context. A fully automated rebase
would silently corrupt your customisations on a bad merge.

**The flow:**

1. User clicks **Upgrade** button in the UI
2. Server runs `git fetch upstream` — checks if there are any new commits
3. If no new commits → shows "Already up to date with t3code vX" and stops
4. If new commits → shows a summary: N commits, files changed, and highlights any that
   overlap with known AppyDave seam files or previously touched upstream files
5. Server spawns a Claude Code session (using the app's existing Claude integration) with
   a prompt that:
   - States the goal: rebase `main` onto `upstream/main`
   - Lists the AppyDave seam files and their expected edit shapes (from `.claude/CLAUDE.md`)
   - Lists any other upstream files touched in this fork (tracked in a manifest, see below)
   - Instructs Claude to attempt `git rebase upstream/main`, resolve conflicts preserving
     AppyDave intent, and report what it changed
6. Claude Code session runs interactively — user can watch or intervene
7. On success: server restarts automatically (or prompts user to restart)
8. On failure: session stays open for manual resolution

**The touched-files manifest:**

The seam files list in `.claude/CLAUDE.md` covers planned touches. But in practice, upstream
files outside the seam list sometimes get edited too (e.g. auth timeout fix, splash screen,
`__root.tsx`). These are just as likely to conflict.

Maintain a file at `.appydave/upstream-touches.md` that tracks every upstream file modified
in this fork, with a one-line note on why. The Upgrade prompt feeds this list to Claude so
it knows where to look for conflicts.

Example entry:

```
apps/web/src/auth.ts — increased auth timeout for slower machines
apps/web/src/routes/__root.tsx — splash screen timing fix
```

**Restart after upgrade:**

The Electron app needs a restart to pick up server/backend changes. The Upgrade flow ends with
an explicit restart prompt (or auto-restart if no user input is needed). The existing
`DesktopUpdateState` / update machinery in `ipc.ts` is a reference for how Theo handles
install-and-restart — same pattern applies here.

**Implementation approach:**

- UI: small "↑ Upgrade" button in `SidebarChromeFooter` alongside Settings, or in Settings → About
- Backend: new `appydave/upgrade/` service in `apps/server/src/appydave/`
  - `git fetch upstream` via child process
  - Commit diff summary
  - Spawn Claude Code session with the upgrade prompt
- Prompt template: `.appydave/prompts/upgrade.md` — the instruction Claude Code receives
- Touched-files manifest: `.appydave/upstream-touches.md` — updated manually when you edit
  an upstream file outside the seam list

**No new RPC method for phase 1** — can be triggered via the existing `shell.openInEditor`
pattern or a new `appydave.triggerUpgrade` bridge call. Proper RPC comes in phase 2.

---

## Implementation order

1. `appBranding.ts` — name change (5 min, one line, low risk)
2. `brand.css` + `main.tsx` import — color tokens (30 min, additive)
3. `AppyWordmark.tsx` — wordmark component (30 min, new file)
4. `AppLauncherSection.tsx` + `appLauncher.ts` — apps sidebar (1–2 hrs, mostly new files)
5. Upgrade button — fetch + rebase + Claude Code session (half day, new service)

Each step is independently shippable and independently rebases cleanly.

---

## Seam edits required

| File                                  | Change                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/desktop/src/appBranding.ts`     | `APP_BASE_NAME` string                                                       |
| `apps/web/src/main.tsx`               | `import "./appydave/brand.css"`                                              |
| `apps/web/src/components/Sidebar.tsx` | Replace `<T3Wordmark />` + "Code" with `<AppyWordmark />`                    |
| `apps/desktop/src/main.ts`            | Wire `appyBridge.openExternalApp` + `appyBridge.triggerUpgrade` IPC handlers |

## Upstream touches manifest

Track every upstream file edited outside the seam list in `.appydave/upstream-touches.md`.
This file feeds the Upgrade prompt so Claude knows where conflicts are likely.
