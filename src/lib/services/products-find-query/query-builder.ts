import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";
import type { ProductFilters } from "./types";
import { getAllChildCategoryIds, findCategoryBySlug } from "./category-utils";

/**
 * Build search filter for where clause
 */
function buildSearchFilter(search: string): Prisma.ProductWhereInput {
  return {
    OR: [
      {
        translations: {
          some: {
            title: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      },
      {
        translations: {
          some: {
            subtitle: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      },
      {
        variants: {
          some: {
            sku: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      },
    ],
  };
}

/**
 * Build category filter for where clause (supports comma-separated slugs = OR between category trees).
 */
async function buildCategoryFilter(
  categoryParam: string,
  lang: string,
  existingWhere: Prisma.ProductWhereInput
): Promise<Prisma.ProductWhereInput | null> {
  const slugs = categoryParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (slugs.length === 0) {
    return null;
  }

  const perSlugTrees: Prisma.ProductWhereInput[] = (
    await Promise.all(
      slugs.map(async (slug) => {
        const categoryDoc = await findCategoryBySlug(slug, lang);
        if (!categoryDoc) {
          return null;
        }

        const childCategoryIds = await getAllChildCategoryIds(categoryDoc.id);
        const allCategoryIds = [categoryDoc.id, ...childCategoryIds];

        logger.debug('Category IDs to include', {
          slug,
          parent: categoryDoc.id,
          children: childCategoryIds,
          total: allCategoryIds.length,
        });

        const categoryConditions = allCategoryIds.flatMap((catId: string) => [
          { primaryCategoryId: catId },
          { categoryIds: { has: catId } },
          { categories: { some: { id: catId } } },
        ]);

        return { OR: categoryConditions } as Prisma.ProductWhereInput;
      }),
    )
  ).filter((node): node is Prisma.ProductWhereInput => node !== null);

  if (perSlugTrees.length === 0) {
    return null;
  }

  const categoryBlock: Prisma.ProductWhereInput =
    perSlugTrees.length === 1 ? perSlugTrees[0]! : { OR: perSlugTrees };

  if (existingWhere.OR) {
    return {
      AND: [{ OR: existingWhere.OR }, categoryBlock],
    };
  }

  return categoryBlock;
}

/**
 * Build filter for new, featured, bestseller
 */
async function buildFilterFilter(
  filter: string,
  existingWhere: Prisma.ProductWhereInput
): Promise<{
  where: Prisma.ProductWhereInput;
  bestsellerProductIds: string[];
}> {
  const bestsellerProductIds: string[] = [];

  if (filter === "new") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      where: {
        ...existingWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      bestsellerProductIds,
    };
  }

  if (filter === "featured") {
    return {
      where: {
        ...existingWhere,
        featured: true,
      },
      bestsellerProductIds,
    };
  }

  if (filter === "bestseller") {
    type BestsellerVariant = { variantId: string | null; _sum: { quantity: number | null } };
    const raw = await db.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: {
        variantId: {
          not: null,
        },
      },
      orderBy: {
        _sum: {
          quantity: "desc" as const,
        },
      },
      take: 200,
    });
    const bestsellerVariants: BestsellerVariant[] = raw as BestsellerVariant[];

    const variantIds = bestsellerVariants
      .map((item) => item.variantId)
      .filter((id): id is string => Boolean(id));

    if (variantIds.length > 0) {
      const variantProductMap = await db.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, productId: true },
      });

      const variantToProduct = new Map<string, string>();
      variantProductMap.forEach(({ id, productId }: { id: string; productId: string }) => {
        variantToProduct.set(id, productId);
      });

      const productSales = new Map<string, number>();
      bestsellerVariants.forEach((item: BestsellerVariant) => {
        const variantId = item.variantId;
        if (!variantId) return;
        const productId = variantToProduct.get(variantId);
        if (!productId) return;
        const qty = item._sum?.quantity || 0;
        productSales.set(productId, (productSales.get(productId) || 0) + qty);
      });

      bestsellerProductIds.push(
        ...Array.from(productSales.entries())
          .sort((a, b) => (b[1] || 0) - (a[1] || 0))
          .map(([productId]) => productId)
      );

      if (bestsellerProductIds.length > 0) {
        return {
          where: {
            ...existingWhere,
            id: {
              in: bestsellerProductIds,
            },
          },
          bestsellerProductIds,
        };
      }
    }
  }

  return {
    where: existingWhere,
    bestsellerProductIds,
  };
}

/**
 * Build where clause for product query
 */
export async function buildWhereClause(
  filters: ProductFilters
): Promise<{
  where: Prisma.ProductWhereInput | null;
  bestsellerProductIds: string[];
}> {
  const {
    category,
    search,
    filter,
    lang = "en",
  } = filters;

  const bestsellerProductIds: string[] = [];

  // Build base where clause
  let where: Prisma.ProductWhereInput = {
    published: true,
    deletedAt: null,
  };

  const idList =
    filters.productIds?.filter((id): id is string => typeof id === "string" && id.trim().length > 0) ?? [];
  const uniqueProductIds = [...new Set(idList.map((id) => id.trim()))].slice(0, 500);
  if (uniqueProductIds.length > 0) {
    where = { ...where, id: { in: uniqueProductIds } };
  }

  // Add search filter
  if (search && search.trim()) {
    const searchFilter = buildSearchFilter(search);
    where = { ...where, ...searchFilter };
  }

  // Add category filter
  if (category) {
    const categoryWhere = await buildCategoryFilter(category, lang, where);
    if (categoryWhere === null) {
      // Category not found - return empty result
      return {
        where: null,
        bestsellerProductIds: [],
      };
    }
    where = { ...where, ...categoryWhere };
  }

  // Add filter for new, featured, bestseller
  const filterResult = await buildFilterFilter(filter || "", where);
  where = filterResult.where;
  bestsellerProductIds.push(...filterResult.bestsellerProductIds);

  return {
    where,
    bestsellerProductIds,
  };
}

