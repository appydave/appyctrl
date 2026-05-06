---
type: learning
phase: phase-3
date: 2026-05-06
title: "shell.openExternal is a Security Boundary — Always Validate URLs"
description: setWindowOpenHandler passes url from loaded page directly to shell.openExternal without validation. Any loaded page can call window.open(\"file:///etc/passwd\") or window.open(\"javascript:...\"). Always validate with URL scheme whitelist + domain allowlist before calling shell.openExternal.
category: learnings
tags: [electron, security, shell, ipc, webcontentsview, url-validation]
kdd_phase_origin: "phase-3"
kdd_error_signatures:
  - "loaded page calls window.open(\"file:///...\")"
  - "javascript: scheme in window.open() executed by shell.openExternal"
  - "user controlled URL passed directly to system"
  - "privilege escalation from web payload"
kdd_hard_won: false
kdd_impact: critical
kdd_related_docs:
  - ../patterns/electron-webcontentsview-lifecycle.md
---

# shell.openExternal is a Security Boundary — Always Validate URLs

## Context

Phase 3 implements embedded app rendering via WebContentsView. The web renderer loads an external app URL (user-controlled content). When the loaded page calls `window.open(targetUrl, "_blank")`, Electron's `setWindowOpenHandler` receives the `url` parameter. The handler must decide: allow it to open in the system default browser (via `shell.openExternal`), or deny it.

**The trap:** `setWindowOpenHandler` receives whatever URL the loaded page passed to `window.open()`. Without explicit validation, you can pass arbitrary schemes and paths directly to `shell.openExternal`, escalating web-page intent to the host system.

## Risk

A malicious or compromised embedded app can call:

```javascript
// In the loaded app's JS
window.open("file:///etc/passwd");          // ✗ Opens local file in editor
window.open("javascript:alert('xss')");     // ✗ Executes JS in the browser
window.open("mailto:attacker@evil.com");    // ✗ Composes email with crafted body
window.open("file:///Applications/...");    // ✗ Opens admin tools
```

Without validation, `shell.openExternal` will:
- For `file://`: open the file in the default app (editor, PDF viewer, etc.)
- For `javascript:`: pass to the system browser, which may execute it
- For `mailto:`: open email client and populate fields
- For custom schemes: invoke registered protocol handlers

This is a **privilege escalation vector**. The web page has no ability to access the filesystem directly, but by controlling the URL passed to `setWindowOpenHandler`, it can trick the main process into doing it.

## Pattern

Validate every URL before passing to `shell.openExternal`. Use a combination of:

1. **Scheme whitelist:** only allow `http:` and `https:`
2. **Domain allowlist:** restrict to known safe hosts
3. **URL parsing:** use `new URL()` to validate syntax

```ts
// Main process
const ALLOWED_DOMAINS = [
  "example.com",
  "www.example.com",
  "docs.example.com",
  "help.company.io",
];

function isValidAppUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    
    // Only allow http and https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    
    // Check against domain allowlist
    if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
      return false;
    }
    
    return true;
  } catch {
    // new URL() threw — invalid syntax
    return false;
  }
}

ipcMain.handle("appy:show-webview", (event, { url, bounds }) => {
  const view = new WebContentsView({...});
  
  // Validate the primary app URL
  if (!isValidAppUrl(url)) {
    throw new Error(`Invalid app URL: ${url}`);
  }
  
  // Handle new windows (target="_blank") from the loaded app
  view.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
    if (isValidAppUrl(popupUrl)) {
      // ✓ Safe to open in external browser
      shell.openExternal(popupUrl);
      return { action: "deny" }; // deny the in-webview window
    }
    
    // ✗ Deny: wrong scheme, wrong domain, or invalid syntax
    console.warn(`Blocked unsafe popup URL: ${popupUrl}`);
    return { action: "deny" };
  });
  
  // Handle navigation within the view (e.g., <a href="...">)
  view.webContents.on("will-navigate", (event, navigationUrl) => {
    if (!isValidAppUrl(navigationUrl)) {
      event.preventDefault();
      console.warn(`Blocked unsafe navigation: ${navigationUrl}`);
    }
  });
  
  view.webContents.loadURL(url);
});
```

## Related Vectors

The same risk applies to:

- **`will-navigate` handler:** navigation URL from a link or form
- **Direct IPC calls:** if the webview can send arbitrary URLs via a custom IPC channel (e.g., `window.appyBridge.openUrl(url)`), validate those too
- **Preload script exposure:** if you expose `shell` or `app` methods directly in the preload, an attacker can call them from loaded page JS

## Prevention Checklist

- [ ] `setWindowOpenHandler` validates `url` before `shell.openExternal`
- [ ] `will-navigate` handler validates navigation URLs
- [ ] Scheme is checked against a whitelist (http/https only)
- [ ] Domain is checked against an allowlist (not a blocklist — blocklists miss new attack surfaces)
- [ ] URL parsing uses `new URL()` — no ad-hoc regex parsing
- [ ] Invalid URLs are logged (for security auditing)
- [ ] The allowlist is maintained in a config file (not hardcoded in multiple places)

## Non-Examples (What NOT to Do)

```ts
// ✗ Wrong: no validation
view.webContents.setWindowOpenHandler(({ url }) => {
  shell.openExternal(url); // Any URL, any scheme — UNSAFE
  return { action: "deny" };
});

// ✗ Wrong: only checking http scheme
view.webContents.setWindowOpenHandler(({ url }) => {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") {
      shell.openExternal(url); // Still unsafe — could be attacker.com or mail.attacker.com
    }
  } catch {}
  return { action: "deny" };
});

// ✗ Wrong: blocklist instead of allowlist
const BLOCKED_DOMAINS = ["evil.com", "malware.io"];
view.webContents.setWindowOpenHandler(({ url }) => {
  if (!BLOCKED_DOMAINS.includes(new URL(url).hostname)) {
    shell.openExternal(url); // Miss: attacker registers new domain
  }
  return { action: "deny" };
});
```

## Origin

- Phase: phase-3
- Risk identified during ADR-0003 (WebContentsView) security review
- Prevention pattern: code review during implementation

## Related

- Electron Security: https://www.electronjs.org/docs/tutorial/security
- OWASP: URL Validation Checklist
