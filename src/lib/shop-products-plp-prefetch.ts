import type { ProductsFiltersData } from '@/components/ProductsFiltersProvider';
import { apiClient } from '@/lib/api-client';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';
import { buildProductsFiltersClientKey } from '@/lib/products-filters-client-key';
import type { LanguageCode } from '@/lib/language';
import { buildTechnicalFilterQuerySignature } from '@/lib/services/products-technical-filters';
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
  return buildProductsFiltersClientKey({
    category: undefined,
    search: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    filter: undefined,
    language,
    technicalFilterSignature: '',
  });
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
  const category = urlParams.get('category') ?? undefined;
  const search = urlParams.get('search') ?? undefined;
  const minPrice = urlParams.get('minPrice') ?? undefined;
  const maxPrice = urlParams.get('maxPrice') ?? undefined;
  const filter = urlParams.get('filter') ?? undefined;
  const scopedFiltersKey = buildProductsFiltersClientKey({
    category,
    search,
    minPrice,
    maxPrice,
    filter,
    language,
    technicalFilterSignature: buildTechnicalFilterQuerySignature(urlParams),
  });

  const filtersParams: Record<string, string> = {
    lang: language,
    includeCategories: '1',
  };
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
