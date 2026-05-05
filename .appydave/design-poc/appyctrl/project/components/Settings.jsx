/* AppyCtrl — Settings (modal-overlay full-screen). Four tabs: General, Source Control, Connections, Archive. */
const { useState: useStateSet, useEffect: useEffectSet } = React;

function SettingsScreen({ tweaks, onClose }) {
  const [tab, setTab] = useStateSet('general');
  useEffectSet(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tabs = [
    { id: 'general',  label: 'General',        icon: <Icon size={13} sw={1.7}><path d="M3 6h18M3 12h18M3 18h12" /></Icon> },
    { id: 'source',   label: 'Source Control', icon: <Icon size={13} sw={1.7}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="12" r="2.5" /><path d="M6 8.5v7M8.5 18a6 6 0 0 0 7-3.5" /></Icon> },
    { id: 'connect',  label: 'Connections',    icon: <Icon size={13} sw={1.7}><path d="M9 7l-3 3 3 3M15 7l3 3-3 3M11 17l2-10" /></Icon> },
    { id: 'archive',  label: 'Archive',        icon: <Icon size={13} sw={1.7}><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" /></Icon> },
  ];

  return (
    <div data-screen-label="02 Settings"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'var(--ac-canvas-bg)', color: 'var(--ac-fg-1)',
        display: 'flex', flexDirection: 'column',
      }}>
      {/* macOS chrome row + wordmark */}
      <div style={{
        display: 'flex', alignItems: 'center', height: 36,
        borderBottom: '1px solid var(--ac-sidebar-border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 8, padding: '0 14px' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: 999, background: c }} />
          ))}
        </div>
        <div style={{ paddingLeft: 12 }}>
          <Wordmark tweaks={tweaks} />
        </div>
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left rail */}
        <aside style={{
          width: 220, flexShrink: 0,
          borderRight: '1px solid var(--ac-sidebar-border)',
          background: 'var(--ac-sidebar-bg)',
          padding: 8,
          display: 'flex', flexDirection: 'column',
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                onMouseEnter={(e) => e.currentTarget.style.background = tab === t.id ? 'var(--ac-row-active)' : 'var(--ac-row-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = tab === t.id ? 'var(--ac-row-active)' : 'transparent'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 6, border: 'none',
                  background: tab === t.id ? 'var(--ac-row-active)' : 'transparent',
                  color: tab === t.id ? 'var(--ac-fg-1)' : 'var(--ac-fg-2)',
                  fontWeight: tab === t.id ? 600 : 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 13, textAlign: 'left',
                }}>
                <span style={{ color: 'inherit' }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <button onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ac-row-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 6, border: 'none',
              background: 'transparent', color: 'var(--ac-fg-2)',
              fontFamily: 'var(--font-body)', fontSize: 12.5,
              cursor: 'pointer', textAlign: 'left',
            }}>
            <Icon size={12} sw={1.8}><path d="M19 12H5M12 19l-7-7 7-7" /></Icon>
            Back
          </button>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '14px 32px', borderBottom: '1px solid var(--ac-sidebar-border)',
            color: 'var(--ac-fg-2)', fontFamily: 'var(--font-body)', fontSize: 13,
            flexShrink: 0,
          }}>Settings</div>
          <div style={{ flex: 1, padding: '20px 32px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 640 }}>
              {tab === 'general' && <SettingsGeneral />}
              {tab === 'source' && <SettingsSource />}
              {tab === 'connect' && <SettingsConnect />}
              {tab === 'archive' && <SettingsArchive />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Reusable bits ────────────────────────────────────────────── */
function GroupLabel({ children, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '0 4px 8px',
      color: 'var(--ac-fg-3)',
      fontFamily: 'var(--font-heading)', fontSize: 11,
      textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600,
    }}>
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
}

function Row({ title, sub, control, separator = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 4px',
      borderBottom: separator ? '1px solid var(--ac-sidebar-border)' : 'none',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: 'var(--ac-fg-1)', fontWeight: 600, fontSize: 13 }}>{title}</div>
        {sub && <div style={{ marginTop: 3, color: 'var(--ac-fg-3)', fontSize: 12 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

function FauxSelect({ label }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      height: 30, padding: '0 10px',
      background: 'var(--ac-input-bg)',
      border: '1px solid var(--ac-input-border)',
      borderRadius: 6,
      color: 'var(--ac-fg-1)',
      fontFamily: 'var(--font-body)', fontSize: 12.5,
      cursor: 'pointer',
    }}>
      <span>{label}</span>
      <IconChevronDown size={11} />
    </button>
  );
}

function Switch({ on, onChange }) {
  return (
    <button onClick={() => onChange?.(!on)}
      style={{
        width: 36, height: 20, borderRadius: 999, border: 'none',
        background: on ? 'var(--ac-accent)' : 'var(--ac-toggle-off)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 160ms var(--ease-out)',
      }}>
      <span style={{
        position: 'absolute', top: 2,
        left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: 999,
        background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        transition: 'left 160ms var(--ease-out)',
      }} />
    </button>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: 'var(--ac-msg-bg)',
      border: '1px solid var(--ac-msg-border)',
      borderRadius: 10,
      padding: 4,
      marginBottom: 12,
    }}>{children}</div>
  );
}

function ProviderRow({ icon, name, version, sub, on, status }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 14px',
    }}>
      <span style={{ flexShrink: 0, color: 'var(--ac-fg-1)' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--ac-fg-1)', fontWeight: 600, fontSize: 13 }}>{name}</span>
          {version && <span style={{ color: 'var(--ac-fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{version}</span>}
          {status && <span style={{
            padding: '1px 6px', borderRadius: 4,
            background: 'rgba(255, 222, 89, 0.15)',
            color: 'var(--ac-accent)',
            fontFamily: 'var(--font-heading)', fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            fontWeight: 600,
          }}>{status}</span>}
        </div>
        {sub && <div style={{ marginTop: 3, color: 'var(--ac-fg-3)', fontSize: 12 }}>{sub}</div>}
      </div>
      {on !== undefined && <Switch on={on} />}
    </div>
  );
}

/* ── Tab: General ─────────────────────────────────────────────── */
function SettingsGeneral() {
  const [autoOpen, setAutoOpen] = useStateSet(true);
  const [diffWrap, setDiffWrap] = useStateSet(false);
  const [tokens, setTokens] = useStateSet(false);
  const [archiveConfirm, setArchiveConfirm] = useStateSet(false);
  const [deleteConfirm, setDeleteConfirm] = useStateSet(true);
  return (
    <>
      <GroupLabel>General</GroupLabel>
      <Card>
        <Row title="Theme" sub="Choose how AppyCtrl looks across the app." control={<FauxSelect label="System" />} />
        <Row title="Time format" sub="System default: follows your browser or OS clock preferences." control={<FauxSelect label="System default" />} />
        <Row title="Diff line wrapping" sub="Set the default wrap state when the diff panel opens." control={<Switch on={diffWrap} onChange={setDiffWrap} />} />
        <Row title="Assistant output" sub="Show token-by-token output while a response is in progress." control={<Switch on={tokens} onChange={setTokens} />} />
        <Row title="Auto-open task panel" sub="Open the right-side plan and task panel automatically when steps appear." control={<Switch on={autoOpen} onChange={setAutoOpen} />} />
        <Row title="New threads" sub="Pick the default workspace mode for newly created draft threads." control={<FauxSelect label="Local" />} />
        <Row title="Add project starts in" sub="Leave empty to use ‘~/’ when the Add Project browser opens." control={
          <input placeholder="~/" style={{
            width: 160, height: 30, padding: '0 10px',
            background: 'var(--ac-input-bg)',
            border: '1px solid var(--ac-input-border)',
            borderRadius: 6, color: 'var(--ac-fg-1)',
            fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
          }} />
        } />
        <Row title="Archive confirmation" sub="Require a second click on the inline archive action before a thread is archived." control={<Switch on={archiveConfirm} onChange={setArchiveConfirm} />} />
        <Row title="Delete confirmation" sub="Ask before deleting a thread and its chat history." control={<Switch on={deleteConfirm} onChange={setDeleteConfirm} />} />
        <Row title="Text generation model" sub="Configure the model used for generated commit messages, PR titles, and similar Git text." separator={false}
          control={
            <div style={{ display: 'flex', gap: 6 }}>
              <FauxSelect label="GPT-5.4-Mini" />
              <FauxSelect label="Medium" />
            </div>
          } />
      </Card>

      <GroupLabel action={<span style={{ color: 'var(--ac-fg-3)', fontFamily: 'var(--font-body)', fontSize: 11, textTransform: 'none', letterSpacing: 0, display: 'flex', alignItems: 'center', gap: 6 }}>Checked just now <Icon size={11} sw={1.8}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Icon></span>}>Providers</GroupLabel>
      <Card>
        <ProviderRow
          icon={<Icon size={18} fill="currentColor" stroke="none"><path d="M12 2l9 5v10l-9 5-9-5V7z" /></Icon>}
          name="Codex" version="v0.118.0"
          sub="Authenticated as **********@****.****  ChatGPT Team Subscription"
          on={true}
        />
      </Card>
    </>
  );
}

/* ── Tab: Source Control ──────────────────────────────────────── */
function SettingsSource() {
  return (
    <>
      <GroupLabel action={<button className="ac-icon-btn" style={{ width: 22, height: 22 }}><Icon size={11} sw={1.8}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Icon></button>}>Version Control</GroupLabel>
      <Card>
        <ProviderRow
          icon={<Icon size={18} fill="currentColor" stroke="none" style={{ color: '#f0532f' }}><circle cx="12" cy="12" r="10" /><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" fill="none" /></Icon>}
          name="Git" version="git version 2.53.0" sub="Available" on={true}
        />
        <div style={{ borderTop: '1px solid var(--ac-sidebar-border)' }} />
        <ProviderRow
          icon={<Icon size={18} sw={1.6}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M9 6V3h6v3" /></Icon>}
          name="Jujutsu" status="Coming Soon"
          sub="Support for Jujutsu is coming soon."
        />
      </Card>

      <GroupLabel>Source Control Providers</GroupLabel>
      <Card>
        <ProviderRow
          icon={<IconGithub size={18} />}
          name="GitHub" version="gh version 2.91.0 (2026-04-22)"
          sub="Authenticated as **********" on={true}
        />
        <div style={{ borderTop: '1px solid var(--ac-sidebar-border)' }} />
        <ProviderRow
          icon={<Icon size={18} fill="currentColor" stroke="none" style={{ color: '#fc6d26' }}><path d="M12 22l-9-13 3-9 6 8 6-8 3 9z" /></Icon>}
          name="GitLab"
          sub='Not found — Install GitLab CLI with `brew install glab` or from https://gitlab.com/gitlab-org/cli.'
          on={false}
        />
        <div style={{ borderTop: '1px solid var(--ac-sidebar-border)' }} />
        <ProviderRow
          icon={<Icon size={18} sw={1.6}><path d="M3 12l4-9 5 9-5 9zM21 12l-4-9-5 9 5 9z" /></Icon>}
          name="Azure DevOps" status="Coming Soon"
          sub="Support for Azure DevOps is coming soon."
        />
        <div style={{ borderTop: '1px solid var(--ac-sidebar-border)' }} />
        <ProviderRow
          icon={<Icon size={18} fill="currentColor" stroke="none" style={{ color: '#2684ff' }}><path d="M3 4h18l-2 16H5z" /></Icon>}
          name="Bitbucket" status="Coming Soon"
          sub="Support for Bitbucket is coming soon."
        />
      </Card>
    </>
  );
}

/* ── Tab: Connections ─────────────────────────────────────────── */
function SettingsConnect() {
  const [net, setNet] = useStateSet(false);
  return (
    <>
      <GroupLabel>Manage Local Backend</GroupLabel>
      <Card>
        <Row title="Network access" sub="Limited to this machine." separator={false}
          control={<Switch on={net} onChange={setNet} />} />
      </Card>

      <GroupLabel action={<button style={{
        height: 26, padding: '0 10px', borderRadius: 6,
        background: 'var(--ac-chrome-btn-bg)',
        border: '1px solid var(--ac-chrome-btn-border)',
        color: 'var(--ac-fg-1)', cursor: 'pointer',
        fontFamily: 'var(--font-body)', fontSize: 11.5,
        textTransform: 'none', letterSpacing: 0, fontWeight: 500,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        <IconPlus size={11} sw={2.2} /> Add environment
      </button>}>Remote Environments</GroupLabel>
      <div style={{
        background: 'var(--ac-msg-bg)',
        border: '1px solid var(--ac-msg-border)',
        borderRadius: 10,
        padding: '18px 20px',
        color: 'var(--ac-fg-3)', fontSize: 12.5,
      }}>
        No remote environments yet. Click “Add environment” to pair another environment.
      </div>
    </>
  );
}

/* ── Tab: Archive ─────────────────────────────────────────────── */
function SettingsArchive() {
  return (
    <>
      <GroupLabel>Archived Threads</GroupLabel>
      <div style={{
        background: 'var(--ac-msg-bg)',
        border: '1px solid var(--ac-msg-border)',
        borderRadius: 10,
        padding: '60px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999,
          background: 'var(--ac-row-active)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ac-fg-2)', marginBottom: 14,
        }}>
          <Icon size={20} sw={1.6}><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" /></Icon>
        </div>
        <div style={{ color: 'var(--ac-fg-1)', fontWeight: 600, fontSize: 14 }}>No archived threads</div>
        <div style={{ marginTop: 4, color: 'var(--ac-fg-3)', fontSize: 12.5 }}>Archived threads will appear here.</div>
      </div>
    </>
  );
}

window.SettingsScreen = SettingsScreen;
