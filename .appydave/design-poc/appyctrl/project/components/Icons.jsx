/* Lucide-style icons for the AppyCtrl shell. 1.5–2px stroke, geometric. */
const Icon = ({ d, size = 16, sw = 1.75, fill = 'none', children, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const IconSearch = (p) => (
  <Icon size={p.size || 14} sw={p.sw || 2} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Icon>
);
const IconChevronDown = (p) => <Icon d="M6 9l6 6 6-6" size={p.size || 14} {...p} />;
const IconChevronRight = (p) => <Icon d="M9 6l6 6-6 6" size={p.size || 14} {...p} />;
const IconChevronUp = (p) => <Icon d="M6 15l6-6 6 6" size={p.size || 14} {...p} />;
const IconClose = (p) => <Icon d="M6 6l12 12M18 6L6 18" size={p.size || 14} {...p} />;
const IconPlus = (p) => <Icon d="M12 5v14M5 12h14" size={p.size || 14} {...p} />;
const IconFolder = (p) => <Icon d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" size={p.size || 14} {...p} />;
const IconFolderPlus = (p) => (
  <Icon size={p.size || 14} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M12 11v6M9 14h6" />
  </Icon>
);
const IconSort = (p) => (
  <Icon size={p.size || 14} {...p}>
    <path d="M7 4v16M7 4l-3 3M7 4l3 3" />
    <path d="M17 20V4M17 20l-3-3M17 20l3-3" />
  </Icon>
);
const IconSettings = (p) => (
  <Icon size={p.size || 14} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Icon>
);
const IconPlay = (p) => <Icon size={p.size || 14} fill="currentColor" stroke="none" d="M8 5v14l11-7z" {...p} />;
const IconTerminal = (p) => (
  <Icon size={p.size || 14} {...p}>
    <path d="M4 17l6-6-6-6" />
    <path d="M12 19h8" />
  </Icon>
);
const IconDiff = (p) => (
  <Icon size={p.size || 14} {...p}>
    <path d="M12 5v6M9 8h6" />
    <path d="M9 16h6" />
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
  </Icon>
);
const IconCloud = (p) => (
  <Icon size={p.size || 14} {...p}>
    <path d="M18 10a5 5 0 0 0-9.5-1.5A4 4 0 0 0 6 16h12a4 4 0 0 0 0-8z" />
    <path d="M12 12v5M9 15l3 3 3-3" />
  </Icon>
);
const IconCommit = (p) => (
  <Icon size={p.size || 14} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M3 12h6M15 12h6" />
  </Icon>
);
const IconGithub = (p) => (
  <Icon size={p.size || 14} fill="currentColor" stroke="none" {...p}>
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
  </Icon>
);
const IconVSCode = (p) => (
  /* mono outline VS-Code-shaped mark (we keep it neutral/muted to avoid clashing with warm palette;
     the brief said keep VS Code's identity — but the icon ships in our chrome and we treat it tonally) */
  <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" style={p.style}>
    <path d="M17 3l-9 7-3.5-3L3 8.5v7L4.5 17 8 14l9 7 4-2V5l-4-2z"
      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
    <path d="M17 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconFinder = (p) => (
  <Icon size={p.size || 14} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="9" cy="11" r="0.6" fill="currentColor" />
    <circle cx="15" cy="11" r="0.6" fill="currentColor" />
    <path d="M9 15c1 1 4 1 5 0" />
  </Icon>
);
const IconArrowUp = (p) => <Icon size={p.size || 14} sw={2.2} d="M12 19V5M5 12l7-7 7 7" {...p} />;
const IconArrowDown = (p) => <Icon size={p.size || 14} sw={2.2} d="M12 5v14M5 12l7 7 7-7" {...p} />;
const IconBuild = (p) => (
  <Icon size={p.size || 14} {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L3 18v3h3l6.1-6.1a4 4 0 0 0 5.6-5.6l-2.5 2.5-2-2 2.5-2.5z" />
  </Icon>
);
const IconLock = (p) => (
  <Icon size={p.size || 14} {...p}>
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);
const IconSmile = (p) => (
  <Icon size={p.size || 14} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="9" cy="10" r="0.6" fill="currentColor" />
    <circle cx="15" cy="10" r="0.6" fill="currentColor" />
    <path d="M8.5 14.5c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2" />
  </Icon>
);
const IconBolt = (p) => <Icon size={p.size || 14} fill="currentColor" stroke="none" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" {...p} />;

Object.assign(window, {
  Icon, IconSearch, IconChevronDown, IconChevronRight, IconChevronUp, IconClose,
  IconPlus, IconFolder, IconFolderPlus, IconSort, IconSettings, IconPlay,
  IconTerminal, IconDiff, IconCloud, IconCommit, IconGithub, IconVSCode,
  IconFinder, IconArrowUp, IconArrowDown, IconBuild, IconLock, IconSmile, IconBolt,
});
