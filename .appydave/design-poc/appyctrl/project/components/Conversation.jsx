/* AppyCtrl — Conversation pane + Composer
   The middle column. Renders the user/assistant message stream and the
   bottom composer dock with model/context/build/access pickers and send.
*/
const { useState: useStateConv, useRef: useRefConv } = React;

function UserCard({ children }) {
  return (
    <div style={{
      maxWidth: 720, marginLeft: 'auto', marginBottom: 16,
      background: 'var(--ac-msg-bg)',
      border: '1px solid var(--ac-msg-border)',
      borderRadius: 10,
      padding: '14px 18px',
      fontFamily: 'var(--font-mono)', fontSize: 12.5,
      lineHeight: 1.6,
      color: 'var(--ac-fg-1)',
      whiteSpace: 'pre-wrap',
    }}>
      {children}
    </div>
  );
}

function MdHeading({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 12.5,
      color: 'var(--ac-fg-2)', fontWeight: 600,
      marginTop: 14, marginBottom: 4,
    }}>
      {children}
    </div>
  );
}

function MdLine({ children, indent = 0, color }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 12.5,
      color: color || 'var(--ac-fg-1)', lineHeight: 1.65,
      paddingLeft: indent * 16,
    }}>
      {children}
    </div>
  );
}

function Mono({ children }) {
  return <span style={{
    background: 'var(--ac-inline-code-bg)',
    color: 'var(--ac-inline-code-fg)',
    padding: '0 4px', borderRadius: 3,
    fontFamily: 'var(--font-mono)', fontSize: 12,
  }}>{children}</span>;
}

function ConversationPane({ tweaks }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: '32px 32px 200px',
      background: 'var(--ac-canvas-bg)',
      position: 'relative',
    }}>
      {tweaks.ghostWatermark && tweaks.theme !== 'cold-t3' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', userSelect: 'none', overflow: 'hidden',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(180px, 22vw, 320px)',
            lineHeight: 0.85, letterSpacing: '-0.02em',
            color: '#ffffff', opacity: 0.025,
            transform: 'translateY(-6%)',
          }}>APPYRADAR</div>
        </div>
      )}

      <div style={{ maxWidth: 820, marginLeft: 'auto', marginRight: 'auto', position: 'relative' }}>
        <UserCard>
          <MdHeading>## Working On</MdHeading>
          <MdLine>AppyDave Branding — Part 2 (wordmark + colours + icons)</MdLine>

          <MdHeading>## Brief</MdHeading>
          <MdLine>The app name is now "AppyDave" but the T3 wordmark SVG and cold dark colours</MdLine>
          <MdLine>remain. Replace the wordmark in the sidebar header, apply AppyDave warm dark</MdLine>
          <MdLine>colour tokens, and swap the boot/favicon icons once assets are available.</MdLine>

          <MdHeading>## Resources</MdHeading>
          <MdLine>- Design plan: <Mono>.appydave/docs/design-plan.md</Mono> (items 1 + 2)</MdLine>
          <MdLine>- Brand tokens: invoke <Mono>brand-dave:brand</Mono> skill</MdLine>
          <MdLine>- Wordmark location: <Mono>apps/web/src/components/Sidebar.tsx</Mono> ~line 2404</MdLine>
          <MdLine indent={1}>(T3Wordmark SVG + hardcoded "Code" text)</MdLine>
          <MdLine>- CSS token location: <Mono>apps/web/src/index.css</Mono> (dark mode block ~line 118)</MdLine>
          <MdLine>- Icon assets: <Mono>apps/desktop/resources/</Mono> + <Mono>apps/web/public/</Mono></MdLine>
          <MdLine>- Coding standards: <Mono>.appydave/docs/coding-standards.md</Mono></MdLine>

          <MdHeading>## What To Do</MdHeading>
          <MdLine>1. Create <Mono>apps/web/src/appydave/AppyWordmark.tsx</Mono></MdLine>
          <MdLine indent={1}>— "Appy" in gold #ccba9d, "Dave" in yellow #ffde59, Oswald font</MdLine>
          <MdLine>2. Create <Mono>apps/web/src/appydave/brand.css</Mono></MdLine>
          <MdLine indent={1}>— Override dark mode CSS tokens (chrome #1a1515, surface #25201e,</MdLine>
          <MdLine indent={1}>&nbsp;&nbsp;primary #ffde59, accent #ccba9d, text #faf5ec)</MdLine>
          <MdLine>3. Seam edit <Mono>main.tsx</Mono> — add import <Mono>'./appydave/brand.css'</Mono> after index.css</MdLine>
          <MdLine>4. Seam edit <Mono>Sidebar.tsx</Mono> — replace <Mono>{'<T3Wordmark />'}</Mono> + "Code" with <Mono>{'<AppyWordmark />'}</Mono></MdLine>
          <MdLine>5. Icons — skip until AppyDave logo assets provided (icns/ico/png/favicons)</MdLine>
          <MdLine>6. <Mono>bun fmt && bun lint && bun typecheck</Mono> — must pass</MdLine>
          <MdLine>7. <Mono>commit feat(appydave): apply AppyDave wordmark and colour tokens</Mono></MdLine>

          <MdHeading>## Key constraints</MdHeading>
          <MdLine>- App runs dark by default — do NOT flip to cream light theme</MdLine>
          <MdLine>- <Mono>Sidebar.tsx</Mono> is an upstream file — minimal edit only (swap the component, nothing else)</MdLine>
          <MdLine>- All new code in <Mono>apps/web/src/appydave/</Mono> (never conflict on rebase)</MdLine>
        </UserCard>

        {/* Floating "Scroll to bottom" pill, like in the screenshots */}
        <div style={{
          position: 'sticky', bottom: 8,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999,
            background: 'var(--ac-pill-bg)',
            border: '1px solid var(--ac-popover-border)',
            color: 'var(--ac-fg-2)', fontSize: 11.5,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'auto', cursor: 'pointer',
          }}>
            <IconChevronDown size={12} /> Scroll to bottom
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposerPill({ children, onClick, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="ac-composer-pill"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 26, padding: '0 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        color: 'var(--ac-fg-2)',
        fontFamily: 'var(--font-body)', fontSize: 12,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function Composer({ tweaks }) {
  const [text, setText] = useStateConv('');
  const [model, setModel] = useStateConv({ id: 'sonnet-4.6', label: 'Claude Sonnet 4.6' });
  const [reasoning, setReasoning] = useStateConv('high');
  const [contextSize, setContextSize] = useStateConv('200k');
  const [planMode, setPlanMode] = useStateConv(false);
  const [access, setAccess] = useStateConv('full');
  const [openModel, setOpenModel] = useStateConv(false);
  const [openReason, setOpenReason] = useStateConv(false);
  const [openAccess, setOpenAccess] = useStateConv(false);

  const modelRef = useRefConv(null);
  const reasonRef = useRefConv(null);
  const accessRef = useRefConv(null);

  const sendActive = text.trim().length > 0;
  const reasoningCap = reasoning[0].toUpperCase() + reasoning.slice(1);
  const accessLabels = { supervised: 'Supervised', auto: 'Auto-accept', full: 'Full access' };

  // Compose colors based on tweaks
  const sendBg = tweaks.theme === 'cold-t3'
    ? '#1f6feb'
    : (sendActive ? 'var(--ac-accent)' : 'var(--ac-send-idle-bg)');
  const sendFg = tweaks.theme === 'cold-t3'
    ? '#ffffff'
    : (sendActive ? 'var(--brand-brown)' : 'var(--ac-fg-2)');

  return (
    <div style={{
      position: 'absolute', left: 32, right: 32, bottom: 14,
      display: 'flex', flexDirection: 'column',
      maxWidth: 820, marginLeft: 'auto', marginRight: 'auto',
    }}>
      <div style={{
        background: 'var(--ac-composer-bg)',
        border: '1px solid var(--ac-composer-border)',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        padding: '12px 14px 10px',
      }}>
        {/* Input row */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="Ask anything, @tag files/folders, or use / to show available commands"
          style={{
            width: '100%', resize: 'none', border: 'none', outline: 'none',
            background: 'transparent',
            color: 'var(--ac-fg-1)',
            fontFamily: 'var(--font-body)', fontSize: 13,
            lineHeight: 1.55,
            padding: '4px 0 8px',
            minHeight: 22,
          }}
        />

        {/* Toolbar row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginTop: 4,
        }}>
          <span ref={modelRef} style={{ display: 'inline-flex' }}>
            <ComposerPill onClick={() => setOpenModel(v => !v)}>
              <span style={{ color: 'var(--ac-accent, var(--ac-fg-1))' }}>
                <IconBolt size={13} />
              </span>
              <span style={{ color: 'var(--ac-fg-1)' }}>{model.label}</span>
              <IconChevronDown size={11} />
            </ComposerPill>
          </span>

          <Sep />

          <span ref={reasonRef} style={{ display: 'inline-flex' }}>
            <ComposerPill onClick={() => setOpenReason(v => !v)}>
              <span style={{ color: 'var(--ac-fg-2)' }}>{reasoningCap} · {contextSize}</span>
              <IconChevronDown size={11} />
            </ComposerPill>
          </span>

          <Sep />

          <ComposerPill onClick={() => setPlanMode(v => !v)}>
            <IconBuild size={12} />
            <span style={{ color: planMode ? 'var(--ac-accent)' : undefined }}>
              {planMode ? 'Plan' : 'Build'}
            </span>
          </ComposerPill>

          <Sep />

          <span ref={accessRef} style={{ display: 'inline-flex' }}>
            <ComposerPill onClick={() => setOpenAccess(v => !v)}>
              <IconLock size={12} />
              <span>{accessLabels[access]}</span>
              <IconChevronDown size={11} />
            </ComposerPill>
          </span>

          <div style={{ flex: 1 }} />

          <ContextGauge percent={50} />

          <button
            aria-label="Send"
            disabled={!sendActive}
            style={{
              width: 30, height: 30, borderRadius: 999,
              border: 'none',
              background: sendBg,
              color: sendFg,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: sendActive ? 'pointer' : 'default',
              transition: 'background 120ms var(--ease-out)',
            }}
          >
            <IconArrowUp size={15} sw={2.5} />
          </button>
        </div>
      </div>

      {/* Popovers */}
      <ModelPickerPopover
        anchorRef={modelRef}
        open={openModel}
        onClose={() => setOpenModel(false)}
        value={model.id}
        onPick={(m) => setModel(m)}
      />
      <ReasoningPopover
        anchorRef={reasonRef}
        open={openReason}
        onClose={() => setOpenReason(false)}
        reasoning={reasoning}
        setReasoning={setReasoning}
        context={contextSize}
        setContext={setContextSize}
      />
      <AccessPopover
        anchorRef={accessRef}
        open={openAccess}
        onClose={() => setOpenAccess(false)}
        value={access}
        onPick={setAccess}
      />

      {/* Footer status row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 6px 0',
        fontFamily: 'var(--font-body)', fontSize: 11.5,
        color: 'var(--ac-fg-3)',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--ac-fg-3)' }} />
          Local checkout
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          main <IconChevronDown size={11} />
        </span>
      </div>
    </div>
  );
}

function Sep() {
  return <span style={{
    width: 1, height: 14, background: 'var(--ac-composer-sep)', margin: '0 2px',
  }} />;
}

window.ConversationPane = ConversationPane;
window.Composer = Composer;
