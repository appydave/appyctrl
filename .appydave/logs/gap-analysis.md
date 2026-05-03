# Gap Analysis

Tracks overlaps between AppyDave planned/built features and upstream (Theo's) work.
Updated after each upstream refresh where an overlap is detected.

Three scenarios:
- **We built it, Theo ships it** → decide: keep ours, take his, or merge
- **We planned it, Theo is clearly building it** → wait and see vs build now
- **We built it differently** → track the divergence, decide on next refresh

---

## Active gaps

_(none yet — first refresh showed no overlaps with planned AppyDave features)_

---

## Resolved gaps

_(none yet)_

---

## Watch list

Features we're planning that Theo *might* ship. Check these after each refresh.

| AppyDave feature | Why Theo might ship it | Watch signal |
|-----------------|----------------------|--------------|
| Upgrade button (upstream sync) | Theo may add auto-update from upstream for his own forks/deployments | Any commit touching `git fetch`, rebase automation, or "update" UI |
| Apps launcher | Theo may add external tool integration or a browser panel | Any commit touching sidebar, external URL handling, or BrowserWindow |
| Branding injection | Already exists via `DesktopAppBranding` — Theo may expand it | Changes to `ipc.ts` DesktopBridge interface or `appBranding.ts` |

---

## Decision framework

When an overlap is detected:

**Theo ships first, we haven't built it yet:**
→ Take his version. Update our plan to note it's superseded. No code needed.

**We shipped first, Theo ships a different version:**
→ Compare approaches. If his is better: mark ours superseded, migrate to his.
→ If ours is better or domain-specific: keep ours, note the divergence in patches/manifest.md.

**We're building it, Theo is clearly heading there:**
→ Pause our work. Wait one or two upstream refreshes to see his approach.
→ Then decide: align with his direction or diverge intentionally.

**We built it specifically for AppyDave (branding, apps launcher):**
→ Theo will never ship this. No gap analysis needed. Keep indefinitely.
