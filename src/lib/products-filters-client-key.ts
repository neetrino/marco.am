import type { LanguageCode } from '@/lib/language';

const FACET_SCOPE_EXCLUDED_PARAMS = ['page', 'sort', 'limit'] as const;

/**
 * Stable facet scope key from PLP URL params (excludes pagination/sort).
 * Used for client session cache and SSR hydration alignment.
 */
export function buildProductsFiltersScopeKeyFromSearchParams(
  searchParams: URLSearchParams,
  language: LanguageCode,
): string {
  const params = new URLSearchParams(searchParams.toString());
  for (const key of FACET_SCOPE_EXCLUDED_PARAMS) {
    params.delete(key);
  }
  params.set('lang', language);
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const normalized = new URLSearchParams();
  for (const [key, value] of entries) {
    normalized.append(key, value);
  }
  return normalized.toString();
}
