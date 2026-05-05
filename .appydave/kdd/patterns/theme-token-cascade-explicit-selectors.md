---
title: "Theme Token Cascade via Explicit :root Selectors"
description: "Override shadcn semantic tokens for a custom theme by re-declaring at :root (light) and :root.dark (dark) — not via Tailwind's @variant dark in a non-Tailwind file."
category: patterns
tags: [theme, css, tailwind, shadcn, dark-mode, cascade, specificity]
date_created: 2026-05-05
last_updated: 2026-05-05
kdd_journey_stage: patterns
kdd_phase_origin: "phase-1"
kdd_hard_won: true
kdd_impact: critical
kdd_related_docs:
  - ../learnings/variant-dark-trap.md
  - ../decisions/adr-0002-reskin-via-tokens.md
---

# Theme Token Cascade via Explicit :root Selectors

## Context

Reskinning a shadcn-themed app (Tailwind v4 + `@custom-variant dark (&:is(.dark, .dark *))`) without forking components. The app already defines its tokens at `:root { ... @variant dark { ... } }` in its main CSS. We want our brand palette to win for both themes, while still letting the app's existing theme switcher own the `.dark` class on `<html>`.

## Pattern

Define the override CSS in its own file (`appydave/themes/themes.css`). Use **explicit selectors**, not `@variant dark`:

```css
:root {
  --background: #ebe2ce;
  --foreground: #3a2a1f;
  --primary: #b8860b;
  /* …all the semantic tokens you want to override… */
}

:root.dark {
  --background: #1a1515;
  --foreground: #faf5ec;
  --primary: #ffde59;
}
```

Import it in `main.tsx` _after_ the upstream `index.css`:

```ts
import "./index.css";
import "./appydave/themes/themes.css"; // loads after — wins ties
```

## Why this works

The upstream's `:root { @variant dark { ... } }` block compiles (via Tailwind v4) to selectors like `:root:is(.dark, .dark *)`, which simplifies to `:root.dark`. Specificity is `(0,1,1)` — element + class.

Our explicit `:root.dark` selector has identical `(0,1,1)` specificity. Same specificity = load order wins. Since our file imports after `index.css`, our tokens take effect.

```css
/* Compiled output, both files: */
:root.dark {
  --background: <upstream-dark-bg>;
} /* from index.css — loaded first */
:root.dark {
  --background: #1a1515;
} /* from themes.css — loaded after, wins */
```

## Counter-example (what NOT to do)

```css
/* ❌ Wrong: @variant dark in a file that's NOT processed by Tailwind */
:root {
  --background: #ebe2ce;

  @variant dark {
    --background: #1a1515; /* never reaches the browser */
  }
}
```

`@variant` is a Tailwind directive. It only compiles for files that pass through Tailwind's pipeline (typically the entry CSS that uses `@import "tailwindcss"`). A file imported as `import "./themes.css"` from a `.tsx` is loaded as plain CSS — Tailwind's preprocessor never sees it. The `@variant dark { ... }` block emits no rules. Symptom: dark mode falls back to upstream's tokens silently. Failure is invisible until you compare a computed style against the source.

```css
/* ❌ Also wrong: top-level @variant dark with the same problem */
@variant dark {
  --background: #1a1515;
}
```

## Origin

- Phase: phase-1
- Commits: `54e4017a` (failed nesting attempt) → `0ad5a1d8` (final fix with explicit selectors)
- File: `apps/web/src/appydave/themes/themes.css`

## Related

- Learnings: [variant-dark-trap.md](../learnings/variant-dark-trap.md)
- Decisions: [adr-0002-reskin-via-tokens.md](../decisions/adr-0002-reskin-via-tokens.md)
