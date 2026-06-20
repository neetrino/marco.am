import { Prisma } from "@white-shop/db/prisma";
import type { ProductFilters } from "./types";

/**
 * Build where clause for product queries
 */
export function buildProductWhereClause(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
  };

  const andConditions: Prisma.ProductWhereInput[] = [];

  // Search filter — title, slug, or SKU
  if (filters.search) {
    andConditions.push({
      OR: [
        {
          translations: {
            some: {
              OR: [
                {
                  title: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                {
                  slug: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
        {
          variants: {
            some: {
              sku: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  if (filters.published !== undefined) {
    andConditions.push({ published: filters.published });
  }

  // Category filter - support both single category and multiple categories
  const categoryIds = filters.categories && filters.categories.length > 0 
    ? filters.categories 
    : filters.category 
      ? [filters.category] 
      : [];
  
  if (categoryIds.length > 0) {
    const categoryConditions: Prisma.ProductWhereInput[] = categoryIds.map((categoryId) => ({
      OR: [
        {
          primaryCategoryId: categoryId,
        },
        {
          categoryIds: {
            has: categoryId,
          },
        }
      ],
    }));
    andConditions.push({ OR: categoryConditions });
  }

  // Brand filter - multiple brand IDs supported
  if (filters.brand && filters.brand.length > 0) {
    andConditions.push({
      brandId: {
        in: filters.brand,
      },
    });
  }

  // Price range filter - any variant in range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceRange: Prisma.FloatFilter = {};
    if (filters.minPrice !== undefined) {
      priceRange.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      priceRange.lte = filters.maxPrice;
    }

    andConditions.push({
      variants: {
        some: {
          price: priceRange,
        },
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

/**
 * Build orderBy clause for product queries
 */
export function buildProductOrderByClause(filters: ProductFilters): Prisma.ProductOrderByWithRelationInput {
  if (filters.sort) {
    const [field, direction] = filters.sort.split("-");
    return { [field]: direction || "desc" };
  }
  return { createdAt: "desc" };
}




