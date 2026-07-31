export const INVALID_PRODUCT_SLUG_LITERALS = ['null', 'undefined'] as const;

/** True when slug is non-empty and not a stringified null/undefined from bad client data. */
export function isValidProductSlug(raw: string | null | undefined): raw is string {
  if (raw == null) {
    return false;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  for (const literal of INVALID_PRODUCT_SLUG_LITERALS) {
    if (lower === literal) {
      return false;
    }
  }
  return true;
}

/** Canonical storefront PDP path for a validated product slug. */
export function productPdpHref(slug: string): string {
  return `/products/${slug}`;
}

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
