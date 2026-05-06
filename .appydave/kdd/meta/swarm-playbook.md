---
title: "AppyCtrl Swarm Playbook"
description: "Cross-phase synthesis of agent-topology decisions. When to swarm, when not to, what to lock upfront, and what to do at close."
category: meta
tags: [swarm, ruflo, multi-agent, playbook, topology, fanout, lisa]
date_created: 2026-05-06
last_updated: 2026-05-06
kdd_phase_origin: "phase-1, phase-2"
kdd_impact: high
kdd_related_docs:
  - ../patterns/contract-lock-fanout.md
  - ../patterns/seam-edit-discipline.md
  - ../patterns/theme-token-cascade-explicit-selectors.md
  - ../learnings/discover-upstream-systems-first.md
  - ../learnings/phantom-claude-flow-leakage.md
  - ../learnings/exact-optional-property-types-trap.md
---

# AppyCtrl Swarm Playbook

Living document. Cross-phase synthesis of how AppyCtrl phases use Claude Code subagents (Ruflo flow). Updated each phase. Audience: future you, future Claude, future contributors.

> "Don't pre-design the workflow before using it once for real." — phase-0 advice that proved correct.

---

## The decision tree

When you start a phase, decide topology in this order:

```
                      ┌──────────────────────────────────┐
                      │  Phase scope ≤ ~150 lines, single │
                      │  file domain, easy mid-stream UAT │
                      └──────────┬───────────────────────┘
                                 │ yes
                                 ▼
                  CONVERSATIONAL SINGLE-CODER (Mode 2 riff)
                  ─────────────────────────────────────────
                  No subagents. You + me in dialogue. UAT happens
                  inline. Phase 1 ran this way.
                                 │ no
                                 ▼
                      ┌──────────────────────────────────┐
                      │  Touches an unfamiliar upstream   │
                      │  surface or external API?         │
                      └──────────┬───────────────────────┘
                                 │ yes
                                 ▼
                       RESEARCHER ONE-SHOT FIRST
                       ─────────────────────────
                       One Explore subagent reads + reports the
                       relevant upstream code. ~300-700 word digest.
                       Saves N coders ~10 min each + reduces drift.
                                 │
                                 ▼
                      ┌──────────────────────────────────┐
                      │  ≥2 genuinely independent slices  │
                      │  touching different file trees?   │
                      └──────────┬───────────────────────┘
                                 │ yes
                                 ▼
                  N-WAY PARALLEL CODER FANOUT (with contract lock)
                  ────────────────────────────────────────────────
                  2-way (Phase 3) or 3-way (Phase 2). Each coder
                  gets a brief that explicitly states:
                    - their slice's files
                    - the locked TS contracts (verbatim code blocks)
                    - the import paths
                    - what NOT to touch
                  Integrator (you) does the seam edit + final wiring.
                                 │ no
                                 ▼
                       SEQUENTIAL SINGLE CODER subagent
                       ────────────────────────────────
                       Useful when you want to keep your context
                       clean but the work is one slice. Brief still
                       includes the locked contract section.
```

---

## Roles

| Role                     | Subagent kind               | When                                                                                                                                        |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Researcher**           | Explore (read-only, scoped) | One-shot before fanout. Reports structure of upstream code.                                                                                 |
| **Planner**              | _(usually skipped)_         | Only spawn if researcher report is large enough that synthesising the briefs yourself is too much. Phase 2 retro: integrator did this fine. |
| **Coder**                | general-purpose             | Each parallel slice. Receives locked contract + file list.                                                                                  |
| **Reviewer**             | general-purpose             | _(skipped in conversational mode — UAT does the job)_. Spawn for genuinely risky changes.                                                   |
| **Tester**               | general-purpose             | _(deferred so far)_ — when test surface is non-trivial.                                                                                     |
| **Integrator (you)**     | main thread                 | Always. Owns seam edits, branch hygiene, contract reconciliation, manifest updates.                                                         |
| **Lisa (KDD librarian)** | agent persona               | At phase close. Curates patterns/learnings/decisions.                                                                                       |

---

## The phase ritual

Every phase, no exceptions:

```
1. SPEC      .appydave/specs/{feature}-spec.md  exists with ACs + AppyDave-owned files
2. BRANCH    feat/phase-N-{slug}  cut from main
3. SWARM     researcher → coder(s) → integrator wires + seam edits
4. GATES     bun fmt && bun lint && bun typecheck && bun run test && check-seams.sh
5. UAT       you click through each AC in dev Electron
6. COMMIT    annotated patches + manifest entries
7. CAPTURE   bash capture-swarm.sh — writes docs/swarm-builds/{date}-phase-N.md +
             AgentDB memory_entries (namespace="swarm-builds")
8. CURATE    Lisa *curate phase-N — distills into .appydave/kdd/{patterns,learnings,decisions}
9. MERGE     git merge --no-ff feat/phase-N-{slug}  → main
10. CLEANUP  branch deleted, push to remote
```

Steps 7+8 are non-negotiable. Subagents bypass Ruflo's hooks → AgentDB stays empty otherwise. The capture is what closes the learning loop.

---

## Contract-lock briefs (the load-bearing pattern)

Pattern doc: [`patterns/contract-lock-fanout.md`](../patterns/contract-lock-fanout.md).

For any fanout with ≥2 coders sharing types, every brief includes a literal section:

> **Locked contracts (do not change):**
>
> ```ts
> // Type signatures + import paths + behavioural commitments, verbatim.
> ```

This block is identical across all coder briefs in the same fanout. Three coders in Phase 2 converged on the same hook signature, same prop shapes, same import path (`@t3tools/appydave-registry/registry`) without any inter-subagent communication. Zero contract-shape rework at integration.

---

## Pre-empt the recurring traps

Add a "Watch out for" section to every coder brief. Phase-2 traps that should be pre-empted in every future brief:

| Trap                                                | Brief instruction                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `exactOptionalPropertyTypes` strictness             | "Never write `field: foo \|\| undefined`. Use `...(foo ? { field: foo } : {})` for optional fields."              |
| `delete` is a JS reserved word                      | "If your hook returns a `delete` method, alias internally (`const remove = ...`) and expose as `delete: remove`." |
| Phantom `.claude-flow/` leakage                     | "Run gates from repo root, not `cd apps/web && ...`. The `**/.claude-flow/` gitignore catches leaks."             |
| Subagents can't share each other's typecheck output | "If a typecheck error references a sibling slice's file, ignore it — integrator runs final gates."                |

---

## When to spawn a "reviewer" subagent

Most phases skip the reviewer. UAT (you, in dev Electron) catches more than a synthetic reviewer would. Spawn one when:

- You can't UAT (no UI, e.g. server-side migration)
- Adversarial review matters (e.g. security-sensitive code)
- Phase touched ≥5 files across ≥2 layers — pattern coherence is at risk

Don't spawn if you'd just be doing a code-style pass — that's `bun lint`'s job.

---

## What goes to the documentation agent

You have an external documentation agent reviewing AppyCtrl design docs (Design 08 + 09 series). Specifically valuable:

- Gap-spotting in specs before code starts (Phase 3 caught the deprecated `<webview>` choice + thin ACs)
- Splitting "phase build doc" from "cross-phase synthesis doc" (this file is the latter)
- Anchoring at known precedents (e.g. "match Design 08 fidelity")

Pattern: send the doc agent the Phase N spec **after researcher one-shot lands** but **before coder fanout starts**. Their review feeds back as spec patches. Phase 3 used this loop and caught two real gaps.

---

## Phases shipped (snapshot)

| Phase                                       | Topology                              | Time-on-clock                  | KDD entries produced                                                                                      |
| ------------------------------------------- | ------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **0 — setup**                               | conversational                        | 30 min                         | seam-edit-discipline pattern; ADR-0001 (Lisa port)                                                        |
| **1 — light-mode design system**            | conversational single-coder           | half day (multiple UAT rounds) | theme-token-cascade pattern; @variant dark trap; discover-upstream learning; ADR-0002 (reskin via tokens) |
| **2 — application launcher**                | researcher → 3-way fanout             | ~2 hours                       | contract-lock-fanout pattern; phantom-claude-flow learning; exactOptionalPropertyTypes learning           |
| **3 — webview rendering + external bridge** | researcher → 2-way fanout _(planned)_ | est. ~45 min                   | TBD (likely: webview-primitive ADR, electron-bridge pattern)                                              |

---

## How this doc evolves

Append, don't replace. Each phase close adds:

- A row to "Phases shipped"
- New entries to the trap pre-empt table if a recurring gotcha emerges
- Updates to the decision tree if a new topology earns its place
- A line to the role table if a new agent kind gets used

Keep narrative tight. Prefer linking to the canonical pattern/learning doc over duplicating content here.
