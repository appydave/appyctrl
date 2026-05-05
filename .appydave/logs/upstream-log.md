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

| Feature                                | Commits | What it does                                                                                                                                                                |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitLab support                         | #2462   | New SCM provider alongside GitHub — merge requests, MR threads                                                                                                              |
| VCS driver foundation                  | #2435   | Major refactor: git-specific code abstracted into pluggable `VcsDriver` interface. `git.*` RPC methods renamed to `vcs.*`. This is a foundation for supporting non-git VCS. |
| GitHub adapter error alignment         | #2476   | Standardised error types across GitHub source control adapter                                                                                                               |
| Provider settings declarative metadata | #2452   | Settings UI driven by metadata rather than hardcoded logic — affects provider instance config forms                                                                         |
| Claude agent system prompt             | #2472   | Claude Code adapter opts into `claude_code` system prompt preset                                                                                                            |
| Invalid pairing token UX               | #2222   | Friendly error message for bad pairing tokens                                                                                                                               |
| Git actions dialog clipping fix        | #2458   | Visual fix — footer button was being clipped                                                                                                                                |
| Discord release version flag           | #2449   | CI/release tooling fix                                                                                                                                                      |

### Overlap with AppyDave work

| AppyDave feature | Overlap? | Notes                                                                                                                                                           |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branding         | None     | —                                                                                                                                                               |
| Color system     | None     | —                                                                                                                                                               |
| Apps launcher    | None     | —                                                                                                                                                               |
| Upgrade button   | Indirect | Upgrade flow will call git commands — VCS driver refactor renamed `git.*` → `vcs.*` RPCs. If upgrade button calls any git RPCs directly, use new `vcs.*` names. |

### Structural notes

The VCS driver refactor (`#2435`) is the most significant architectural change. It:

- Splits `apps/server/src/git/` → `apps/server/src/vcs/` + new driver pattern
- Renames all git-related RPC methods (`git.pull` → `vcs.pull`, `git.listBranches` → `vcs.listRefs`, etc.)
- Contracts in `packages/contracts/src/git.ts` now export with `Vcs*` prefixes alongside old `Git*` names

**Watch:** If we ever add git-touching code to AppyDave (e.g. the upgrade flow reads git status),
use the new `vcs.*` layer, not the old `git.*` one.

### No action required

None of these changes require AppyDave patches or modifications. Clean pass.

---

## 2026-05-04 — 1 commit (0ce7e56e..f7748a0d)

### What shipped

| Feature                  | Commits | What it does                                                                                                            |
| ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| Hide whitespace in diffs | #2389   | Toggle in diff panel to hide whitespace-only changes — affects `DiffPanel.tsx`, `CheckpointDiffQuery`, `SettingsPanels` |

### Overlap with AppyDave work

| AppyDave feature | Overlap? | Notes |
| ---------------- | -------- | ----- |
| Branding         | None     | —     |
| Apps launcher    | None     | —     |
| Upgrade button   | None     | —     |

### In-progress branches (visible via fetch)

- `t3code/azure-devops-provider` — Azure DevOps SCM provider (new SCM family, watch if it touches sidebar)
- `cursor/react-performance-scan` — React perf work (could touch component structure)
- `cursor/t3-review-diff-rendering` — diff rendering follow-on to #2389
- `t3code/remote-git-projects` — remote git project support
- `t3code/mobile-remote-connect` — mobile remote connection

### No action required

Clean pass. Patches survived. 10/10 typecheck.

---

## 2026-05-05 — 12 commits (f7748a0d..f4c9418d)

### What shipped

| Feature                                         | Commits          | What it does                                                                                                                 |
| ----------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Hosted Frontend, Tailscale, SSH Launcher        | #2361            | New `packages/ssh` + `packages/tailscale`, hosted pairing flow, SSH password prompt dialog, remote endpoint advertising      |
| Bitbucket + Azure DevOps SCM providers          | #2473, #2500     | New `BitbucketApi`, `AzureDevOpsCli`, `SourceControlProviderRegistry` overhaul; provider discovery refactor                  |
| Remote repository publish + discovery           | #2482            | Push/pull from hosted endpoints, advertised endpoints, version skew detection                                                |
| Startup time -47%, memory -150-300MB            | #2204            | Bootstrap restructure — splits primary/auth + primary/context flows, new `bootstrap.test.ts`, `authBootstrap.test.ts`        |
| Collapsible file diffs, @pierre/diffs bump      | #2502            | Diff panel UX improvement                                                                                                    |
| Mobile composer collapsed by default            | #1263            | ChatComposer + ComposerBannerStack rework                                                                                    |
| Markdown highlight render stability             | #2479            | ChatMarkdown.tsx                                                                                                             |
| Focus-ring clipping fix in AnimatedHeight       | #2503            | New AnimatedHeight component                                                                                                 |
| effect-language-service prepare hook            | #2497            | `package.json` adds `prepare` script (caused our package.json conflict — both kept)                                          |
| README: add OpenCode to supported agents        | #2436            | Docs only                                                                                                                    |
| Version test fix                                | #2490            | Test fix                                                                                                                     |
| Migration 029 (projection thread ordering)      | —                | New SQLite migration                                                                                                         |

### Overlap with AppyDave work

| AppyDave feature | Overlap?    | Notes                                                                                                                                                  |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Branding         | None        | —                                                                                                                                                      |
| Apps launcher    | None        | —                                                                                                                                                      |
| Upgrade button   | **Watch**   | New SSH/Tailscale/hosted-pairing flow uses similar progressive-status UX patterns we'd want for Upgrade — review for reusable components               |
| Bug-fix patches  | **Removed** | PR #2204 restructured bootstrap. `fetchWithBootstrapTimeout` (`fetch-timeout`) broke 10 new upstream tests; both `fetch-timeout` + `splash-pending` removed per manifest "Remove when" criterion |

### Conflicts during rebase

- `package.json` — kept both `prepare` (upstream #2497) and `appydave:dev` script (ours)
- `apps/web/src/routes/__root.tsx` — auto-merged cleanly (patch then removed)

### Action taken

- Both bug-fix patches dropped (see `.appydave/patches/manifest.md` Removed section)
- `apps/web` tests: 994/994 pass after patch removal
- Pre-existing upstream failures: 2 in `apps/server/src/git/GitManager.test.ts` (slash-remote synthetic alias tests, 20s timeout on pristine upstream too — not ours)

