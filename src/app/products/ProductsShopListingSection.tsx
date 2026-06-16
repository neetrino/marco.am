import { getProductsListingCached } from '@/lib/cache/products-listing-redis';
import { searchParamsRecordToUrlSearchParams } from '@/lib/cache/products-filters-redis';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { parseTechnicalSpecFiltersFromSearchParams } from '@/lib/services/products-technical-filters';
import type { ProductsPageSearchParams } from './products-page-search-params';
import { ProductsShopListingClient } from './ProductsShopListingClient';
import { normalizeShopGridProduct } from './shop-grid-product';

type ProductsShopListingSectionProps = {
  readonly raw: ProductsPageSearchParams;
  readonly ctx: ProductsShopListingServerContext;
};

async function fetchProductsListing(
  raw: ProductsPageSearchParams,
  ctx: ProductsShopListingServerContext,
) {
  const technicalSpecs = parseTechnicalSpecFiltersFromSearchParams(
    searchParamsRecordToUrlSearchParams(raw),
  );

  try {
    const productsData = await getProductsListingCached({
      page: ctx.page,
      limit: ctx.perPage,
      lang: ctx.language,
      search: ctx.params.search?.trim() || undefined,
      category: ctx.params.category?.trim() || undefined,
      minPrice: ctx.filtersMinPrice,
      maxPrice: ctx.filtersMaxPrice,
      colors: ctx.params.colors?.trim() || undefined,
      sizes: ctx.params.sizes?.trim() || undefined,
      brand: ctx.params.brand?.trim() || undefined,
      filter: ctx.params.filter?.trim() || undefined,
      sort: ctx.params.sort?.trim() || undefined,
      pricePresence: ctx.pricePresence,
      technicalSpecs,
      listingOmitProductAttributes: true,
      plpLeanListing: true,
    });
    return { ctx, productsData };
  } catch (error) {
    console.error('❌ PRODUCT ERROR', error);
    return {
      ctx,
      productsData: {
        data: [],
        meta: { total: 0, page: 1, limit: ctx.perPage, totalPages: 0 },
      },
    };
  }
}

/** Streams the PLP product grid independently from sidebar facet queries. */
export async function ProductsShopListingSection({ raw, ctx }: ProductsShopListingSectionProps) {
  const { productsData } = await fetchProductsListing(raw, ctx);

  return (
    <ProductsShopListingClient
      initialProducts={productsData.data.map(normalizeShopGridProduct)}
      initialMeta={productsData.meta}
      initialQueryString={ctx.initialQueryString}
      initialSort={ctx.params.sort || 'default'}
    />
  );
}
