'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { readShopListingCache } from '@/lib/shop-products-listing-client-cache';
import { ProductsShopListingClient } from './ProductsShopListingClient';
import { ProductsShopLoadingSkeleton } from './ProductsShopLoadingSkeleton';
import { normalizeShopGridProduct } from './shop-grid-product';
import { ProductsListingToolbar } from '@/components/ProductsListingToolbar';

/**
 * Suspense fallback for the PLP grid — shows a warmed session cache instantly
 * instead of a blank main area during client navigations.
 */
export function ProductsShopListingCacheFallback() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const cached = useMemo(() => readShopListingCache(queryString), [queryString]);

  if (!cached || cached.data.length === 0) {
    return (
      <div className="min-w-0 flex-1 w-full min-[744px]:w-auto">
        <ProductsListingToolbar />
        <ProductsShopLoadingSkeleton variant="grid" />
      </div>
    );
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
