import { Prisma } from '@white-shop/db/prisma';
import { db } from '@white-shop/db';
import {
  SHOP_PLP_DEFAULT_PAGE_SIZE,
  SHOP_PLP_MAX_PAGE_SIZE,
} from '@/lib/constants/shop-plp-pagination';
import {
  resolveShopPlpPricePresence,
  type ShopPlpPricePresence,
} from '@/lib/constants/shop-plp-price-presence';
import {
  EMPTY_PRODUCTS_FILTERS,
  type ProductsFiltersData,
} from '@/lib/shop-products-filters-types';
import type { TechnicalSpecFilters } from '@/lib/services/products-find-query/types';
import {
  buildTechnicalSpecFilterToken,
  normalizeTechnicalFilterToken,
} from '@/lib/services/products-technical-filters';
import { aggregateProductsPlpFacets } from './product-facet-live-aggregation';
import {
  firstCsvTokens,
  parseOptionalPrice,
  parsePositiveInt,
} from './product-plp-filter-parse';
import type {
  PlpListingMeta,
  PlpReadModelSearchParams,
} from './products-plp-read-model-types';

export type { PlpReadModelSearchParams } from './products-plp-read-model-types';

const PRODUCT_ID_LOOKUP_MAX_PAGE_SIZE = 500;

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
};

function buildSortOrderBy(sort: string | undefined): Prisma.ProductListingRowOrderByWithRelationInput[] {
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

/**
 * Segment the listing by price presence instead of hard-excluding: the selected
 * presence is surfaced first ("with price" → priced wall first, then unpriced; and
 * vice-versa) so a category with only unpriced products never renders empty.
 */
function buildOrderBy(
  sort: string | undefined,
  pricePresence: ShopPlpPricePresence,
): Prisma.ProductListingRowOrderByWithRelationInput[] {
  const presenceFirst: Prisma.ProductListingRowOrderByWithRelationInput = {
    hasPrice: pricePresence === 'without' ? 'asc' : 'desc',
  };
  return [presenceFirst, ...buildSortOrderBy(sort)];
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

function buildWhere(params: PlpReadModelSearchParams): Prisma.ProductListingRowWhereInput {
  const minPrice = parseOptionalPrice(params.minPrice);
  const maxPrice = parseOptionalPrice(params.maxPrice);
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
    // Ancestor slugs are denormalized into `categorySlugs`, so a parent-category filter
    // matches subcategory products directly (no operational category lookup).
    and.push({ categorySlugs: { hasSome: categoryTokens } });
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

  return {
    locale: params.lang ?? 'en',
    isPublished: true,
    deletedAt: null,
    ...(and.length > 0 ? { AND: and } : {}),
  };
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

export async function getProductsPlpReadModelFilters(
  params: PlpReadModelSearchParams,
): Promise<ProductsFiltersData> {
  return aggregateProductsPlpFacets(params);
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
  const orderBy = buildOrderBy(
    params.sort ?? params.filter,
    resolveShopPlpPricePresence(params.pricePresence),
  );
  const includeFilters = params.includeFilters !== false && params.includeFilters !== '0';
  const includeItems = params.includeItems !== false && params.includeItems !== '0';
  const [rows, filters] = await Promise.all([
    includeItems
      ? fetchRows({ where: buildWhere(params), orderBy, skip, take: limit + 1 })
      : Promise.resolve([]),
    includeFilters ? aggregateProductsPlpFacets(params) : Promise.resolve(EMPTY_PRODUCTS_FILTERS),
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
  };
}
