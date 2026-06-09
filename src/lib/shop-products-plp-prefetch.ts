import type { ProductsFiltersData } from '@/components/ProductsFiltersProvider';
import { apiClient } from '@/lib/api-client';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';
import { buildProductsFiltersScopeKeyFromSearchParams } from '@/lib/products-filters-client-key';
import type { LanguageCode } from '@/lib/language';
import { writeShopFiltersCache } from '@/lib/shop-products-filters-client-cache';
import {
  writeShopListingCache,
  type ShopListingCachePayload,
} from '@/lib/shop-products-listing-client-cache';

const warmInFlight = new Set<string>();

function buildDefaultShopListingQueryString(): string {
  return '';
}

/** Stable facet key for the default PLP (no active filters in the URL). */
export function buildDefaultShopFiltersClientKey(language: LanguageCode): string {
  return buildProductsFiltersScopeKeyFromSearchParams(new URLSearchParams(), language);
}

function buildListingApiParams(queryString: string, language: LanguageCode): Record<string, string> {
  const params = new URLSearchParams(queryString);
  params.set('lang', language);
  params.set('listingOmitProductAttributes', '1');
  if (!params.has('limit')) {
    params.set('limit', String(SHOP_PLP_DEFAULT_PAGE_SIZE));
  }
  if (!params.has('page')) {
    params.set('page', '1');
  }
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

type ProductsListingApiResponse = ShopListingCachePayload;

/**
 * Fetches default PLP listing + facet payloads and stores them in session caches
 * so `/products` can paint instantly on client navigation.
 */
export function warmShopProductsClientCaches(
  language: LanguageCode,
  queryString: string = buildDefaultShopListingQueryString(),
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const dedupeKey = `${language}|${queryString}`;
  if (warmInFlight.has(dedupeKey)) {
    return;
  }
  warmInFlight.add(dedupeKey);

  const urlParams = new URLSearchParams(queryString);
  const scopedFiltersKey = buildProductsFiltersScopeKeyFromSearchParams(urlParams, language);

  const filtersParams: Record<string, string> = {
    lang: language,
    includeCategories: '1',
  };
  const category = urlParams.get('category');
  const search = urlParams.get('search');
  const filter = urlParams.get('filter');
  const minPrice = urlParams.get('minPrice');
  const maxPrice = urlParams.get('maxPrice');
  if (category) {
    filtersParams.category = category;
  }
  if (search) {
    filtersParams.search = search;
  }
  if (filter) {
    filtersParams.filter = filter;
  }
  if (minPrice) {
    filtersParams.minPrice = minPrice;
  }
  if (maxPrice) {
    filtersParams.maxPrice = maxPrice;
  }
  urlParams.forEach((value, key) => {
    if (key.startsWith('spec.') || key === 'specs') {
      filtersParams[key] = value;
    }
  });

  void Promise.all([
    apiClient.get<ProductsFiltersData>('/api/v1/products/filters', {
      params: filtersParams,
    }),
    apiClient.get<ProductsListingApiResponse>('/api/v1/products', {
      params: buildListingApiParams(queryString, language),
    }),
  ])
    .then(([filters, listing]) => {
      writeShopFiltersCache(scopedFiltersKey, filters);
      writeShopListingCache(queryString, listing);
    })
    .catch(() => {
      /* Prefetch is best-effort — PLP will fetch on mount if this fails. */
    })
    .finally(() => {
      warmInFlight.delete(dedupeKey);
    });
}
