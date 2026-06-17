import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import { PRODUCT_LISTING_VARIANTS_PER_PRODUCT_LIMIT } from "@/lib/constants/product-listing-query-limits";
import type { ProductWithRelations } from "./types";

export type HomeStripListingQueryOptions = {
  lang?: string;
  orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
};

function buildPreferredLocales(lang: string): string[] {
  const normalized = lang.trim().toLowerCase();
  return normalized === "en" ? ["en"] : [normalized, "en"];
}

/**
 * Lean listing query for home product strips — skips categories and heavy attributeValue joins.
 */
export async function executeHomeStripListingQuery(
  where: Prisma.ProductWhereInput,
  limit: number,
  skip: number = 0,
  options: HomeStripListingQueryOptions = {},
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
        take: PRODUCT_LISTING_VARIANTS_PER_PRODUCT_LIMIT,
        select: {
          id: true,
          imageUrl: true,
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
    },
  });

  return products as unknown as ProductWithRelations[];
}

/** Preserve promotion / bestseller ID order after a single `IN (...)` fetch. */
export function orderProductsByIds(
  products: ProductWithRelations[],
  ids: readonly string[],
): ProductWithRelations[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered: ProductWithRelations[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (row) {
      ordered.push(row);
    }
  }
  return ordered;
}

export async function fetchHomeStripProductsByIds(
  ids: readonly string[],
  options: HomeStripListingQueryOptions = {},
): Promise<ProductWithRelations[]> {
  if (ids.length === 0) {
    return [];
  }
  const rows = await executeHomeStripListingQuery(
    { id: { in: [...ids] } },
    ids.length,
    0,
    options,
  );
  return orderProductsByIds(rows, ids);
}
