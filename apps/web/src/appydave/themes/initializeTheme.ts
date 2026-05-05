import { DEFAULT_THEME, isTheme, THEME_STORAGE_KEY, type Theme } from "./types";

/** Read stored theme synchronously and apply the .dark class before React mounts. Eliminates FOUC. */
export function initializeTheme(): Theme {
  const stored = readStoredTheme();
  applyThemeClass(stored);
  return stored;
}

export function readStoredTheme(): Theme {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function writeStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage may be unavailable (e.g. private mode) — non-fatal.
  }
}

export function applyThemeClass(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
