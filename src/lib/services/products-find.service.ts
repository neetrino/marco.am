import { resolveListingCardSortPrice } from "@/lib/pricing/listing-card-sort-price";
import { getListingDiscountSettings } from "./listing-discount-settings";
import { ProductFilters } from "./products-find-query.service";
import { productsFindQueryService } from "./products-find-query.service";
import { productsFindFilterService } from "./products-find-filter.service";
import { productsFindTransformService } from "./products-find-transform.service";
import {
  trimProductsForHomeStripListing,
  type HomeStripListingProduct,
} from "./home-strip-listing-payload";
import { hasTechnicalSpecFilters } from "./products-technical-filters";
import {
  decodeProductCursor,
  encodeProductCursor,
} from "./products-pagination-cursor";

interface ProductsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  nextCursor: string | null;
}

function toCardVisualOnlyRows(
  rows: Array<{ id: string; slug: string; image: string | null; images?: string[] }>,
) {
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    image: row.image,
    images: row.images?.length ? row.images : row.image ? [row.image] : ([] as string[]),
  }));
}

function applyListingOutputShape<T extends HomeStripListingProduct>(
  rows: T[],
  filters: ProductFilters,
): T[] | ReturnType<typeof toCardVisualOnlyRows> {
  let shaped: HomeStripListingProduct[] = rows;
  if (filters.homeStripListing) {
    shaped = trimProductsForHomeStripListing(shaped);
  }
  if (filters.cardVisualOnly) {
    return toCardVisualOnlyRows(shaped as never[]);
  }
  return shaped as T[];
}

function buildProductsMeta(total: number, limit: number, page: number, start: number): ProductsMeta {
  const hasNextPage = start + limit < total;
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage,
    nextCursor: hasNextPage ? encodeProductCursor(start + limit) : null,
  };
}

class ProductsFindService {
  /**
   * Get all products with filters
   */
  async findAll(filters: ProductFilters) {
    const {
      page = 1,
      limit = 12,
      lang = "en",
      sort,
      cursor,
    } = filters;
    const cursorOffset = decodeProductCursor(cursor);
    const start = cursor ? cursorOffset : (page - 1) * limit;
    const normalizedPage = cursor ? Math.floor(start / limit) + 1 : page;

    // Step 1: Build query and fetch products from database
    const { products, bestsellerProductIds, total: totalFromQuery } =
      await productsFindQueryService.buildQueryAndFetch(filters);

    const requiresInMemoryFiltering =
      totalFromQuery === undefined || hasTechnicalSpecFilters(filters.technicalSpecs);
    const filteredProducts = requiresInMemoryFiltering
      ? productsFindFilterService.filterProducts(products, filters, bestsellerProductIds)
      : products;

    // Step 3: Pagination — use server total when provided (no filters), else client slice
    const total =
      totalFromQuery !== undefined ? totalFromQuery : filteredProducts.length;
    const paginatedProducts =
      totalFromQuery !== undefined
        ? filteredProducts
        : filteredProducts.slice(start, start + limit);

    // Step 4: Transform products to response format
    // Price sorting must match PLP card price — sort in memory, transform only the page slice.
    if (
      totalFromQuery === undefined &&
      (sort === "price-asc" || sort === "price-desc" || sort === "price")
    ) {
      const discountSettings = await getListingDiscountSettings();
      const sorted = [...filteredProducts].sort((a, b) => {
        const aPrice = resolveListingCardSortPrice(a, discountSettings);
        const bPrice = resolveListingCardSortPrice(b, discountSettings);
        if (sort === "price-asc") {
          return aPrice - bPrice;
        }
        return bPrice - aPrice;
      });
      const slice = sorted.slice(start, start + limit);
      const data = (await productsFindTransformService.transformProducts(
        slice,
        lang,
      )) as HomeStripListingProduct[];
      return {
        data: applyListingOutputShape(data, filters),
        meta: buildProductsMeta(total, limit, normalizedPage, start),
      };
    }

    const data = (await productsFindTransformService.transformProducts(
      paginatedProducts,
      lang,
    )) as HomeStripListingProduct[];

    return {
      data: applyListingOutputShape(data, filters),
      meta: buildProductsMeta(total, limit, normalizedPage, start),
    };
  }
}

export const productsFindService = new ProductsFindService();






