import { useCallback, useEffect, useState } from "react";

import { applyThemeClass, readStoredTheme, writeStoredTheme } from "./initializeTheme";
import type { Theme } from "./types";
import { THEME_STORAGE_KEY } from "./types";

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  // Cross-tab / cross-window sync (e.g. multiple Electron renderers, devtools).
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next = readStoredTheme();
      setThemeState(next);
      applyThemeClass(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    writeStoredTheme(next);
    applyThemeClass(next);
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
