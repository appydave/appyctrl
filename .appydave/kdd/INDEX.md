# AppyCtrl KDD — Knowledge Driven Development

Master taxonomy and entry point for all curated knowledge assets in this project. Maintained by Lisa (`.claude/agents/appydave/lisa.md`).

> "Knowledge Assets Over Documentation" — patterns, examples, and lessons are living references the next phase will use, not static docs that rot.

---

## Categories

| Category | Purpose | Index |
|---|---|---|
| `foundation/` | Setup, configuration, and conceptual reference (the "what is this codebase" context) | [foundation/index.md](foundation/index.md) |
| `patterns/` | Reusable architectural and code patterns proven across 2+ phases | [patterns/index.md](patterns/index.md) |
| `operations/` | Troubleshooting guides and runbooks for ops-time problems | [operations/index.md](operations/index.md) |
| `frameworks/` | Framework-specific knowledge (TanStack, Effect, Electron, shadcn) | [frameworks/index.md](frameworks/index.md) |
| `learnings/` | Hard-won lessons captured in-the-moment from real bugs and gotchas | [learnings/index.md](learnings/index.md) |
| `examples/` | Working code extracted from successful phases — copy-paste-ready | [examples/index.md](examples/index.md) |
| `decisions/` | Architecture Decision Records (ADRs) with rationale and removal conditions | [decisions/index.md](decisions/index.md) |
| `meta/` | KDD methodology, Lisa changelog, taxonomy notes | [meta/index.md](meta/index.md) |
| `templates/` | Frontmatter templates for the four document types | [templates/](templates/) |

## Journey-based discovery

When you don't know exactly which doc you need, walk the journey:

```
Getting started      → foundation/
Building something   → patterns/  +  examples/
Stuck on a bug       → operations/  +  learnings/
Framework gotcha     → frameworks/
Architectural choice → decisions/
```

## Frontmatter convention

Every KDD doc carries the same frontmatter (see Lisa agent definition for the full spec). Required fields:

```yaml
---
title: ""
description: ""
category: patterns|learnings|decisions|examples|operations|frameworks|foundation|meta
tags: [...]
date_created: YYYY-MM-DD
last_updated: YYYY-MM-DD
kdd_phase_origin: "phase-N"
kdd_impact: critical|high|medium|low
kdd_hard_won: true|false
kdd_related_docs: [...]
---
```

## Standards

- **100% link health.** 95% is failure. Run `*validate-topology` before every phase commit.
- **Evidence-based.** Every claim cites a commit SHA, phase id, file path, or measurement.
- **No duplication.** Run `*search-similar` before drafting; consolidate if 70%+ overlap.
- **Update in place.** Same problem reappears? Update the existing learning, don't write a new one.

## How knowledge enters this system

1. A phase ships (commit lands, AC met)
2. User runs `bash scripts/capture-swarm.sh` (Ruflo skill) to record the build retrospectively
3. Lisa is invoked: `*curate {phase-id}`
4. Lisa reads the swarm-build, the diff, and the commit log; drafts new patterns/learnings/decisions/examples; updates indexes; verifies 100% link health
5. Phase is closed
