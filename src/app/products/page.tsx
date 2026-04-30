import { Suspense } from 'react';
import { ProductsShopLoadingSkeleton } from './ProductsShopLoadingSkeleton';
import { ProductsShopClientShell } from './ProductsShopClientShell';
import { ProductsShopStreamedSection } from './ProductsShopStreamedSection';
import type { ProductsPageSearchParams } from './products-page-search-params';

interface ProductsPageProps {
  readonly searchParams: Promise<ProductsPageSearchParams>;
}

/**
 * Header (`ProductsShopClientShell`) paints immediately; listing streams inside Suspense
 * so breadcrumb + «Խանութ» are not replaced by a skeleton during fetch.
 */
export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <ProductsShopClientShell>
      <Suspense fallback={<ProductsShopLoadingSkeleton variant="body" />}>
        <ProductsShopStreamedSection searchParams={searchParams} />
      </Suspense>
    </ProductsShopClientShell>
  );
}
