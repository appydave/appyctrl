/* AppyCtrl — Add / Configure Application modal
   Matches the visual language of AddActionModal. Fields:
     - Name
     - Glyph (single character icon shown in the sidebar pill)
     - Kind (Local / Cloud / Hybrid radio)
     - Command or URL  (label flips based on Kind)
     - Port (only for Local/Hybrid)
     - Autostart toggle
   onSave receives the full config object.
*/
const { useState: useStateAppModal, useEffect: useEffectAppModal } = React;

function AppToggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 32, height: 18, borderRadius: 999,
        background: on ? 'var(--ac-accent)' : 'var(--ac-toggle-off)',
        border: 'none', cursor: 'pointer', padding: 0,
        position: 'relative', transition: 'background 160ms var(--ease-out)',
      }}
      aria-pressed={on}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 14, height: 14, borderRadius: 999,
        background: '#fff',
        transition: 'left 160ms var(--ease-out)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function AppField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 12.5,
        color: 'var(--ac-fg-1)', fontWeight: 500,
        marginBottom: 6,
      }}>{label}</div>
      {children}
      {hint && (
        <div style={{
          marginTop: 5, fontSize: 11, color: 'var(--ac-fg-3)',
          fontFamily: 'var(--font-body)',
        }}>{hint}</div>
      )}
    </div>
  );
}

function KindSegmented({ value, onChange }) {
  const opts = [
    { id: 'local',  label: 'Local' },
    { id: 'cloud',  label: 'Cloud' },
    { id: 'hybrid', label: 'Hybrid' },
  ];
  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--ac-input-bg)',
      border: '1px solid var(--ac-input-border)',
      borderRadius: 6, padding: 2, gap: 2,
    }}>
      {opts.map(o => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              padding: '5px 14px',
              background: active ? 'var(--ac-accent)' : 'transparent',
              color: active ? 'var(--brand-brown)' : 'var(--ac-fg-2)',
              border: 'none', borderRadius: 4,
              fontFamily: 'var(--font-body)', fontSize: 12.5,
              fontWeight: active ? 600 : 500,
              cursor: 'pointer',
              minWidth: 64,
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

function AddApplicationModal({ tweaks, initial, onClose, onSave }) {
  const [name, setName]       = useStateAppModal(initial?.name || '');
  const [glyph, setGlyph]     = useStateAppModal(initial?.glyph || '◉');
  const [kind, setKind]       = useStateAppModal(initial?.kind || 'local');
  const [target, setTarget]   = useStateAppModal(initial?.target || '');
  const [port, setPort]       = useStateAppModal(initial?.port || '4321');
  const [autostart, setAuto]  = useStateAppModal(!!initial?.autostart);

  useEffectAppModal(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isCloud = kind === 'cloud';
  const isEdit  = !!initial;

  const saveBg = tweaks.theme === 'cold-t3' ? '#1f6feb' : 'var(--ac-accent)';
  const saveFg = tweaks.theme === 'cold-t3' ? '#fff' : 'var(--brand-brown)';
  const focusBorder = tweaks.theme === 'cold-t3' ? '#1f6feb' : 'var(--ac-accent)';
  const focusGlow = tweaks.theme === 'cold-t3'
    ? '0 0 0 3px rgba(31,111,235,0.18)'
    : '0 0 0 3px color-mix(in srgb, var(--ac-accent) 18%, transparent)';

  const handleSave = () => {
    onSave && onSave({
      name: name.trim() || 'Untitled',
      glyph: (glyph.trim() || '◉').slice(0, 2),
      kind,
      target,
      port: isCloud ? null : port,
      autostart,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480, background: 'var(--ac-modal-bg)',
          border: '1px solid var(--ac-modal-border)',
          borderRadius: 12,
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          color: 'var(--ac-fg-1)',
          fontFamily: 'var(--font-body)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '18px 20px 8px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
              color: 'var(--ac-fg-1)', marginBottom: 4,
            }}>{isEdit ? 'Configure Application' : 'Add Application'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ac-fg-2)', lineHeight: 1.5 }}>
              Applications appear in the sidebar and take over the right pane when opened. They can run locally or point at a cloud endpoint.
            </div>
          </div>
          <button
            onClick={onClose}
            className="ac-icon-btn"
            style={{ color: 'var(--ac-fg-2)' }}
            aria-label="Close"
          >
            <IconClose size={14} sw={2} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 20px 16px' }}>
          {/* Name + glyph */}
          <AppField label="Name">
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
              <input
                value={glyph}
                onChange={(e) => setGlyph(e.target.value)}
                maxLength={2}
                title="Glyph"
                style={{
                  width: 36, height: 32, textAlign: 'center',
                  background: 'var(--ac-input-bg)',
                  border: '1px solid var(--ac-input-border)',
                  borderRadius: 6,
                  color: 'var(--ac-accent)',
                  fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600,
                  outline: 'none',
                }}
              />
              <input
                autoFocus
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Angle Eye"
                style={{
                  flex: 1, height: 32, padding: '0 10px',
                  background: 'var(--ac-input-bg)',
                  border: `1px solid ${focusBorder}`,
                  outline: 'none',
                  borderRadius: 6,
                  color: 'var(--ac-fg-1)',
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  boxShadow: focusGlow,
                }}
              />
            </div>
          </AppField>

          {/* Kind */}
          <AppField label="Where it runs" hint={isCloud
            ? 'Cloud apps load over the network. No local process is managed.'
            : 'Local apps are launched and watched by AppyCtrl.'}>
            <KindSegmented value={kind} onChange={setKind} />
          </AppField>

          {/* Target */}
          <AppField label={isCloud ? 'URL' : 'Command'}>
            <input
              value={target} onChange={(e) => setTarget(e.target.value)}
              placeholder={isCloud
                ? 'https://app.example.com'
                : 'pnpm --filter angle-eye dev'}
              style={{
                width: '100%', height: 32, padding: '0 10px',
                background: 'var(--ac-input-bg)',
                border: '1px solid var(--ac-input-border)',
                outline: 'none',
                borderRadius: 6,
                color: 'var(--ac-fg-1)',
                fontFamily: 'var(--font-mono)', fontSize: 12.5,
              }}
            />
          </AppField>

          {/* Port (hidden for cloud) */}
          {!isCloud && (
            <AppField label="Port" hint="Used to embed and to detect when the app is up.">
              <input
                value={port} onChange={(e) => setPort(e.target.value)}
                placeholder="4321"
                style={{
                  width: 120, height: 32, padding: '0 10px',
                  background: 'var(--ac-input-bg)',
                  border: '1px solid var(--ac-input-border)',
                  outline: 'none',
                  borderRadius: 6,
                  color: 'var(--ac-fg-1)',
                  fontFamily: 'var(--font-mono)', fontSize: 12.5,
                }}
              />
            </AppField>
          )}

          {/* Autostart */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px',
            background: 'var(--ac-input-bg)',
            border: '1px solid var(--ac-input-border)',
            borderRadius: 6,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ac-fg-1)' }}>
                Start on AppyCtrl launch
              </div>
              <div style={{ fontSize: 11, color: 'var(--ac-fg-3)', marginTop: 2 }}>
                {isCloud
                  ? 'Pre-load the cloud surface so it\'s ready when you open it.'
                  : 'Boot the local process automatically.'}
              </div>
            </div>
            <AppToggle on={autostart} onChange={setAuto} />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--ac-modal-border)',
          background: 'var(--ac-modal-footer-bg)',
        }}>
          <button
            onClick={onClose}
            style={{
              height: 30, padding: '0 14px',
              background: 'transparent',
              border: '1px solid var(--ac-input-border)',
              borderRadius: 6,
              color: 'var(--ac-fg-1)',
              fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={handleSave}
            style={{
              height: 30, padding: '0 14px',
              background: saveBg, color: saveFg,
              border: 'none', borderRadius: 6,
              fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer',
            }}
          >{isEdit ? 'Save changes' : 'Add application'}</button>
        </div>
      </div>
    </div>
  );
}

window.AddApplicationModal = AddApplicationModal;
