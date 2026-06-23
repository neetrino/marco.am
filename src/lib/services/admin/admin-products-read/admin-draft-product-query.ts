import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import type { ProductFilters } from "./types";

/** Admin draft list reads Product.published — not the storefront listing read model. */
export function buildAdminDraftProductWhere(
  filters: ProductFilters,
  productIdsFromSku: string[] = [],
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    published: false,
  };

  const categoryIds =
    filters.categories && filters.categories.length > 0
      ? filters.categories
      : filters.category
        ? [filters.category]
        : [];

  if (categoryIds.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { primaryCategoryId: { in: categoryIds } },
          { categoryIds: { hasSome: categoryIds } },
        ],
      },
    ];
  }

  if (filters.brand && filters.brand.length > 0) {
    where.brandId = { in: filters.brand };
  }

  if (filters.stock === "inStock") {
    where.variants = { some: { published: true, stock: { gt: 0 } } };
  } else if (filters.stock === "outOfStock") {
    where.NOT = { variants: { some: { published: true, stock: { gt: 0 } } } };
  }

  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    const searchConditions: Prisma.ProductWhereInput[] = [
      { translations: { some: { title: { contains: searchTerm, mode: "insensitive" } } } },
      { translations: { some: { slug: { contains: searchTerm, mode: "insensitive" } } } },
    ];
    if (productIdsFromSku.length > 0) {
      searchConditions.push({ id: { in: productIdsFromSku } });
    }
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { OR: searchConditions },
    ];
  }

  return where;
}

export function buildAdminDraftProductOrderBy(
  sort?: string,
): Prisma.ProductOrderByWithRelationInput[] {
  if (!sort) {
    return [{ createdAt: "desc" }];
  }

  const [field, directionRaw] = sort.split("-");
  const direction = directionRaw === "asc" ? "asc" : "desc";

  switch (field) {
    case "createdAt":
      return [{ createdAt: direction }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function executeAdminDraftProductList(
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput[],
  skip: number,
  take: number,
  locale: string,
) {
  const listInclude = {
    translations: {
      where: { locale },
      take: 1,
      select: { slug: true, title: true },
    },
    variants: {
      where: { published: true },
      take: 1,
      orderBy: { price: "asc" as const },
      select: { price: true, stock: true, compareAtPrice: true, imageUrl: true },
    },
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        primaryCategoryId: true,
        published: true,
        featured: true,
        productClass: true,
        discountPercent: true,
        createdAt: true,
        categoryIds: true,
        media: true,
        translations: listInclude.translations,
        variants: listInclude.variants,
      },
    }),
    db.product.count({ where }),
  ]);

  return { products, total };
}
