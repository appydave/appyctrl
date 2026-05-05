# AppyCtrl Patch Manifest

All deliberate divergences from upstream t3code. Every entry here corresponds to an
`[APPYDAVE-PATCH]` annotation in the source file.

Types:

- **bug-fix** — fixes a genuine upstream bug; remove when upstream ships its own fix
- **feature** — AppyDave-owned functionality; keep indefinitely
- **seam** — minimal wiring line in a seam file; re-apply after any rebase conflict

---

## Active patches

_(none)_

---

## Removed patches

### fetch-timeout `bug-fix` — removed 2026-05-05

|             |                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------- |
| **Files**   | `apps/web/src/environments/primary/auth.ts`, `apps/web/src/environments/primary/context.ts` |
| **Added**   | 2026-05-03                                                                                  |
| **Removed** | 2026-05-05 — superseded by upstream PR #2204                                                |

**Why removed:** Upstream PR #2204 ("reduce startup time by ~47%") restructured the
dev-mode bootstrap flow. New tests in `bootstrap.test.ts` and `authBootstrap.test.ts`
assert exact `fetchMock.toHaveBeenCalledWith(url)` arguments — our `fetchWithBootstrapTimeout`
wrapper added a second arg (`{ signal }`) and broke 10 tests. The restructure also matches
the manifest's "Remove when" criterion. Patches dropped; if dev-mode hang reappears, file
upstream issue rather than re-patch.

### splash-pending `bug-fix` — removed 2026-05-05

|             |                                          |
| ----------- | ---------------------------------------- |
| **Files**   | `apps/web/src/routes/__root.tsx`         |
| **Added**   | 2026-05-03                               |
| **Removed** | 2026-05-05 — paired with `fetch-timeout` |

**Why removed:** This patch only existed to mask the long retry window introduced by
`fetch-timeout`. With upstream's faster startup (PR #2204), the pending-state black-screen
window should be brief enough that `pendingComponent` is unnecessary.
