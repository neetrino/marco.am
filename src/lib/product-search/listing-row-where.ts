import { Prisma } from "@white-shop/db/prisma";

import { splitProductSearchTokens } from "./match";

export function buildListingRowTextTokenCondition(
  token: string,
): Prisma.ProductListingRowWhereInput {
  return {
    OR: [
      { title: { contains: token, mode: "insensitive" } },
      { slug: { contains: token, mode: "insensitive" } },
      { searchText: { contains: token, mode: "insensitive" } },
    ],
  };
}

/**
 * Token-AND listing-row search with optional SKU product-id fallback (admin + PLP).
 */
export function buildListingRowSearchWhereInput(
  search: string,
  productIdsFromSku: string[] = [],
): Prisma.ProductListingRowWhereInput | null {
  const trimmed = search.trim();
  if (!trimmed) {
    return null;
  }

  const tokens = splitProductSearchTokens(trimmed);
  const searchConditions: Prisma.ProductListingRowWhereInput[] = [
    {
      AND: tokens.map((token) => buildListingRowTextTokenCondition(token)),
    },
  ];
  if (productIdsFromSku.length > 0) {
    searchConditions.push({ productId: { in: productIdsFromSku } });
  }
  return { OR: searchConditions };
}
