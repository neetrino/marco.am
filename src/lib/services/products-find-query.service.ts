import { Prisma } from "@white-shop/db/prisma";
import { buildWhereClause } from "./products-find-query/query-builder";
import { executeProductListingQuery } from "./products-find-query/query-executor";
import {
  executePlpLeanListingQuery,
  fetchPlpLeanProductsByIds,
} from "./products-find-query/plp-lean-listing-query";
import {
  executeHomeStripListingQuery,
  fetchHomeStripProductsByIds,
} from "./products-find-query/home-strip-listing-query";
import { fetchPromotionListingProductIds } from "./products-find-query/promotion-listing-ids";
import {
  fetchPriceSortedListingProductIds,
  isPriceListingSortKey,
  resolvePriceListingSortDirection,
  usesPriceDbSortPath,
} from "./products-find-query/price-sorted-listing-ids";
import { getProductsListingCountCached } from "@/lib/cache/products-listing-count-redis";
import type { ProductFilters, ProductWithRelations } from "./products-find-query/types";
import { hasTechnicalSpecFilters } from "./products-technical-filters";
import { decodeProductCursor } from "./products-pagination-cursor";
import { PLP_IN_MEMORY_SORT_OVERFETCH_MAX } from "@/lib/constants/shop-plp-pagination";

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

type ListingQueryOpts = {
  omitProductAttributes: boolean;
  lang: string;
  orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] | undefined;
};

function runListingQuery(
  where: Prisma.ProductWhereInput,
  limit: number,
  skip: number,
  filters: ProductFilters,
  queryOpts: ListingQueryOpts,
): Promise<ProductWithRelations[]> {
  if (filters.plpLeanListing && filters.listingOmitProductAttributes) {
    return executePlpLeanListingQuery(where, limit, skip, {
      lang: queryOpts.lang,
      orderBy: queryOpts.orderBy,
    });
  }
  return executeProductListingQuery(where, limit, skip, queryOpts);
}

function deriveApproximateTotal(
  skip: number,
  limit: number,
  pageLength: number,
): number {
  return pageLength < limit ? skip + pageLength : skip + limit + 1;
}

async function resolveListingTotal(
  filters: ProductFilters,
  canSkipCount: boolean,
  skip: number,
  limit: number,
  pageLength: number,
): Promise<number> {
  if (canSkipCount) {
    return deriveApproximateTotal(skip, limit, pageLength);
  }
  return getProductsListingCountCached(filters);
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

    const priceDbSort = usesPriceDbSortPath(filters);

    const requiresSortOverFetch =
      (isPriceListingSortKey(sort) && !priceDbSort) ||
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
        const total = deriveApproximateTotal(skip, limit, products.length);
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
        const total = await resolveListingTotal(filters, canSkipCount, skip, limit, products.length);
        return {
          products,
          bestsellerProductIds,
          total,
        };
      }

      if (priceDbSort && isPriceListingSortKey(sort)) {
        const direction = resolvePriceListingSortDirection(sort);
        const idsPromise = fetchPriceSortedListingProductIds(where, direction, limit, skip);
        const totalPromise = canSkipCount
          ? idsPromise.then((ids) => deriveApproximateTotal(skip, limit, ids.length))
          : getProductsListingCountCached(filters);
        const [ids, total] = await Promise.all([idsPromise, totalPromise]);
        const products = await fetchPlpLeanProductsByIds(ids, {
          lang: queryOpts.lang,
        });
        return {
          products,
          bestsellerProductIds,
          total,
        };
      }

      if (canSkipCount) {
        const products = await runListingQuery(where, limit, skip, filters, queryOpts);
        const total = deriveApproximateTotal(skip, limit, products.length);
        return {
          products,
          bestsellerProductIds,
          total,
        };
      }

      const [total, products] = await Promise.all([
        getProductsListingCountCached(filters),
        runListingQuery(where, limit, skip, filters, queryOpts),
      ]);
      return {
        products,
        bestsellerProductIds,
        total,
      };
    }

    const requestedWindow = Math.max(1, page) * limit;
    const fetchLimit = Math.min(
      Math.max(requestedWindow * 3, limit * 4),
      PLP_IN_MEMORY_SORT_OVERFETCH_MAX,
    );
    const products = await runListingQuery(where, fetchLimit, 0, filters, queryOpts);

    return {
      products,
      bestsellerProductIds,
    };
  }
}

export const productsFindQueryService = new ProductsFindQueryService();
export type { ProductFilters, ProductWithRelations };
