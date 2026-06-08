import { Prisma } from "@white-shop/db/prisma";
import { buildWhereClause } from "./products-find-query/query-builder";
import { executeProductListingQuery } from "./products-find-query/query-executor";
import {
  executeHomeStripListingQuery,
  fetchHomeStripProductsByIds,
} from "./products-find-query/home-strip-listing-query";
import { fetchPromotionListingProductIds } from "./products-find-query/promotion-listing-ids";
import { db } from "@white-shop/db";
import type { ProductFilters, ProductWithRelations } from "./products-find-query/types";
import { hasTechnicalSpecFilters } from "./products-technical-filters";
import { decodeProductCursor } from "./products-pagination-cursor";

const PROMOTION_DB_SORT_KEYS = new Set([
  undefined,
  "createdAt",
  "createdAt-desc",
  "newest",
]);

function promotionUsesDbSort(filter: string | undefined, sort: string | undefined): boolean {
  return (
    (filter === "promotion" || filter === "special_offer") &&
    PROMOTION_DB_SORT_KEYS.has(sort)
  );
}

function resolveListingOrderBy(
  filters: ProductFilters,
): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] | undefined {
  const { filter, sort } = filters;
  if (promotionUsesDbSort(filter, sort)) {
    return [{ discountPercent: "desc" }, { createdAt: "desc" }];
  }
  return { createdAt: "desc" };
}

function usesHomeStripListingPath(filters: ProductFilters, needOverFetch: boolean): boolean {
  return (
    Boolean(filters.homeStripListing) &&
    Boolean(filters.listingOmitProductAttributes) &&
    Boolean(filters.skipExactTotalCount) &&
    !needOverFetch &&
    filters.cursor === undefined &&
    !hasTechnicalSpecFilters(filters.technicalSpecs) &&
    !filters.category &&
    !filters.search &&
    filters.minPrice === undefined &&
    filters.maxPrice === undefined &&
    !filters.colors &&
    !filters.sizes &&
    !filters.brand &&
    !filters.productIds?.length
  );
}

async function buildBaseWhereForHomeStrip(
  filters: ProductFilters,
): Promise<{ where: Prisma.ProductWhereInput | null; bestsellerProductIds: string[] }> {
  return buildWhereClause({ ...filters, filter: undefined });
}

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
      ((filter === "promotion" || filter === "special_offer") &&
        !promotionUsesDbSort(filter, sort));

    const needOverFetch = hasTechnicalSpecFilters(filters.technicalSpecs) || requiresSortOverFetch;

    const queryOpts = {
      omitProductAttributes: Boolean(filters.listingOmitProductAttributes),
      lang: filters.lang ?? "en",
      orderBy: resolveListingOrderBy(filters),
    };

    const homeStripPath = usesHomeStripListingPath(filters, needOverFetch);

    if (!needOverFetch) {
      const cursorOffset = filters.cursor ? decodeProductCursor(filters.cursor) : undefined;
      const skip = cursorOffset !== undefined ? cursorOffset : (page - 1) * limit;
      const canSkipCount =
        Boolean(filters.skipExactTotalCount) && filters.cursor === undefined;

      if (homeStripPath && (filter === "promotion" || filter === "special_offer")) {
        const { where: baseWhere, bestsellerProductIds: baseBestsellerIds } =
          await buildBaseWhereForHomeStrip(filters);
        if (baseWhere === null) {
          return { products: [], bestsellerProductIds: baseBestsellerIds, total: 0 };
        }
        const ids = await fetchPromotionListingProductIds(baseWhere, limit, skip);
        const products = await fetchHomeStripProductsByIds(ids, {
          lang: queryOpts.lang,
        });
        const total =
          products.length < limit ? skip + products.length : skip + limit + 1;
        return {
          products,
          bestsellerProductIds,
          total,
        };
      }

      if (homeStripPath) {
        const products = await executeHomeStripListingQuery(where, limit, skip, {
          lang: queryOpts.lang,
          orderBy: queryOpts.orderBy,
        });
        if (canSkipCount) {
          const total =
            products.length < limit ? skip + products.length : skip + limit + 1;
          return {
            products,
            bestsellerProductIds,
            total,
          };
        }
        const [total, countedProducts] = await Promise.all([
          db.product.count({ where }),
          Promise.resolve(products),
        ]);
        return {
          products: countedProducts,
          bestsellerProductIds,
          total,
        };
      }

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

    // Over-fetch window for in-memory technical/spec sorting path.
    // Keep it tight to avoid slow PLP renders on every filter interaction.
    const requestedWindow = Math.max(1, page) * limit;
    const fetchLimit = Math.min(Math.max(requestedWindow * 3, limit * 4), 120);
    const products = await executeProductListingQuery(where, fetchLimit, 0, queryOpts);

    return {
      products,
      bestsellerProductIds,
    };
  }
}

export const productsFindQueryService = new ProductsFindQueryService();
export type { ProductFilters, ProductWithRelations };
