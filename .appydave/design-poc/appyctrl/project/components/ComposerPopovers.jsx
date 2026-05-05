/* Composer popovers — model picker, reasoning/context, plan/build toggle, full access. */
const { useState: useStateCp, useRef: useRefCp, useEffect: useEffectCp } = React;

function Popover({ open, onClose, anchorRef, children, placement = "top", width, style }) {
  const ref = useRefCp(null);
  useEffectCp(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      )
        onClose?.();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);
  if (!open || !anchorRef?.current) return null;
  const r = anchorRef.current.getBoundingClientRect();
  const positioned =
    placement === "top"
      ? { left: r.left, bottom: window.innerHeight - r.top + 6 }
      : { left: r.left, top: r.bottom + 6 };
  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        zIndex: 60,
        width: width || "auto",
        background: "var(--ac-popover-bg)",
        border: "1px solid var(--ac-popover-border)",
        borderRadius: 10,
        boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
        color: "var(--ac-fg-1)",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        ...positioned,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Model picker (Claude Sonnet 4.6 ▾) ───────────────────────── */
function ModelPickerPopover({ anchorRef, open, onClose, value, onPick }) {
  const [q, setQ] = useStateCp("");
  const models = [
    { id: "opus-4.7", label: "Claude Opus 4.7", shortcut: "⌘1" },
    { id: "opus-4.6", label: "Claude Opus 4.6", shortcut: "⌘2" },
    { id: "opus-4.5", label: "Claude Opus 4.5", shortcut: "⌘3" },
    { id: "sonnet-4.6", label: "Claude Sonnet 4.6", shortcut: "⌘4" },
    { id: "haiku-4.5", label: "Claude Haiku 4.5", shortcut: "⌘5" },
  ];
  const filtered = models.filter((m) => m.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover anchorRef={anchorRef} open={open} onClose={onClose} placement="top" width={420}>
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid var(--ac-sidebar-border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "var(--ac-accent)" }}>
          <IconBolt size={14} />
        </span>
        <span style={{ fontWeight: 600 }}>Claude</span>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 32,
            padding: "0 10px",
            background: "var(--ac-input-bg)",
            border: "1px solid var(--ac-input-border)",
            borderRadius: 6,
          }}
        >
          <IconSearch size={13} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search models…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--ac-fg-1)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
            }}
          />
        </div>
      </div>
      <div style={{ padding: "0 6px 8px", maxHeight: 280, overflowY: "auto" }}>
        {filtered.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              onPick?.(m);
              onClose?.();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              background: value === m.id ? "var(--ac-row-active)" : "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ac-fg-1)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ac-row-hover)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background =
                value === m.id ? "var(--ac-row-active)" : "transparent")
            }
          >
            <Icon size={14} fill="none" sw={1.6}>
              <path d="M12 2l2.5 7L22 11l-6 4.5L18 22l-6-4-6 4 2-6.5L2 11l7.5-2z" />
            </Icon>
            <span style={{ flex: 1, textAlign: "left", fontWeight: 600 }}>{m.label}</span>
            <span
              style={{
                padding: "2px 6px",
                borderRadius: 4,
                background: "var(--ac-kbd-bg)",
                color: "var(--ac-fg-2)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
            >
              {m.shortcut}
            </span>
          </button>
        ))}
      </div>
    </Popover>
  );
}

/* ── Reasoning + Context Window popover ───────────────────────── */
function ReasoningPopover({
  anchorRef,
  open,
  onClose,
  reasoning,
  setReasoning,
  context,
  setContext,
}) {
  const reasonings = [
    { id: "low", label: "Low" },
    { id: "medium", label: "Medium" },
    { id: "high", label: "High (default)" },
    { id: "ultra", label: "Ultrathink" },
  ];
  const contexts = [
    { id: "200k", label: "200k (default)" },
    { id: "1m", label: "1M" },
  ];
  return (
    <Popover anchorRef={anchorRef} open={open} onClose={onClose} placement="top" width={240}>
      <Section title="Reasoning">
        {reasonings.map((r) => (
          <PopRow
            key={r.id}
            active={reasoning === r.id}
            onClick={() => setReasoning(r.id)}
            label={r.label}
          />
        ))}
      </Section>
      <div style={{ borderTop: "1px solid var(--ac-sidebar-border)" }} />
      <Section title="Context Window">
        {contexts.map((c) => (
          <PopRow
            key={c.id}
            active={context === c.id}
            onClick={() => setContext(c.id)}
            label={c.label}
          />
        ))}
      </Section>
    </Popover>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ padding: "12px 8px 8px" }}>
      <div
        style={{
          padding: "0 10px 6px",
          color: "var(--ac-fg-3)",
          fontFamily: "var(--font-heading)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function PopRow({ active, onClick, label, sub }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ac-row-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
        padding: sub ? "8px 10px" : "6px 10px",
        borderRadius: 6,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "var(--ac-fg-1)",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        textAlign: "left",
      }}
    >
      <span style={{ width: 14, flexShrink: 0, color: "var(--ac-fg-1)", marginTop: sub ? 2 : 0 }}>
        {active ? <Icon size={12} sw={2.5} d="M5 13l4 4L19 7" /> : null}
      </span>
      <span style={{ flex: 1 }}>
        <div>{label}</div>
        {sub && <div style={{ marginTop: 3, fontSize: 12, color: "var(--ac-fg-3)" }}>{sub}</div>}
      </span>
    </button>
  );
}

/* ── Full access popover ──────────────────────────────────────── */
function AccessPopover({ anchorRef, open, onClose, value, onPick }) {
  const opts = [
    {
      id: "supervised",
      icon: <IconLock size={13} />,
      label: "Supervised",
      sub: "Ask before commands and file changes.",
    },
    {
      id: "auto",
      icon: (
        <Icon size={13} sw={1.7}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z" />
        </Icon>
      ),
      label: "Auto-accept edits",
      sub: "Auto-approve edits, ask before other actions.",
    },
    {
      id: "full",
      icon: <IconLock size={13} />,
      label: "Full access",
      sub: "Allow commands and edits without prompts.",
    },
  ];
  return (
    <Popover anchorRef={anchorRef} open={open} onClose={onClose} placement="top" width={280}>
      <div style={{ padding: 6 }}>
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => {
              onPick?.(o.id);
              onClose?.();
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ac-row-hover)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background =
                value === o.id ? "var(--ac-row-active)" : "transparent")
            }
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              background: value === o.id ? "var(--ac-row-active)" : "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ac-fg-1)",
              textAlign: "left",
            }}
          >
            <span style={{ marginTop: 2, color: "var(--ac-fg-2)" }}>{o.icon}</span>
            <span style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{o.label}</div>
              <div style={{ marginTop: 2, color: "var(--ac-fg-3)", fontSize: 12 }}>{o.sub}</div>
            </span>
          </button>
        ))}
      </div>
    </Popover>
  );
}

/* ── Context-window gauge popover (hover bubble) ──────────────── */
function ContextGauge({ percent }) {
  const r = 9,
    c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  return (
    <div
      style={{
        width: 26,
        height: 26,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="13" cy="13" r={r} fill="none" stroke="var(--ac-toggle-off)" strokeWidth="2" />
        <circle
          cx="13"
          cy="13"
          r={r}
          fill="none"
          stroke="var(--ac-fg-2)"
          strokeWidth="2"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          position: "absolute",
          fontSize: 9,
          color: "var(--ac-fg-2)",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
        }}
      >
        {percent}
      </span>
    </div>
  );
}

window.Popover = Popover;
window.ModelPickerPopover = ModelPickerPopover;
window.ReasoningPopover = ReasoningPopover;
window.AccessPopover = AccessPopover;
window.ContextGauge = ContextGauge;
