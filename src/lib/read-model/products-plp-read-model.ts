import { Prisma } from '@white-shop/db/prisma';
import { db } from '@white-shop/db';
import {
  SHOP_PLP_DEFAULT_PAGE_SIZE,
  SHOP_PLP_MAX_PAGE_SIZE,
} from '@/lib/constants/shop-plp-pagination';
import { resolveShopPlpPricePresence } from '@/lib/constants/shop-plp-price-presence';
import {
  EMPTY_PRODUCTS_FILTERS,
  type ProductsFiltersData,
} from '@/lib/shop-products-filters-types';
import { findCategoryBySlug, getAllChildCategoryIds } from '@/lib/services/products-find-query/category-utils';
import type { TechnicalSpecFilters } from '@/lib/services/products-find-query/types';
import {
  buildTechnicalSpecFilterToken,
  normalizeTechnicalFilterToken,
} from '@/lib/services/products-technical-filters';
import { buildShopCategoryFilterTree, type ShopCategoryFilterRow } from '@/lib/shop-category-filter-tree';

export type PlpReadModelSearchParams = {
  lang?: string;
  page?: string;
  limit?: string;
  ids?: string;
  search?: string;
  category?: string;
  brand?: string;
  filter?: string;
  minPrice?: string;
  maxPrice?: string;
  pricePresence?: string;
  colors?: string;
  sizes?: string;
  sort?: string;
  technicalSpecs?: TechnicalSpecFilters;
  includeFilters?: string | boolean;
  includeItems?: string | boolean;
};

const PRODUCT_ID_LOOKUP_MAX_PAGE_SIZE = 500;

type PlpListingMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  nextCursor: string | null;
  totalIsExact: boolean;
};

type PlpReadModelProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  isSpecialPrice: boolean;
  image: string | null;
  images: string[];
  inStock: boolean;
  brand: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
  } | null;
  defaultVariantId: string | null;
  labels: unknown[];
  colors: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  warrantyBadge: { years: number } | null;
  requiresAttributeSelection: boolean;
};

export type PlpReadModelPayload = {
  items: PlpReadModelProduct[];
  pagination: PlpListingMeta;
  filters: ProductsFiltersData;
  data: PlpReadModelProduct[];
  meta: PlpListingMeta;
};

function firstCsvTokens(raw: string | undefined, transform?: (token: string) => string): string[] {
  return (
    raw
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  ).map((token) => (transform ? transform(token) : token));
}

function parsePositiveInt(raw: string | undefined, fallback: number, max: number): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function parseOptionalPrice(raw: string | undefined): number | undefined {
  const parsed = raw ? Number(raw) : undefined;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function buildOrderBy(sort: string | undefined): Prisma.ProductListingRowOrderByWithRelationInput[] {
  switch (sort) {
    case 'price-asc':
      return [{ priceSort: 'asc' }, { productCreatedAt: 'desc' }];
    case 'price':
    case 'price-desc':
      return [{ priceSort: 'desc' }, { productCreatedAt: 'desc' }];
    case 'name-asc':
      return [{ title: 'asc' }, { productCreatedAt: 'desc' }];
    case 'name-desc':
      return [{ title: 'desc' }, { productCreatedAt: 'desc' }];
    case 'promotion':
    case 'special_offer':
      return [{ discountPercent: 'desc' }, { productCreatedAt: 'desc' }];
    case 'createdAt':
    case 'createdAt-desc':
    case 'newest':
    default:
      return [{ productCreatedAt: 'desc' }];
  }
}

async function resolveCategoryIdsForFilter(
  categoryTokens: readonly string[],
  lang: string,
): Promise<string[]> {
  if (categoryTokens.length === 0) {
    return [];
  }

  const categoryIds = new Set<string>();
  await Promise.all(
    categoryTokens.map(async (categoryToken) => {
      const category = await findCategoryBySlug(categoryToken, lang);
      if (!category) {
        return;
      }
      categoryIds.add(category.id);
      const descendantIds = await getAllChildCategoryIds(category.id);
      for (const id of descendantIds) {
        categoryIds.add(id);
      }
    }),
  );
  return [...categoryIds];
}

function buildTechnicalSpecWhere(
  technicalSpecs: TechnicalSpecFilters | undefined,
): Prisma.ProductListingRowWhereInput[] {
  if (!technicalSpecs) {
    return [];
  }
  const conditions: Prisma.ProductListingRowWhereInput[] = [];
  for (const [rawKey, values] of Object.entries(technicalSpecs)) {
    const key = normalizeTechnicalFilterToken(rawKey);
    const tokens = values.map((value) => buildTechnicalSpecFilterToken(key, value)).filter(Boolean);
    if (!key || tokens.length === 0) {
      continue;
    }
    conditions.push({ technicalSpecTokens: { hasSome: tokens } });
  }
  return conditions;
}

async function buildWhere(params: PlpReadModelSearchParams): Promise<Prisma.ProductListingRowWhereInput> {
  const minPrice = parseOptionalPrice(params.minPrice);
  const maxPrice = parseOptionalPrice(params.maxPrice);
  const pricePresence = resolveShopPlpPricePresence(params.pricePresence);
  const and: Prisma.ProductListingRowWhereInput[] = [];
  const categoryTokens = firstCsvTokens(params.category);
  const productIdTokens = firstCsvTokens(params.ids).slice(0, PRODUCT_ID_LOOKUP_MAX_PAGE_SIZE);
  const brandTokens = firstCsvTokens(params.brand);
  const colorTokens = firstCsvTokens(params.colors, (token) => token.toLowerCase());
  const sizeTokens = firstCsvTokens(params.sizes, (token) => token.toUpperCase());
  const search = params.search?.trim();
  const filter = params.filter?.trim();

  if (productIdTokens.length > 0) {
    and.push({ productId: { in: productIdTokens } });
  }
  if (categoryTokens.length > 0) {
    const categoryIds = await resolveCategoryIdsForFilter(categoryTokens, params.lang ?? 'en');
    and.push(categoryIds.length > 0 ? { categoryIds: { hasSome: categoryIds } } : { productId: { in: [] } });
  }
  if (brandTokens.length > 0) {
    and.push({
      OR: [
        { brandId: { in: brandTokens } },
        { brandSlug: { in: brandTokens.map((token) => token.toLowerCase()) } },
      ],
    });
  }
  if (search) {
    and.push({
      searchText: {
        contains: search.toLowerCase(),
        mode: Prisma.QueryMode.insensitive,
      },
    });
  }
  if (colorTokens.length > 0) {
    and.push({ colorTokens: { hasSome: colorTokens } });
  }
  if (sizeTokens.length > 0) {
    and.push({ sizeTokens: { hasSome: sizeTokens } });
  }
  and.push(...buildTechnicalSpecWhere(params.technicalSpecs));
  if (filter === 'promotion' || filter === 'special_offer') {
    and.push({
      OR: [{ discountPercent: { gt: 0 } }, { isSpecialPrice: true }],
    });
  } else if (filter === 'new') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    and.push({ productCreatedAt: { gte: thirtyDaysAgo } });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    and.push({
      priceSort: {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      },
    });
  }
  if (pricePresence === 'with') {
    and.push({ priceSort: { gt: 0 } });
  } else if (pricePresence === 'without') {
    and.push({ priceSort: { lte: 0 } });
  }

  return {
    locale: params.lang ?? 'en',
    isPublished: true,
    deletedAt: null,
    ...(and.length > 0 ? { AND: and } : {}),
  };
}

function resolveFacetScope(params: PlpReadModelSearchParams): { scopeType: string; scopeKey: string } {
  const categoryTokens = firstCsvTokens(params.category);
  const hasCombinedScope =
    Boolean(params.search?.trim()) ||
    Boolean(params.brand?.trim()) ||
    Boolean(params.filter?.trim()) ||
    Boolean(params.minPrice?.trim()) ||
    Boolean(params.maxPrice?.trim()) ||
    Boolean(params.pricePresence?.trim());
  if (!hasCombinedScope && categoryTokens.length === 1) {
    return { scopeType: 'category', scopeKey: categoryTokens[0] as string };
  }
  return { scopeType: 'catalog', scopeKey: 'default' };
}

function normalizeJsonArray(value: Prisma.JsonValue): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeColors(value: Prisma.JsonValue): PlpReadModelProduct['colors'] {
  const colors: PlpReadModelProduct['colors'] = [];
  for (const item of normalizeJsonArray(value)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }
    const row = item as { value?: unknown; imageUrl?: unknown; colors?: unknown };
    const label = typeof row.value === 'string' ? row.value.trim() : '';
    if (!label) {
      continue;
    }
    colors.push({
      value: label,
      imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : null,
      colors: Array.isArray(row.colors)
        ? row.colors.filter((color): color is string => typeof color === 'string')
        : null,
    });
  }
  return colors;
}

function toProduct(row: Awaited<ReturnType<typeof fetchRows>>[number]): PlpReadModelProduct {
  return {
    id: row.productId,
    slug: row.slug,
    title: row.title,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    originalPrice: row.originalPrice,
    discountPercent: row.discountPercent > 0 ? row.discountPercent : null,
    isSpecialPrice: row.isSpecialPrice,
    image: row.image,
    images: row.images,
    inStock: row.inStock,
    brand:
      row.brandId && row.brandSlug && row.brandName
        ? {
            id: row.brandId,
            slug: row.brandSlug,
            name: row.brandName,
            logoUrl: row.brandLogoUrl,
          }
        : null,
    defaultVariantId: row.defaultVariantId,
    labels: normalizeJsonArray(row.labels),
    colors: normalizeColors(row.colors),
    warrantyBadge: row.warrantyYears ? { years: row.warrantyYears } : null,
    requiresAttributeSelection: row.requiresAttributeSelection,
  };
}

function readMetaRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const strings = value.filter((item): item is string => typeof item === 'string');
  return strings.length > 0 ? strings : null;
}

async function fetchFilters(params: PlpReadModelSearchParams): Promise<ProductsFiltersData> {
  const scope = resolveFacetScope(params);
  const lang = params.lang ?? 'en';
  const rows = await db.productFacetCount.findMany({
    where: {
      locale: lang,
      scopeType: scope.scopeType,
      scopeKey: scope.scopeKey,
    },
    orderBy: [{ facetType: 'asc' }, { position: 'asc' }, { count: 'desc' }, { label: 'asc' }],
    select: {
      facetType: true,
      facetKey: true,
      value: true,
      label: true,
      count: true,
      position: true,
      meta: true,
    },
  });

  const brands: ProductsFiltersData['brands'] = [];
  const fallbackCategories: ProductsFiltersData['categories'] = [];
  const colors: ProductsFiltersData['colors'] = [];
  const sizes: ProductsFiltersData['sizes'] = [];
  const categoryCountMap = new Map<string, number>();
  const categoryRows: ShopCategoryFilterRow[] = [];
  const attributeFacetMap = new Map<
    string,
    {
      key: string;
      label: string;
      type: string;
      values: Array<{ value: string; label: string; count: number }>;
    }
  >();
  let priceRange = { min: 0, max: 0, stepSize: null, stepSizePerCurrency: null };

  for (const row of rows) {
    const meta = readMetaRecord(row.meta);
    if (row.facetType === 'brand') {
      brands.push({
        id: typeof meta.brandId === 'string' ? meta.brandId : row.value,
        slug: row.value,
        name: row.label,
        count: row.count,
      });
    } else if (row.facetType === 'category') {
      const categoryId = typeof meta.categoryId === 'string' ? meta.categoryId : null;
      if (categoryId) {
        categoryCountMap.set(categoryId, row.count);
        categoryRows.push({
          id: categoryId,
          parentId: typeof meta.parentId === 'string' ? meta.parentId : null,
          position: Number.isFinite(row.position) ? row.position : 0,
          slug: row.value,
          title: row.label,
        });
      } else {
        fallbackCategories.push({
          slug: row.value,
          title: row.label,
          count: row.count,
          children: [],
        });
      }
    } else if (row.facetType === 'color') {
      colors.push({
        value: row.value,
        label: row.label,
        count: row.count,
        imageUrl: typeof meta.imageUrl === 'string' ? meta.imageUrl : null,
        colors: readStringArray(meta.colors),
      });
    } else if (row.facetType === 'size') {
      sizes.push({
        value: row.value,
        count: row.count,
      });
    } else if (row.facetType === 'attribute') {
      const key = row.facetKey;
      const existing =
        attributeFacetMap.get(key) ??
        {
          key,
          label: typeof meta.attributeLabel === 'string' ? meta.attributeLabel : key,
          type: typeof meta.attributeType === 'string' ? meta.attributeType : 'select',
          values: [],
        };
      existing.values.push({
        value: row.value,
        label: row.label,
        count: row.count,
      });
      attributeFacetMap.set(key, existing);
    } else if (row.facetType === 'price') {
      priceRange = {
        min: readNumber(meta.min) ?? 0,
        max: readNumber(meta.max) ?? 0,
        stepSize: null,
        stepSizePerCurrency: null,
      };
    }
  }

  const categories =
    categoryRows.length > 0 ? buildShopCategoryFilterTree(categoryRows, categoryCountMap) : fallbackCategories;
  const attributeFacets = [...attributeFacetMap.values()]
    .map((facet) => ({
      ...facet,
      values: facet.values.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    brands,
    categories,
    priceRange,
    colors,
    sizes,
    attributeFacets,
  };
}

export async function getProductsPlpReadModelFilters(
  params: PlpReadModelSearchParams,
): Promise<ProductsFiltersData> {
  return fetchFilters(params);
}

async function fetchRows(args: {
  where: Prisma.ProductListingRowWhereInput;
  orderBy: Prisma.ProductListingRowOrderByWithRelationInput[];
  skip: number;
  take: number;
}) {
  return db.productListingRow.findMany({
    where: args.where,
    orderBy: args.orderBy,
    skip: args.skip,
    take: args.take,
    select: {
      productId: true,
      slug: true,
      title: true,
      price: true,
      compareAtPrice: true,
      originalPrice: true,
      discountPercent: true,
      isSpecialPrice: true,
      image: true,
      images: true,
      inStock: true,
      brandId: true,
      brandSlug: true,
      brandName: true,
      brandLogoUrl: true,
      defaultVariantId: true,
      labels: true,
      colors: true,
      warrantyYears: true,
      requiresAttributeSelection: true,
    },
  });
}

export async function getProductsPlpReadModelPayload(
  params: PlpReadModelSearchParams,
): Promise<PlpReadModelPayload> {
  const page = parsePositiveInt(params.page, 1, Number.MAX_SAFE_INTEGER);
  const maxLimit =
    firstCsvTokens(params.ids).length > 0 ? PRODUCT_ID_LOOKUP_MAX_PAGE_SIZE : SHOP_PLP_MAX_PAGE_SIZE;
  const limit = parsePositiveInt(params.limit, SHOP_PLP_DEFAULT_PAGE_SIZE, maxLimit);
  const skip = (page - 1) * limit;
  const orderBy = buildOrderBy(params.sort ?? params.filter);
  const includeFilters = params.includeFilters !== false && params.includeFilters !== '0';
  const includeItems = params.includeItems !== false && params.includeItems !== '0';
  const [rows, filters] = await Promise.all([
    includeItems
      ? buildWhere(params).then((where) => fetchRows({ where, orderBy, skip, take: limit + 1 }))
      : Promise.resolve([]),
    includeFilters ? fetchFilters(params) : Promise.resolve(EMPTY_PRODUCTS_FILTERS),
  ]);
  const hasNextPage = rows.length > limit;
  const visibleRows = hasNextPage ? rows.slice(0, limit) : rows;
  const total = hasNextPage ? skip + limit + 1 : skip + visibleRows.length;
  const meta = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage,
    nextCursor: null,
    totalIsExact: !hasNextPage,
  };
  const items = visibleRows.map(toProduct);
  return {
    items,
    pagination: meta,
    filters,
    data: items,
    meta,
  };
}
