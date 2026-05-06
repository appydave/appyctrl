---
title: "exactOptionalPropertyTypes Forbids Passing `undefined` to Optional Properties"
description: "t3code uses TypeScript's strict exactOptionalPropertyTypes flag. `obj.field = undefined` is not assignable to `field?: string`. Use conditional spread instead."
category: learnings
tags: [typescript, strict, optional, tsconfig, fork-discipline]
date_created: 2026-05-06
last_updated: 2026-05-06
kdd_journey_stage: learnings
kdd_phase_origin: "phase-2"
kdd_error_signatures:
  - "Type 'undefined' is not assignable to type 'string'."
  - "Types of property 'glyph' are incompatible"
  - "exactOptionalPropertyTypes"
kdd_hard_won: false
kdd_impact: medium
kdd_related_docs:
  - ../patterns/contract-lock-fanout.md
---

# exactOptionalPropertyTypes Forbids Passing `undefined` to Optional Properties

## Symptom

When a Phase-2 subagent (coder-1 and coder-3 independently) wrote code like:

```ts
const app: RegisteredApp = {
  id,
  name,
  url,
  glyph: glyph || undefined, // <-- error here
  openExternal,
};
```

TypeScript reported:

```
Type 'undefined' is not assignable to type 'string'.
  Types of property 'glyph' are incompatible
```

even though the type declares `glyph?: string`.

## Investigation

Both coders hit the same error in independent files. The shared cause: t3code's tsconfig sets `exactOptionalPropertyTypes: true`. With that flag, `field?: string` means "the field may be absent OR a string." It does NOT mean "the field may be undefined." Assigning `undefined` is treated as a different kind of absence — explicitly present, with the value undefined — and rejected.

## Root cause

Standard TypeScript treats `field?: T` as `field: T | undefined`. With `exactOptionalPropertyTypes: true`, those become two different types:

- `field?: string` — field absent or has string value
- `field: string | undefined` — field present, may be string or undefined

Most npm-published packages predate this flag and use the looser interpretation. t3code is strict.

## Fix

Use conditional spread instead of explicit-undefined assignment:

```ts
// ❌ Wrong — fails under exactOptionalPropertyTypes
const app: RegisteredApp = {
  id,
  name,
  url,
  glyph: glyph || undefined,
  openExternal,
};

// ✅ Right — conditional spread
const app: RegisteredApp = {
  id,
  name,
  url,
  ...(glyph ? { glyph } : {}),
  openExternal,
};
```

The spread either includes `glyph: <string>` or omits the key entirely. Both are valid for `glyph?: string`.

For destructuring + reassignment patterns:

```ts
// ❌ Wrong
function update(patch: Partial<RegisteredApp>) {
  const { glyph: newGlyph, ...rest } = patch;
  return { ...current, ...rest, glyph: newGlyph }; // glyph: undefined possible
}

// ✅ Right
function update(patch: Partial<RegisteredApp>) {
  return { ...current, ...patch }; // spread skips undefined keys
}
```

## Generalised rule

Two rules of thumb when working in t3code:

1. **Never write `field: foo || undefined` for an optional property.** Use `...(foo ? { field: foo } : {})` instead.
2. **Prefer object spread over explicit reassignment** when copying with optional fields. Spread elides `undefined`-keyed entries; explicit assignment doesn't.

Add this to subagent briefs that touch types with optional fields. Both phase-2 coders ran into it independently, so the trap is reliable enough to pre-empt.

## How long this took

About 5 minutes per coder to diagnose + fix. The integrator (me) didn't have to redo any work because both coders already corrected before reporting back. Cost: 10 minutes total of subagent time that could have been zero with a one-paragraph note in the briefs.

## Origin

- Phase: phase-2
- Files: `packages/appydave/src/registry.ts`, `apps/web/src/appydave/apps/AppyAppModal.tsx`
- Commit: `96a0abf5`

## Related

- Patterns: [contract-lock-fanout](../patterns/contract-lock-fanout.md) — pre-empt this gotcha by adding it to the contract-lock section of every fanout brief
