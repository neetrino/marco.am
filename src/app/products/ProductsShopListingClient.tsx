'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductsGrid } from '@/components/ProductsGrid';
import {
  ProductsPagination,
  type PaginationSlotItem,
} from '@/components/products/ProductsPagination';
import { apiClient } from '@/lib/api-client';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';
import { getStoredLanguage } from '@/lib/language';
import { PRODUCTS_PLP_TOTAL_EVENT } from '@/lib/products-plp-total-event';
import { pushShopProductsListingUrl } from '@/lib/push-shop-products-listing-url';
import { getQueryClient } from '@/lib/query/get-query-client';
import { syncShopListingProductsToPdpCache } from '@/lib/shop-products-plp-pdp-sync';
import {
  isShopListingCacheFresh,
  readShopListingCache,
  registerShopProductsListingFetchListener,
  writeShopListingCache,
} from '@/lib/shop-products-listing-client-cache';
import { getShopCategoryFilterTree } from '@/lib/shop-category-filter-tree-store';
import { applyOptimisticShopListingFilter } from '@/lib/shop-products-listing-optimistic-filter';
import {
  SHOP_PRODUCTS_LISTING_PARAMS_EVENT,
  type ShopProductsListingParamsDetail,
} from '@/lib/shop-products-listing-params-event';
import { useTranslation } from '@/lib/i18n-client';
import { ProductsShopLoadingSkeleton } from './ProductsShopLoadingSkeleton';
import { normalizeShopGridProduct, type ShopGridProduct } from './shop-grid-product';

type ListingMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ProductsListingApiResponse = {
  data?: unknown[];
  meta?: ListingMeta;
  items?: unknown[];
  pagination?: ListingMeta;
};

type ProductsShopListingClientProps = {
  readonly initialProducts: ShopGridProduct[];
  readonly initialMeta: ListingMeta;
  readonly initialQueryString: string;
  readonly initialSort: string;
};

function buildListingApiParams(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  params.set('lang', getStoredLanguage());
  params.set('listingOmitProductAttributes', '1');
  params.set('compact', '1');
  if (!params.has('limit')) {
    params.set('limit', String(SHOP_PLP_DEFAULT_PAGE_SIZE));
  }
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function buildPaginationUrl(queryString: string, page: number): string {
  const params = new URLSearchParams(queryString);
  params.set('page', String(page));
  if (!params.has('limit')) {
    params.set('limit', String(SHOP_PLP_DEFAULT_PAGE_SIZE));
  }
  const qs = params.toString();
  return qs ? `/products?${qs}` : '/products';
}

function getPaginationPages(totalPages: number, current: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const set = new Set<number>([1, totalPages, current - 1, current, current + 1]);
  const sorted = Array.from(set).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    if (index > 0 && sorted[index]! - sorted[index - 1]! > 1) {
      out.push('ellipsis');
    }
    out.push(sorted[index]!);
  }
  return out;
}

function readSortFromQuery(queryString: string): string {
  return new URLSearchParams(queryString).get('sort') ?? 'default';
}

function normalizeListingApiResponse(response: ProductsListingApiResponse): {
  data: unknown[];
  meta: ListingMeta;
} {
  return {
    data: response.data ?? response.items ?? [],
    meta:
      response.meta ??
      response.pagination ?? {
        total: 0,
        page: 1,
        limit: SHOP_PLP_DEFAULT_PAGE_SIZE,
        totalPages: 0,
      },
  };
}

const PLP_LISTING_ROOT_CLASS =
  'min-w-0 flex-1 w-full overflow-x-hidden pt-4 pb-2 min-[744px]:w-auto min-[744px]:py-4';

/**
 * Client-driven PLP grid — filter/pagination changes fetch `/api/v1/products` immediately
 * instead of waiting for a full RSC navigation round-trip.
 */
export function ProductsShopListingClient({
  initialProducts,
  initialMeta,
  initialQueryString,
  initialSort,
}: ProductsShopListingClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [products, setProducts] = useState(initialProducts);
  const [meta, setMeta] = useState(initialMeta);
  const [sortBy, setSortBy] = useState(initialSort);
  const [queryString, setQueryString] = useState(initialQueryString);
  const [isFetching, setIsFetching] = useState(false);
  const [showGridSkeleton, setShowGridSkeleton] = useState(false);
  const [hasOptimisticListing, setHasOptimisticListing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const queryRef = useRef(initialQueryString);
  const productsRef = useRef(initialProducts);
  const fetchGenerationRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialPdpCacheSyncedRef = useRef(false);

  if (!initialPdpCacheSyncedRef.current) {
    initialPdpCacheSyncedRef.current = true;
    writeShopListingCache(initialQueryString, {
      data: initialProducts,
      meta: initialMeta,
    });
    syncShopListingProductsToPdpCache(
      getQueryClient(),
      initialProducts,
      getStoredLanguage(),
    );
  }

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    writeShopListingCache(initialQueryString, {
      data: initialProducts,
      meta: initialMeta,
    });
    syncShopListingProductsToPdpCache(
      getQueryClient(),
      initialProducts,
      getStoredLanguage(),
    );
  }, [initialMeta, initialProducts, initialQueryString]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    syncShopListingProductsToPdpCache(getQueryClient(), products, getStoredLanguage());
  }, [isHydrated, products]);

  const reportTotal = useCallback((total: number) => {
    window.dispatchEvent(new CustomEvent<number>(PRODUCTS_PLP_TOTAL_EVENT, { detail: total }));
  }, []);

  const applyListingPayload = useCallback(
    (payload: ProductsListingApiResponse, nextQueryString: string) => {
      const normalizedPayload = normalizeListingApiResponse(payload);
      const normalized = normalizedPayload.data.map(normalizeShopGridProduct);
      setProducts(normalized);
      setMeta(normalizedPayload.meta);
      setSortBy(readSortFromQuery(nextQueryString));
      setShowGridSkeleton(false);
      setHasOptimisticListing(false);
      writeShopListingCache(nextQueryString, normalizedPayload);
      syncShopListingProductsToPdpCache(
        getQueryClient(),
        normalized,
        getStoredLanguage(),
      );
      reportTotal(normalizedPayload.meta.total);
    },
    [reportTotal],
  );

  const fetchListing = useCallback(
    async (nextQueryString: string, options?: { silent?: boolean }) => {
      const generation = fetchGenerationRef.current + 1;
      fetchGenerationRef.current = generation;
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      if (!options?.silent) {
        setIsFetching(true);
      } else {
        setIsFetching(false);
      }
      try {
        const response = await apiClient.get<ProductsListingApiResponse>('/api/v1/products', {
          params: buildListingApiParams(nextQueryString),
          signal: abortController.signal,
          suppressAbortErrorLogging: true,
        });
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        applyListingPayload(response, nextQueryString);
      } catch {
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        if (abortController.signal.aborted) {
          return;
        }
        if (!options?.silent) {
          setProducts([]);
          setMeta({ total: 0, page: 1, limit: SHOP_PLP_DEFAULT_PAGE_SIZE, totalPages: 0 });
          setShowGridSkeleton(false);
          setHasOptimisticListing(false);
          reportTotal(0);
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
        if (generation === fetchGenerationRef.current && !options?.silent) {
          setIsFetching(false);
        }
      }
    },
    [applyListingPayload, reportTotal],
  );

  const syncFromQueryString = useCallback(
    (nextQueryString: string) => {
      if (nextQueryString === queryRef.current) {
        return;
      }
      const previousQueryString = queryRef.current;
      queryRef.current = nextQueryString;
      setQueryString(nextQueryString);

      const cached = readShopListingCache(nextQueryString);
      if (cached) {
        applyListingPayload(cached, nextQueryString);
        if (!isShopListingCacheFresh(nextQueryString)) {
          void fetchListing(nextQueryString, { silent: true });
        }
        return;
      }

      const optimistic = applyOptimisticShopListingFilter(
        productsRef.current,
        nextQueryString,
        previousQueryString,
        getShopCategoryFilterTree(),
      );
      if (optimistic !== null) {
        setProducts(optimistic);
        setShowGridSkeleton(false);
        setHasOptimisticListing(true);
      } else if (productsRef.current.length > 0) {
        setShowGridSkeleton(true);
        setHasOptimisticListing(false);
      } else {
        setProducts([]);
        setShowGridSkeleton(true);
        setHasOptimisticListing(false);
      }

      void fetchListing(nextQueryString);
    },
    [applyListingPayload, fetchListing],
  );

  useEffect(() => {
    registerShopProductsListingFetchListener(syncFromQueryString);
    return () => {
      fetchGenerationRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      registerShopProductsListingFetchListener(null);
    };
  }, [syncFromQueryString]);

  useEffect(() => {
    const onListingParams = (event: Event) => {
      const detail = (event as CustomEvent<ShopProductsListingParamsDetail>).detail;
      syncFromQueryString(detail.queryString);
    };
    window.addEventListener(SHOP_PRODUCTS_LISTING_PARAMS_EVENT, onListingParams);
    return () => {
      window.removeEventListener(SHOP_PRODUCTS_LISTING_PARAMS_EVENT, onListingParams);
    };
  }, [syncFromQueryString]);

  useEffect(() => {
    if (initialQueryString === queryRef.current) {
      return;
    }
    queryRef.current = initialQueryString;
    setQueryString(initialQueryString);
    setProducts(initialProducts);
    setMeta(initialMeta);
    setSortBy(initialSort);
    setShowGridSkeleton(false);
    setHasOptimisticListing(false);
    reportTotal(initialMeta.total);
  }, [initialMeta, initialProducts, initialQueryString, initialSort, reportTotal]);

  useEffect(() => {
    reportTotal(initialMeta.total);
  }, [initialMeta.total, reportTotal]);

  const navigateToPage = (href: string) => {
    pushShopProductsListingUrl(router, href);
  };

  const visibleProducts = isHydrated ? products : initialProducts;
  const visibleMeta = isHydrated ? meta : initialMeta;
  const visibleSort = isHydrated ? sortBy : initialSort;
  const visiblePage = visibleMeta.page;
  const showFetchingSkeleton = isHydrated && isFetching && !hasOptimisticListing;
  const showSkeleton = isHydrated && showGridSkeleton;

  const visiblePaginationSlotItems: PaginationSlotItem[] = useMemo(() => {
    return getPaginationPages(visibleMeta.totalPages, visiblePage).map((item) =>
      item === 'ellipsis'
        ? { kind: 'ellipsis' }
        : {
            kind: 'page',
            page: item,
            href: buildPaginationUrl(queryString, item),
          },
    );
  }, [visibleMeta.totalPages, visiblePage, queryString]);

  return (
    <div
      className={PLP_LISTING_ROOT_CLASS}
      {...(isHydrated && isFetching ? { 'aria-busy': true as const } : {})}
    >
      {showSkeleton || showFetchingSkeleton ? (
        <ProductsShopLoadingSkeleton variant="grid" />
      ) : visibleProducts.length > 0 ? (
        <>
          <ProductsGrid products={visibleProducts} sortBy={visibleSort} disableProgressiveRender />
          {visibleMeta.totalPages > 1 ? (
            <ProductsPagination
              page={visiblePage}
              totalPages={visibleMeta.totalPages}
              hrefFirst={buildPaginationUrl(queryString, 1)}
              hrefBack={buildPaginationUrl(queryString, Math.max(1, visiblePage - 1))}
              hrefNext={buildPaginationUrl(queryString, Math.min(visibleMeta.totalPages, visiblePage + 1))}
              hrefLast={buildPaginationUrl(queryString, visibleMeta.totalPages)}
              slotItems={visiblePaginationSlotItems}
              onNavigate={navigateToPage}
            />
          ) : null}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500 dark:text-white/72">
            {t('common.messages.noProductsFound')}
          </p>
        </div>
      )}
    </div>
  );
}
