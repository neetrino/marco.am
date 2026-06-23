import { Prisma } from "@white-shop/db/prisma";
import { buildListingRowSearchWhereInput } from "@/lib/product-search/listing-row-where";
import type { ProductFilters } from "./types";

export { splitProductSearchTokens as splitAdminSearchTokens } from "@/lib/product-search/match";

/**
 * Maps admin product list filters to ProductListingRow where clause.
 * Sorting uses the read model so price/stock/title order applies across the full catalog.
 */
export function buildAdminListingRowWhere(
  filters: ProductFilters,
  locale: string,
  productIdsFromSku: string[] = [],
): Prisma.ProductListingRowWhereInput {
  const where: Prisma.ProductListingRowWhereInput = {
    locale,
    deletedAt: null,
  };

  if (filters.published !== undefined) {
    where.isPublished = filters.published;
  }

  const categoryIds =
    filters.categories && filters.categories.length > 0
      ? filters.categories
      : filters.category
        ? [filters.category]
        : [];

  if (categoryIds.length > 0) {
    where.categoryIds = { hasSome: categoryIds };
  }

  if (filters.brand && filters.brand.length > 0) {
    where.brandId = { in: filters.brand };
  }

  if (filters.stock === "inStock") {
    where.inStock = true;
  } else if (filters.stock === "outOfStock") {
    where.inStock = false;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceRange: Prisma.FloatFilter = {};
    if (filters.minPrice !== undefined) {
      priceRange.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      priceRange.lte = filters.maxPrice;
    }
    where.priceSort = priceRange;
  }

  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    const searchWhere = buildListingRowSearchWhereInput(searchTerm, productIdsFromSku);
    if (searchWhere) {
      where.AND = [searchWhere];
    }
  }

  return where;
}

/** Server-side sort for admin product list (full DB, not current page only). */
export function buildAdminListingRowOrderBy(
  sort?: string,
): Prisma.ProductListingRowOrderByWithRelationInput[] {
  if (!sort) {
    return [{ productCreatedAt: "desc" }];
  }

  const [field, directionRaw] = sort.split("-");
  const direction = directionRaw === "asc" ? "asc" : "desc";

  switch (field) {
    case "createdAt":
      return [{ productCreatedAt: direction }];
    case "title":
      return [{ title: direction }, { productCreatedAt: "desc" }];
    case "stock":
      return [{ stock: direction }, { productCreatedAt: "desc" }];
    case "price":
      return [{ priceSort: direction }, { productCreatedAt: "desc" }];
    default:
      return [{ productCreatedAt: "desc" }];
  }
}
