# AppyCtrl Extensibility Strategy

How to extend this fork of t3code substantially while keeping upstream rebases cheap.

---

## The core problem

Upstream (t3code) is active. You want to add significant AppyDave-specific features over time.
Naive forking means every upstream change collides with your changes across many files.
The goal is to **minimise the set of upstream files you touch**, so rebase conflicts are
predictable and fast to resolve.

---

## The two categories of files

### Seam files (upstream files you must touch — keep changes minimal)

These are the only upstream files that need modification to wire in AppyDave extensions.
Each change should be a single import + single composition line — nothing more.

| File                           | Why touched                                         | Change shape  |
| ------------------------------ | --------------------------------------------------- | ------------- |
| `apps/web/src/main.tsx`        | Import AppyDave CSS token overrides                 | 1 import line |
| `apps/web/src/router.ts`       | Wrap component to inject AppyDave providers/shell   | 3–5 lines     |
| `apps/server/src/ws.ts`        | Compose `AppyWsRpcGroup` with upstream `WsRpcGroup` | 2 lines       |
| `apps/server/src/bootstrap.ts` | Compose `AppyLayer` alongside upstream layers       | 2 lines       |
| `apps/desktop/src/main.ts`     | Expose AppyDave bridge methods via preload          | 10–20 lines   |

When a rebase conflict hits one of these files, the resolution is always the same shape:
keep the upstream change, re-apply your one composition line.

### AppyDave-owned files (never conflict — all new)

Everything else lives in `appydave/` subdirectories or the `packages/appydave/` package.
Upstream never touches these. Rebase never conflicts here.

---

## Extension patterns

### Pattern 1: Desktop Bridge injection (zero seam edits)

The app already has `window.desktopBridge` (defined in `packages/contracts/src/ipc.ts`).
Electron's preload injects capabilities this way. Branding is already injectable:
`DesktopBridge.getAppBranding()` → `branding.ts` reads it → no web source file changes needed.

**Extend this for AppyDave:** define `window.appyBridge` alongside `window.desktopBridge`.
Expose upgrade-from-upstream status, app registry data, anything that flows from desktop → web
without a WS round-trip.

Zero conflict: you're adding a new global, not modifying the existing one.

### Pattern 2: CSS token override (one import line in main.tsx)

The UI uses shadcn/ui with CSS custom properties (`--background`, `--primary`, etc.).
Branding is a single CSS file that overrides tokens at `:root`.

```
apps/web/src/appydave/brand.css   ← your one file
```

Import it in `main.tsx` after the upstream `index.css`. One line, easy to re-apply after rebase.

### Pattern 3: Outer shell wrapper (one Wrap change in router.ts)

`router.ts` has a `Wrap` component that wraps the entire React tree. Add your providers and
layout shell here — AppyDave sidebar panel, theme provider, app registry context.

```ts
// router.ts (seam edit)
Wrap: ({ children }) =>
  createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(
      AppAtomRegistryProvider,
      undefined,
      createElement(AppyShell, undefined, children), // ← your one addition
    ),
  );
```

`AppyShell` lives in `apps/web/src/appydave/shell/` and can be as complex as needed.

### Pattern 4: Additive routes (zero seam edits)

TanStack Router auto-discovers route files. New pages (upgrade panel, app launcher, settings
extensions) are new files in the routes directory — no upstream file touched.

### Pattern 5: Parallel RpcGroup (one composition line in ws.ts)

Define your own RPC methods in `packages/appydave/src/rpc.ts`:

```ts
export const AppyWsRpcGroup = RpcGroup.make(
  AppyUpgradeFromUpstreamRpc,
  AppyAppRegistryListRpc,
  // ...
);
```

In `ws.ts` (seam edit):

```ts
const AppyGroup = RpcGroup.union(WsRpcGroup, AppyWsRpcGroup);
// then use AppyGroup where WsRpcGroup was used
```

### Pattern 6: Effect Layer sidecar (one composition line in bootstrap.ts)

Your server services are a separate Effect Layer:

```ts
// apps/server/src/appydave/AppyLayer.ts
export const AppyLayer = Layer.mergeAll(UpgradeService.Default, AppRegistryService.Default);
```

In `bootstrap.ts` (seam edit): compose `AppyLayer` with the upstream layer graph.

### Pattern 7: Settings namespace (additive, low-conflict)

All AppyDave settings live under an `appydave` key in the server settings schema.
Upstream adds new top-level keys; you add under your namespace. Conflict probability: near zero.

---

## Folder layout

```
.appydave/                          ← docs, strategy, skill configs (not source)
  docs/
  skills/

packages/
  appydave/                         ← AppyDave contracts (new package, never conflicts)
    src/
      rpc.ts                        ← AppyWsRpcGroup
      settings.ts                   ← appydave settings schema extension
      bridge.ts                     ← AppyDesktopBridge interface

apps/
  web/src/
    appydave/                       ← all custom React code
      brand.css                     ← CSS token overrides
      shell/                        ← AppyShell (outer layout wrapper)
      sidebar/                      ← app switcher panel
      upgrade/                      ← Upgrade button + status UI
      registry/                     ← app registry UI

  server/src/
    appydave/                       ← all custom server code
      AppyLayer.ts                  ← composed Effect layer
      upgrade/                      ← upstream sync service
      registry/                     ← app registry service

  desktop/src/
    appydave/                       ← desktop bridge extensions
      appyBridge.ts                 ← window.appyBridge preload
      upgradeIpc.ts                 ← IPC handlers for upgrade flow
```

---

## Bug fixes to upstream files

Sometimes a genuine upstream bug has no external fix — the only viable fix is inside
the upstream source file itself. In those cases, editing the upstream file is acceptable,
but it must be documented:

1. Add an `[APPYDAVE-PATCH id="..." type="bug-fix"]` comment block at the change site
   with root cause, rationale, and removal condition
2. Add an entry to `.appydave/patches/manifest.md`

This makes the divergence visible during rebase conflicts and auditable over time.

The patch annotation convention:

```
// [APPYDAVE-PATCH id="<id>" type="bug-fix|feature|seam"]
// Root cause: <why the upstream code fails>
// Remove when: <condition that makes this patch unnecessary>
```

See `upstream-diff-strategy.md` for the full audit approach.

---

## The seam file discipline

Every seam file edit follows the same rule: **one import, one composition**. Nothing else.
No logic, no conditionals, no restructuring of upstream code.

When the upstream changes a seam file (likely — these are active files), your rebase diff is
always predictable: "put my one line back in the right place." That's a 30-second conflict,
not a 30-minute one.

If you find yourself wanting to add more logic to a seam file, that's a signal to push the
logic into an `appydave/` file and import it.

---

## What this looks like in practice

### Adding a new server feature

1. Create `apps/server/src/appydave/<feature>/`
2. Add service to `AppyLayer.ts`
3. Add RPC contract to `packages/appydave/src/rpc.ts`
4. _(no seam edits if AppyLayer and AppyRpcGroup are already wired)_

### Adding a new UI feature

1. Create `apps/web/src/appydave/<feature>/`
2. Expose it through `AppyShell` or as a new route file
3. _(no seam edits if AppyShell is already wired)_

### Adding a new desktop capability

1. Define it in `packages/appydave/src/bridge.ts`
2. Implement in `apps/desktop/src/appydave/appyBridge.ts`
3. _(minimal seam edit in `main.ts` only if adding a new IPC channel)_

---

## Seam files to watch during rebase

Run this after every `git fetch upstream` to see if seam files changed upstream:

```bash
git diff upstream/main HEAD -- \
  apps/web/src/main.tsx \
  apps/web/src/router.ts \
  apps/server/src/ws.ts \
  apps/server/src/bootstrap.ts \
  apps/desktop/src/main.ts
```

If any of these show upstream changes, review before rebasing. The conflict resolution
is always: keep upstream's change, add your one line back.
