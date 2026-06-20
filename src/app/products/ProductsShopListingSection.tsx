import { searchParamsRecordToUrlSearchParams } from '@/lib/search-params-record';
import type { ProductsShopListingServerContext } from '@/lib/products-shop-listing-server-context';
import { getProductsPlpReadModelPayload } from '@/lib/read-model/products-plp-read-model';
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
    const productsData = await getProductsPlpReadModelPayload({
      page: String(ctx.page),
      limit: String(ctx.perPage),
      lang: ctx.language,
      search: ctx.params.search?.trim() || undefined,
      category: ctx.params.category?.trim() || undefined,
      minPrice: ctx.params.minPrice?.trim() || undefined,
      maxPrice: ctx.params.maxPrice?.trim() || undefined,
      colors: ctx.params.colors?.trim() || undefined,
      sizes: ctx.params.sizes?.trim() || undefined,
      brand: ctx.params.brand?.trim() || undefined,
      filter: ctx.params.filter?.trim() || undefined,
      sort: ctx.params.sort?.trim() || undefined,
      pricePresence: ctx.pricePresence,
      technicalSpecs,
      includeFilters: false,
    });
    return { ctx, productsData };
  } catch (error) {
    console.error('❌ PRODUCT ERROR', error);
    return {
      ctx,
      productsData: {
        items: [],
        pagination: {
          total: 0,
          page: 1,
          limit: ctx.perPage,
          totalPages: 0,
          hasNextPage: false,
          nextCursor: null,
          totalIsExact: true,
        },
      },
    };
  }
}

/** Streams the PLP product grid independently from sidebar facet queries. */
export async function ProductsShopListingSection({ raw, ctx }: ProductsShopListingSectionProps) {
  const { productsData } = await fetchProductsListing(raw, ctx);

  return (
    <ProductsShopListingClient
      initialProducts={productsData.items.map(normalizeShopGridProduct)}
      initialMeta={productsData.pagination}
      initialQueryString={ctx.initialQueryString}
      initialSort={ctx.params.sort || 'default'}
    />
  );
}
