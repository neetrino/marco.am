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
import {
  SHOP_PRODUCTS_LISTING_PARAMS_EVENT,
  type ShopProductsListingParamsDetail,
} from '@/lib/shop-products-listing-params-event';
import { useTranslation } from '@/lib/i18n-client';
import { normalizeShopGridProduct, type ShopGridProduct } from './shop-grid-product';

type ListingMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ProductsListingApiResponse = {
  data: unknown[];
  meta: ListingMeta;
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
  const queryRef = useRef(initialQueryString);
  const fetchGenerationRef = useRef(0);

  const reportTotal = useCallback((total: number) => {
    window.dispatchEvent(new CustomEvent<number>(PRODUCTS_PLP_TOTAL_EVENT, { detail: total }));
  }, []);

  const applyListingPayload = useCallback(
    (payload: ProductsListingApiResponse, queryString: string) => {
      setProducts(payload.data.map(normalizeShopGridProduct));
      setMeta(payload.meta);
      setSortBy(readSortFromQuery(queryString));
      reportTotal(payload.meta.total);
    },
    [reportTotal],
  );

  const fetchListing = useCallback(
    async (queryString: string) => {
      const generation = fetchGenerationRef.current + 1;
      fetchGenerationRef.current = generation;
      setIsFetching(true);
      try {
        const response = await apiClient.get<ProductsListingApiResponse>('/api/v1/products', {
          params: buildListingApiParams(queryString),
        });
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        applyListingPayload(response, queryString);
      } catch {
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        setProducts([]);
        setMeta({ total: 0, page: 1, limit: SHOP_PLP_DEFAULT_PAGE_SIZE, totalPages: 0 });
        reportTotal(0);
      } finally {
        if (generation === fetchGenerationRef.current) {
          setIsFetching(false);
        }
      }
    },
    [applyListingPayload, reportTotal],
  );

  const syncFromQueryString = useCallback(
    (queryString: string) => {
      if (queryString === queryRef.current) {
        return;
      }
      queryRef.current = queryString;
      setQueryString(queryString);
      void fetchListing(queryString);
    },
    [fetchListing],
  );

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
    reportTotal(initialMeta.total);
  }, [initialMeta, initialProducts, initialQueryString, initialSort, reportTotal]);

  useEffect(() => {
    reportTotal(initialMeta.total);
  }, [initialMeta.total, reportTotal]);

  const page = meta.page;
  const paginationSlotItems: PaginationSlotItem[] = useMemo(() => {
    return getPaginationPages(meta.totalPages, page).map((item) =>
      item === 'ellipsis'
        ? { kind: 'ellipsis' }
        : {
            kind: 'page',
            page: item,
            href: buildPaginationUrl(queryString, item),
          },
    );
  }, [meta.totalPages, page, queryString]);

  const navigateToPage = (href: string) => {
    pushShopProductsListingUrl(router, href);
  };

  return (
    <div
      className={`min-w-0 flex-1 w-full overflow-x-hidden pt-4 pb-2 min-[744px]:w-auto min-[744px]:py-4 transition-opacity duration-150 ${
        isFetching ? 'opacity-70' : 'opacity-100'
      }`}
      aria-busy={isFetching}
    >
      {products.length > 0 ? (
        <>
          <ProductsGrid products={products} sortBy={sortBy} />
          {meta.totalPages > 1 ? (
            <ProductsPagination
              page={page}
              totalPages={meta.totalPages}
              hrefFirst={buildPaginationUrl(queryString, 1)}
              hrefBack={buildPaginationUrl(queryString, Math.max(1, page - 1))}
              hrefNext={buildPaginationUrl(queryString, Math.min(meta.totalPages, page + 1))}
              hrefLast={buildPaginationUrl(queryString, meta.totalPages)}
              slotItems={paginationSlotItems}
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
