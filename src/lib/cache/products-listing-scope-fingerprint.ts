import type { ProductFilters } from '@/lib/services/products-find-query/types';

/** Normalize technical spec filters for stable cache keys. */
export function normalizeTechnicalSpecsForListingKey(
  specs: ProductFilters['technicalSpecs'],
): Record<string, string[]> {
  if (!specs || typeof specs !== 'object') {
    return {};
  }
  const out: Record<string, string[]> = {};
  for (const key of Object.keys(specs).sort()) {
    const arr = specs[key];
    if (!Array.isArray(arr)) {
      continue;
    }
    out[key] = [...arr].map((value) => String(value)).sort();
  }
  return out;
}

/**
 * Listing scope fingerprint — excludes pagination and sort (count is sort-invariant).
 */
export function buildProductsListingScopeFingerprint(
  filters: ProductFilters,
): Record<string, unknown> {
  const productIds = filters.productIds?.length
    ? [...filters.productIds].sort()
    : null;

  return {
    category: filters.category ?? null,
    search: filters.search ?? null,
    filter: filters.filter ?? null,
    pricePresence: filters.pricePresence ?? null,
    minPrice: filters.minPrice ?? null,
    maxPrice: filters.maxPrice ?? null,
    colors: filters.colors ?? null,
    sizes: filters.sizes ?? null,
    brand: filters.brand ?? null,
    lang: filters.lang ?? 'en',
    technicalSpecs: normalizeTechnicalSpecsForListingKey(filters.technicalSpecs),
    productIds,
    listingOmitProductAttributes: Boolean(filters.listingOmitProductAttributes),
    cardVisualOnly: Boolean(filters.cardVisualOnly),
    homeStripListing: Boolean(filters.homeStripListing),
    plpLeanListing: Boolean(filters.plpLeanListing),
    ...(filters.skipExactTotalCount ? { skipExactTotalCount: true as const } : {}),
  };
}
