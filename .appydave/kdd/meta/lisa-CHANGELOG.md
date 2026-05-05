# Lisa Changelog (AppyCtrl)

Append-only log of capability changes to Lisa for this project. Format follows the SupportSignal Lisa convention so cross-project enhancements remain trackable.

---

## [2026-05-05] AppyCtrl — Initial port from SupportSignal BMAD librarian

### ADDED

- Phase-based curation workflow (replaces BMAD story-based)
- `.appydave/kdd/` taxonomy (8 categories + templates dir)
- `kdd_phase_origin` frontmatter field
- AppyCtrl-shaped activation banner ("planner → coder → reviewer → tester → LISA")

### MODIFIED

- `*curate` input model: phase id + git diff + commit log + capture-swarm output (vs story file Dev Agent Record + QA Results)
- `phase-record-permissions` block (vs `story-file-permissions`)
- Workflow position banner

### DELETED

- `*epic-curation` (BMAD-specific)
- `*audit-docs` BMAD/POEM scope (replaced with `.appydave/` scope)
- BMAD core_principles entries that don't apply (Quinn integration, Sarah feedback loop, defense-in-depth across multiple agents)

### Files referenced

- Source: `/Users/davidcruwys/dev/clients/supportsignal/legacy.supportsignal.com.au/.bmad-core/agents/librarian.md`
- Target: `.claude/agents/appydave/lisa.md`

### Lessons learned

- Lisa's commands and principles port cleanly across workflows; only the _triggers_ and _input shapes_ differ between BMAD and phase-based projects.
- Frontmatter convention is reusable verbatim with one renamed field (`kdd_story_origin` → `kdd_phase_origin`).
- 100% link health standard is project-agnostic — keep it.
