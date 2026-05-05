---
title: "ADR-0001: Port Lisa librarian from BMAD-shaped to phase-shaped"
description: "Adopt SupportSignal's BMAD librarian (Lisa) and adapt her to AppyCtrl's phase-based workflow rather than building a new agent from scratch."
category: decisions
tags: [librarian, lisa, kdd, agents, bmad, knowledge-management]
date_created: 2026-05-05
last_updated: 2026-05-05
kdd_phase_origin: "phase-0"
kdd_impact: high
kdd_related_docs:
  - ../meta/lisa-CHANGELOG.md
status: accepted
---

# ADR-0001: Port Lisa librarian from BMAD-shaped to phase-shaped

## Status

accepted

## Context

AppyCtrl needs a Knowledge-Driven Development (KDD) curator agent — the role that, after every phase ships, extracts patterns/learnings/decisions/examples from the actual implementation and writes them to a discoverable knowledge base for future phases to consume.

The user already has a battle-tested librarian agent ("Lisa") in the SupportSignal BMAD project. Lisa is a v2.0 (Journey-Based Discovery) implementation: 17 commands, file-based, 100% link health standard, frontmatter convention, journey-based taxonomy, evidence-based docs.

BMAD is story-shaped (Bob → Sarah → James → Quinn → Lisa). AppyCtrl is phase-shaped (planner → coder → reviewer → tester → librarian). The agent role and outputs are identical; the workflow trigger differs.

## Decision

Port Lisa verbatim where possible, adapt only the trigger/input shape. Specifically:

- **Keep verbatim:** name (Lisa), persona, core principles, 100% link health standard, journey-based taxonomy, frontmatter convention, file-based-only constraint, evidence-based principle, master librarian secondary role.
- **Adapt:** activation banner (BMAD workflow → phase workflow); inputs (story file + Dev Agent Record + QA Results → phase id + git diff + commits + capture-swarm output); paths (`docs/kdd/` → `.appydave/kdd/`); frontmatter field rename (`kdd_story_origin` → `kdd_phase_origin`).
- **Drop:** BMAD-specific commands (`*epic-curation`); commands assuming SupportSignal's combined BMAD+POEM scope (`*audit-docs` shrinks from full docs/ tree to `.appydave/`).

## Alternatives considered

- **Build a new librarian from scratch.** Rejected — Lisa is already mature; rebuilding wastes the v1→v2 evolution lessons (context > keywords, battle-tested > theoretical, framework isolation, journey stages universal).
- **Use Lisa as-is.** Rejected — BMAD activation banner and `*epic-curation` would confuse users and produce wrong-shaped outputs in a non-BMAD project.
- **Run two librarians (one BMAD, one phase-shaped).** Rejected — same name, same role, different triggers = unnecessary confusion. One Lisa per project, adapted to the project's workflow shape.
- **Use a different name (Lyra, Larkin, Marian).** Rejected by user: "just because capabilities aren't quite the same doesn't mean the usage is different." Single canonical librarian name across projects.

## Consequences

### Positive

- AppyCtrl gets a v2.0-quality librarian on day one without a from-scratch build
- The frontmatter convention and taxonomy are reusable across projects, lowering the cost of running KDD anywhere
- Cross-project lessons (Lisa's CHANGELOG history) remain transferable if Lisa evolves further

### Negative

- Lisa now exists in two slightly-different shapes across two projects. Future enhancements need to be evaluated against both workflow models.
- BMAD-specific concepts (Quinn integration, Sarah feedback loop) appear in Lisa's source-of-truth file even though they don't apply here. Mitigated by a header comment marking the file as adapted.

### Neutral

- The `update-changelog` command remains functional but its purpose shifts slightly: from "track Lisa enhancements across all projects" to "track AppyCtrl-specific Lisa enhancements." The cross-project rollup happens by humans reading both projects' changelogs.

## Removal / supersedence condition

Replace this ADR if either of the following occurs:

- AppyCtrl's workflow shifts away from phase-based delivery (e.g. adopts BMAD stories) — in which case re-port Lisa from BMAD without the adaptations
- A successor librarian agent (Lisa v3.0) ships from another project with materially different capabilities worth adopting wholesale — in which case re-port and supersede this ADR

## References

- Phase: phase-0
- Commit: 8f3477bf
- Source librarian: `/Users/davidcruwys/dev/clients/supportsignal/legacy.supportsignal.com.au/.bmad-core/agents/librarian.md`
- Target librarian: `.claude/agents/appydave/lisa.md`
- Changelog: `.appydave/kdd/meta/lisa-CHANGELOG.md`
