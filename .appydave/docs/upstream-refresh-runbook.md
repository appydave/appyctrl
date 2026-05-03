# Upstream Refresh Runbook

Documented from first live run: 2026-05-03, 8 upstream commits (GitLab support, VCS driver refactor).

---

## The commands

```bash
git fetch upstream
git log --oneline HEAD..upstream/main   # preview what's coming
git diff HEAD..upstream/main --name-only | grep -E "(auth|root|main|router|ws\.ts)" # conflict risk check
git rebase upstream/main
bun install                              # always run — upstream may have updated deps
bun typecheck
git push --force-with-lease origin main
```

---

## What we learned

### 1. The rebase was cleaner than expected

We had three patched upstream files (`auth.ts`, `context.ts`, `__root.tsx`) and expected
conflicts. There were none. Git resolved all 8 commits automatically because upstream's
changes to those files didn't touch the same lines as our patches.

**Lesson:** Don't assume conflicts. Check with `git diff HEAD..upstream/main --name-only`
to see which files overlap, but run the rebase first — git is often smarter than expected.

### 2. Always run `bun install` after rebase

The new `sourceControlDiscoveryState.ts` imported `effect/unstable/reactivity`, which
wasn't available. `bun install` resolved it immediately by pulling updated lockfile deps.

**Lesson:** `bun install` is mandatory after every upstream rebase, not optional. Add it
to the standard sequence before typecheck.

### 3. Typecheck warnings vs errors

`bun typecheck` reported Effect lint hints (`effect(returnEffectInGen)`,
`effect(unnecessaryEffectGen)`) in upstream's own test files. These are warnings/messages,
not errors — exit code 0, all 10 tasks successful.

**Lesson:** Scan typecheck output for `error` not just non-zero exit. Upstream ships with
its own advisory lint hints that will always appear.

### 4. Log shape after rebase

After a clean rebase, `git log --oneline` shows:
```
<hash>  chore(appydave): our latest commit     ← AppyDave commits on top
<hash>  fix(dev): our earlier commit
<hash>  feat(scm): Gitlab (#2462)               ← upstream commits below
...
```
This is correct. Our commits always float on top. If an AppyDave commit appears below
an upstream commit, something went wrong.

### 5. force-with-lease is the right push flag

`--force-with-lease` (not `--force`) confirms nobody else pushed to origin between your
last fetch and your push. Safe for solo use; also protects against accidentally clobbering
a push from another machine.

---

## Conflict resolution (not needed this run — documented for future)

If `git rebase upstream/main` stops with a conflict:

```
CONFLICT (content): Merge conflict in apps/web/src/environments/primary/auth.ts
```

1. Open the file — find the `<<<<<<` markers
2. Check `.appydave/patches/manifest.md` for what our patch does and why
3. Take upstream's new code AND keep the `[APPYDAVE-PATCH]` block intact
4. `git add <file>` then `git rebase --continue`
5. Repeat for each conflicting file

After resolution, update `patches/manifest.md` if the patch context changed.

---

## Full standard sequence

```bash
# Morning upgrade ritual
git fetch upstream
git log --oneline HEAD..upstream/main          # see what's coming
git rebase upstream/main                       # rebase (resolve conflicts if any)
bun install                                    # update deps
bun typecheck                                  # verify (scan for 'error', not just exit code)
git push --force-with-lease origin main        # push
```

Time taken first run: ~5 minutes including learning. Expected ongoing: 2-3 minutes.
