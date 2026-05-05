---
title: "ADR-0002: Reskin via token overrides — never via component rewrites"
description: "AppyDave brand reskin happens at the CSS-token layer. Components are only edited when they bypass tokens with hardcoded palette literals — and then only the bypass class strings are swapped, never the surrounding logic."
category: decisions
tags: [reskin, theming, css, fork-discipline, scope]
date_created: 2026-05-05
last_updated: 2026-05-05
kdd_phase_origin: "phase-1"
kdd_impact: high
kdd_related_docs:
  - ../patterns/theme-token-cascade-explicit-selectors.md
  - ../patterns/seam-edit-discipline.md
  - ../learnings/discover-upstream-systems-first.md
status: accepted
---

# ADR-0002: Reskin via token overrides — never via component rewrites

## Status

accepted

## Context

AppyCtrl is a long-running fork of t3code with daily upstream rebases. Phase 1 ships AppyDave warm-cream / warm-dark themes plus an AppyCtrl wordmark. There were three plausible approaches to brand the surface:

1. **Token override layer** — Re-declare shadcn semantic tokens (`--background`, `--foreground`, `--primary`, etc.) at `:root` and `:root.dark` from a single AppyDave-owned CSS file. Touch zero components.
2. **Component restyling** — Walk every UI component and edit its className/inline styles to use AppyDave brand colours directly.
3. **Hybrid** — Token overrides where possible, component edits where colours are inlined.

## Decision

Adopt approach **1 (token override) as the default** with **approach 3 (targeted component patches) only for components that bypass tokens with hardcoded Tailwind palette literals or raw hex values**. Never restyle a component that already uses semantic tokens — those reskin "for free" through `themes.css`.

Concretely:

- **Default surface:** AppyDave token overrides in `apps/web/src/appydave/themes/themes.css` (already covers `--background`, `--foreground`, `--primary`, `--card`, `--popover`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`).
- **Token bypasses:** When upstream uses `text-sky-600`, `bg-emerald-500/15`, raw `#1f6feb`, etc., add a new namespaced token (`--ac-status-working`, `--ac-status-completed`) and replace the bypass class with `text-[var(--ac-status-working)]`. This is a seam patch, annotated and listed in the manifest.
- **Never:** Modify a component's structural logic, layout, or behaviour to achieve the reskin. If the look needs structural change, that's a feature phase, not a reskin.

## Alternatives considered

- **Approach 2 (component restyling).** Rejected: every component edit is a future rebase conflict. With ~50 components to touch, daily rebases become unworkable. Also: structural changes get tangled with cosmetic ones, making rebase-conflict resolution ambiguous.
- **Approach 1 alone (no component patches at all).** Rejected: token-only reskin leaves bypassed colours wrong. The "Working" pill staying sky-blue in a warm-dark surface is a brand failure, not "good enough."
- **Forking shadcn.** Rejected: massive maintenance cost for negligible gain.

## Consequences

### Positive

- Phase 1 final diff is **3 component-file seam edits + 1 CSS file + 2 polish patches** — minimal upstream surface.
- Each rebase only conflicts on the few seam files; everything else is automatic.
- Adding a future theme (e.g. high-contrast a11y) is a new file, not a new pass through every component.
- Audit method (subagent grep for hardcoded palette) is repeatable on every future polish pass.

### Negative

- The hardcoded-bypass audit must be re-run after every upstream pull — new bypass sites appear over time. Phase-1 audit found 26; some will be added back as upstream evolves.
- Tokens are now "ours" but defined inside upstream's selectors (`:root`, `:root.dark`). If upstream changes the dark-class strategy (e.g. moves to `[data-theme="dark"]`), our entire override breaks.
- Some components ARE structurally biased toward upstream's palette (ultrathink rainbow, plan-sidebar gradient borders). Token override is insufficient — they remain outside the reskin scope.

### Neutral

- The deferred patches 3–6 from Phase 1's audit (composer selection, model star, diff error, plan toggle) are component-bypass patches in the same shape as patches 1+2. They're scope, not strategy — schedule them when their visual impact matters.

## Removal / supersedence condition

Replace this ADR if any of:

- Upstream removes shadcn semantic tokens or restructures the dark class strategy. At that point, re-evaluate the entire approach.
- AppyCtrl forks far enough from t3code that daily rebases are abandoned. Without rebase pressure, restyling components becomes viable.
- A future phase requires structural UI changes that can't be reskinned (e.g. AppyDave-specific dialog patterns). Those would justify a different category of patch (`feature` rather than `seam`) and may need a different reskin doctrine.

## References

- Phase: phase-1
- Commits: `87f603c5`, `54e4017a`, `0ad5a1d8`, `1bbcb7c3`
- Patterns: [theme-token-cascade-explicit-selectors](../patterns/theme-token-cascade-explicit-selectors.md), [seam-edit-discipline](../patterns/seam-edit-discipline.md)
- Learnings: [discover-upstream-systems-first](../learnings/discover-upstream-systems-first.md)
- Earlier ADR: [adr-0001-port-lisa-from-bmad](adr-0001-port-lisa-from-bmad.md)
