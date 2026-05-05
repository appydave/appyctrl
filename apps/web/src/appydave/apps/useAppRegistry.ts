import { useCallback, useEffect, useState } from "react";
import {
  APP_REGISTRY_STORAGE_KEY,
  type AppRegistry,
  generateId,
  loadRegistry,
  type RegisteredApp,
  saveRegistry,
  seedIfEmpty,
  uniqueId,
} from "@t3tools/appydave-registry";

type UseAppRegistryResult = {
  apps: AppRegistry;
  add: (input: Omit<RegisteredApp, "id">) => RegisteredApp;
  update: (id: string, patch: Partial<Omit<RegisteredApp, "id">>) => void;
  delete: (id: string) => void;
  getById: (id: string) => RegisteredApp | undefined;
};

function initialApps(): AppRegistry {
  if (typeof window === "undefined") return [];
  return seedIfEmpty();
}

export function useAppRegistry(): UseAppRegistryResult {
  const [apps, setApps] = useState<AppRegistry>(initialApps);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: StorageEvent) => {
      if (event.key !== APP_REGISTRY_STORAGE_KEY) return;
      setApps(loadRegistry());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const add = useCallback((input: Omit<RegisteredApp, "id">): RegisteredApp => {
    const base = generateId(input.name);
    let created!: RegisteredApp;
    setApps((current) => {
      const id = uniqueId(base, current);
      const entry: RegisteredApp =
        input.glyph === undefined
          ? { id, name: input.name, url: input.url, openExternal: input.openExternal }
          : {
              id,
              name: input.name,
              url: input.url,
              glyph: input.glyph,
              openExternal: input.openExternal,
            };
      created = entry;
      const next = [...current, entry];
      saveRegistry(next);
      return next;
    });
    return created;
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<RegisteredApp, "id">>) => {
    setApps((current) => {
      const next = current.map((app): RegisteredApp => {
        if (app.id !== id) return app;
        const merged: RegisteredApp = {
          id: app.id,
          name: patch.name ?? app.name,
          url: patch.url ?? app.url,
          openExternal: patch.openExternal ?? app.openExternal,
        };
        const nextGlyph = "glyph" in patch ? patch.glyph : app.glyph;
        if (nextGlyph !== undefined) merged.glyph = nextGlyph;
        return merged;
      });
      saveRegistry(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setApps((current) => {
      const next = current.filter((app) => app.id !== id);
      saveRegistry(next);
      return next;
    });
  }, []);

  const getById = useCallback(
    (id: string): RegisteredApp | undefined => apps.find((app) => app.id === id),
    [apps],
  );

  return { apps, add, update, delete: remove, getById };
}
