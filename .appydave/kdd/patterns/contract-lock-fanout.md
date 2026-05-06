---
title: "Contract-Lock Fanout"
description: "Lock cross-slice TypeScript contracts (hook signatures, prop shapes, import paths) in the planner brief BEFORE spawning parallel coder subagents. Prevents the predictable drift-then-rework cycle."
category: patterns
tags: [subagents, fanout, contracts, ruflo, multi-agent]
date_created: 2026-05-06
last_updated: 2026-05-06
kdd_journey_stage: patterns
kdd_phase_origin: "phase-2"
kdd_hard_won: true
kdd_impact: high
kdd_related_docs:
  - ../learnings/exact-optional-property-types-trap.md
---

# Contract-Lock Fanout

## Context

You want to use a Ruflo / Claude-Code parallel-subagent fanout to build a feature in 3+ independent slices. The slices share types and module boundaries (e.g. a hook signature consumed by two UI components). Subagents start cold — they don't see your conversation, won't know what naming conventions you've already settled on, and can't ask each other questions while running.

Without intervention, each subagent invents its own version of the shared contract. You then spend the integration phase reconciling the mismatches — defeating the parallelism.

## Pattern

In the planner brief (or directly in each coder brief if no separate planner), **explicitly write out the shared contracts as TypeScript code blocks** with the labels:

> "**Locked contracts (do not change):** ..."

> "**You import X from Y. Y is created by coder-N.**"

For each cross-slice surface, specify:

1. **Type signatures** — full TypeScript declarations, not English summaries
2. **Module paths** — exact import strings ("@t3tools/appydave-registry/registry"), not "wherever coder-1 puts it"
3. **Behavioural commitments** — e.g. "the hook seeds the registry on first mount via seedIfEmpty()" (so coder-2 doesn't replicate that logic)
4. **What you do NOT touch** — explicit boundary of each subagent's slice

Example fragment from Phase 2's coder-2 brief:

```ts
// Locked contracts (do not change — coder-1 owns the data layer with these signatures)

type RegisteredApp = {
  id: string;
  name: string;
  url: string;
  glyph?: string;
  openExternal: boolean;
};

function useAppRegistry(): {
  apps: ReadonlyArray<RegisteredApp>;
  add: (input: Omit<RegisteredApp, "id">) => RegisteredApp;
  update: (id: string, patch: Partial<Omit<RegisteredApp, "id">>) => void;
  delete: (id: string) => void;
  getById: (id: string) => RegisteredApp | undefined;
};

// You import useAppRegistry from "./useAppRegistry" (coder-1 creates it).
```

## Counter-example (what NOT to do)

```text
"Build a hook that manages the app registry. Other coders will import from your file."
```

That brief is fine for a single coder, fatal for parallel coders. Three subagents will produce three different hook shapes (`useApps()`, `useRegistry()`, `useAppList()`), three different return types (`{apps,addApp,...}` vs `{registry,createApp,...}`), and three different import paths.

## Why it works

Each subagent treats its brief as ground truth. When the same contract block appears verbatim in three briefs, all three converge on the same code shape. The only remaining integration work is wiring imports — which you can pre-fix by stating the exact path string in each brief.

In Phase 2 with 3 parallel coders writing 7 files across 2 packages, integration required **zero contract-shape rework**. One small content edit (`console.log` → no-op) and zero structural changes.

## When to use

- Any fanout with ≥2 parallel coders sharing types
- Especially when one slice's output is an input to another (data-layer + consumer pattern)
- When using subagents that don't have access to your in-progress conversation

## When not to use

- Single-coder tasks (no fanout = no contract drift)
- Spike / exploration work where the contract is what you're trying to discover
- Cases where the subagents will collaborate live (e.g. teammate-mode SendMessage). Then the contract can emerge through dialogue.

## Origin

- Phase: phase-2
- Commits: `96a0abf5` (the coordinated fanout that landed)
- Source briefs: see Phase-2 swarm-build doc for the actual brief content

## Related

- Learnings: [exactOptionalPropertyTypes trap](../learnings/exact-optional-property-types-trap.md) — a TS-strictness gotcha that two coders independently ran into; codifying it in briefs would prevent it
- Patterns: [seam-edit-discipline](seam-edit-discipline.md)

## Phases Shipped

| Phase   | Application                                          | Outcome                                                                        | Integration Rework                                   |
| ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| phase-2 | App registry (3 coders, 7 files, 2 packages)         | Locked contracts before fanout, zero shape drift                               | Zero rework — one content edit (console.log removal) |
| phase-3 | Desktop bridge + web webview (researcher + 2 coders) | ADR-0003 locked by researcher one-shot before fanout, types codified in briefs | Zero integration rework                              |
