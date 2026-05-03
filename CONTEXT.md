---
generated: 2026-05-03
generator: system-context
status: snapshot
sources:
  - package.json
  - README.md
  - AGENTS.md
  - .claude/CLAUDE.md
  - .appydave/docs/extensibility-strategy.md
  - .appydave/docs/design-plan.md
  - .docs/appyctrl-fork-strategy.md
  - .docs/architecture.md
  - .docs/workspace-layout.md
  - apps/web/package.json
  - apps/web/src/main.tsx
  - apps/web/src/router.ts
  - apps/web/src/branding.ts
  - apps/web/src/wsTransport.ts
  - apps/server/package.json
  - apps/server/src/ws.ts
  - apps/server/src/bootstrap.ts
  - apps/server/src/serverLayers.ts
  - apps/desktop/src/main.ts
  - apps/desktop/src/appBranding.ts
  - packages/contracts/src/ws.ts
  - packages/contracts/src/ipc.ts
  - packages/shared/src/git.ts
  - context.globs.json
regenerate: "Run /appydave:system-context in the repo root"
---

# AppyCtrl — System Context

## Purpose

AppyCtrl is David Cruwys's daily-rebasing fork of [t3code](https://github.com/pingdotgg/t3code) — a web-based GUI for coding agents (Codex/Claude) — extended with AppyDave branding, an apps-launcher sidebar, and a planned in-app upstream-sync "Upgrade" flow, while remaining safe to rebase against an active open-source upstream.

## Core Abstractions

- **Seam File** — one of the five upstream files AppyDave is allowed to touch (`apps/web/src/main.tsx`, `apps/web/src/router.ts`, `apps/server/src/ws.ts`, `apps/server/src/bootstrap.ts`, `apps/desktop/src/main.ts`). Each receives exactly one import line and one composition line. Everything else is off-limits. The seam is the only stable interface between upstream code and AppyDave code; violating it makes rebasing fragile.

- **AppyDave Extension Directory** — every app package has an `appydave/` subdir (`apps/web/src/appydave/`, `apps/server/src/appydave/`, `apps/desktop/src/appydave/`) where all custom code lives. These dirs are invisible to upstream and never conflict on rebase. The planned `packages/appydave/` will hold shared contracts once multiple packages need custom RPC types.

- **WsRpcGroup / AppyWsRpcGroup** — the abstraction unit for WebSocket method routing in the server. Upstream defines `WsRpcGroup` mapping method names to Effect handlers; AppyDave will define `AppyWsRpcGroup` with its own methods, then compose the two via `RpcGroup.union(...)` at the ws.ts seam. New methods are additive; no upstream signature changes.

- **Effect Layer** — the server is structured as a graph of Effect layers (dependency injection containers from the Effect-TS library). `AppyLayer` will compose `UpgradeService.Default` and `AppRegistryService.Default` and merge into the upstream layer graph at the `bootstrap.ts` seam. Adding a service means adding to `AppyLayer`, not touching upstream layers.

- **Codex App Server** — the actual agentic engine: a separate child process spawned per provider session, communicating with the Node.js server over JSON-RPC via stdio. The server is a thin bridge: it starts/resumes Codex sessions, streams structured events to the browser via WebSocket push, and never embeds model logic itself. AppyDave does not modify this integration layer.

## Key Workflows

### Daily Upstream Sync (Rebase)
1. `git fetch upstream` — pulls latest commits from `pingdotgg/t3code`
2. Check seam files: `git diff upstream/main HEAD -- apps/web/src/main.tsx apps/web/src/router.ts apps/server/src/ws.ts apps/desktop/src/main.ts` — confirm AppyDave's seam edits are the only diffs
3. `git rebase upstream/main` — replays AppyDave commits on top of fresh upstream history
4. Resolve any rebase conflicts (should be zero if seam discipline is maintained)
5. `git push --force-with-lease origin main` — force-push the rebased branch; `--force-with-lease` guards against overwriting a concurrent push

### Adding an AppyDave Feature
1. Identify which seam the feature composes through (UI component → `router.ts`; new RPC method → `ws.ts`; new server service → `bootstrap.ts`; desktop IPC → `main.ts`)
2. Create a new file inside the appropriate `appydave/` subdir (e.g., `apps/web/src/appydave/sidebar/AppLauncherSection.tsx`)
3. Add exactly one import and one composition line to the seam file — nothing more
4. Test locally (`bun run dev`) and verify the seam file diff is still only that one import + one composition
5. Commit with prefix `feat(appydave):` so AppyDave commits are identifiable in `git log upstream/main..HEAD`

### Running the App in Development
1. `bun install` — installs all workspace dependencies (Bun workspaces, Turbo)
2. `bun run dev` — starts web (Vite on port 5173) and server (WebSocket on port 3773) concurrently via `scripts/dev-runner.ts`
3. Browser opens to `localhost:5173`; server connects to Codex app-server child process on first session
4. For desktop: `bun run dev:desktop` instead — launches Electron shell loading the same web app
5. Before committing: `bun fmt && bun lint && bun run typecheck && bun run test` must all pass

### Applying AppyDave Branding (Phase 1–2)
1. Update `apps/desktop/src/appBranding.ts` — change `APP_BASE_NAME` from `"T3 Code"` to `"AppyDave"` (one constant, the only permitted direct upstream-file edit here)
2. Create `apps/web/src/appydave/brand.css` — CSS custom property overrides using warm dark tokens (`#1a1515` chrome, `#ccba9d` gold, `#ffde59` yellow)
3. Add one import line to `apps/web/src/main.tsx`: `import "./appydave/brand.css";` — this is the seam edit
4. Verify dark theme is unchanged for light-mode CSS; no edits to upstream `index.css`

## Design Decisions

- **Rebase strategy, not merge**: Keeping AppyDave commits always on top of upstream via daily rebase produces a linear history where `git log upstream/main..HEAD` shows exactly AppyDave's additions. A merge strategy would interleave commits and make it harder to audit what's custom vs upstream. The tradeoff is force-push is required, which is acceptable on a single-owner repo.
  - *Alternative considered*: Merge commits from upstream
  - *Why rejected*: Merge history obscures which code is AppyDave's; conflict resolution is harder to review; force-push avoidance does not justify the overhead at this scale

- **Seam file discipline (one import + one composition)**: Restricting upstream file edits to the minimum possible makes rebasing nearly conflict-free. If upstream restructures a seam file, AppyDave's one-line addition is trivial to re-apply. Any logic in upstream files beyond a seam line would collide with upstream evolution.
  - *Alternative considered*: Fork and patch individual upstream files as needed
  - *Why rejected*: Patch-style forks accumulate drift; a rebase after major upstream refactors becomes days of conflict resolution rather than minutes

- **CSS variable override approach**: Branding is applied by overriding `:root` CSS custom properties in a single `brand.css` file imported at the entry point, never by editing upstream's `index.css`. This means upstream can add or rename tokens freely; AppyDave's overrides are a thin diff on top.
  - *Alternative considered*: Copy and edit `index.css` entirely
  - *Why rejected*: Forked CSS diverges on every upstream token change; the seam discipline would be violated

- **Effect-TS for server composition**: Upstream chose Effect as its dependency injection and async model. AppyDave's server extensions (`AppyLayer`, `AppyWsRpcGroup`) use the same model, making them composable with upstream layers at the seam points. Switching to a different DI approach for AppyDave code would create impedance mismatch at every seam.
  - *Alternative considered*: Plain Node.js services injected via constructor
  - *Why rejected*: Incompatible with upstream layer graph composition; cannot use `Layer.mergeAll` across paradigms

- **Single `main` branch, no long-lived feature branches**: All AppyDave work lands on `main` to minimize rebase friction. A feature branch rebasing against upstream simultaneously with `main` creates double rebase work. This enforces small, shippable increments.
  - *Alternative considered*: Feature branches merged back to main before rebase
  - *Why rejected*: Branch merges add merge commits that complicate the upstream rebase history

## Non-obvious Constraints

- **`bun run test`, not `bun test`**: Running `bun test` invokes Bun's built-in test runner, which does not understand the project's Vitest configuration. The correct command is `bun run test`, which executes the `test` script in `package.json` that invokes Vitest. This is a silent failure — `bun test` may pass trivially or miss tests entirely.

- **The `packages/shared` package has no barrel export**: Unlike most shared packages, `@t3tools/shared` uses explicit subpath exports (`@t3tools/shared/git`, `@t3tools/shared/DrainableWorker`). Importing from `@t3tools/shared` directly will fail or return nothing. Every import must name a specific subpath.

- **Codex app-server is a child process, not an npm dependency**: The server spawns `codex app-server` as a stdio child process per provider session. There is no Codex SDK embedded in the server's Node process. If the `codex` CLI is not installed on the machine, no sessions will work — this appears as a blank session with no events, not a startup error.

- **CSS tokens apply to dark mode only**: The app is a developer tool and defaults to dark. AppyDave's `brand.css` overrides `:root` custom properties that map to the dark color scheme. There is no light-mode variant to maintain. Adding light-mode overrides without knowing upstream's full token map risks visual breakage if a session ever surfaces a light context.

- **`--force-with-lease`, never `--force`**: After rebasing, the push must use `--force-with-lease`. Plain `--force` will silently overwrite any commits pushed to the remote between the last fetch and the push. Since this is a solo repo, the risk is low, but the habit matters when CI or a desktop app also pushes.

- **Desktop branding flows through the preload bridge**: `APP_DISPLAY_NAME` in the web app is not a build-time constant — it is read from `window.desktopBridge.getAppBranding()` at runtime in `branding.ts`. In browser mode (no Electron), the bridge is absent and the display name falls back to a default. Changes to `appBranding.ts` only affect the Electron build; browser-mode branding requires a separate path.

## Expert Mental Model

- **Ask "which seam?" before writing any line of AppyDave code**: An expert never starts by writing the feature — they start by identifying which of the five seam files the feature composes through. That determines where the single-line addition goes and which `appydave/` subdir holds the implementation. A beginner writes the feature first and then tries to wire it in; this leads to seam files accumulating logic.

- **The rebase is the product discipline, not a chore**: Upstream ships features and fixes daily. An expert treats `git rebase upstream/main` as a test of seam hygiene — if it completes in under 30 seconds with zero conflicts, the seam discipline is holding. Conflicts signal that logic crept into an upstream file. The zero-conflict rebase is not a lucky outcome; it's the invariant the entire extensibility strategy exists to protect.

- **Effect layers compose at the boundary, not inside**: Effect-TS layers are not middleware or plugins; they are dependency declarations. `AppyLayer = Layer.mergeAll(A, B)` makes services A and B available to anything that requires them, then `Layer.provide(upstreamLayers, AppyLayer)` merges it into the runtime. An expert adds services by expanding `AppyLayer`, not by injecting into existing upstream service constructors or calling upstream services from a setup hook.

- **CSS token override is additive, not substitutive**: The brand.css file does not need to redeclare every upstream token — only the ones that differ. An expert reads the browser's computed styles after adding a token to verify inheritance is working, rather than copying the full upstream token list and diffing manually. Unknown tokens inherit upstream values automatically.

## Scope Limits

- Does NOT implement AI or code generation capabilities — Codex app-server handles all agent behavior; AppyCtrl is a UI shell and orchestration bridge around it.
- Does NOT run long-lived feature branches — all AppyDave work lands on `main`; any exploratory work should be prototyped in a throwaway branch and squashed before landing.
- Does NOT modify upstream WebSocket method signatures or existing RPC contracts — AppyDave extends by adding new methods via `AppyWsRpcGroup` union, never by patching existing ones.
- Does NOT provide a light-mode AppyDave theme — the app is dark-only; AppyDave's `brand.css` only overrides dark-mode tokens.
- Does NOT upstream contributions back to `pingdotgg/t3code` — `CONTRIBUTING.md` is closed to external PRs; AppyDave customizations are private divergences, not upstream contributions.
- Does NOT use a database for the apps launcher registry (initially) — the app list is hardcoded in `useAppRegistry.ts`; a server-settings-backed registry is a future phase.

## Failure Modes

- **Rebase conflict on a seam file**: Recognisable by `CONFLICT (content)` in a file like `apps/web/src/main.tsx` during `git rebase upstream/main`. Cause: logic was added directly to an upstream file rather than isolated in an `appydave/` subdir. Resolution: `git checkout upstream/main -- <seam-file>`, then re-apply only the one-line import + composition from AppyDave's version, then `git rebase --continue`.

- **Branding change not visible in browser**: Symptom: colors unchanged despite `brand.css` existing. Causes: (a) the import line was not added to `main.tsx`; (b) the CSS properties use wrong names and don't match upstream token names; (c) in browser-mode (non-Electron), the display name still shows "T3 Code" because the desktop bridge is absent — this is expected. Check browser DevTools computed styles on `:root` to confirm tokens are being set.

- **Provider session produces no events (blank session)**: Symptom: session starts, title bar shows a session ID, but no conversation events arrive. Most likely cause: `codex` CLI is not installed or not on PATH. The server spawns it as a child process and fails silently if the binary is missing. Run `which codex` in the shell that starts the server. Secondary cause: server WebSocket isn't running — check port 3773.

- **Wrong test runner invoked**: Symptom: `bun test` exits successfully with no tests listed, or runs only a subset. Cause: `bun test` uses Bun's built-in runner, which does not read `vitest.config.ts`. Always use `bun run test` to invoke Vitest via the package script.

- **Force-push overwrites remote state**: Symptom: commits visible on the remote before the push are gone from `git log` after. Cause: `git push --force` used instead of `git push --force-with-lease`. Use `--force-with-lease` always; if it rejects, `git fetch` first to reconcile.

- **Effect layer missing a required service at runtime**: Symptom: server throws an Effect `MissingDependency` error on startup or on first request, not during build. Cause: `AppyLayer` was not merged into the upstream layer graph at the `bootstrap.ts` seam, or a new service was added to `AppyLayer` but its own `Default` layer was not included. Add missing layer to `AppyLayer` and confirm the seam edit in `bootstrap.ts` is present.
