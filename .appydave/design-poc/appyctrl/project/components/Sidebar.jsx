/* AppyCtrl — Sidebar
   Recreates the left rail: traffic lights + APPYRADAR wordmark + DEV badge,
   search w/ ⌘K, PROJECTS header w/ sort + add, expandable project tree,
   thread list with "Working" status, Settings row at bottom.
*/
const { useState: useStateSidebar, useRef: useRefSidebar, useEffect: useEffectSidebar } = React;

function TrafficLights() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
      <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ff5f57" }} />
      <span style={{ width: 12, height: 12, borderRadius: 999, background: "#febc2e" }} />
      <span style={{ width: 12, height: 12, borderRadius: 999, background: "#28c840" }} />
    </div>
  );
}

function Wordmark({ tweaks }) {
  // Two-tone Bebas: "APPY" gold + "RADAR" yellow, with a small DEV pill.
  // When tweaks.coldT3 is on, render the original T3 wordmark instead.
  if (tweaks.theme === "cold-t3") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.04em",
            color: "#e6e6e6",
          }}
        >
          T3.code
        </div>
      </div>
    );
  }
  // Two-tone display: legible in all three themes.
  // - dark   → gold "APPY" + yellow "CTRL"
  // - light  → deep brown "APPY" + amber "CTRL" (yellow disappears on cream)
  // - cold-t3 → original T3 wordmark
  const goldColor = tweaks.theme === "light" ? "var(--brand-brown)" : "var(--brand-gold)";
  const yellowColor = tweaks.theme === "light" ? "var(--brand-amber)" : "var(--brand-yellow)";
  const devColor = tweaks.theme === "light" ? "rgba(42,31,28,0.50)" : "rgba(204, 186, 157, 0.65)";
  const devBorder = tweaks.theme === "light" ? "rgba(42,31,28,0.25)" : "rgba(204, 186, 157, 0.35)";
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          lineHeight: 1,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ color: goldColor }}>APPY</span>
        <span style={{ color: yellowColor }}>CTRL</span>
      </div>
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontSize: 9,
          color: devColor,
          border: `1px solid ${devBorder}`,
          padding: "1px 5px",
          borderRadius: 3,
          position: "relative",
          top: -2,
        }}
      >
        DEV
      </span>
    </div>
  );
}

function ThreadRow({ title, time, working, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="ac-thread-row"
      data-active={active ? "true" : "false"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        textAlign: "left",
        background: active ? "var(--ac-row-active)" : "transparent",
        border: "none",
        cursor: "pointer",
        padding: "6px 10px 6px 26px",
        borderRadius: 6,
        color: active ? "var(--ac-fg-1)" : "var(--ac-fg-2)",
        fontFamily: "var(--font-body)",
        fontSize: 12.5,
        marginBottom: 1,
        whiteSpace: "nowrap",
        minWidth: 0,
      }}
    >
      {working && (
        <span
          className="ac-working-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          <span
            className="ac-working-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              animation: "ac-pulse 1.6s ease-in-out infinite",
            }}
          />
          Working
        </span>
      )}
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--ac-fg-3)",
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}
      >
        {time}
      </span>
    </button>
  );
}

function ProjectGroup({ project, openSort, setOpenSort, activeThread, setActiveThread }) {
  const [expanded, setExpanded] = useStateSidebar(true);
  return (
    <div style={{ marginBottom: 6 }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "5px 10px",
          borderRadius: 6,
          color: "var(--ac-fg-1)",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 120ms var(--ease-out)",
            color: "var(--ac-fg-2)",
          }}
        >
          <IconChevronRight size={12} />
        </span>
        <IconFolder size={14} style={{ color: "var(--ac-fg-2)" }} />
        <span>{project.name}</span>
      </button>
      {expanded &&
        project.threads.map((t) => (
          <ThreadRow
            key={t.id}
            title={t.title}
            time={t.time}
            working={t.working}
            active={activeThread === t.id}
            onClick={() => setActiveThread(t.id)}
          />
        ))}{" "}
    </div>
  );
}

function SortPopover({ onClose }) {
  return (
    <div
      className="ac-popover"
      style={{
        position: "absolute",
        top: 30,
        right: 0,
        zIndex: 50,
        background: "var(--ac-popover-bg)",
        border: "1px solid var(--ac-popover-border)",
        borderRadius: 10,
        boxShadow: "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
        padding: 6,
        minWidth: 220,
        fontFamily: "var(--font-body)",
        fontSize: 13,
        color: "var(--ac-fg-1)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <SortGroup
        title="Sort projects"
        items={["Last user message", "Created at", "Manual"]}
        active="Last user message"
      />
      <SortGroup
        title="Sort threads"
        items={["Last user message", "Created at"]}
        active="Last user message"
      />
      <div style={{ height: 1, background: "var(--ac-popover-border)", margin: "4px 6px" }} />
      <SortGroup
        title="Group projects"
        items={["Group by repository", "Group by repository path", "Keep separate"]}
        active="Group by repository"
      />
    </div>
  );
}

function SortGroup({ title, items, active }) {
  const [val, setVal] = useStateSidebar(active);
  return (
    <div style={{ padding: "4px 0" }}>
      <div
        style={{
          padding: "6px 10px 4px",
          fontSize: 11,
          color: "var(--ac-fg-3)",
          fontWeight: 500,
        }}
      >
        {title}
      </div>
      {items.map((it) => (
        <button
          key={it}
          onClick={() => setVal(it)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: 6,
            color: "var(--ac-fg-1)",
            fontSize: 13,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ac-row-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ width: 14, display: "inline-flex", color: "var(--ac-fg-1)" }}>
            {val === it && <Icon size={12} sw={2.5} d="M5 12l5 5L20 7" />}
          </span>
          {it}
        </button>
      ))}
    </div>
  );
}

function AppRow({ app, active, onClick, onConfigure }) {
  return (
    <button
      onClick={onClick}
      className="ac-thread-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        textAlign: "left",
        background: active ? "var(--ac-row-active)" : "transparent",
        border: "none",
        cursor: "pointer",
        padding: "6px 10px",
        borderRadius: 6,
        color: active ? "var(--ac-fg-1)" : "var(--ac-fg-2)",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        marginBottom: 1,
        whiteSpace: "nowrap",
        minWidth: 0,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? "var(--ac-accent-soft)" : "transparent",
          color: active ? "var(--ac-accent)" : "var(--ac-fg-2)",
          flexShrink: 0,
        }}
      >
        {app.glyph}
      </span>
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {app.name}
      </span>
      {app.status === "live" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--status-active)",
            boxShadow: "0 0 0 3px color-mix(in srgb, var(--status-active) 22%, transparent)",
            flexShrink: 0,
          }}
        />
      )}
      {app.status === "cloud" && (
        <span
          style={{
            fontFamily: "var(--font-heading)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: 9,
            color: "var(--ac-fg-3)",
            flexShrink: 0,
          }}
        >
          cloud
        </span>
      )}
      <span
        role="button"
        title="Configure"
        onClick={(e) => {
          e.stopPropagation();
          onConfigure && onConfigure(app);
        }}
        className="ac-icon-btn"
        style={{
          width: 18,
          height: 18,
          marginRight: -4,
          color: "var(--ac-fg-3)",
          flexShrink: 0,
          opacity: active ? 1 : 0.55,
        }}
      >
        <IconSettings size={11} />
      </span>
    </button>
  );
}

function Sidebar({
  tweaks,
  activeThread,
  setActiveThread,
  mode,
  setMode,
  activeApp,
  setActiveApp,
  apps,
  onAddApplication,
  onConfigureApplication,
  onOpenSettings,
}) {
  const [openSort, setOpenSort] = useStateSidebar(false);
  const sortBtnRef = useRefSidebar(null);

  useEffectSidebar(() => {
    if (!openSort) return;
    const onDown = () => setOpenSort(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openSort]);

  const projects = [
    {
      id: "p1",
      name: "Appy Ctrl",
      threads: [
        { id: "t1", title: "AppyDave wordmark and colors", time: "4m ago", working: false },
        { id: "t2", title: "Review system context", time: "44m ago", working: true },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: 240,
        height: "100%",
        background: "var(--ac-sidebar-bg)",
        borderRight: "1px solid var(--ac-sidebar-border)",
        display: "flex",
        flexDirection: "column",
        color: "var(--ac-fg-1)",
      }}
    >
      {/* Header: traffic lights + wordmark */}
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 14px",
          borderBottom: "1px solid var(--ac-sidebar-border)",
        }}
      >
        <TrafficLights />
        <Wordmark tweaks={tweaks} />
      </div>

      {/* Search */}
      <div style={{ padding: "10px 12px 6px" }}>
        <div
          className="ac-search-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            background: "var(--ac-input-bg)",
            border: "1px solid var(--ac-input-border)",
            borderRadius: 6,
            color: "var(--ac-fg-3)",
          }}
        >
          <IconSearch size={13} sw={2} />
          <input
            placeholder="Search"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ac-fg-1)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
            }}
          />
          <kbd
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              background: "var(--ac-kbd-bg)",
              color: "var(--ac-fg-2)",
              border: "1px solid var(--ac-input-border)",
              padding: "1px 5px",
              borderRadius: 3,
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Scroll region: PROJECTS group + APPLICATIONS group */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {/* PROJECTS header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 8px 6px",
            position: "relative",
          }}
        >
          <span
            className="ac-label"
            style={{
              fontFamily: "var(--font-heading)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: 10,
              color: "var(--ac-fg-3)",
              fontWeight: 500,
            }}
          >
            Projects
          </span>
          <div style={{ display: "flex", gap: 2, position: "relative" }}>
            <button
              ref={sortBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                setOpenSort((v) => !v);
              }}
              className="ac-icon-btn"
              title="Sort"
            >
              <IconSort size={13} />
            </button>
            <button className="ac-icon-btn" title="Add project">
              <IconFolderPlus size={13} />
            </button>
            {openSort && <SortPopover onClose={() => setOpenSort(false)} />}
          </div>
        </div>

        {/* Project tree */}
        {projects.map((p) => (
          <ProjectGroup
            key={p.id}
            project={p}
            activeThread={mode === "projects" ? activeThread : null}
            setActiveThread={(id) => {
              setMode("projects");
              setActiveThread(id);
            }}
          />
        ))}

        {/* APPLICATIONS header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 8px 6px",
            marginTop: 6,
            borderTop: "1px solid var(--ac-sidebar-border)",
          }}
        >
          <span
            className="ac-label"
            style={{
              fontFamily: "var(--font-heading)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: 10,
              color: "var(--ac-fg-3)",
              fontWeight: 500,
              paddingTop: 8,
            }}
          >
            Applications
          </span>
          <div style={{ display: "flex", gap: 2, paddingTop: 8 }}>
            <button className="ac-icon-btn" title="Add application" onClick={onAddApplication}>
              <IconPlus size={13} />
            </button>
          </div>
        </div>

        {(apps || []).map((a) => (
          <AppRow
            key={a.id}
            app={a}
            active={mode === "apps" && activeApp === a.id}
            onClick={() => {
              setMode("apps");
              setActiveApp(a.id);
            }}
            onConfigure={onConfigureApplication}
          />
        ))}
      </div>

      {/* Settings */}
      <div
        style={{
          borderTop: "1px solid var(--ac-sidebar-border)",
          padding: "8px 12px",
        }}
      >
        <button
          onClick={onOpenSettings}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "6px 8px",
            borderRadius: 6,
            color: "var(--ac-fg-2)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ac-row-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <IconSettings size={13} />
          Settings
        </button>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
