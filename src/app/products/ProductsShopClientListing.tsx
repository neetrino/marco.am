'use client';

import { useEffect, useMemo, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';
import { buildShopListingApiParams } from '@/lib/shop-products-listing-api-params';
import { getStoredLanguage } from '@/lib/language';
import { readShopListingCache } from '@/lib/shop-products-listing-client-cache';
import { useShopProductsListingSearchParams } from '@/lib/use-shop-products-listing-search-params';

import { ProductsShopListingClient } from './ProductsShopListingClient';
import { ProductsShopLoadingSkeleton } from './ProductsShopLoadingSkeleton';
import { normalizeShopGridProduct } from './shop-grid-product';

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

/**
 * PLP grid mount — paints warmed session cache instantly, otherwise fetches on the client.
 */
export function ProductsShopClientListing() {
  const searchParams = useShopProductsListingSearchParams();
  const queryString = searchParams.toString();
  const sort = searchParams.get('sort') ?? 'default';
  const cached = useMemo(() => readShopListingCache(queryString), [queryString]);
  const [bootstrapped, setBootstrapped] = useState(cached);

  useEffect(() => {
    if (cached) {
      setBootstrapped(cached);
      return;
    }

    let cancelled = false;
    setBootstrapped(null);

    void apiClient
      .get<ProductsListingApiResponse>('/api/v1/products', {
        params: buildShopListingApiParams(queryString, getStoredLanguage()),
      })
      .then((response) => {
        if (cancelled) {
          return;
        }
        setBootstrapped(normalizeListingApiResponse(response));
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setBootstrapped({
          data: [],
          meta: { total: 0, page: 1, limit: SHOP_PLP_DEFAULT_PAGE_SIZE, totalPages: 0 },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [cached, queryString]);

  if (!bootstrapped) {
    return <ProductsShopLoadingSkeleton variant="grid" />;
  }

  return (
    <ProductsShopListingClient
      initialProducts={bootstrapped.data.map(normalizeShopGridProduct)}
      initialMeta={bootstrapped.meta}
      initialQueryString={queryString}
      initialSort={sort}
    />
  );
}
