---
title: "Subagent Bash from Subdirectories Leaks .claude-flow/ Folders"
description: "Ruflo's hook-system creates .claude-flow/data/pending-insights.jsonl wherever Bash commands run. Subagents that cd into apps/web/ leak these files into the working tree."
category: learnings
tags: [ruflo, hooks, subagents, gitignore, fork-discipline]
date_created: 2026-05-06
last_updated: 2026-05-06
kdd_journey_stage: learnings
kdd_phase_origin: "phase-2"
kdd_error_signatures:
  - "apps/web/.claude-flow/data/pending-insights.jsonl"
  - "phantom .claude-flow appears in subdirectory"
kdd_hard_won: false
kdd_impact: medium
kdd_related_docs:
  - ../patterns/contract-lock-fanout.md
---

# Subagent Bash from Subdirectories Leaks .claude-flow/ Folders

## Symptom

After a 3-way subagent fanout completed, `git status` showed an untracked file at:

```
apps/web/.claude-flow/data/pending-insights.jsonl
```

Phase 2's commit (96a0abf5) accidentally tracked this file because `git add -A` was run during integration.

## Investigation

The repo only had a project-root `.claude-flow/` directory previously. The new directory under `apps/web/` was unexpected.

`grep` of the file showed it contained Ruflo hook telemetry — the same shape as `.claude-flow/data/pending-insights.jsonl` at the repo root.

Tracing back: subagents (general-purpose, Explore) ran `cd apps/web && bun typecheck` as part of their quality-gate checks. Ruflo's hook system fires on every Bash command and writes the insight into `.claude-flow/data/pending-insights.jsonl` **relative to the current working directory at the time of the hook**. So `cd apps/web && bun typecheck` created `apps/web/.claude-flow/data/pending-insights.jsonl`.

## Root cause

Ruflo's hook resolves `.claude-flow/` relative to `pwd`, not relative to the project root. `.gitignore` had `.appydave/design-poc/**/.claude-flow/` (added when extracting the design POC also created the leak), but no rule covering arbitrary subdirectories of `apps/`.

## Fix

Add to `.gitignore`:

```gitignore
# Ruflo hook leakage — .claude-flow/ resolves relative to pwd of bash command,
# not project root, so any subdirectory cd'd into ends up with one.
**/.claude-flow/
!/.claude-flow/
```

Then untrack any leaked files with `git rm --cached -r apps/**/.claude-flow/`.

## Generalised rule

If you spawn subagents that run `cd <subdir> && <command>`, expect Ruflo to leak `.claude-flow/` into `<subdir>`. Either:

1. Brief subagents to run commands from the repo root (`bun typecheck` not `cd apps/web && bun typecheck`)
2. Add a global gitignore rule (above)
3. Both

Option 2 is the cheaper solution — `**/.claude-flow/` with a project-root negation works regardless of subagent behaviour.

## How long this took

5 minutes once spotted. The accidental commit means a follow-up `chore` commit is needed to add the gitignore rule and remove the file.

## Origin

- Phase: phase-2
- Commit: `96a0abf5` (where the leaked file got tracked)

## Related

- Patterns: [contract-lock-fanout](../patterns/contract-lock-fanout.md)
