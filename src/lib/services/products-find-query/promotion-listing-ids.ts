import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";

type PromotionIdRow = {
  id: string;
  discountPercent: number;
  createdAt: Date;
};

function sortPromotionRows(rows: PromotionIdRow[]): PromotionIdRow[] {
  return [...rows].sort((a, b) => {
    if (b.discountPercent !== a.discountPercent) {
      return b.discountPercent - a.discountPercent;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

function dedupePromotionRows(rows: PromotionIdRow[]): PromotionIdRow[] {
  const byId = new Map<string, PromotionIdRow>();
  for (const row of rows) {
    const existing = byId.get(row.id);
    if (!existing || row.discountPercent > existing.discountPercent) {
      byId.set(row.id, row);
    }
  }
  return sortPromotionRows([...byId.values()]);
}

/**
 * Resolves promotion product IDs without a single heavy `OR` + variant join on the main listing query.
 * Branch 1: product-level discount. Branch 2: variant compare-at price (product discount = 0).
 */
export async function fetchPromotionListingProductIds(
  baseWhere: Prisma.ProductWhereInput,
  limit: number,
  skip: number,
): Promise<string[]> {
  const fetchCap = Math.min(Math.max(skip + limit, limit), 120);

  const [discountRows, compareAtRows] = await Promise.all([
    db.product.findMany({
      where: {
        ...baseWhere,
        discountPercent: { gt: 0 },
      },
      orderBy: [{ discountPercent: "desc" }, { createdAt: "desc" }],
      take: fetchCap,
      select: {
        id: true,
        discountPercent: true,
        createdAt: true,
      },
    }),
    db.product.findMany({
      where: {
        ...baseWhere,
        discountPercent: 0,
        variants: {
          some: {
            published: true,
            compareAtPrice: { gt: 0 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: fetchCap,
      select: {
        id: true,
        discountPercent: true,
        createdAt: true,
      },
    }),
  ]);

  const merged = dedupePromotionRows([...discountRows, ...compareAtRows]);
  return merged.slice(skip, skip + limit).map((row) => row.id);
}
