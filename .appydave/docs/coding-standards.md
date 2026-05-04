# AppyCtrl Coding Standards

---

## Overriding principle

Write AppyDave code that looks like upstream t3code. Same patterns, same style, same discipline.
Code that matches upstream patterns rebases cleanly and breaks less when upstream evolves.

---

## Specs

Design-plan entries are the spec. Before touching code for any feature, expand the relevant
section in `.appydave/docs/design-plan.md` until it answers:

- What files get created
- Which pattern each file uses (Effect layer / Rpc.make / CSS override / bridge call)
- Edge cases and failure modes

Simple changes (name string, CSS token) need no extra spec. Complex changes (Upgrade button,
app registry) must be fully specced before coding starts.

---

## Patterns (follow upstream exactly)

| What               | Pattern                                              | Reference                         |
| ------------------ | ---------------------------------------------------- | --------------------------------- |
| New server service | Effect Layer                                         | `apps/server/src/*/Services/`     |
| New RPC method     | `Rpc.make()` + `RpcGroup`                            | `packages/contracts/src/rpc.ts`   |
| Shared types       | Effect Schema (not raw TS interfaces)                | `packages/contracts/src/`         |
| Desktop ↔ web data | Typed bridge interface                               | `packages/contracts/src/ipc.ts`   |
| IPC calls          | Via `AppyBridge` interface — never raw `ipcRenderer` | `packages/appydave/src/bridge.ts` |
| CSS theming        | Custom property overrides                            | `apps/web/src/appydave/brand.css` |

---

## Tests

Match upstream's discipline:

- **Test** service logic, pure functions, schema validation
- **Skip** obvious React UI components unless they contain real logic
- **Run** with `bun run test` (never `bun test` — see AGENTS.md)
- All AppyDave service code in `apps/server/src/appydave/` should have test coverage

---

## Quality gates — required before every commit

```bash
bun fmt && bun lint && bun typecheck && bun run test
```

All four must pass. No exceptions.

---

## Commit discipline

Prefix every AppyDave commit so `git log upstream/main..HEAD` stays readable:

```
feat(appydave): add AppyWordmark component
fix(appydave): correct brand token for sidebar border
chore(appydave): update upstream-touches manifest
```

Never mix AppyDave changes with upstream-derived changes in the same commit.

---

## Tracking bad code / debt

Add a line to `.appydave/upstream-touches.md` under a `## Known shortcuts` section.
Format: `path — what the shortcut is — what the proper fix would be`

One list, one habit. Not a separate system.

---

## Patch annotation (upstream bug fixes only)

When you must edit an upstream file to fix a genuine bug, annotate the change site:

```ts
// [APPYDAVE-PATCH id="splash-timeout" type="bug-fix"]
// Root cause: upstream timeout too short for slow machines
// Remove when: upstream fixes splash screen timing
```

And add an entry to `.appydave/patches/manifest.md`. See extensibility-strategy.md for full detail.
