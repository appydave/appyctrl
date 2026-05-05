/* AppyCtrl — Terminal & Diff panes (per the screenshots).
   Terminal docks below conversation; Diff splits the right side.
*/
function TerminalPane({ onClose }) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--ac-sidebar-border)",
        background: "var(--ac-terminal-bg)",
        color: "var(--ac-fg-1)",
        flexShrink: 0,
        height: 180,
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
      }}
    >
      {/* tab strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 10px",
          height: 28,
          borderBottom: "1px solid var(--ac-sidebar-border)",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1 }} />
        <button className="ac-icon-btn" title="Split" style={{ width: 22, height: 22 }}>
          <Icon size={12} sw={1.6}>
            <path d="M3 3h18v18H3z" />
            <path d="M12 3v18" />
          </Icon>
        </button>
        <button className="ac-icon-btn" title="New" style={{ width: 22, height: 22 }}>
          <IconPlus size={12} sw={2} />
        </button>
        <button
          className="ac-icon-btn"
          title="Close"
          onClick={onClose}
          style={{ width: 22, height: 22 }}
        >
          <Icon size={11} sw={2} d="M6 6l12 12M18 6L6 18" />
        </button>
      </div>
      <div style={{ flex: 1, padding: "8px 12px", overflowY: "auto" }}>
        <div style={{ color: "var(--ac-fg-3)" }}>↳ Shell loaded in 5ms</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{ color: "var(--ac-accent)" }}>➜</span>
          <span style={{ color: "var(--ac-term-prompt)" }}>appyctrl</span>
          <span style={{ color: "var(--ac-term-branch)" }}>git:(main)</span>
          <span style={{ color: "var(--ac-fg-2)" }}>/</span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 14,
              background: "var(--ac-fg-1)",
              animation: "ac-pulse 1s steps(2) infinite",
              marginLeft: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function DiffPane({ onClose }) {
  return (
    <aside
      style={{
        width: 480,
        flexShrink: 0,
        borderLeft: "1px solid var(--ac-sidebar-border)",
        background: "var(--ac-diff-bg)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* header: All turns, Turn 2, Turn 1, view toggles */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          padding: "0 12px",
          borderBottom: "1px solid var(--ac-sidebar-border)",
          fontFamily: "var(--font-body)",
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        <DiffTab active>All turns</DiffTab>
        <DiffTab>
          Turn 2 <span style={{ color: "var(--ac-fg-3)", marginLeft: 4 }}>11:07 AM</span>
        </DiffTab>
        <DiffTab>
          Turn 1 <span style={{ color: "var(--ac-fg-3)", marginLeft: 4 }}>9:44 AM</span>
        </DiffTab>
        <div style={{ flex: 1 }} />
        <button className="ac-icon-btn" title="Prev" style={{ width: 24, height: 24 }}>
          <IconChevronRight size={13} style={{ transform: "rotate(180deg)" }} />
        </button>
        <button className="ac-icon-btn" title="Next" style={{ width: 24, height: 24 }}>
          <IconChevronRight size={13} />
        </button>
        <button className="ac-icon-btn" title="Unified" style={{ width: 24, height: 24 }}>
          <Icon size={13} sw={1.6}>
            <path d="M3 6h18M3 12h18M3 18h18" />
          </Icon>
        </button>
        <button className="ac-icon-btn" title="Side-by-side" style={{ width: 24, height: 24 }}>
          <Icon size={13} sw={1.6}>
            <path d="M3 4h7v16H3zM14 4h7v16h-7z" />
          </Icon>
        </button>
        <button
          className="ac-icon-btn"
          title="Close diff"
          onClick={onClose}
          style={{ width: 24, height: 24 }}
        >
          <IconClose size={13} sw={2} />
        </button>
      </div>

      {/* scrollable diff content */}
      <div style={{ flex: 1, overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
        <DiffFile name="appydave/docs/boot-sequence.md" minus={4} plus={4}>
          <DiffContext>32 unmodified lines</DiffContext>
          <DiffLine n={33} />
          <DiffLine n={34}>
            See <span style={{ color: "var(--ac-fg-2)" }}>`.appydave/patches/manifest.md`</span> for
            full detail.
          </DiffLine>
          <DiffLine n={35} />
          <DiffLine n={36} kind="del">
            | Patch | What it does |
          </DiffLine>
          <DiffLine n={37} kind="del">
            {"|---------------|--------------|"}
          </DiffLine>
          <DiffLine n={38} kind="del">
            <span style={{ color: "var(--ac-diff-mono)" }}>| `fetch-timeout`</span> | Wraps auth
            fetch calls with 8s AbortController
          </DiffLine>
          <DiffLine n={39} kind="del">
            <span style={{ color: "var(--ac-diff-mono)" }}>| `splash-pending`</span> | Shows the T3
            splash logo during `beforeLoad`
          </DiffLine>
          <DiffLine n={36} kind="add">
            | Patch | What it does
          </DiffLine>
          <DiffLine n={37} kind="add">
            {"|--------------------------|--------------"}
          </DiffLine>
          <DiffLine n={38} kind="add">
            <span style={{ color: "var(--ac-diff-mono)" }}>| `fetch-timeout`</span> | Wraps auth
            fetch calls with 8s AbortControl
          </DiffLine>
          <DiffLine n={39} kind="add">
            <span style={{ color: "var(--ac-diff-mono)" }}>| `splash-pending`</span> | Shows the T3
            splash logo during `beforeLoad`
          </DiffLine>
          <DiffLine n={40} />
          <DiffLine n={41}>## What a proper upstream fix would look like</DiffLine>
          <DiffLine n={42} />
        </DiffFile>

        <DiffFile name="appydave/docs/coding-standards.md" minus={8} plus={10}>
          <DiffContext>12 unmodified lines</DiffContext>
          <DiffLine n={13} />
          <DiffLine n={14}>
            Design-plan entries are the spec. Before touching code for any fea
          </DiffLine>
          <DiffLine n={15}>
            section in{" "}
            <span style={{ color: "var(--ac-fg-2)" }}>`.appydave/docs/design-plan.md`</span> until
            it answers:
          </DiffLine>
          <DiffLine n={16} />
          <DiffLine n={17}>- What files get created</DiffLine>
          <DiffLine n={18}>
            - Which pattern each file uses (Effect layer / Rpc.make / CSS ov
          </DiffLine>
          <DiffLine n={19}>- Edge cases and failure modes</DiffLine>
          <DiffContext>5 unmodified lines</DiffContext>
          <DiffLine n={25} />
          <DiffLine n={26}>## Patterns (follow upstream exactly)</DiffLine>
          <DiffLine n={27} />
          <DiffLine n={28} kind="del">
            | What | Pattern | Reference |
          </DiffLine>
          <DiffLine n={29} kind="del">
            {"|------|---------|-----------|"}
          </DiffLine>
          <DiffLine n={30} kind="del">
            | New server service | Effect Layer |{" "}
            <span style={{ color: "var(--ac-fg-2)" }}>`apps/server/src/*/Services`</span>
          </DiffLine>
          <DiffLine n={31} kind="del">
            | New RPC method | <span style={{ color: "var(--ac-fg-2)" }}>`Rpc.make()`</span> +{" "}
            <span style={{ color: "var(--ac-fg-2)" }}>`RpcGroup`</span> |{" "}
            <span style={{ color: "var(--ac-fg-2)" }}>`packages/contract`</span>
          </DiffLine>
          <DiffLine n={32} kind="del">
            | Shared types | Effect Schema (not raw TS interfaces) |{" "}
            <span style={{ color: "var(--ac-fg-2)" }}>`packages/cont`</span>
          </DiffLine>
          <DiffLine n={33} kind="del">
            | Desktop ↔ web data | Typed bridge interface |{" "}
            <span style={{ color: "var(--ac-fg-2)" }}>`packages/contract`</span>
          </DiffLine>
          <DiffLine n={34} kind="del">
            | IPC calls | Via <span style={{ color: "var(--ac-fg-2)" }}>`AppyBridge`</span>{" "}
            interface — never raw <span style={{ color: "var(--ac-fg-2)" }}>`ipcRender`</span>
          </DiffLine>
          <DiffLine n={35} kind="del">
            | CSS theming | Custom property overrides |{" "}
            <span style={{ color: "var(--ac-fg-2)" }}>`apps/web/src/appydave`</span>
          </DiffLine>
          <DiffLine n={28} kind="add">
            | What | Pattern
          </DiffLine>
          <DiffLine n={29} kind="add">
            {"|------|---------"}
          </DiffLine>
          <DiffLine n={30} kind="add">
            | New server service | Effect Layer
          </DiffLine>
          <DiffLine n={31} kind="add">
            | New RPC method | <span style={{ color: "var(--ac-fg-2)" }}>`Rpc.make()`</span> +{" "}
            <span style={{ color: "var(--ac-fg-2)" }}>`RpcGroup`</span>
          </DiffLine>
          <DiffLine n={32} kind="add">
            | Shared types | Effect Schema (not raw TS interfaces)
          </DiffLine>
          <DiffLine n={33} kind="add">
            | Desktop ↔ web data | Typed bridge interface
          </DiffLine>
        </DiffFile>
      </div>
    </aside>
  );
}

function DiffTab({ active, children }) {
  return (
    <button
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        background: active ? "var(--ac-row-active)" : "transparent",
        color: active ? "var(--ac-fg-1)" : "var(--ac-fg-2)",
        border: "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-body)",
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

function DiffFile({ name, minus, plus, children }) {
  return (
    <div style={{ borderBottom: "1px solid var(--ac-sidebar-border)", marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "var(--ac-diff-header-bg)",
          fontFamily: "var(--font-body)",
          fontSize: 11.5,
          color: "var(--ac-fg-2)",
        }}
      >
        <Icon size={12} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <span style={{ color: "var(--ac-fg-1)", flex: 1 }}>{name}</span>
        <span style={{ color: "var(--ac-diff-del-fg)" }}>−{minus}</span>
        <span style={{ color: "var(--ac-diff-add-fg)" }}>+{plus}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function DiffContext({ children }) {
  return (
    <div
      style={{
        padding: "4px 12px",
        color: "var(--ac-fg-3)",
        fontFamily: "var(--font-body)",
        fontSize: 11,
        fontStyle: "italic",
        background: "var(--ac-diff-context-bg)",
        borderTop: "1px solid var(--ac-sidebar-border)",
        borderBottom: "1px solid var(--ac-sidebar-border)",
      }}
    >
      {children}
    </div>
  );
}

function DiffLine({ n, kind, children }) {
  const bg =
    kind === "add"
      ? "var(--ac-diff-add-bg)"
      : kind === "del"
        ? "var(--ac-diff-del-bg)"
        : "transparent";
  const numColor =
    kind === "add"
      ? "var(--ac-diff-add-fg)"
      : kind === "del"
        ? "var(--ac-diff-del-fg)"
        : "var(--ac-fg-3)";
  return (
    <div style={{ display: "flex", background: bg, alignItems: "flex-start" }}>
      <span
        style={{
          width: 36,
          padding: "1px 6px",
          textAlign: "right",
          color: numColor,
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        {n}
      </span>
      <span
        style={{
          flex: 1,
          padding: "1px 8px 1px 0",
          whiteSpace: "pre",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "var(--ac-fg-1)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

window.TerminalPane = TerminalPane;
window.DiffPane = DiffPane;
