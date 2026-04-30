import { ProductFilters } from "./products-find-query.service";
import { productsFindQueryService } from "./products-find-query.service";
import { productsFindFilterService } from "./products-find-filter.service";
import { productsFindTransformService } from "./products-find-transform.service";
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

    // Step 2: Filter products in memory (price, colors, sizes, brand) and sort
    const filteredProducts = productsFindFilterService.filterProducts(
      products,
      filters,
      bestsellerProductIds
    );

    // Step 3: Pagination — use server total when provided (no filters), else client slice
    const total =
      totalFromQuery !== undefined ? totalFromQuery : filteredProducts.length;
    const paginatedProducts =
      totalFromQuery !== undefined
        ? filteredProducts
        : filteredProducts.slice(start, start + limit);

    // Step 4: Transform products to response format
    // Price sorting must use transformed final price (discount-aware) to match PLP output.
    if (
      totalFromQuery === undefined &&
      (sort === "price-asc" || sort === "price-desc" || sort === "price")
    ) {
      const transformedAll = (await productsFindTransformService.transformProducts(
        filteredProducts,
        lang
      )) as Array<{ price: number }>;
      transformedAll.sort((a: { price: number }, b: { price: number }) => {
        if (sort === "price-asc") {
          return a.price - b.price;
        }
        return b.price - a.price;
      });
      const slice = transformedAll.slice(start, start + limit);
      return {
        data: filters.cardVisualOnly ? toCardVisualOnlyRows(slice as never[]) : slice,
        meta: buildProductsMeta(total, limit, normalizedPage, start),
      };
    }

    const data = await productsFindTransformService.transformProducts(paginatedProducts, lang);

    return {
      data: filters.cardVisualOnly ? toCardVisualOnlyRows(data as never[]) : data,
      meta: buildProductsMeta(total, limit, normalizedPage, start),
    };
  }
}

export const productsFindService = new ProductsFindService();






