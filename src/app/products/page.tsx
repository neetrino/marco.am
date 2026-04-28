import { Suspense } from 'react';
import { ProductsShopLoadingSkeleton } from './ProductsShopLoadingSkeleton';
import {
  ProductsShopStreamedSection,
  type ProductsPageSearchParams,
} from './ProductsShopStreamedSection';

interface ProductsPageProps {
  readonly searchParams: Promise<ProductsPageSearchParams>;
}

/**
 * Sync shell + Suspense so the route resolves immediately and the shop UI streams
 * (filters + grid) without blocking on `products/loading.tsx`.
 */
export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <Suspense fallback={<ProductsShopLoadingSkeleton />}>
      <ProductsShopStreamedSection searchParams={searchParams} />
    </Suspense>
  );
}
