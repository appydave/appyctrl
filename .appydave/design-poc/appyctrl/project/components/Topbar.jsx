/* AppyCtrl — Topbar
   Breadcrumb (project > thread name) + right-side action cluster:
   [+ Add action]  [VS Code Open ▾]  [Cloud Commit & push ▾]  [terminal]  [diff]
*/
const { useState: useStateTopbar, useEffect: useEffectTopbar, useRef: useRefTopbar } = React;

function ChromeButton({ children, onClick, active, title, hasCaret, leftIcon, style }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="ac-chrome-btn"
      data-active={active ? 'true' : 'false'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 28, padding: hasCaret ? '0 4px 0 10px' : '0 10px',
        background: active ? 'var(--ac-row-active)' : 'var(--ac-chrome-btn-bg)',
        border: '1px solid var(--ac-chrome-btn-border)',
        borderRadius: 6,
        color: 'var(--ac-fg-1)',
        fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {leftIcon}
      {children}
    </button>
  );
}

function SplitButton({ icon, label, items, onPick, accent }) {
  const [open, setOpen] = useStateTopbar(false);
  const wrap = useRefTopbar(null);
  useEffectTopbar(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={wrap} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        className="ac-chrome-btn ac-split-main"
        onClick={() => onPick && onPick(items[0])}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          height: 28, padding: '0 10px',
          background: 'var(--ac-chrome-btn-bg)',
          border: '1px solid var(--ac-chrome-btn-border)',
          borderRight: 'none',
          borderRadius: '6px 0 0 6px',
          color: accent || 'var(--ac-fg-1)',
          fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ display: 'inline-flex', color: accent || 'currentColor' }}>{icon}</span>
        <span>{label}</span>
      </button>
      <button
        className="ac-chrome-btn ac-split-caret"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          height: 28, width: 22,
          background: 'var(--ac-chrome-btn-bg)',
          border: '1px solid var(--ac-chrome-btn-border)',
          borderRadius: '0 6px 6px 0',
          color: 'var(--ac-fg-2)',
          cursor: 'pointer',
        }}
      >
        <IconChevronDown size={12} />
      </button>
      {open && (
        <div
          className="ac-popover"
          style={{
            position: 'absolute', top: 32, right: 0, zIndex: 60,
            background: 'var(--ac-popover-bg)',
            border: '1px solid var(--ac-popover-border)',
            borderRadius: 10,
            boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            padding: 6, minWidth: 200,
            color: 'var(--ac-fg-1)',
            fontFamily: 'var(--font-body)', fontSize: 13,
          }}
        >
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => { onPick && onPick(it); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '8px 10px', borderRadius: 6,
                color: 'var(--ac-fg-1)', fontSize: 13,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ac-row-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: it.iconColor || 'var(--ac-fg-2)', display: 'inline-flex' }}>{it.icon}</span>
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.shortcut && (
                <kbd style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  background: 'var(--ac-kbd-bg)', color: 'var(--ac-fg-2)',
                  padding: '1px 5px', borderRadius: 3,
                }}>{it.shortcut}</kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Topbar({ tweaks, onAddAction, onToggleTerminal, onToggleDiff, showTerminal, showDiff }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 12,
      height: 48, padding: '0 14px',
      background: 'var(--ac-topbar-bg)',
      borderBottom: '1px solid var(--ac-sidebar-border)',
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden' }}>
        <span style={{ color: 'var(--ac-fg-2)', overflow: 'hidden', textOverflow: 'ellipsis' }}>AppyDave wordmark and colors</span>
        <span style={{ color: 'var(--ac-fg-3)' }}>›</span>
        <span style={{ color: 'var(--ac-fg-1)', fontWeight: 500 }}>Appy Ctrl</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Action cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ChromeButton
          onClick={onAddAction}
          leftIcon={<IconPlus size={13} sw={2.2} />}
        >
          Add action
        </ChromeButton>

        <SplitButton
          icon={<IconVSCode size={14} />}
          label="Open"
          accent={tweaks.theme === 'cold-t3' ? '#3b9eff' : 'var(--ac-fg-1)'}
          items={[
            { icon: <IconVSCode size={15} />, iconColor: tweaks.theme === 'cold-t3' ? '#3b9eff' : 'var(--brand-gold)', label: 'VS Code', shortcut: '⌘O' },
            { icon: <IconFinder size={15} />, label: 'Finder' },
          ]}
        />

        <SplitButton
          icon={<IconCloud size={14} />}
          label="Commit & push"
          items={[
            { icon: <IconCommit size={15} />, label: 'Commit' },
            { icon: <IconCloud size={15} />, label: 'Push' },
            { icon: <IconGithub size={15} />, label: 'Create PR' },
          ]}
        />

        <ChromeButton
          title="Toggle terminal"
          onClick={onToggleTerminal}
          active={showTerminal}
          style={{ width: 30, padding: 0, justifyContent: 'center' }}
        >
          <IconTerminal size={14} />
        </ChromeButton>
        <ChromeButton
          title="Toggle diff view"
          onClick={onToggleDiff}
          active={showDiff}
          style={{ width: 30, padding: 0, justifyContent: 'center' }}
        >
          <IconDiff size={14} />
        </ChromeButton>
      </div>
    </header>
  );
}

window.Topbar = Topbar;
window.ChromeButton = ChromeButton;
window.SplitButton = SplitButton;
