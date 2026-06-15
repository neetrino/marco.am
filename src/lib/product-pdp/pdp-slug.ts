/** Normalizes `/products/[slug]` segment for cache keys and lookups. */
export function normalizePdpSlug(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    decoded = trimmed;
  }

  const base = decoded.includes(':') ? decoded.split(':')[0] ?? decoded : decoded;
  return base.trim();
}
