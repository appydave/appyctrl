# Phase 3 — Kickoff Brief

**Status:** ready to execute · **Topology:** researcher one-shot → 2-way coder fanout · **Estimated wall time:** ~45 min

---

## What we're building

The "click an app row → it opens" half of the Application launcher.

- `openExternal: false` → app renders in the **main panel** as an embedded Electron webview
- `openExternal: true` → app opens via `shell.openExternal()` in the user's **default browser**

Phase 2 built the registry + sidebar UI + add/edit/delete modal but left click as a no-op. Phase 3 wires the click.

---

## Topology

```
                                 spec gaps closed
                                 (gap-1 webview primitive, gap-2 thin ACs)
                                          │
                                          ▼
                              ┌─────────────────────┐
                              │  Researcher (1-shot)│
                              │  Explore subagent    │
                              │  reads:              │
                              │   • apps/desktop/src │
                              │     /main.ts (IPC)   │
                              │   • t3code's existing│
                              │     webview/BVview/  │
                              │     WebContentsView  │
                              │     usage if any     │
                              │  decides:            │
                              │   • webview primitive│
                              │     (locks ADR)      │
                              └─────────┬───────────┘
                                        │ report + locked decision
                                        ▼
                              ┌─────────────────────┐
                              │   Integrator (me)    │
                              │   synthesises 2 briefs│
                              │   with locked        │
                              │   contracts          │
                              └─────────┬───────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                          ▼                           ▼
              ┌───────────────────┐         ┌───────────────────┐
              │  Coder-A           │         │  Coder-B           │
              │  Desktop bridge    │ parallel │  Web webview pane │
              │                    │         │                    │
              │  packages/appydave │         │  apps/web/src/     │
              │    /src/bridge.ts  │         │    routes/         │
              │                    │         │      apps.$id.tsx  │
              │  apps/desktop/src/ │         │                    │
              │    appydave/       │         │  apps/web/src/     │
              │      appyBridge.ts │         │    appydave/apps/  │
              │      externalBro.ts│         │      WebviewPane.tsx│
              │                    │         │                    │
              │  apps/desktop/src/ │         │                    │
              │    main.ts (seam,  │         │                    │
              │    1 line)         │         │                    │
              └─────────┬─────────┘         └─────────┬─────────┘
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │   Integrator (me)    │
                          │   • wire AppyAppsSection│
                          │     handleActivate    │
                          │   • seam edit         │
                          │     Sidebar.tsx       │
                          │     (already done in  │
                          │      Phase 2; just    │
                          │      update the call) │
                          │   • run gates         │
                          │   • UAT with you      │
                          └─────────┬───────────┘
                                    │
                                    ▼
                         capture-swarm + Lisa *curate phase-3
                                    │
                                    ▼
                         merge --no-ff → main, push, close
```

---

## The locked contract

The bridge interface, identical in both coder briefs:

```ts
// packages/appydave/src/bridge.ts
export interface AppyDesktopBridge {
  openInExternalBrowser(url: string): Promise<void>;
}

declare global {
  interface Window {
    appyBridge: AppyDesktopBridge;
  }
}
```

That's the entire contract surface. Coder-A implements; coder-B (and the integrator wire-up) calls.

---

## Acceptance criteria (10)

| # | AC |
| --- | --- |
| 1 | Click `openExternal=false` row → main panel renders the webview at `/apps/$id`; sidebar stays put |
| 2 | Click `openExternal=true` row → URL handed to `shell.openExternal()`; main panel does not change |
| 3 | Toggle `openExternal` in modal → next click on that row uses new behaviour without app restart |
| 4 | Session/cookie persistence across app switches and Electron restarts (verifiable in devtools) |
| 5 | In-webview navigation policy: same-origin links navigate inside; `target="_blank"` routes to `shell.openExternal()` |
| 6 | Error UI: unreachable URL → fallback panel with app name + URL + reason + Retry button |
| 7 | CSP / sandbox: `nodeIntegration: false`, `contextIsolation: true`, no remote module |
| 8 | Bridge contract: `window.appyBridge.openInExternalBrowser(url)` exposed via preload, IPC handled in main |
| 9 | `check-seams.sh` reports `bridge-open-external` patch annotated and in manifest |
| 10 | No regression in Phase 2 ACs |

---

## Gap-fix ledger (review feedback closed)

Documentation agent flagged two gaps in the prior Phase 3 spec. Both addressed before fanout starts:

| Gap | Risk | Resolution |
| --- | --- | --- |
| **Webview primitive deprecated** — spec said `<webview>`, which Electron has marked deprecated. Cold subagents would have shipped it. | high — security warts + future removal | Researcher one-shot now investigates t3code precedent + decides between `<webview>` / `BrowserView` / `WebContentsView`. Decision recorded as Phase 3 ADR before fanout. |
| **Thin ACs** — Phase 2 had 8, Phase 3 had 6 and missed session persistence, in-webview navigation, error UI, CSP posture. | medium — subagents would have shipped reasonable defaults but not THE defaults | Spec ACs expanded from 6 to 10. New ACs: session/cookie partition, in-webview navigation policy, error UI shape, CSP/sandbox posture, explicit bridge contract. |

The doc agent's third proposal — split into "Design 09 (this phase)" and "Design 10 (cross-phase swarm playbook)" — actioned: see `.appydave/kdd/meta/swarm-playbook.md`.

---

## What goes back to the documentation agent

After researcher one-shot lands and the webview-primitive ADR is written, send back:

- Updated spec with the ADR linked
- Phase 3 implementation diff once it lands
- Swarm playbook draft (Design 10) for review pass

This closes the doc-agent feedback loop *before* code commits, not after.

---

## Why no separate planner subagent

Researcher report + spec → I synthesise the 2 coder briefs directly. Adding a planner subagent for a 2-slice fanout adds a coordination hop without value. (See [`swarm-playbook.md`](../kdd/meta/swarm-playbook.md) decision tree.)

---

## Pre-empt the known traps in coder briefs

Both coder briefs include this verbatim block:

> **Watch out for:**
>
> - **`exactOptionalPropertyTypes`**: never write `field: x || undefined`. Use `...(x ? { field: x } : {})`.
> - **Run gates from repo root**, not `cd apps/web && ...` (avoids `.claude-flow/` leakage).
> - **Don't run `bun fmt`** (whole repo, noisy diff). Integrator runs it once at end.
> - **Sibling-slice typecheck failures** are expected — integrator runs final gates.

---

## Files to be created or touched

### Coder-A — desktop bridge
- ➕ `packages/appydave/src/bridge.ts`
- ➕ `apps/desktop/src/appydave/appyBridge.ts`
- ➕ `apps/desktop/src/appydave/externalBrowser.ts`
- ✏️ `apps/desktop/src/main.ts` *(seam edit, 1 import + 1 IPC handler line, annotated `[APPYDAVE-PATCH id="bridge-open-external"]`)*

### Coder-B — web webview pane
- ➕ `apps/web/src/routes/apps.$id.tsx` *(TanStack auto-discovery, no seam edit)*
- ➕ `apps/web/src/appydave/apps/WebviewPane.tsx`

### Integrator — wire-up
- ✏️ `apps/web/src/appydave/apps/AppyAppsSection.tsx` *(`handleActivate` no-op → branch on `app.openExternal`)*

---

## Phase close-out (locked ritual)

```
bash .appydave/scripts/check-seams.sh                      # 1 new accounted
bun fmt && bun lint && bun typecheck && bun run test       # full gates
                                                            # UAT in Electron — all 10 ACs
git commit + manifest entry
bash capture-swarm.sh   →  docs/swarm-builds/{date}-phase-3.md + AgentDB row
Lisa *curate phase-3    →  KDD assets (likely: webview-primitive ADR,
                            electron-bridge pattern, in-webview nav learning)
git merge --no-ff feat/phase-3-app-launcher-rendering → main
git push origin main
git branch -d feat/phase-3-app-launcher-rendering
swarm-playbook.md updated with Phase 3 row
```

---

## Sign-off needed before execution

1. Topology + locked contract — accept as drafted, or override
2. ACs (1-10) — accept as drafted, or add/remove
3. Researcher brief content (next message) — review before launching the subagent

Once you confirm, I send the researcher one-shot. Code starts after the ADR lands.
