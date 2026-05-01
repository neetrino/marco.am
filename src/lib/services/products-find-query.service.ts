import { buildWhereClause } from "./products-find-query/query-builder";
import { executeProductQuery } from "./products-find-query/query-executor";
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
    const { limit = 12, page = 1, sort } = filters;

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
      sort === "bestseller";

    const needOverFetch =
      Boolean(filters.category || filters.search) ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      Boolean(filters.colors || filters.sizes || filters.brand) ||
      hasTechnicalSpecFilters(filters.technicalSpecs) ||
      requiresSortOverFetch;

    const queryOpts = {
      omitProductAttributes: Boolean(filters.listingOmitProductAttributes),
    };

    if (!needOverFetch) {
      const cursorOffset = filters.cursor ? decodeProductCursor(filters.cursor) : undefined;
      const skip = cursorOffset !== undefined ? cursorOffset : (page - 1) * limit;
      const canSkipCount =
        Boolean(filters.skipExactTotalCount) && filters.cursor === undefined;

      if (canSkipCount) {
        const products = await executeProductQuery(where, limit, skip, queryOpts);
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
        executeProductQuery(where, limit, skip, queryOpts),
      ]);
      return {
        products,
        bestsellerProductIds,
        total,
      };
    }

    const fetchLimit = Math.min(limit * 10, 200);
    const products = await executeProductQuery(where, fetchLimit, 0, queryOpts);

    return {
      products,
      bestsellerProductIds,
    };
  }
}

export const productsFindQueryService = new ProductsFindQueryService();
export type { ProductFilters, ProductWithRelations };
