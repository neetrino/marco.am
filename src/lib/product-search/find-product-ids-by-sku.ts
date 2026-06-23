import { db } from "@white-shop/db";

import { splitProductSearchTokens } from "./match";

const SKU_SEARCH_PRODUCT_ID_LIMIT = 200;

/** Resolve product IDs whose variant SKU matches any search token. */
export async function findProductIdsBySkuSearch(search: string): Promise<string[]> {
  const tokens = splitProductSearchTokens(search);
  if (tokens.length === 0) {
    return [];
  }

  const rows = await db.productVariant.findMany({
    where: {
      OR: tokens.map((token) => ({
        sku: { contains: token, mode: "insensitive" },
      })),
      product: { deletedAt: null },
    },
    select: { productId: true },
    distinct: ["productId"],
    take: SKU_SEARCH_PRODUCT_ID_LIMIT,
  });

  return rows.map((row) => row.productId);
}
