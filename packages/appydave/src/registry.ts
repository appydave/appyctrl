export type RegisteredApp = {
  id: string;
  name: string;
  url: string;
  glyph?: string;
  openExternal: boolean;
};

export type AppRegistry = ReadonlyArray<RegisteredApp>;

export const APP_REGISTRY_STORAGE_KEY = "appydave.appRegistry";

export const SEEDED_APPS: ReadonlyArray<RegisteredApp> = [
  { id: "claude-ai", name: "Claude.ai", url: "https://claude.ai", glyph: "C", openExternal: false },
  {
    id: "angel-eye",
    name: "AngelEye",
    url: "http://localhost:5050/",
    glyph: "AE",
    openExternal: false,
  },
];

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isRegisteredApp(value: unknown): value is RegisteredApp {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v["id"] !== "string") return false;
  if (typeof v["name"] !== "string") return false;
  if (typeof v["url"] !== "string") return false;
  if (typeof v["openExternal"] !== "boolean") return false;
  if ("glyph" in v && v["glyph"] !== undefined && typeof v["glyph"] !== "string") return false;
  return true;
}

function isRegistry(value: unknown): value is ReadonlyArray<RegisteredApp> {
  return Array.isArray(value) && value.every(isRegisteredApp);
}

export function loadRegistry(): AppRegistry {
  if (!hasStorage()) return SEEDED_APPS;
  try {
    const raw = localStorage.getItem(APP_REGISTRY_STORAGE_KEY);
    if (raw === null) return SEEDED_APPS;
    const parsed: unknown = JSON.parse(raw);
    if (!isRegistry(parsed)) return SEEDED_APPS;
    return parsed;
  } catch {
    return SEEDED_APPS;
  }
}

export function saveRegistry(registry: AppRegistry): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(APP_REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Swallow — private mode / quota exceeded. In-session state still works.
  }
}

export function seedIfEmpty(): AppRegistry {
  if (!hasStorage()) return SEEDED_APPS;
  try {
    const raw = localStorage.getItem(APP_REGISTRY_STORAGE_KEY);
    if (raw === null) {
      saveRegistry(SEEDED_APPS);
      return SEEDED_APPS;
    }
  } catch {
    return SEEDED_APPS;
  }
  return loadRegistry();
}

export function generateId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length === 0) {
    return `app-${Math.random().toString(36).slice(2, 8)}`;
  }
  return slug;
}

export function uniqueId(base: string, existing: ReadonlyArray<RegisteredApp>): string {
  const ids = new Set(existing.map((app) => app.id));
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export type UrlValidation = { ok: true } | { ok: false; reason: string };

export function validateUrl(url: string): UrlValidation {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "URL is required" };
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return { ok: false, reason: "URL must start with http:// or https://" };
  }
  return { ok: true };
}

export type AppValidation =
  | { ok: true }
  | { ok: false; field: "name" | "url" | "glyph"; reason: string };

export function validateApp(input: Omit<RegisteredApp, "id">): AppValidation {
  if (input.name.trim().length === 0) {
    return { ok: false, field: "name", reason: "Name is required" };
  }
  const urlResult = validateUrl(input.url);
  if (!urlResult.ok) {
    return { ok: false, field: "url", reason: urlResult.reason };
  }
  if (input.glyph !== undefined && input.glyph.length > 2) {
    return { ok: false, field: "glyph", reason: "Glyph must be 1-2 characters" };
  }
  return { ok: true };
}
