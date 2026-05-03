# Upstream Log

Append-only record of what Theo ships each time we run an upstream refresh.
One entry per refresh. Purpose: track upstream direction, spot overlaps with AppyDave work.

Format per entry:
- Date + commit range
- Feature-level summary (not just commit messages)
- Overlap flag: does any of this touch AppyDave planned/built features?

---

## 2026-05-03 — 8 commits (c0dff6b1..0ce7e56e)

### What shipped

| Feature | Commits | What it does |
|---------|---------|--------------|
| GitLab support | #2462 | New SCM provider alongside GitHub — merge requests, MR threads |
| VCS driver foundation | #2435 | Major refactor: git-specific code abstracted into pluggable `VcsDriver` interface. `git.*` RPC methods renamed to `vcs.*`. This is a foundation for supporting non-git VCS. |
| GitHub adapter error alignment | #2476 | Standardised error types across GitHub source control adapter |
| Provider settings declarative metadata | #2452 | Settings UI driven by metadata rather than hardcoded logic — affects provider instance config forms |
| Claude agent system prompt | #2472 | Claude Code adapter opts into `claude_code` system prompt preset |
| Invalid pairing token UX | #2222 | Friendly error message for bad pairing tokens |
| Git actions dialog clipping fix | #2458 | Visual fix — footer button was being clipped |
| Discord release version flag | #2449 | CI/release tooling fix |

### Overlap with AppyDave work

| AppyDave feature | Overlap? | Notes |
|-----------------|---------|-------|
| Branding | None | — |
| Color system | None | — |
| Apps launcher | None | — |
| Upgrade button | Indirect | Upgrade flow will call git commands — VCS driver refactor renamed `git.*` → `vcs.*` RPCs. If upgrade button calls any git RPCs directly, use new `vcs.*` names. |

### Structural notes

The VCS driver refactor (`#2435`) is the most significant architectural change. It:
- Splits `apps/server/src/git/` → `apps/server/src/vcs/` + new driver pattern
- Renames all git-related RPC methods (`git.pull` → `vcs.pull`, `git.listBranches` → `vcs.listRefs`, etc.)
- Contracts in `packages/contracts/src/git.ts` now export with `Vcs*` prefixes alongside old `Git*` names

**Watch:** If we ever add git-touching code to AppyDave (e.g. the upgrade flow reads git status),
use the new `vcs.*` layer, not the old `git.*` one.

### No action required

None of these changes require AppyDave patches or modifications. Clean pass.
