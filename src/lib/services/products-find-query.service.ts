import { buildWhereClause } from "./products-find-query/query-builder";
import { executeProductListingQuery } from "./products-find-query/query-executor";
import { db } from "@white-shop/db";
import type { ProductFilters, ProductWithRelations } from "./products-find-query/types";
import { hasTechnicalSpecFilters } from "./products-technical-filters";
import { decodeProductCursor } from "./products-pagination-cursor";

/**
 * Service for building and executing product find queries
 */
class ProductsFindQueryService {
  /**
   * Build where clause and fetch products from database
   */
  async buildQueryAndFetch(filters: ProductFilters): Promise<{
    products: ProductWithRelations[];
    bestsellerProductIds: string[];
    total?: number;
  }> {
    const { limit = 12, page = 1, sort, filter } = filters;

    const { where, bestsellerProductIds } = await buildWhereClause(filters);

    if (where === null) {
      return {
        products: [],
        bestsellerProductIds: [],
        total: 0,
      };
    }

    const requiresSortOverFetch =
      sort === "price-asc" ||
      sort === "price-desc" ||
      sort === "price" ||
      sort === "popular" ||
      sort === "bestseller" ||
      filter === "promotion" ||
      filter === "special_offer";

    const needOverFetch = hasTechnicalSpecFilters(filters.technicalSpecs) || requiresSortOverFetch;

    const queryOpts = {
      omitProductAttributes: Boolean(filters.listingOmitProductAttributes),
      lang: filters.lang ?? "en",
    };

    if (!needOverFetch) {
      const cursorOffset = filters.cursor ? decodeProductCursor(filters.cursor) : undefined;
      const skip = cursorOffset !== undefined ? cursorOffset : (page - 1) * limit;
      const canSkipCount =
        Boolean(filters.skipExactTotalCount) && filters.cursor === undefined;

      if (canSkipCount) {
        const products = await executeProductListingQuery(where, limit, skip, queryOpts);
        const total =
          products.length < limit ? skip + products.length : skip + limit + 1;
        return {
          products,
          bestsellerProductIds,
          total,
        };
      }

      const [total, products] = await Promise.all([
        db.product.count({ where }),
        executeProductListingQuery(where, limit, skip, queryOpts),
      ]);
      return {
        products,
        bestsellerProductIds,
        total,
      };
    }

    const fetchLimit = Math.min(limit * 10, 200);
    const products = await executeProductListingQuery(where, fetchLimit, 0, queryOpts);

    return {
      products,
      bestsellerProductIds,
    };
  }
}

export const productsFindQueryService = new ProductsFindQueryService();
export type { ProductFilters, ProductWithRelations };
