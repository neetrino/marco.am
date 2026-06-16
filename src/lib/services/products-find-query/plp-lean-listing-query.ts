import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import { PLP_LEAN_VARIANTS_PER_PRODUCT_LIMIT } from "@/lib/constants/product-listing-query-limits";
import { orderProductsByIds } from "./home-strip-listing-query";
import type { ProductWithRelations } from "./types";

export type PlpLeanListingQueryOptions = {
  lang?: string;
  orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
};

function buildPreferredLocales(lang: string): string[] {
  const normalized = lang.trim().toLowerCase();
  return normalized === "en" ? ["en"] : [normalized, "en"];
}

/**
 * Lean PLP listing query — skips attributeValue joins; keeps category slugs for optimistic filters.
 */
export async function executePlpLeanListingQuery(
  where: Prisma.ProductWhereInput,
  limit: number,
  skip: number = 0,
  options: PlpLeanListingQueryOptions = {},
): Promise<ProductWithRelations[]> {
  const locales = buildPreferredLocales(options.lang ?? "en");
  const orderBy = options.orderBy ?? { createdAt: "desc" };

  const products = await db.product.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    select: {
      id: true,
      brandId: true,
      primaryCategoryId: true,
      discountPercent: true,
      warrantyYears: true,
      createdAt: true,
      media: true,
      translations: {
        where: { locale: { in: locales } },
        select: {
          locale: true,
          title: true,
          slug: true,
          subtitle: true,
        },
      },
      brand: {
        select: {
          id: true,
          slug: true,
          logoUrl: true,
          translations: {
            where: { locale: { in: locales } },
            select: {
              locale: true,
              name: true,
            },
          },
        },
      },
      variants: {
        where: { published: true },
        take: PLP_LEAN_VARIANTS_PER_PRODUCT_LIMIT,
        select: {
          id: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          attributes: true,
          published: true,
          options: {
            select: {
              attributeKey: true,
              value: true,
            },
          },
        },
      },
      labels: true,
      categories: {
        select: {
          id: true,
          translations: {
            where: { locale: { in: locales } },
            select: { locale: true, slug: true, title: true },
          },
        },
      },
    },
  });

  return products as unknown as ProductWithRelations[];
}

/** Preserve price-sorted ID order after a single `IN (...)` lean fetch. */
export async function fetchPlpLeanProductsByIds(
  ids: readonly string[],
  options: PlpLeanListingQueryOptions = {},
): Promise<ProductWithRelations[]> {
  if (ids.length === 0) {
    return [];
  }
  const rows = await executePlpLeanListingQuery(
    { id: { in: [...ids] } },
    ids.length,
    0,
    options,
  );
  return orderProductsByIds(rows, ids);
}
