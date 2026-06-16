import type { ProductsFiltersData } from '@/components/ProductsFiltersProvider';
import { normalizeShopGridProduct } from '@/app/products/shop-grid-product';
import { apiClient } from '@/lib/api-client';
import { SHOP_PLP_DEFAULT_PAGE_SIZE, PLP_PDP_CACHE_SYNC_BATCH_SIZE } from '@/lib/constants/shop-plp-pagination';
import { buildProductsFiltersScopeKeyFromSearchParams } from '@/lib/products-filters-client-key';
import type { LanguageCode } from '@/lib/language';
import { getQueryClient } from '@/lib/query/get-query-client';
import { writeShopFiltersCache } from '@/lib/shop-products-filters-client-cache';
import { syncShopListingProductsToPdpCache } from '@/lib/shop-products-plp-pdp-sync';
import { buildShopListingApiParams } from '@/lib/shop-products-listing-api-params';
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
  return buildShopListingApiParams(queryString, language);
}

type ProductsListingApiResponse = ShopListingCachePayload & {
  items?: ShopListingCachePayload['data'];
  pagination?: ShopListingCachePayload['meta'];
};

type WarmShopProductsClientCachesOptions = {
  timeoutMs?: number;
  includeCategories?: boolean;
  includeFilters?: boolean;
  suppressTimeoutLogging?: boolean;
};

/**
 * Fetches default PLP listing + facet payloads and stores them in session caches
 * so `/products` can paint instantly on client navigation.
 */
export function warmShopProductsClientCaches(
  language: LanguageCode,
  queryString: string = buildDefaultShopListingQueryString(),
  options?: WarmShopProductsClientCachesOptions,
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

  const includeFilters = options?.includeFilters !== false;
  const filtersParams: Record<string, string> = {
    lang: language,
    includeCategories: options?.includeCategories === false ? '0' : '1',
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

  const listingRequest = apiClient.get<ProductsListingApiResponse>('/api/v1/products', {
      params: buildListingApiParams(queryString, language),
      timeoutMs: options?.timeoutMs,
      suppressNetworkErrorLogging: options?.suppressTimeoutLogging,
    });
  const filtersRequest = includeFilters
    ? apiClient.get<ProductsFiltersData>('/api/v1/products/filters', {
        params: filtersParams,
        timeoutMs: options?.timeoutMs,
        suppressNetworkErrorLogging: options?.suppressTimeoutLogging,
      })
    : Promise.resolve(null);

  void Promise.all([filtersRequest, listingRequest])
    .then(([filters, listing]) => {
      if (filters) {
        writeShopFiltersCache(scopedFiltersKey, filters);
      }
      writeShopListingCache(queryString, {
        data: listing.data ?? listing.items ?? [],
        meta: listing.meta ?? listing.pagination ?? {
          total: 0,
          page: 1,
          limit: SHOP_PLP_DEFAULT_PAGE_SIZE,
          totalPages: 0,
        },
      });
      const normalized = (listing.data ?? listing.items ?? []).map(normalizeShopGridProduct);
      syncShopListingProductsToPdpCache(
        getQueryClient(),
        normalized.slice(0, PLP_PDP_CACHE_SYNC_BATCH_SIZE),
        language,
      );
    })
    .catch(() => {
      /* Prefetch is best-effort — PLP will fetch on mount if this fails. */
    })
    .finally(() => {
      warmInFlight.delete(dedupeKey);
    });
}
