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

/** @deprecated Prefer {@link buildProductsFiltersScopeKeyFromSearchParams} — kept for narrow migrations. */
export function buildProductsFiltersClientKey(args: {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  filter?: string;
  language: LanguageCode;
  technicalFilterSignature: string;
}): string {
  const params = new URLSearchParams();
  params.set('lang', args.language);
  if (args.category) {
    params.set('category', args.category);
  }
  if (args.search) {
    params.set('search', args.search);
  }
  if (args.minPrice) {
    params.set('minPrice', args.minPrice);
  }
  if (args.maxPrice) {
    params.set('maxPrice', args.maxPrice);
  }
  if (args.filter) {
    params.set('filter', args.filter);
  }
  if (args.technicalFilterSignature) {
    for (const part of args.technicalFilterSignature.split('&')) {
      if (!part) {
        continue;
      }
      const eq = part.indexOf('=');
      if (eq <= 0) {
        continue;
      }
      params.set(part.slice(0, eq), part.slice(eq + 1));
    }
  }
  return buildProductsFiltersScopeKeyFromSearchParams(params, args.language);
}
