---
title: "@variant dark Silently Fails in CSS Files Outside Tailwind's Pipeline"
description: "The Tailwind v4 @variant directive only compiles for files processed by Tailwind. A plain CSS file imported via JS emits no rules from @variant blocks — fails silently."
category: learnings
tags: [tailwind, css, dark-mode, debugging, theming, vite]
date_created: 2026-05-05
last_updated: 2026-05-05
kdd_journey_stage: learnings
kdd_phase_origin: "phase-1"
kdd_error_signatures:
  - "dark mode falls back to upstream tokens"
  - "themes.css overrides don't apply in dark"
  - "@variant dark block emits no rules"
kdd_hard_won: true
kdd_impact: critical
kdd_related_docs:
  - ../patterns/theme-token-cascade-explicit-selectors.md
---

# @variant dark Silently Fails in CSS Files Outside Tailwind's Pipeline

## Symptom

After porting AppyDave warm-dark tokens into `appydave/themes/themes.css` and verifying via `bun run dev` UAT, **light mode looked correct but dark mode rendered the upstream cold-T3 colour palette**. No error in the console, no warning at build time. CSS variables resolved to upstream values regardless of what `@variant dark { ... }` declared in our file.

## Investigation

What I tried that didn't work:

- **Suspect 1:** load order. `themes.css` imports after `index.css` — already correct. Load order would only matter for ties; ruled out by inspection.
- **Suspect 2:** specificity battle. Hypothesised that upstream's `:root { @variant dark { ... } }` (compiled to `:root.dark`) was beating my top-level `@variant dark { ... }` (compiled to `.dark`) on selector specificity (0,1,1) vs (0,1,0). **Fix attempt:** nest my @variant inside `:root` to match the compiled selector. **Result:** still failed — dark mode unchanged.
- **Suspect 3:** Vite HMR caching stale CSS. Forced full restart. **Result:** still failed.

What unblocked me: opened devtools → Computed → searched for `--background` on `<html class="dark">`. The variable resolved to the upstream value. Looked at the actual stylesheet served — my `themes.css` had **no rules** for the dark block. The `@variant dark { ... }` had been emitted unchanged into the served CSS, which is invalid syntax that browsers ignore.

## Root cause

`@variant` is a Tailwind v4 *directive*, not a CSS at-rule. It's processed by Tailwind's CSS preprocessor and replaced with the resolved selector. A file only goes through that preprocessor if it's part of the Tailwind entry chain — typically the file that contains `@import "tailwindcss"` and `@custom-variant dark (...)`.

`appydave/themes/themes.css` is imported by `main.tsx` as a plain CSS module:

```ts
import "./appydave/themes/themes.css";
```

Vite serves it as static CSS. Tailwind never sees it. The `@variant dark { ... }` block is preserved verbatim in the served file, where it's invalid CSS and the browser silently discards it.

## Fix

Replace the Tailwind directive with the explicit selector it would have compiled to:

```css
/* Before — silently discarded */
:root {
  --background: #ebe2ce;

  @variant dark {
    --background: #1a1515;
  }
}

/* After — works */
:root {
  --background: #ebe2ce;
}

:root.dark {
  --background: #1a1515;
}
```

`:root.dark` matches Tailwind's compiled output for `:root { @variant dark { ... } }` (that compiles to `:root:is(.dark, .dark *)` which simplifies to `:root.dark`). Same specificity, same behaviour, no preprocessor required.

## How long this took

About 90 minutes across two UAT rounds. Most of it was hunting in the wrong direction (specificity, then HMR caching) before opening devtools and checking what was actually served.

## Origin

- Phase: phase-1
- Commits: `54e4017a` (failed nesting fix) → `0ad5a1d8` (final fix with explicit selectors)

## Related

- Patterns: [theme-token-cascade-explicit-selectors.md](../patterns/theme-token-cascade-explicit-selectors.md)
