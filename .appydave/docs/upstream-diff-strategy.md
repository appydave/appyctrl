# Upstream Diff Strategy

How to track, audit, and manage divergences from upstream t3code deterministically.

---

## The problem at scale

With hundreds of upstream commits over time, two questions become hard to answer manually:
1. Which files in our fork differ from upstream, and why?
2. Are all divergences accounted for, or did something slip in undocumented?

---

## The two-source approach

**Source A — patch annotations in code**
Every deliberate change to an upstream file is marked `[APPYDAVE-PATCH id="..."]` inline.
Greppable, visible during rebase conflicts, self-contained rationale.

**Source B — `.appydave/patches/manifest.md`**
The authoritative registry. One entry per patch, keyed by id. Contains root cause,
upstream status, removal conditions, rebase risk.

A diff is **accounted** if it appears in both Source A and Source B.
A diff is **unaccounted** if it appears in git diff but not in the manifest — that's a signal
something changed without documentation.

---

## Planned tools in `.appydave/scripts/`

These do not exist yet. This document describes what they should do.

### `audit-patches.sh` (or `.ts`)

Runs `git diff upstream/main HEAD` filtered to non-AppyDave files, then cross-references
against `manifest.md`.

Output:
```
✓ accounted   apps/web/src/environments/primary/auth.ts         [fetch-timeout]
✓ accounted   apps/web/src/environments/primary/context.ts      [fetch-timeout]
✓ accounted   apps/web/src/routes/__root.tsx                    [splash-pending]

✗ unaccounted apps/server/src/some-file.ts                      (not in manifest)

Seam files with changes:
  (none)

Summary: 3 accounted, 0 unaccounted, 0 seam changes
```

Unaccounted diffs mean something was changed without a patch entry — either document it
or revert it.

### `diff-upstream.sh`

Raw `git diff upstream/main HEAD` scoped to everything except `appydave/` directories
and `.appydave/`. Shows the raw divergence for manual review or before a rebase.

### `check-seams.sh`

Runs `git diff upstream/main HEAD` scoped to the five seam files only:
- `apps/web/src/main.tsx`
- `apps/web/src/router.ts`
- `apps/server/src/ws.ts`
- `apps/server/src/bootstrap.ts`
- `apps/desktop/src/main.ts`

Useful immediately after `git fetch upstream` to know if a rebase will hit seam conflicts.

---

## Upgrade flow integration

When the Upgrade button (conversational Claude session) is built, it should:
1. Run `audit-patches.sh` before rebasing — confirm all divergences are accounted for
2. Run `check-seams.sh` — flag seam conflicts for manual review
3. After rebase, run `audit-patches.sh` again — any new unaccounted diffs mean the
   rebase introduced something unexpected
4. For each patch in the manifest, check if upstream has shipped a native fix —
   if so, flag it for removal

---

## Removal lifecycle

When upstream ships a fix that supersedes one of our patches:
1. Remove the `[APPYDAVE-PATCH]` annotation from the source file
2. Move the manifest entry from `## Active patches` to `## Removed patches` with a
   removal date and note of what upstream change made it obsolete
3. Run `audit-patches.sh` to confirm zero unaccounted diffs

This gives a permanent audit trail of what we fixed, when, and when it was no longer needed.
