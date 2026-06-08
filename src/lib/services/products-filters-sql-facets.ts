import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import {
  PRODUCT_FILTERS_ATTRIBUTE_FACET_SAMPLE_LIMIT,
  PRODUCT_FILTERS_ATTRIBUTE_FACET_VARIANTS_LIMIT,
  PRODUCT_FILTERS_BRANDS_GROUP_LIMIT,
  PRODUCT_FILTERS_SQL_PRODUCT_ID_CAP,
  PRODUCT_FILTERS_SQL_OPTION_ROWS_CAP,
} from "@/lib/constants/product-filters-query-limits";
import { isColorAttributeKey, isSizeAttributeKey } from "@/lib/attribute-keys";
import type { ProductWithRelations } from "./products-find-query.service";

const COLOR_OPTION_KEYS = ["color", "colour", "guyn", "colors"] as const;
const SIZE_OPTION_KEYS = ["size", "sizes"] as const;

const SIZE_FACET_SORT_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

export type ColorFacetRow = {
  value: string;
  label: string;
  count: number;
  imageUrl?: string | null;
  colors?: string[] | null;
};

export type SizeFacetRow = {
  value: string;
  count: number;
};

export type BrandFacetRow = {
  id: string;
  slug: string;
  name: string;
  count: number;
};

export type CategoryFacetProductRow = {
  id: string;
  primaryCategoryId: string | null;
  categoryIds: string[];
};

type ColorFacetAccumulator = {
  count: number;
  label: string;
  imageUrl?: string | null;
  colors?: string[] | null;
  productIds: Set<string>;
};

function buildPreferredLocales(lang: string): string[] {
  const normalized = lang.trim().toLowerCase();
  return normalized === "en" ? ["en"] : [normalized, "en"];
}

function getLocalizedAttributeValueLabel(
  attributeValue: {
    value?: string | null;
    translations?: Array<{ locale?: string | null; label?: string | null }>;
  } | null | undefined,
  lang: string,
): string {
  if (!attributeValue) {
    return "";
  }
  const translation =
    attributeValue.translations?.find((row) => row.locale === lang) ??
    attributeValue.translations?.find((row) => Boolean(row?.label)) ??
    null;
  return (translation?.label || attributeValue.value || "").trim();
}

function isScopedCatalogWhere(
  filters: {
    category?: string;
    search?: string;
    filter?: string;
  },
): boolean {
  return Boolean(
    filters.category?.trim() || filters.search?.trim() || filters.filter?.trim(),
  );
}

async function fetchFacetProductIds(
  where: Prisma.ProductWhereInput,
  isScopedCatalog: boolean,
): Promise<string[]> {
  const rows = await db.product.findMany({
    where,
    select: { id: true },
    ...(isScopedCatalog
      ? {}
      : {
          orderBy: { createdAt: "desc" as const },
          take: PRODUCT_FILTERS_SQL_PRODUCT_ID_CAP,
        }),
  });
  return rows.map((row) => row.id);
}

function buildColorOptionWhere(productIds: string[]): Prisma.ProductVariantOptionWhereInput {
  return {
    variant: {
      published: true,
      productId: { in: productIds },
    },
    OR: [
      { attributeKey: { in: [...COLOR_OPTION_KEYS], mode: "insensitive" } },
      {
        attributeValue: {
          attribute: {
            key: { in: [...COLOR_OPTION_KEYS], mode: "insensitive" },
          },
        },
      },
    ],
  };
}

function buildSizeOptionWhere(productIds: string[]): Prisma.ProductVariantOptionWhereInput {
  return {
    variant: {
      published: true,
      productId: { in: productIds },
    },
    OR: [
      { attributeKey: { in: [...SIZE_OPTION_KEYS], mode: "insensitive" } },
      {
        attributeValue: {
          attribute: {
            key: { in: [...SIZE_OPTION_KEYS], mode: "insensitive" },
          },
        },
      },
    ],
  };
}

function upsertColorFacet(
  colorMap: Map<string, ColorFacetAccumulator>,
  input: {
    productId: string;
    label: string;
    imageUrl?: string | null;
    colors?: string[] | null;
  },
): void {
  const normalizedLabel = input.label.trim();
  if (!normalizedLabel) {
    return;
  }
  const key = normalizedLabel.toLowerCase();
  const existing = colorMap.get(key);
  const preferredLabel = existing
    ? normalizedLabel[0] === normalizedLabel[0]?.toUpperCase()
      ? normalizedLabel
      : existing.label
    : normalizedLabel;

  if (existing) {
    if (!existing.productIds.has(input.productId)) {
      existing.productIds.add(input.productId);
      existing.count += 1;
    }
    colorMap.set(key, {
      count: existing.count,
      label: preferredLabel,
      imageUrl: input.imageUrl ?? existing.imageUrl ?? null,
      colors: input.colors ?? existing.colors ?? null,
      productIds: existing.productIds,
    });
    return;
  }

  colorMap.set(key, {
    count: 1,
    label: preferredLabel,
    imageUrl: input.imageUrl ?? null,
    colors: input.colors ?? null,
    productIds: new Set([input.productId]),
  });
}

function upsertSizeFacet(
  sizeMap: Map<string, Set<string>>,
  productId: string,
  sizeValue: string,
): void {
  const normalized = sizeValue.trim().toUpperCase();
  if (!normalized) {
    return;
  }
  const productIds = sizeMap.get(normalized) ?? new Set<string>();
  productIds.add(productId);
  sizeMap.set(normalized, productIds);
}

export function sortSizeFacetRows(rows: SizeFacetRow[]): SizeFacetRow[] {
  return [...rows].sort((a, b) => {
    const aIndex = SIZE_FACET_SORT_ORDER.indexOf(a.value as (typeof SIZE_FACET_SORT_ORDER)[number]);
    const bIndex = SIZE_FACET_SORT_ORDER.indexOf(b.value as (typeof SIZE_FACET_SORT_ORDER)[number]);
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) {
      return -1;
    }
    if (bIndex !== -1) {
      return 1;
    }
    return a.value.localeCompare(b.value);
  });
}

export async function getPublishedVariantPriceBounds(
  where: Prisma.ProductWhereInput,
): Promise<{ min: number; max: number }> {
  const aggregate = await db.productVariant.aggregate({
    where: {
      published: true,
      product: where,
    },
    _min: { price: true },
    _max: { price: true },
  });
  return {
    min: aggregate._min.price ?? 0,
    max: aggregate._max.price ?? 0,
  };
}

export async function aggregateBrandFacetsFromWhere(
  where: Prisma.ProductWhereInput,
  lang: string,
  preferredLocales: string[],
): Promise<BrandFacetRow[]> {
  const groups = await db.product.groupBy({
    by: ["brandId"],
    where: {
      ...where,
      brandId: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: PRODUCT_FILTERS_BRANDS_GROUP_LIMIT,
  });

  const brandIds = groups
    .map((group) => group.brandId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (brandIds.length === 0) {
    return [];
  }

  const brandRows = await db.brand.findMany({
    where: { id: { in: brandIds } },
    select: {
      id: true,
      slug: true,
      translations: {
        where: { locale: { in: preferredLocales } },
        select: { locale: true, name: true },
      },
    },
  });
  const brandById = new Map(brandRows.map((brand) => [brand.id, brand]));

  return groups
    .map((group) => {
      if (!group.brandId) {
        return null;
      }
      const brand = brandById.get(group.brandId);
      if (!brand) {
        return null;
      }
      const translation =
        brand.translations.find((row) => row.locale === lang) ?? brand.translations[0];
      const name = (translation?.name?.trim() || brand.slug || "").trim();
      if (!name) {
        return null;
      }
      return {
        id: brand.id,
        slug: brand.slug,
        name,
        count: group._count.id,
      };
    })
    .filter((row): row is BrandFacetRow => row !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildCategoryCountMapFromRows(
  rows: readonly CategoryFacetProductRow[],
): Map<string, number> {
  const categoryCountMap = new Map<string, number>();
  for (const row of rows) {
    const categoryIdsForProduct = new Set<string>();
    if (row.primaryCategoryId) {
      categoryIdsForProduct.add(row.primaryCategoryId);
    }
    for (const categoryId of row.categoryIds) {
      categoryIdsForProduct.add(categoryId);
    }
    for (const categoryId of categoryIdsForProduct) {
      categoryCountMap.set(categoryId, (categoryCountMap.get(categoryId) || 0) + 1);
    }
  }
  return categoryCountMap;
}

/**
 * Distinct-product color facets from `product_variant_options` — no full product sample.
 */
export async function aggregateColorFacetsFromWhere(
  where: Prisma.ProductWhereInput,
  lang: string,
  scopeFilters: { category?: string; search?: string; filter?: string },
): Promise<ColorFacetRow[]> {
  const preferredLocales = buildPreferredLocales(lang);
  const isScopedCatalog = isScopedCatalogWhere(scopeFilters);
  const productIds = await fetchFacetProductIds(where, isScopedCatalog);
  if (productIds.length === 0) {
    return [];
  }

  const optionRows = await db.productVariantOption.findMany({
    where: buildColorOptionWhere(productIds),
    select: {
      value: true,
      attributeKey: true,
      attributeValue: {
        select: {
          value: true,
          imageUrl: true,
          colors: true,
          attribute: { select: { key: true } },
          translations: {
            where: { locale: { in: preferredLocales } },
            select: { locale: true, label: true },
          },
        },
      },
      variant: { select: { productId: true } },
    },
    take: PRODUCT_FILTERS_SQL_OPTION_ROWS_CAP,
  });

  const colorMap = new Map<string, ColorFacetAccumulator>();
  for (const row of optionRows) {
    const productId = row.variant.productId;
    const attributeKey = row.attributeValue?.attribute?.key ?? row.attributeKey;
    if (!isColorAttributeKey(attributeKey)) {
      continue;
    }

    let label = "";
    let imageUrl: string | null | undefined = null;
    let colorsHex: string[] | null | undefined = null;
    if (row.attributeValue) {
      label = getLocalizedAttributeValueLabel(row.attributeValue, lang);
      imageUrl = row.attributeValue.imageUrl;
      colorsHex = Array.isArray(row.attributeValue.colors)
        ? row.attributeValue.colors.filter((color): color is string => typeof color === "string")
        : null;
    } else if (row.value) {
      label = row.value.trim();
    }
    if (!label) {
      continue;
    }

    upsertColorFacet(colorMap, {
      productId,
      label,
      imageUrl,
      colors: colorsHex,
    });
  }

  return Array.from(colorMap.entries())
    .map(([value, data]) => ({
      value,
      label: data.label,
      count: data.count,
      imageUrl: data.imageUrl ?? null,
      colors: data.colors ?? null,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Distinct-product size facets from `product_variant_options`.
 */
export async function aggregateSizeFacetsFromWhere(
  where: Prisma.ProductWhereInput,
  lang: string,
  scopeFilters: { category?: string; search?: string; filter?: string },
): Promise<SizeFacetRow[]> {
  const preferredLocales = buildPreferredLocales(lang);
  const isScopedCatalog = isScopedCatalogWhere(scopeFilters);
  const productIds = await fetchFacetProductIds(where, isScopedCatalog);
  if (productIds.length === 0) {
    return [];
  }

  const optionRows = await db.productVariantOption.findMany({
    where: buildSizeOptionWhere(productIds),
    select: {
      value: true,
      attributeKey: true,
      attributeValue: {
        select: {
          value: true,
          attribute: { select: { key: true } },
          translations: {
            where: { locale: { in: preferredLocales } },
            select: { locale: true, label: true },
          },
        },
      },
      variant: { select: { productId: true } },
    },
    take: PRODUCT_FILTERS_SQL_OPTION_ROWS_CAP,
  });

  const sizeMap = new Map<string, Set<string>>();
  for (const row of optionRows) {
    const productId = row.variant.productId;
    const attributeKey = row.attributeValue?.attribute?.key ?? row.attributeKey;
    if (!isSizeAttributeKey(attributeKey)) {
      continue;
    }

    let sizeValue = "";
    if (row.attributeValue) {
      sizeValue = getLocalizedAttributeValueLabel(row.attributeValue, lang);
    } else if (row.value) {
      sizeValue = row.value.trim();
    }
    if (!sizeValue) {
      continue;
    }
    upsertSizeFacet(sizeMap, productId, sizeValue);
  }

  const sizes = Array.from(sizeMap.entries()).map(([value, productIdsForSize]) => ({
    value,
    count: productIdsForSize.size,
  }));
  return sortSizeFacetRows(sizes);
}

/**
 * Lightweight rows for category facet tree — no variants.
 */
/** Lean variant sample for technical attribute facets on the SQL fast path. */
export async function fetchAttributeFacetSample(
  where: Prisma.ProductWhereInput,
  preferredLocales: string[],
): Promise<ProductWithRelations[]> {
  const products = await db.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PRODUCT_FILTERS_ATTRIBUTE_FACET_SAMPLE_LIMIT,
    select: {
      variants: {
        where: { published: true },
        take: PRODUCT_FILTERS_ATTRIBUTE_FACET_VARIANTS_LIMIT,
        select: {
          attributes: true,
          options: {
            select: {
              attributeKey: true,
              value: true,
              attributeValue: {
                select: {
                  value: true,
                  attribute: {
                    select: {
                      key: true,
                      type: true,
                      filterable: true,
                      translations: {
                        where: { locale: { in: preferredLocales } },
                        select: { locale: true, name: true },
                      },
                    },
                  },
                  translations: {
                    where: { locale: { in: preferredLocales } },
                    select: { locale: true, label: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  return products as unknown as ProductWithRelations[];
}

export async function fetchCategoryFacetProductRows(
  where: Prisma.ProductWhereInput,
  scopeFilters: { category?: string; search?: string; filter?: string },
): Promise<CategoryFacetProductRow[]> {
  const isScopedCatalog = isScopedCatalogWhere(scopeFilters);
  return db.product.findMany({
    where,
    select: {
      id: true,
      primaryCategoryId: true,
      categoryIds: true,
    },
    ...(isScopedCatalog
      ? {}
      : {
          orderBy: { createdAt: "desc" as const },
          take: PRODUCT_FILTERS_SQL_PRODUCT_ID_CAP,
        }),
  });
}
