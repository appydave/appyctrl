---
title: "Search Upstream for Existing Systems Before Building a Parallel One"
description: "Before building any cross-cutting capability (theming, settings, persistence), grep upstream for existing implementations. Two parallel systems writing the same DOM/storage will silently fight."
category: learnings
tags: [upstream, fork, theme, settings, integration, anti-pattern]
date_created: 2026-05-05
last_updated: 2026-05-05
kdd_journey_stage: learnings
kdd_phase_origin: "phase-1"
kdd_error_signatures:
  - "two systems both writing .dark class"
  - "switcher works but state doesn't persist"
  - "settings panel duplicate"
kdd_hard_won: true
kdd_impact: high
kdd_related_docs:
  - ../decisions/adr-0002-reskin-via-tokens.md
---

# Search Upstream for Existing Systems Before Building a Parallel One

## Symptom

Phase 1 spec called for a Settings → Appearance panel with a Light/Dark theme switcher. Built it: own `useTheme()` hook, own `appydave.theme` localStorage key, own `initializeTheme()` call from `main.tsx`, own panel component, own route. Worked in isolation. Then UAT revealed the user already had a Theme dropdown in Settings → General that ALSO toggled `.dark` on `<html>`. Two switchers competing for the same DOM class with different storage keys — last writer wins, state out of sync.

## Investigation

The duplicate was discovered via UAT screenshot showing two settings entries: my new "Appearance" tab and a pre-existing "Theme" dropdown under General. Once I knew it existed, two greps would have caught it pre-build:

```bash
grep -rn "classList.add.*dark\|classList.toggle.*dark" apps/web/src/
grep -rn "useTheme\|ThemeProvider" apps/web/src/
```

Either of those run _before_ writing my own theme system would have surfaced `apps/web/src/hooks/useTheme.ts` — a complete, tested, hook-based implementation with `t3code:theme` storage, system-preference following, and cross-tab sync. Skipping that step cost ~2 hours of build + 1 hour of unwind.

## Root cause

I treated the spec as if it were greenfield. The phrase "Settings → Appearance panel with theme switcher" became a build instruction without first checking whether the underlying capability already existed. In a fork that rebases against an active upstream, **most cross-cutting capabilities are already there** — they just may not be wired to the surface I want.

## Fix

Deleted everything: my `useTheme.ts`, `initializeTheme.ts`, `types.ts`, `AppearanceSettings.tsx`, `settings.appearance.tsx` route, and the seam edit on `SettingsSidebarNav.tsx`. Kept `themes.css` (purely token-level). Theme state ownership: upstream's `hooks/useTheme.ts`. Visual reskin ownership: my `themes.css`. Two responsibilities, one each.

## How long this took

About 2 hours building the duplicate + 30 minutes deleting it. Net cost: 2.5 hours.

## Generalised rule

Before building any "cross-cutting capability that touches global state" (theming, persistence, focus management, notifications, command palette, keyboard shortcuts, etc.) in a fork:

1. Grep upstream for the obvious global mutation (`classList.toggle`, `localStorage.setItem`, `dispatchEvent`, etc.)
2. Grep for the obvious React shape (`use<Capability>`, `<CapabilityProvider>`)
3. Grep for routes/pages that already host UI for the capability
4. If anything turns up, your job is to _extend_ it via tokens / additional UI elements / new entries in its registries — **not** to build a parallel system

The spec phrase "add a switcher" is ambiguous between "wire a new one" and "expose the existing one differently." Treat it as the latter until proven otherwise.

## Origin

- Phase: phase-1
- Commits: `87f603c5` (duplicate built) → `54e4017a` (duplicate deleted)

## Related

- Decisions: [adr-0002-reskin-via-tokens.md](../decisions/adr-0002-reskin-via-tokens.md)
