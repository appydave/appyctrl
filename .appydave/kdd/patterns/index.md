# Patterns

Reusable architectural and code patterns proven across 2+ phases.

## Documents

| Pattern                                                                                       | Description                                                                                                   | Impact   |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| [Seam Edit Discipline](seam-edit-discipline.md)                                               | One import + one composition line per upstream file edit, audited via check-seams.sh                          | critical |
| [Theme Token Cascade via Explicit :root Selectors](theme-token-cascade-explicit-selectors.md) | Use :root / :root.dark in plain CSS files, not @variant dark — directive only compiles in Tailwind's pipeline | critical |
| [Contract-Lock Fanout](contract-lock-fanout.md)                                               | Lock cross-slice TypeScript contracts in the planner brief before spawning parallel coders                    | high     |
| [Electron WebContentsView Lifecycle Management](electron-webcontentsview-lifecycle.md)        | Store {view, win} pairs, always listen for destroyed events, apply devicePixelRatio to bounds, validate URLs  | high     |
