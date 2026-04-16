import { Prisma } from "@prisma/client";
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
 * Build category filter for where clause
 */
async function buildCategoryFilter(
  category: string,
  lang: string,
  existingWhere: Prisma.ProductWhereInput
): Promise<Prisma.ProductWhereInput | null> {
  const categoryDoc = await findCategoryBySlug(category, lang);

  if (!categoryDoc) {
    return null; // Category not found - return null to indicate empty result
  }

  // Get all child categories (subcategories) recursively
  const childCategoryIds = await getAllChildCategoryIds(categoryDoc.id);
  const allCategoryIds = [categoryDoc.id, ...childCategoryIds];
  
  logger.debug('Category IDs to include', {
    parent: categoryDoc.id,
    children: childCategoryIds,
    total: allCategoryIds.length
  });
  
  // Build OR conditions for all categories (parent + children)
  const categoryConditions = allCategoryIds.flatMap((catId: string) => [
    { primaryCategoryId: catId },
    { categoryIds: { has: catId } },
  ]);
  
  if (existingWhere.OR) {
    return {
      AND: [
        { OR: existingWhere.OR },
        {
          OR: categoryConditions,
        },
      ],
    };
  }
  
  return {
    OR: categoryConditions,
  };
}

/** Product IDs that have at least one variant with compare-at price above current price (sale price). */
async function getProductIdsWithVariantSalePrice(): Promise<string[]> {
  const rows = await db.$queryRaw<{ productId: string }[]>(Prisma.sql`
    SELECT DISTINCT "productId"
    FROM "product_variants"
    WHERE published = true
      AND "compareAtPrice" IS NOT NULL
      AND "compareAtPrice" > price
  `);
  return rows.map((r) => r.productId);
}

/**
 * Promotions / special offers: product discount, category/brand discounts from settings,
 * or variant-level compare-at sale (compareAtPrice > price).
 */
async function buildPromotionFilter(
  existingWhere: Prisma.ProductWhereInput
): Promise<Prisma.ProductWhereInput> {
  const discountSettings = await db.settings.findMany({
    where: {
      key: { in: ["categoryDiscounts", "brandDiscounts"] },
    },
  });

  const categoryDiscountsSetting = discountSettings.find(
    (s: { key: string; value: unknown }) => s.key === "categoryDiscounts"
  );
  const categoryDiscounts = categoryDiscountsSetting
    ? ((categoryDiscountsSetting.value as Record<string, number>) || {})
    : {};

  const brandDiscountsSetting = discountSettings.find(
    (s: { key: string; value: unknown }) => s.key === "brandDiscounts"
  );
  const brandDiscounts = brandDiscountsSetting
    ? ((brandDiscountsSetting.value as Record<string, number>) || {})
    : {};

  const categoryIdsWithDiscount = Object.entries(categoryDiscounts)
    .filter(([, v]) => Number(v) > 0)
    .map(([k]) => k);
  const brandIdsWithDiscount = Object.entries(brandDiscounts)
    .filter(([, v]) => Number(v) > 0)
    .map(([k]) => k);

  const saleProductIds = await getProductIdsWithVariantSalePrice();

  const orConditions: Prisma.ProductWhereInput[] = [{ discountPercent: { gt: 0 } }];

  if (saleProductIds.length > 0) {
    orConditions.push({ id: { in: saleProductIds } });
  }
  if (categoryIdsWithDiscount.length > 0) {
    orConditions.push({ primaryCategoryId: { in: categoryIdsWithDiscount } });
  }
  if (brandIdsWithDiscount.length > 0) {
    orConditions.push({ brandId: { in: brandIdsWithDiscount } });
  }

  return {
    AND: [existingWhere, { OR: orConditions }],
  };
}

/**
 * Build filter for new, featured, bestseller, promotion
 */
async function buildFilterFilter(
  filter: string,
  existingWhere: Prisma.ProductWhereInput
): Promise<{
  where: Prisma.ProductWhereInput;
  bestsellerProductIds: string[];
}> {
  const bestsellerProductIds: string[] = [];

  if (filter === "promotion" || filter === "special_offer") {
    const where = await buildPromotionFilter(existingWhere);
    return { where, bestsellerProductIds };
  }

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

  // Add filter for new, featured, bestseller, promotion
  const filterResult = await buildFilterFilter(filter || "", where);
  where = filterResult.where;
  bestsellerProductIds.push(...filterResult.bestsellerProductIds);

  return {
    where,
    bestsellerProductIds,
  };
}

