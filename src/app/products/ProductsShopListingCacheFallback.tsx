'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { readShopListingCache } from '@/lib/shop-products-listing-client-cache';
import { ProductsShopListingClient } from './ProductsShopListingClient';
import { ProductsShopLoadingSkeleton } from './ProductsShopLoadingSkeleton';
import { normalizeShopGridProduct } from './shop-grid-product';

/**
 * Suspense fallback for the PLP grid — shows a warmed session cache instantly
 * instead of a blank main area during client navigations.
 */
export function ProductsShopListingCacheFallback() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const cached = useMemo(() => readShopListingCache(queryString), [queryString]);

  if (!cached || cached.data.length === 0) {
    return <ProductsShopLoadingSkeleton variant="grid" />;
  }

  return (
    <ProductsShopListingClient
      initialProducts={cached.data.map(normalizeShopGridProduct)}
      initialMeta={cached.meta}
      initialQueryString={queryString}
      initialSort={searchParams.get('sort') ?? 'default'}
    />
  );
}
