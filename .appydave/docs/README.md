# AppyDave Docs Index

All strategy, design, and operational documentation for the AppyCtrl fork.

---

## Strategy

| Doc                                                    | What it covers                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| [extensibility-strategy.md](extensibility-strategy.md) | How to extend the fork without accumulating rebase conflicts — seam files, AppyDave-owned directories, extension patterns |
| [upstream-diff-strategy.md](upstream-diff-strategy.md) | How to track divergences from upstream deterministically — patch annotations, manifest, planned audit scripts             |

## Design

| Doc                              | What it covers                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [design-plan.md](design-plan.md) | Current AppyDave features in progress — branding, color tokens, apps launcher sidebar, Upgrade button |

## Operations

| Doc                                                        | What it covers                                                                                                                      |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [upstream-refresh-runbook.md](upstream-refresh-runbook.md) | **Step-by-step upstream rebase sequence** — lessons from first live run, conflict resolution guide                                  |
| [boot-sequence.md](boot-sequence.md)                       | Dev-mode startup race condition, why the fetch-timeout and splash-pending patches exist, what a proper upstream fix would look like |

## Logs

| File                                               | What it covers                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| [../logs/upstream-log.md](../logs/upstream-log.md) | What Theo ships each refresh — feature summaries, overlap flags             |
| [../logs/appydave-log.md](../logs/appydave-log.md) | What we build — status tracking per feature                                 |
| [../logs/gap-analysis.md](../logs/gap-analysis.md) | Overlaps between the two — decision framework for integration vs divergence |

## Patches

| File                                             | What it covers                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [../patches/manifest.md](../patches/manifest.md) | Registry of all deliberate divergences from upstream — root cause, removal conditions, rebase risk |
