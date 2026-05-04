---
name: t3-upstream-refresh
description: Full upstream refresh cycle for the appyctrl fork of pingdotgg/t3code. Use when David says "do the upstream refresh", "sync upstream", "pull from Theo", or "run the morning upgrade". Runs git fetch + rebase, updates deps, logs what Theo shipped, checks the gap-analysis watch list, verifies patches survived, and pushes. Only makes sense in /Users/davidcruwys/dev/ad/apps/appyctrl.
---

# T3 Upstream Refresh

Full reference: `.appydave/docs/upstream-refresh-runbook.md`

## Step 1 — Register t3code in upstream system (first time only)

Check if t3code is in `~/dev/upstream/repos.jsonl`:

```bash
grep -q '"name": "t3code"' ~/dev/upstream/repos.jsonl && echo "registered" || echo "missing"
```

If missing, append this line to `repos.jsonl`:

```json
{"name": "t3code", "remote": "https://github.com/pingdotgg/t3code.git", "local": "~/dev/upstream/repos/t3code", "language": "typescript", "brain": ["appyctrl"], "status": "active", "purpose": "upstream", "description": "T3 Code — upstream source for appyctrl fork. Electron + React coding assistant (pingdotgg).", "tags": ["t3code", "electron", "typescript", "upstream", "appyctrl"], "last_pulled": "2026-05-03"}
```

Then clone if not present:

```bash
[ -d ~/dev/upstream/repos/t3code/.git ] || git clone https://github.com/pingdotgg/t3code.git ~/dev/upstream/repos/t3code
```

## Step 2 — Pull upstream snapshot

```bash
git -C ~/dev/upstream/repos/t3code pull --ff-only
```

## Step 3 — Rebase appyctrl

```bash
cd /Users/davidcruwys/dev/ad/apps/appyctrl
git fetch upstream
git log --oneline HEAD..upstream/main          # preview incoming commits
git diff HEAD..upstream/main --name-only | grep -E "(auth|root|main|router|ws\.ts)"  # conflict risk
git rebase upstream/main
bun install
bun typecheck                                  # scan for 'error', not just exit code
```

If rebase conflicts: check `.appydave/patches/manifest.md` for each patched file, keep the `[APPYDAVE-PATCH]` block intact, take upstream's new code around it, then `git rebase --continue`.

## Step 4 — Log what Theo shipped

Append an entry to `.appydave/logs/upstream-log.md`:

- Date + commit range (`git log --oneline HEAD..upstream/main` before rebase)
- Feature-level summary (not raw commit messages — what does it actually do?)
- Overlap column: check each entry against the AppyDave watch list

## Step 5 — Check gap-analysis watch list

Read `.appydave/logs/gap-analysis.md` → Watch list section.

For each watched feature, ask: did any incoming commit touch it?

| Watch item | Signal to look for |
|---|---|
| Upgrade button | `git fetch`, rebase automation, "update" UI |
| Apps launcher | sidebar changes, external URL handling, BrowserWindow |
| Branding injection | `ipc.ts`, `appBranding.ts`, `DesktopBridge` interface |

If an overlap is found, add it to the **Active gaps** section of `gap-analysis.md`.

## Step 6 — Verify patches survived

Read `.appydave/patches/manifest.md`. For each active patch, confirm the `[APPYDAVE-PATCH]` annotation is still present in the listed files:

```bash
grep -n "APPYDAVE-PATCH" apps/web/src/environments/primary/auth.ts
grep -n "APPYDAVE-PATCH" apps/web/src/environments/primary/context.ts
grep -n "APPYDAVE-PATCH" apps/web/src/routes/__root.tsx
```

If a patch annotation is missing, the rebase conflict resolution dropped it — re-apply from manifest.

## Step 7 — Push

```bash
git push --force-with-lease origin main
```

## Step 8 — Update upstream-log last_pulled date

Update `last_pulled` in `~/dev/upstream/repos.jsonl` for the t3code entry to today's date.

## Done

Report: commits absorbed, any overlaps found, patch status (all survived / re-applied), typecheck result.
