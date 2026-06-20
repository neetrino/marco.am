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
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { aggregateProductsPlpFacets } from './product-facet-live-aggregation';
import {
  PRODUCTS_PLP_CACHE_TTL_SEC,
  buildPlpFiltersCacheKey,
  buildPlpListingCacheKey,
  shouldSkipPlpCache,
} from './products-plp-read-model-cache';
import { resolveCategoryIdsFromSlugs } from './product-category-slug-resolver';
import {
  LISTING_CARD_SELECT,
  mapListingRowToCard,
  type PlpReadModelProduct,
} from './product-listing-card-mapper';
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

type PlpReadModelPayload = {
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

/**
 * Category condition prefers resolved (locale-agnostic) category IDs and falls back
 * to slug matching only when no slug resolved (e.g. unknown/legacy slug), so a
 * cross-locale URL still narrows to the same products.
 */
function buildCategoryCondition(
  categorySlugTokens: string[],
  categoryIdTokens: string[],
): Prisma.ProductListingRowWhereInput | null {
  if (categoryIdTokens.length > 0) {
    return { categoryIds: { hasSome: categoryIdTokens } };
  }
  if (categorySlugTokens.length > 0) {
    return { categorySlugs: { hasSome: categorySlugTokens } };
  }
  return null;
}

function buildWhere(
  params: PlpReadModelSearchParams,
  categoryIdTokens: string[],
): Prisma.ProductListingRowWhereInput {
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
  const categoryCondition = buildCategoryCondition(categoryTokens, categoryIdTokens);
  if (categoryCondition) {
    // Ancestor IDs/slugs are denormalized into the row, so a parent-category filter
    // matches subcategory products directly (no operational category lookup).
    and.push(categoryCondition);
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

export async function getProductsPlpReadModelFilters(
  params: PlpReadModelSearchParams,
): Promise<ProductsFiltersData> {
  if (shouldSkipPlpCache(params)) {
    return aggregateProductsPlpFacets(params);
  }
  return getCachedJson(buildPlpFiltersCacheKey(params), PRODUCTS_PLP_CACHE_TTL_SEC, () =>
    aggregateProductsPlpFacets(params),
  );
}

type PlpListingItemsPayload = {
  items: PlpReadModelProduct[];
  pagination: PlpListingMeta;
};

function buildEmptyListingItems(params: PlpReadModelSearchParams): PlpListingItemsPayload {
  const page = parsePositiveInt(params.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePositiveInt(params.limit, SHOP_PLP_DEFAULT_PAGE_SIZE, SHOP_PLP_MAX_PAGE_SIZE);
  return {
    items: [],
    pagination: {
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasNextPage: false,
      nextCursor: null,
      totalIsExact: true,
    },
  };
}

async function computeListingItems(params: PlpReadModelSearchParams): Promise<PlpListingItemsPayload> {
  const page = parsePositiveInt(params.page, 1, Number.MAX_SAFE_INTEGER);
  const maxLimit =
    firstCsvTokens(params.ids).length > 0 ? PRODUCT_ID_LOOKUP_MAX_PAGE_SIZE : SHOP_PLP_MAX_PAGE_SIZE;
  const limit = parsePositiveInt(params.limit, SHOP_PLP_DEFAULT_PAGE_SIZE, maxLimit);
  const skip = (page - 1) * limit;
  const orderBy = buildOrderBy(
    params.sort ?? params.filter,
    resolveShopPlpPricePresence(params.pricePresence),
  );
  const categoryIdTokens = await resolveCategoryIdsFromSlugs(firstCsvTokens(params.category));
  const rows = await fetchRows({
    where: buildWhere(params, categoryIdTokens),
    orderBy,
    skip,
    take: limit + 1,
  });
  const hasNextPage = rows.length > limit;
  const visibleRows = hasNextPage ? rows.slice(0, limit) : rows;
  const total = hasNextPage ? skip + limit + 1 : skip + visibleRows.length;
  return {
    items: visibleRows.map(mapListingRowToCard),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage,
      nextCursor: null,
      totalIsExact: !hasNextPage,
    },
  };
}

async function getCachedListingItems(
  params: PlpReadModelSearchParams,
): Promise<PlpListingItemsPayload> {
  if (shouldSkipPlpCache(params)) {
    return computeListingItems(params);
  }
  return getCachedJson(buildPlpListingCacheKey(params), PRODUCTS_PLP_CACHE_TTL_SEC, () =>
    computeListingItems(params),
  );
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
    select: LISTING_CARD_SELECT,
  });
}

export async function getProductsPlpReadModelPayload(
  params: PlpReadModelSearchParams,
): Promise<PlpReadModelPayload> {
  const includeFilters = params.includeFilters !== false && params.includeFilters !== '0';
  const includeItems = params.includeItems !== false && params.includeItems !== '0';
  const [listing, filters] = await Promise.all([
    includeItems ? getCachedListingItems(params) : Promise.resolve(buildEmptyListingItems(params)),
    includeFilters
      ? getProductsPlpReadModelFilters(params)
      : Promise.resolve(EMPTY_PRODUCTS_FILTERS),
  ]);
  return {
    items: listing.items,
    pagination: listing.pagination,
    filters,
  };
}
