# Spec — Light Mode Design System (Phase 1)

**Status:** approved · **Phase:** 1 · **Depends on:** Phase 0 deliverables (this spec, Lisa, KDD seed) · **Blocks:** Phase 2

---

## Goal

Ship two AppyDave-branded themes (Light = default, Dark = option) and an AppyCtrl wordmark, plus a user-facing theme switcher. Cold-T3 stays in CSS as a reference token block but is **not** user-selectable.

## Non-goals

- Density toggle (compact/comfy) — dev-only, not shipped
- Accent intensity (subtle/balanced/loud) — dev-only, not shipped
- Cold-T3 user toggle — kept in tokens for A/B comparison only
- Replacing or restyling t3code chat surface (`Conversation`, `ChatComposer`) — they consume the same `--ac-*` tokens, no extra work

## Source of truth (POC)

- `.appydave/design-poc/appyctrl/project/styles/colors_and_type.css` — universal AppyDave brand tokens (fonts, palette, scale, spacing, radii)
- `.appydave/design-poc/appyctrl/project/styles/appyctrl.css` — three theme blocks (`[data-theme="dark"|"light"|"cold-t3"]`) plus density/accent variants and shared chrome rules
- POC `App.jsx` — pattern: `root.setAttribute('data-theme', tweaks.theme)` on the document root

## Files

### Seam edits (annotate `[APPYDAVE-PATCH id="..." type="seam"]` + manifest entry)

| File                                                      | Edit                                                                                                                                                          | Patch id                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `apps/web/src/main.tsx`                                   | Already imports `./appydave/brand.css` (existing). Replace import with `./appydave/themes/themes.css` (entry that itself `@import`s the two CSS files below). | `theme-css-entry`         |
| `apps/web/src/components/Sidebar.tsx`                     | Replace `<T3Wordmark />` (and adjacent "Code" text) with `<AppyCtrlWordmark />`. One import + one element swap.                                               | `sidebar-wordmark`        |
| `apps/web/src/components/settings/SettingsSidebarNav.tsx` | Append `{ label: "Appearance", to: "/settings/appearance", icon: PaintbrushIcon }` to `SETTINGS_NAV_ITEMS`; extend `SettingsSectionPath` union.               | `settings-appearance-nav` |

### Additive (no seam, never conflict)

```
apps/web/src/appydave/
  themes/
    themes.css                 # Entry — imports the two below
    colors-and-type.css        # Verbatim port of POC colors_and_type.css
    appyctrl-themes.css        # Verbatim port of POC appyctrl.css (all 3 themes kept)
    ThemeProvider.tsx          # Sets data-theme on documentElement; persists to localStorage
    useTheme.ts                # Hook: { theme, setTheme }
    types.ts                   # type Theme = "light" | "dark"  (cold-t3 NOT exported)

  AppyCtrlWordmark.tsx         # New — replaces existing AppyWordmark.tsx (which was AppyDave-branded)

  settings/
    AppearanceSettings.tsx     # Theme switcher panel using SettingsSection from upstream

apps/web/src/routes/
  settings.appearance.tsx      # New route — renders AppearanceSettings inside settings layout
```

### Existing file decisions

- `apps/web/src/appydave/AppyWordmark.tsx` — **delete**. Replaced by `AppyCtrlWordmark.tsx`.
- `apps/web/src/appydave/brand.css` — **delete**. Replaced by `themes/themes.css` entry. (Manifest entry update — this file's role moves.)

## Theme switcher UX

- Location: Settings → Appearance (new panel)
- Control: shadcn segmented `RadioGroup` with two cards — **Light** and **Dark** — each with a small swatch preview (canvas, sidebar, accent)
- Persistence: `localStorage["appydave.theme"]`, applied on app mount before first paint to avoid flash
- Default on first run: **Light**

## Wordmark spec

- Text: "AppyCtrl" (single word, not split like AppyDave)
- Font: `var(--font-display)` (Bebas Neue)
- Color: `var(--ac-fg-1)` (theme-aware — warm brown on light, near-white on dark)
- Optional accent: small dot or underline in `var(--ac-accent)` (defer; ship plain word in Phase 1)
- Replaces: `<T3Wordmark />` SVG + adjacent "Code" text in `Sidebar.tsx`

## Acceptance criteria

1. App boots with `data-theme="light"` by default; renders without flash on cold start
2. Settings → Appearance shows two-option switcher; switching applies instantly across sidebar, topbar, settings, and chat surface
3. Wordmark in sidebar reads "AppyCtrl" in both themes, theme-aware foreground
4. `bun fmt && bun lint && bun typecheck && bun run test` all pass
5. No upstream files touched outside the three seam edits above
6. `check-seams.sh` reports the three seam edits, all annotated

## Out of scope / deferred

- Theme transitions (fade between themes) — not worth the complexity
- High-contrast / a11y theme — future phase
- Cold-T3 toggle in dev-only TweaksPanel — possible Phase 1.5 if useful
- Brand wordmark with two-color split (AppyCtrl-style) — defer; plain wordmark for now
