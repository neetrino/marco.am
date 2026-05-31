import { prefetchProductsShopFilters } from '@/lib/cache/products-shop-filters-prefetch';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import type { ProductsPageSearchParams } from './products-page-search-params';

type ProductsShopFiltersPrefetchProps = {
  readonly raw: ProductsPageSearchParams;
  readonly ctx: ProductsShopListingServerContext;
};

/** Starts the Redis facet read-through fetch as early as possible in the RSC tree. */
export async function ProductsShopFiltersPrefetch({ raw, ctx }: ProductsShopFiltersPrefetchProps) {
  await prefetchProductsShopFilters(raw, ctx);
  return null;
}
