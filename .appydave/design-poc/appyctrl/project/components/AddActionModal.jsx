/* AppyCtrl — Add Action modal
   Recreates the dialog with Name (with play-icon prefix), Keybinding,
   Command (textarea), "Run automatically on worktree creation" toggle,
   Cancel + Save action buttons.
*/
const { useState: useStateModal, useEffect: useEffectModal } = React;

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 32,
        height: 18,
        borderRadius: 999,
        background: on ? "var(--ac-accent)" : "var(--ac-toggle-off)",
        border: "none",
        cursor: "pointer",
        padding: 0,
        position: "relative",
        transition: "background 160ms var(--ease-out)",
      }}
      aria-pressed={on}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 16 : 2,
          width: 14,
          height: 14,
          borderRadius: 999,
          background: "#fff",
          transition: "left 160ms var(--ease-out)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12.5,
          color: "var(--ac-fg-1)",
          fontWeight: 500,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
      {hint && (
        <div
          style={{
            marginTop: 5,
            fontSize: 11,
            color: "var(--ac-fg-3)",
            fontFamily: "var(--font-body)",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function AddActionModal({ tweaks, onClose, onSave }) {
  const [name, setName] = useStateModal("");
  const [keybind, setKeybind] = useStateModal("");
  const [command, setCommand] = useStateModal("bun test");
  const [autorun, setAutorun] = useStateModal(false);

  useEffectModal(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const saveBg = tweaks.theme === "cold-t3" ? "#1f6feb" : "var(--ac-accent)";
  const saveFg = tweaks.theme === "cold-t3" ? "#fff" : "var(--brand-brown)";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          background: "var(--ac-modal-bg)",
          border: "1px solid var(--ac-modal-border)",
          borderRadius: 12,
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          color: "var(--ac-fg-1)",
          fontFamily: "var(--font-body)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "18px 20px 8px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--ac-fg-1)",
                marginBottom: 4,
              }}
            >
              Add Action
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ac-fg-2)", lineHeight: 1.5 }}>
              Actions are project-scoped commands you can run from the top bar or keybindings.
            </div>
          </div>
          <button
            onClick={onClose}
            className="ac-icon-btn"
            style={{ color: "var(--ac-fg-2)" }}
            aria-label="Close"
          >
            <IconClose size={14} sw={2} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "8px 20px 16px" }}>
          <Field label="Name">
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 8,
              }}
            >
              <button
                title="Action icon"
                style={{
                  width: 34,
                  height: 32,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--ac-input-bg)",
                  border: "1px solid var(--ac-input-border)",
                  borderRadius: 6,
                  color: "var(--ac-fg-1)",
                  cursor: "pointer",
                }}
              >
                <IconPlay size={11} />
              </button>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Test"
                style={{
                  flex: 1,
                  height: 32,
                  padding: "0 10px",
                  background: "var(--ac-input-bg)",
                  border: `1px solid ${tweaks.theme === "cold-t3" ? "#1f6feb" : "var(--ac-accent)"}`,
                  outline: "none",
                  borderRadius: 6,
                  color: "var(--ac-fg-1)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  boxShadow:
                    tweaks.theme === "cold-t3"
                      ? "0 0 0 3px rgba(31,111,235,0.18)"
                      : "0 0 0 3px color-mix(in srgb, var(--ac-accent) 18%, transparent)",
                }}
              />
            </div>
          </Field>

          <Field label="Keybinding" hint="Press a shortcut. Use Backspace to clear.">
            <input
              value={keybind}
              onChange={(e) => setKeybind(e.target.value)}
              placeholder="Press shortcut"
              style={{
                width: "100%",
                height: 32,
                padding: "0 10px",
                background: "var(--ac-input-bg)",
                border: "1px solid var(--ac-input-border)",
                outline: "none",
                borderRadius: 6,
                color: "var(--ac-fg-1)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
              }}
            />
          </Field>

          <Field label="Command">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "8px 10px",
                background: "var(--ac-input-bg)",
                border: "1px solid var(--ac-input-border)",
                outline: "none",
                resize: "vertical",
                borderRadius: 6,
                color: "var(--ac-fg-1)",
                fontFamily: "var(--font-mono)",
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            />
          </Field>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              background: "var(--ac-input-bg)",
              border: "1px solid var(--ac-input-border)",
              borderRadius: 6,
            }}
          >
            <span style={{ flex: 1, fontSize: 12.5, color: "var(--ac-fg-1)" }}>
              Run automatically on worktree creation
            </span>
            <Toggle on={autorun} onChange={setAutorun} />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 20px 16px",
            borderTop: "1px solid var(--ac-modal-border)",
            background: "var(--ac-modal-footer-bg)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 30,
              padding: "0 14px",
              background: "transparent",
              border: "1px solid var(--ac-input-border)",
              borderRadius: 6,
              color: "var(--ac-fg-1)",
              fontFamily: "var(--font-body)",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave && onSave({ name, keybind, command, autorun })}
            style={{
              height: 30,
              padding: "0 14px",
              background: saveBg,
              color: saveFg,
              border: "none",
              borderRadius: 6,
              fontFamily: "var(--font-body)",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save action
          </button>
        </div>
      </div>
    </div>
  );
}

window.AddActionModal = AddActionModal;
