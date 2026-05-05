/* AppyCtrl — Angle Eye application
   An original observability surface (NOT a recreation of any branded product).
   Renders inside the right pane when an app is selected from the sidebar.

   Layout:
     - app-chrome top bar:  "Angle EYE" wordmark · status pill · build · Local-changes pill
     - left nav:            MAIN (Observer/Organiser/Workflows/Dashboard/Infographic)
                            SYSTEM (Inspector/Diagnostics/Settings/Mockups)
     - main pane:           Observer view — session list w/ filter row + selected
                            session inspector strip docked at the bottom.
*/
const { useState: useEyeState } = React;

/* ------------------------------- Sub-nav ------------------------------- */

function EyeNav({ active, onSelect }) {
  const main = [
    { id: 'observer',   label: 'Observer' },
    { id: 'organiser',  label: 'Organiser' },
    { id: 'workflows',  label: 'Workflows' },
    { id: 'dashboard',  label: 'Dashboard' },
    { id: 'infographic',label: 'Infographic' },
  ];
  const system = [
    { id: 'inspector',  label: 'Inspector' },
    { id: 'diagnostics',label: 'Diagnostics' },
    { id: 'settings',   label: 'Settings' },
    { id: 'mockups',    label: 'Mockups' },
  ];
  const NavGroup = ({ label, items }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        padding: '0 16px 8px',
        fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
        letterSpacing: '0.10em', fontSize: 10, color: 'var(--ac-fg-3)',
        fontWeight: 500,
      }}>{label}</div>
      {items.map(it => (
        <button
          key={it.id}
          onClick={() => onSelect(it.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', textAlign: 'left',
            background: active === it.id ? 'var(--ac-row-active)' : 'transparent',
            border: 'none', cursor: 'pointer',
            padding: '7px 16px',
            color: active === it.id ? 'var(--ac-fg-1)' : 'var(--ac-fg-2)',
            fontFamily: 'var(--font-body)', fontSize: 13.5,
            fontWeight: active === it.id ? 600 : 400,
            borderLeft: active === it.id
              ? '2px solid var(--ac-accent)'
              : '2px solid transparent',
          }}
          onMouseEnter={(e) => { if (active !== it.id) e.currentTarget.style.background = 'var(--ac-row-hover)'; }}
          onMouseLeave={(e) => { if (active !== it.id) e.currentTarget.style.background = 'transparent'; }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );

  return (
    <nav style={{
      width: 184, flexShrink: 0,
      borderRight: '1px solid var(--ac-sidebar-border)',
      background: 'var(--ac-sidebar-bg)',
      padding: '20px 0',
      overflowY: 'auto',
    }}>
      <NavGroup label="Main" items={main} />
      <NavGroup label="System" items={system} />
    </nav>
  );
}

/* ----------------------------- Filter strip ----------------------------- */

function FilterChip({ label, active, accent, onClick }) {
  const bg = active
    ? (accent ? 'var(--ac-accent)' : 'var(--ac-row-active)')
    : 'transparent';
  const fg = active && accent
    ? 'var(--brand-brown)'
    : (active ? 'var(--ac-fg-1)' : 'var(--ac-fg-2)');
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        background: bg, color: fg,
        border: 'none', borderRadius: 4,
        fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
        letterSpacing: '0.08em', fontSize: 11, fontWeight: 600,
        cursor: 'pointer',
      }}
    >{label}</button>
  );
}

function FilterBar({ filter, setFilter }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '0 18px', height: 36,
      background: 'var(--bg-chrome)',
      color: 'var(--fg-inverse)',
      borderBottom: '1px solid rgba(0,0,0,0.4)',
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
        letterSpacing: '0.10em', fontSize: 11, fontWeight: 500,
        color: 'rgba(250,245,236,0.55)',
        marginRight: 24,
      }}>Session</span>
      <span style={{
        fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
        letterSpacing: '0.10em', fontSize: 11, fontWeight: 500,
        color: 'rgba(250,245,236,0.55)',
      }}>Last activity</span>
      <div style={{ flex: 1 }} />
      <span style={{
        fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
        letterSpacing: '0.10em', fontSize: 11, fontWeight: 500,
        color: 'rgba(250,245,236,0.55)',
        marginRight: 12,
      }}>When</span>
      <span style={{
        fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
        letterSpacing: '0.10em', fontSize: 11, fontWeight: 500,
        color: 'rgba(250,245,236,0.55)',
        marginRight: 16,
      }}>Pulse</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {['All','Starred','Named','Auto'].map(f => (
          <FilterChip
            key={f}
            label={f === 'Auto' ? 'Auto (0)' : f}
            active={filter === f}
            accent={filter === f && f === 'All'}
            onClick={() => setFilter(f)}
          />
        ))}
      </div>
      <span style={{
        marginLeft: 12,
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'rgba(250,245,236,0.45)',
      }}>?</span>
    </div>
  );
}

/* ----------------------------- Session row ----------------------------- */

function SessionRow({ s, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        width: '100%', textAlign: 'left',
        padding: '10px 18px',
        background: selected ? 'var(--ac-row-active)' : 'transparent',
        borderLeft: selected
          ? '3px solid var(--ac-accent)'
          : '3px solid transparent',
        borderBottom: '1px solid var(--ac-sidebar-border)',
        border: 'none', borderTop: 'none',
        borderBottomWidth: 1, borderBottomStyle: 'solid',
        borderBottomColor: 'var(--ac-sidebar-border)',
        borderLeftWidth: 3, borderLeftStyle: 'solid',
        borderLeftColor: selected ? 'var(--ac-accent)' : 'transparent',
        cursor: 'pointer',
        color: 'var(--ac-fg-1)',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--ac-row-hover)'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* checkbox */}
      <span style={{
        width: 14, height: 14, borderRadius: 3,
        border: '1.5px solid var(--ac-fg-3)',
        flexShrink: 0, marginTop: 3,
      }} />

      {/* main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 13, fontWeight: 500,
            color: 'var(--ac-fg-1)',
          }}>{s.name}</span>
          {s.tag && (
            <span style={{
              fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
              letterSpacing: '0.08em', fontSize: 9.5, fontWeight: 600,
              padding: '1px 6px', borderRadius: 3,
              background: 'rgba(204, 186, 157, 0.18)',
              color: 'var(--brand-gold)',
            }}>{s.tag}</span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--ac-fg-3)',
          }}>{s.hash}</span>
        </div>
        {s.note && (
          <div style={{
            marginTop: 3,
            fontSize: 12.5, color: 'var(--ac-fg-2)',
            fontFamily: s.note.startsWith('/') ? 'var(--font-mono)' : 'var(--font-body)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 720,
          }}>{s.note}</div>
        )}
      </div>

      {/* right column */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        gap: 4, flexShrink: 0, paddingTop: 1, minWidth: 72,
      }}>
        {s.starred && (
          <span style={{ color: 'var(--brand-gold)', fontSize: 12, lineHeight: 1 }}>★</span>
        )}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--ac-fg-3)', whiteSpace: 'nowrap',
        }}>{s.ago}</span>
        {s.runtime && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--brand-amber)', fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>{s.runtime}</span>
        )}
      </div>
    </button>
  );
}

/* ----------------------------- Inspector strip ----------------------------- */

function InspectorRow({ time, kind, text, meta }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '6px 18px',
      borderBottom: '1px solid var(--ac-sidebar-border)',
      fontFamily: 'var(--font-body)', fontSize: 12.5,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--ac-fg-3)', flexShrink: 0,
        width: 64,
      }}>{time}</span>
      <span style={{
        fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
        letterSpacing: '0.06em', fontSize: 10.5, fontWeight: 600,
        color: 'var(--brand-amber)', flexShrink: 0,
        width: 92,
      }}>{kind}</span>
      <span style={{
        flex: 1, color: 'var(--ac-fg-1)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{text}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--ac-fg-3)', flexShrink: 0,
      }}>{meta}</span>
    </div>
  );
}

function Inspector({ session, onClose }) {
  return (
    <section style={{
      borderTop: '1px solid var(--ac-sidebar-border)',
      background: 'var(--ac-canvas-bg)',
      flexShrink: 0,
      maxHeight: '40%',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 18px',
        borderBottom: '1px solid var(--ac-sidebar-border)',
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          fontSize: 12, color: 'var(--ac-accent)',
        }}>{session.name}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--ac-fg-3)',
        }}>{session.hash}</span>
        <div style={{ flex: 1 }} />
        <button className="ac-icon-btn" onClick={onClose} title="Close inspector">
          <IconClose size={13} sw={2} />
        </button>
      </header>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {session.events.map((e, i) => (
          <InspectorRow key={i} {...e} />
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- Top bar ----------------------------- */

function EyeChrome({ view }) {
  const titles = {
    observer: 'Observer',
    organiser: 'Organiser',
    workflows: 'Workflows',
    dashboard: 'Dashboard',
    infographic: 'Infographic',
    inspector: 'Inspector',
    diagnostics: 'Diagnostics',
    settings: 'Settings',
    mockups: 'Mockups',
  };
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '0 22px', height: 56,
      borderBottom: '1px solid var(--ac-sidebar-border)',
      background: 'var(--ac-topbar-bg)',
    }}>
      {/* Wordmark — original mark, NOT a recreation of any branded product */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 999,
          border: '2px solid var(--brand-amber)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999,
            background: 'var(--brand-amber)',
          }} />
        </span>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 20,
          letterSpacing: '0.04em', lineHeight: 1,
          display: 'flex', alignItems: 'baseline', gap: 6,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: 'var(--ac-fg-1)' }}>ANGLE</span>
          <span style={{ color: 'var(--brand-amber)' }}>EYE</span>
        </div>
      </div>

      <span style={{
        fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--ac-fg-2)',
        marginLeft: 32,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>{titles[view]}</span>

      <div style={{ flex: 1 }} />

      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px',
        background: 'var(--ac-accent-soft)',
        color: 'var(--ac-accent)',
        borderRadius: 4,
        fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: 999,
          background: 'var(--ac-accent)',
          animation: 'ac-pulse 1.6s ease-in-out infinite',
        }} />
        Local changes detected
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--ac-fg-3)',
      }}>v0.1.0</span>
    </header>
  );
}

/* ----------------------------- Observer view ----------------------------- */

function ObserverView() {
  const [filter, setFilter] = useEyeState('All');
  const [selected, setSelected] = useEyeState('s2');

  const sessions = [
    { id: 's1', name: 'appyctrl',        hash: '0de3f983', ago: '36s ago' },
    { id: 's2', name: 'angleeye',        hash: '052b47ad', tag: 'BUILD',
      note: '/angleeye-mocha', ago: '7h ago', runtime: '421m' },
    { id: 's3', name: 'beauty-and-joy',  hash: '0266c8db', tag: 'BUILD',
      note: 'Carve out a fresh folder for the conversation thread before starting Phase 1.',
      ago: '8h ago' },
    { id: 's4', name: 'beauty-and-joy',  hash: '0246c8db', tag: 'BUILD',
      note: 'Open a new window in latest, link to the project, and start with HANDOVER.md.',
      ago: '8h ago' },
    { id: 's5', name: 'angleeye',        hash: '728406a5', tag: 'BUILD',
      note: '/enrich-subtypes 50 build feature', ago: '8h ago', runtime: '562m' },
    { id: 's6', name: 'appyctrl',        hash: '77e7ff1c', tag: 'BUILD',
      note: '/3-upstream-refresh', ago: '10h ago', runtime: '612m' },
    { id: 's7', name: 'appysentinel',    hash: 'b6a9c022', tag: 'BUILD',
      note: 'How do we use Sentinel?', ago: '10h ago', runtime: '612m' },
    { id: 's8', name: 'kiros-sentinel',  hash: '184e43ce', tag: 'BUILD',
      note: 'where is this implementation plan written to?', ago: '10h ago' },
  ];

  const sel = sessions.find(s => s.id === selected) || sessions[0];

  // hand-rolled inspector events
  const events = [
    { time: '00:41:48', kind: 'user_prompt', text: 'Appsupport@signal.com.au is 95% BMAD life cycle, but that\'s not a useful way of …', meta: '↓ 4 tool calls · 6 other' },
    { time: '00:36:47', kind: 'user_prompt', text: 'If you had to go back over everything again, what would you do differently? Hav…', meta: '↓1 · 1 tool call · 1 stop · 1 subagent event · 1 other' },
    { time: '00:34:28', kind: 'user_prompt', text: 'server is back', meta: '↓1' },
    { time: '00:20:59', kind: 'user_prompt', text: 'you should ship deferred code changes, and there\'s no reason to run 90-second l…', meta: '↓1 · 15 tool calls · 1 stop · 1 subagent event · 1 other' },
    { time: '00:16:08', kind: 'user_prompt', text: '/oco /enrich-subtypes 50 undefined', meta: '↓1 · 3 tool calls · 1 stop · 1 subagent event · 1 other' },
    { time: '00:16:12', kind: 'user_prompt', text: '/oco /enrich-subtypes 50 build skipped', meta: '↓1 · 3 tool calls · 2 stops · 1 subagent event · 4 other' },
  ];

  const selWithEvents = { ...sel, events };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      minHeight: 0, minWidth: 0,
    }}>
      {/* count strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 22px',
        borderBottom: '1px solid var(--ac-sidebar-border)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.04em',
          color: 'var(--ac-fg-1)',
          margin: 0,
        }}>Observer</h1>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-body)', fontSize: 12.5,
          color: 'var(--ac-fg-2)',
        }}>
          50 of 1833 sessions
          <span style={{
            width: 8, height: 8, borderRadius: 999,
            background: 'var(--status-active)',
            boxShadow: '0 0 0 3px color-mix(in srgb, var(--status-active) 22%, transparent)',
          }} />
        </span>
      </div>

      <FilterBar filter={filter} setFilter={setFilter} />

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {sessions.map(s => (
          <SessionRow
            key={s.id}
            s={s}
            selected={selected === s.id}
            onSelect={() => setSelected(s.id)}
          />
        ))}
      </div>

      {selWithEvents && (
        <Inspector session={selWithEvents} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ----------------------------- Placeholder views ----------------------------- */

function PlaceholderView({ view }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 8, color: 'var(--ac-fg-3)',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
        letterSpacing: '0.10em', fontSize: 14, fontWeight: 600,
        color: 'var(--ac-fg-2)',
      }}>{view}</div>
      <div style={{ fontSize: 12 }}>Placeholder — drop the {view.toLowerCase()} surface here.</div>
    </div>
  );
}

/* ----------------------------- Root ----------------------------- */

function AngleEyeApp() {
  const [view, setView] = useEyeState('observer');
  return (
    <div
      data-screen-label="Angle Eye — Observer"
      style={{
        flex: 1, minWidth: 0, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        background: 'var(--ac-canvas-bg)',
        color: 'var(--ac-fg-1)',
      }}
    >
      <EyeChrome view={view} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <EyeNav active={view} onSelect={setView} />
        {view === 'observer'
          ? <ObserverView />
          : <PlaceholderView view={view.charAt(0).toUpperCase() + view.slice(1)} />}
      </div>
    </div>
  );
}

window.AngleEyeApp = AngleEyeApp;
