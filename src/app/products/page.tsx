import { Suspense } from 'react';
import { resolveProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { ProductsShopClientShell } from './ProductsShopClientShell';
import { ProductsShopFiltersPrefetch } from './ProductsShopFiltersPrefetch';
import { ProductsShopStreamedSection } from './ProductsShopStreamedSection';
import type { ProductsPageSearchParams } from './products-page-search-params';

interface ProductsPageProps {
  readonly searchParams: Promise<ProductsPageSearchParams>;
}

/**
 * Header paints immediately; filter shell paints with parsed URL context; facet data streams in.
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const raw = await searchParams;
  const ctx = await resolveProductsShopListingServerContext(raw);

  return (
    <ProductsShopClientShell>
      <Suspense fallback={null}>
        <ProductsShopFiltersPrefetch raw={raw} ctx={ctx} />
      </Suspense>
      <ProductsShopStreamedSection raw={raw} ctx={ctx} />
    </ProductsShopClientShell>
  );
}
