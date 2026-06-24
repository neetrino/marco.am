import { Prisma } from "@white-shop/db/prisma";

import { splitProductSearchTokens } from "./match";

/** Token-AND product search on operational tables (instant search). */
export function buildOperationalProductSearchWhere(query: string): Prisma.ProductWhereInput {
  const tokens = splitProductSearchTokens(query);
  if (tokens.length === 0) {
    return {};
  }

  return {
    AND: tokens.map((token) => ({
      OR: [
        {
          translations: {
            some: {
              title: { contains: token, mode: "insensitive" },
            },
          },
        },
        {
          translations: {
            some: {
              subtitle: { contains: token, mode: "insensitive" },
            },
          },
        },
        {
          variants: {
            some: {
              sku: { contains: token, mode: "insensitive" },
            },
          },
        },
      ],
    })),
  };
}

/** Token-AND category search on operational tables (instant search). */
export function buildOperationalCategorySearchWhere(query: string): Prisma.CategoryWhereInput {
  const tokens = splitProductSearchTokens(query);
  if (tokens.length === 0) {
    return {};
  }

  return {
    AND: tokens.map((token) => ({
      translations: {
        some: {
          OR: [
            { title: { contains: token, mode: "insensitive" } },
            { slug: { contains: token, mode: "insensitive" } },
            { fullPath: { contains: token, mode: "insensitive" } },
          ],
        },
      },
    })),
  };
}
