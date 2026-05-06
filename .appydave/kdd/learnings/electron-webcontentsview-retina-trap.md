---
type: learning
phase: phase-3
date: 2026-05-06
title: "WebContentsView Bounds on macOS Retina: CSS Pixels vs Device Pixels"
description: getBoundingClientRect() returns CSS pixels. WebContentsView.setBounds() on macOS expects physical (device) pixels. On 2x Retina, omitting devicePixelRatio scaling causes a quarter-size overlay in the top-left quadrant.
category: learnings
tags: [electron, webcontentsview, retina, macos, bounds, scaling, ipc]
kdd_phase_origin: "phase-3"
kdd_error_signatures:
  - "embedded app renders at 25% size"
  - "webview positioned in top-left corner only"
  - "view clips at incorrect bounds on retina display"
  - "css pixels don't match device pixels"
kdd_hard_won: true
kdd_impact: critical
kdd_related_docs:
  - ../patterns/electron-webcontentsview-lifecycle.md
---

# WebContentsView Bounds on macOS Retina: CSS Pixels vs Device Pixels

## Symptom

During Phase 3 UAT on a MacBook Pro (Retina 2×), the embedded app panel rendered at approximately **25% of the intended size** and was positioned in the **top-left corner** instead of filling the main panel area. On a non-Retina display or in the Simulator (1×), the same code worked correctly.

Inspector tools showed the container div had the correct logical bounds (e.g., `width: 800px`), but the WebContentsView appeared as a small 400×400 overlay flush to the top-left.

## Investigation

What I tried that didn't work:

- **Suspect 1:** incorrect bounds calculation in the React component. Logged `getBoundingClientRect()` and confirmed the values matched the visual container. Ruled out.
- **Suspect 2:** Electron version (40.9.3) — searched changelog for known WebContentsView bugs. Found nothing related to scaling.
- **Suspect 3:** the CSS pixel calculations in the bounds object. Tried doubling the values manually to see if scale was the issue. **Result:** the view doubled in size, confirming the root cause was a 2× mismatch.

What unblocked me: **checked the Retina display settings** (System Preferences → Displays → Resolution: "Scaled"). Native Retina resolution is 2×, which means 1 CSS pixel = 2 device (physical) pixels. The bounds object was being calculated in CSS pixels but `WebContentsView.setBounds()` on macOS **expects device pixels**.

## Root cause

`getBoundingClientRect()` returns the bounding box in **CSS pixels** — the logical coordinate space that the DOM renderer uses. On a 2× Retina display:
- CSS pixel = 1 unit in the DOM
- Device pixel = 2× the physical hardware pixels

`WebContentsView.setBounds()` on macOS takes **device pixels** (physical coordinates for the Electron window's content view). Without converting CSS pixels to device pixels, the bounds are off by a factor of 2 in each dimension — resulting in 25% area (0.5 × 0.5) and positioned at the wrong corner.

Example:
```
Container width in CSS: 800px
getBoundingClientRect(): { width: 800 }
devicePixelRatio: 2
Expected bounds for WebContentsView: { width: 1600 }
```

Without the multiplier, `setBounds({ width: 800 })` renders an 800-device-pixel view. On a 2× display, that's visually 400×400 CSS pixels — 25% of the container.

## Fix

Multiply all bounds values by `window.devicePixelRatio` before sending to the main process:

**Before (broken on Retina):**
```tsx
const rect = containerRef.current.getBoundingClientRect();
window.appyBridge.showWebview({
  url: appUrl,
  bounds: {
    x: rect.left,      // ✗ CSS pixels
    y: rect.top,       // ✗ CSS pixels
    width: rect.width, // ✗ CSS pixels
    height: rect.height, // ✗ CSS pixels
  },
});
```

**After (works on Retina and non-Retina):**
```tsx
const rect = containerRef.current.getBoundingClientRect();
const dpr = window.devicePixelRatio;
window.appyBridge.showWebview({
  url: appUrl,
  bounds: {
    x: Math.round(rect.left * dpr),       // ✓ device pixels
    y: Math.round(rect.top * dpr),        // ✓ device pixels
    width: Math.round(rect.width * dpr),  // ✓ device pixels
    height: Math.round(rect.height * dpr), // ✓ device pixels
  },
});
```

Note: `Math.round()` is required — floating-point device pixels cause unexpected clipping or offset rendering.

## How long this took

About 4 hours across two UAT sessions:
1. Initial observation on Retina MacBook (1 hour)
2. Hypothesis testing on Simulator (1× — no issue, incorrectly dismissed as environment-specific)
3. Manual 2× scaling tests (1.5 hours)
4. Root cause investigation and fix (1.5 hours)

The key breakthrough was testing on the actual Retina hardware and checking system display settings.

## Applicability

This affects **any Electron API that takes pixel coordinates** and is called from web-renderer code:
- `WebContentsView.setBounds()`
- `BrowserView.setBounds()` (deprecated but same issue)
- Any custom bounds passed to native code via IPC

## Prevention

In code review or testing checklist:
- [ ] If bounds come from `getBoundingClientRect()` or similar DOM API, apply `window.devicePixelRatio` multiplier
- [ ] Test on a Retina display (or use device emulation in DevTools)
- [ ] Log the final bounds values to confirm the multiplier was applied

## Origin

- Phase: phase-3
- Commits: discovery in UAT, fix applied to main process bounds handler
- Related: ADR-0003 (WebContentsView decision)
