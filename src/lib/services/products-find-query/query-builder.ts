import { Prisma } from "@white-shop/db/prisma";
import { getBestsellerProductIdsCached } from "@/lib/cache/bestseller-product-ids-redis";
import { logger } from "../../utils/logger";
import type { ProductFilters } from "./types";
import { getAllChildCategoryIds, findCategoryBySlug } from "./category-utils";

const COLOR_ATTRIBUTE_KEYS = ["color", "colors", "colour"] as const;
const SIZE_ATTRIBUTE_KEYS = ["size", "sizes"] as const;

function parseCsvTokens(
  raw: string | undefined,
  transform?: (token: string) => string,
): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => (transform ? transform(token) : token));
}

function buildCaseInsensitiveStringOr(
  field: "value" | "name" | "slug" | "label",
  tokens: string[],
): Array<Record<string, { equals: string; mode: Prisma.QueryMode }>> {
  return tokens.map((token) => ({
    [field]: {
      equals: token,
      mode: Prisma.QueryMode.insensitive,
    },
  }));
}

function buildOptionValueFilter(tokens: string[]): Prisma.ProductVariantOptionWhereInput {
  return {
    OR: [
      ...buildCaseInsensitiveStringOr("value", tokens),
      {
        attributeValue: {
          OR: [
            ...buildCaseInsensitiveStringOr("value", tokens),
            {
              translations: {
                some: {
                  OR: buildCaseInsensitiveStringOr("label", tokens),
                },
              },
            },
          ],
        },
      },
    ],
  };
}

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
    const rankedIds = await getBestsellerProductIdsCached();
    bestsellerProductIds.push(...rankedIds);

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
    brand,
    minPrice,
    maxPrice,
    colors,
    sizes,
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

  const andConditions: Prisma.ProductWhereInput[] = [];

  const brandTokensRaw = parseCsvTokens(brand);
  const brandTokensNormalized = parseCsvTokens(brand, (token) => token.toLowerCase());
  if (brandTokensRaw.length > 0 || brandTokensNormalized.length > 0) {
    andConditions.push({
      OR: [
        {
          brandId: {
            in: brandTokensRaw,
          },
        },
        ...brandTokensNormalized.map((token) => ({
          brand: {
            slug: {
              equals: token,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        })),
        ...brandTokensNormalized.map((token) => ({
          brand: {
            translations: {
              some: {
                name: {
                  equals: token,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        })),
      ],
    });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceCondition: Prisma.FloatFilter = {};
    if (minPrice !== undefined) {
      priceCondition.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      priceCondition.lte = maxPrice;
    }
    andConditions.push({
      variants: {
        some: {
          published: true,
          price: priceCondition,
        },
      },
    });
  }

  const colorTokens = parseCsvTokens(colors, (token) => token.toLowerCase());
  if (colorTokens.length > 0) {
    andConditions.push({
      variants: {
        some: {
          published: true,
          options: {
            some: {
              OR: [
                {
                  AND: [
                    { attributeKey: { in: [...COLOR_ATTRIBUTE_KEYS] } },
                    buildOptionValueFilter(colorTokens),
                  ],
                },
                {
                  attributeValue: {
                    attribute: {
                      key: {
                        in: [...COLOR_ATTRIBUTE_KEYS],
                      },
                    },
                    OR: [
                      ...buildCaseInsensitiveStringOr("value", colorTokens),
                      {
                        translations: {
                          some: {
                            OR: buildCaseInsensitiveStringOr("label", colorTokens),
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    });
  }

  const sizeTokens = parseCsvTokens(sizes, (token) => token.toUpperCase());
  if (sizeTokens.length > 0) {
    andConditions.push({
      variants: {
        some: {
          published: true,
          options: {
            some: {
              OR: [
                {
                  AND: [
                    { attributeKey: { in: [...SIZE_ATTRIBUTE_KEYS] } },
                    buildOptionValueFilter(sizeTokens),
                  ],
                },
                {
                  attributeValue: {
                    attribute: {
                      key: {
                        in: [...SIZE_ATTRIBUTE_KEYS],
                      },
                    },
                    OR: [
                      ...buildCaseInsensitiveStringOr("value", sizeTokens),
                      {
                        translations: {
                          some: {
                            OR: buildCaseInsensitiveStringOr("label", sizeTokens),
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    });
  }

  if (andConditions.length > 0) {
    const existingAnd = Array.isArray(where.AND)
      ? where.AND
      : where.AND
        ? [where.AND]
        : [];
    where = {
      ...where,
      AND: [...existingAnd, ...andConditions],
    };
  }

  return {
    where,
    bestsellerProductIds,
  };
}

