export function validateAppyUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.href;
  } catch {
    return null;
  }
}

export function parseViewBounds(
  raw: unknown,
): { x: number; y: number; width: number; height: number } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const x = Number(r.x);
  const y = Number(r.y);
  const width = Number(r.width);
  const height = Number(r.height);
  if ([x, y, width, height].some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (width < 10 || height < 10) return null;
  return { x, y, width, height };
}
