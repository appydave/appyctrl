/* AppyCtrl — App entry. Composes Sidebar + Topbar + Conversation + Composer,
   plus optional terminal pane and diff view. Tweaks panel switches between
   three themes: light (cream), dark (warm AppyCtrl), cold-t3 (original).
*/
const { useState: useAppState, useEffect: useAppEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "ghostWatermark": false,
  "accentIntensity": "balanced",
  "density": "comfy"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeThread, setActiveThread] = useAppState('t2');
  const [mode, setMode] = useAppState('projects');     // 'projects' | 'apps'
  const [activeApp, setActiveApp] = useAppState('angle-eye');
  const [apps, setApps] = useAppState([
    { id: 'angle-eye', name: 'Angle Eye', glyph: '◉', kind: 'local', target: 'pnpm --filter angle-eye dev', port: '4321', autostart: true, status: 'live' },
  ]);
  const [appModal, setAppModal] = useAppState(null); // null | { mode: 'add' } | { mode: 'edit', app }
  const [showAddAction, setShowAddAction] = useAppState(false);
  const [showTerminal, setShowTerminal] = useAppState(true);
  const [showDiff, setShowDiff] = useAppState(false);
  const [showSettings, setShowSettings] = useAppState(false);

  const handleSaveApp = (cfg) => {
    if (appModal?.mode === 'edit' && appModal.app) {
      setApps(list => list.map(a => a.id === appModal.app.id ? { ...a, ...cfg } : a));
    } else {
      const id = (cfg.name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).slice(2, 5);
      const status = cfg.kind === 'cloud' ? 'cloud' : 'live';
      setApps(list => [...list, { id, status, ...cfg }]);
      setMode('apps');
      setActiveApp(id);
    }
    setAppModal(null);
  };

  useAppEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', tweaks.theme || 'dark');
    root.setAttribute('data-accent', tweaks.accentIntensity || 'balanced');
    root.setAttribute('data-density', tweaks.density || 'comfy');
  }, [tweaks.theme, tweaks.accentIntensity, tweaks.density]);

  return (
    <div
      data-screen-label="01 AppyCtrl shell"
      style={{
        height: '100%', display: 'flex',
        background: 'var(--ac-canvas-bg)',
        color: 'var(--ac-fg-1)',
        overflow: 'hidden',
      }}
    >
      <Sidebar
        tweaks={tweaks}
        activeThread={activeThread}
        setActiveThread={setActiveThread}
        mode={mode}
        setMode={setMode}
        activeApp={activeApp}
        setActiveApp={setActiveApp}
        apps={apps}
        onAddApplication={() => setAppModal({ mode: 'add' })}
        onConfigureApplication={(app) => setAppModal({ mode: 'edit', app })}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {mode === 'apps' ? (
          <AngleEyeApp />
        ) : (
          <React.Fragment>
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                <Topbar
                  tweaks={tweaks}
                  onAddAction={() => setShowAddAction(true)}
                  onToggleTerminal={() => setShowTerminal(v => !v)}
                  onToggleDiff={() => setShowDiff(v => !v)}
                  showTerminal={showTerminal}
                  showDiff={showDiff}
                />
                <ConversationPane tweaks={tweaks} />
                <Composer tweaks={tweaks} />
              </main>
              {showDiff && <DiffPane onClose={() => setShowDiff(false)} />}
            </div>
            {showTerminal && <TerminalPane onClose={() => setShowTerminal(false)} />}
          </React.Fragment>
        )}
      </div>

      {showAddAction && (
        <AddActionModal
          tweaks={tweaks}
          onClose={() => setShowAddAction(false)}
          onSave={() => setShowAddAction(false)}
        />
      )}

      {appModal && (
        <AddApplicationModal
          tweaks={tweaks}
          initial={appModal.mode === 'edit' ? appModal.app : null}
          onClose={() => setAppModal(null)}
          onSave={handleSaveApp}
        />
      )}

      {showSettings && (
        <SettingsModal
          tweaks={tweaks}
          onClose={() => setShowSettings(false)}
        />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio
            label="Variant"
            value={tweaks.theme || 'dark'}
            onChange={(v) => setTweak('theme', v)}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'cold-t3', label: 'T3' },
            ]}
          />
          <TweakRadio
            label="Accent"
            value={tweaks.accentIntensity || 'balanced'}
            onChange={(v) => setTweak('accentIntensity', v)}
            options={[
              { value: 'subtle', label: 'Subtle' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'loud', label: 'Loud' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Polish">
          <TweakToggle label="Ghost watermark" value={!!tweaks.ghostWatermark} onChange={(v) => setTweak('ghostWatermark', v)} />
          <TweakRadio
            label="Density" value={tweaks.density || 'comfy'} onChange={(v) => setTweak('density', v)}
            options={[{ value: 'compact', label: 'Compact' }, { value: 'comfy', label: 'Comfy' }]}
          />
        </TweakSection>
        <TweakSection label="Panes">
          <TweakToggle label="Terminal pane" value={showTerminal} onChange={setShowTerminal} />
          <TweakToggle label="Diff pane" value={showDiff} onChange={setShowDiff} />
          <TweakButton label="Open Add Action modal" onClick={() => setShowAddAction(true)} />
          <TweakButton label="Open Add Application modal" onClick={() => setAppModal({ mode: 'add' })} />
          <TweakButton label="Open Settings" onClick={() => setShowSettings(true)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
