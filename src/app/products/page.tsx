import { Suspense } from 'react';
import { ProductsShopClientShell } from './ProductsShopClientShell';
import { ProductsShopLoadingSkeleton } from './ProductsShopLoadingSkeleton';
import { ProductsShopStreamedSection } from './ProductsShopStreamedSection';
import type { ProductsPageSearchParams } from './products-page-search-params';

interface ProductsPageProps {
  readonly searchParams: Promise<ProductsPageSearchParams>;
}

/**
 * Header paints immediately; filter shell and listing stream in under Suspense.
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const raw = await searchParams;

  return (
    <ProductsShopClientShell>
      <Suspense fallback={<ProductsShopLoadingSkeleton variant="body" />}>
        <ProductsShopStreamedSection raw={raw} />
      </Suspense>
    </ProductsShopClientShell>
  );
}
