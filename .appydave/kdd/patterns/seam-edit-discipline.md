---
title: "Seam Edit Discipline"
description: "Every upstream-file edit is one import + one composition line, annotated with [APPYDAVE-PATCH], and audited by check-seams.sh before commit."
category: patterns
tags: [seam, upstream, rebase, fork, t3code, extensibility]
date_created: 2026-05-05
last_updated: 2026-05-05
kdd_journey_stage: patterns
kdd_phase_origin: "phase-0"
kdd_hard_won: true
kdd_impact: critical
kdd_related_docs:
  - ../decisions/adr-0001-port-lisa-from-bmad.md
---

# Seam Edit Discipline

## Context

AppyCtrl is a long-running fork of `pingdotgg/t3code` that rebases against upstream daily. Every line we add to an upstream file is a future rebase conflict waiting to happen. The naive approach — modify upstream files freely — produces unmaintainable conflict storms within weeks.

This pattern keeps the fork rebaseable indefinitely.

## Pattern

Five files in upstream are designated **seam files**: the only upstream files we are allowed to modify. Two more we have added by necessity (Sidebar.tsx, SettingsSidebarNav.tsx) join the list when we touch them.

Every seam edit follows the same shape:

```ts
// 1. One import line at the top of the file:
import { AppyShell } from "../appydave/shell/AppyShell";

// 2. One composition line at the relevant point:
createElement(AppyShell, undefined, children),

// 3. An [APPYDAVE-PATCH] annotation at the change site:
// [APPYDAVE-PATCH id="shell-wrapper" type="seam"]
```

Plus a manifest entry in `.appydave/patches/manifest.md` keyed by the same id.

```ts
// One import + one composition line — never logic in a seam file.
```

## Counter-example (what NOT to do)

```ts
// Don't add conditional logic, restructure upstream code, or extend the seam edit
// beyond a single composition line. The moment you do, every upstream change to
// that file becomes a 30-minute conflict instead of a 30-second one.

// ❌ Wrong:
if (someAppyCtrlCondition) {
  return createElement(AppyShell, customProps, children); // logic in seam
} else {
  return children;
}

// ✅ Right:
return createElement(AppyShell, undefined, children);
// AppyShell itself, in apps/web/src/appydave/, holds all the conditional logic.
```

## Audit gate

`bash .appydave/scripts/check-seams.sh` runs `git diff upstream/main HEAD` against the canonical seam list and reports:

- ✅ unchanged — file matches upstream
- ✓ accounted — file differs but has `[APPYDAVE-PATCH]` annotation
- ✗ UNACCOUNTED — file differs without annotation (exit code 1)

Run before every commit that touches an upstream file. Wire into CI when ready.

## Origin

- Phase: phase-0
- Commit: 8f3477bf
- File: `.appydave/scripts/check-seams.sh`, `.appydave/docs/extensibility-strategy.md` (pre-existing canonical doc)

## Related

- Decisions: [ADR-0001 (porting Lisa)](../decisions/adr-0001-port-lisa-from-bmad.md)
- Pre-existing strategy doc: `.appydave/docs/extensibility-strategy.md` (full pattern catalogue with 7 numbered patterns)
- Patch manifest: `.appydave/patches/manifest.md`
