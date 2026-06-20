import { Prisma } from '@white-shop/db/prisma';
import { buildTechnicalSpecFilterToken } from '@/lib/services/products-technical-filters';
import { firstCsvTokens, parseOptionalPrice } from './product-plp-filter-parse';
import type { PlpReadModelSearchParams } from './products-plp-read-model-types';

const NEW_PRODUCT_WINDOW_DAYS = 30;

type FacetFilterDimension = 'category' | 'brand' | 'color' | 'size' | 'price' | (string & {});

export type PlpFacetFilterInput = {
  locale: string;
  categorySlugTokens: string[];
  /** Locale-agnostic category IDs resolved from the slug tokens (preferred over slugs for filtering). */
  categoryIdTokens: string[];
  brandTokens: string[];
  colorTokens: string[];
  sizeTokens: string[];
  technicalSpecGroups: Array<{ key: string; dimension: string; tokens: string[] }>;
  search: string | null;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  promotion: boolean;
  newOnly: boolean;
};

/** Build the normalized facet filter input. Category slugs match directly (ancestors denormalized). */
export function buildFacetFilterInput(params: PlpReadModelSearchParams): PlpFacetFilterInput {
  const locale = params.lang ?? 'en';
  const categoryTokens = firstCsvTokens(params.category);
  const filter = params.filter?.trim();
  const technicalSpecGroups = Object.entries(params.technicalSpecs ?? {})
    .map(([key, values]) => ({
      key,
      dimension: `spec:${key}`,
      tokens: values.map((value) => buildTechnicalSpecFilterToken(key, value)).filter(Boolean),
    }))
    .filter((group) => group.key && group.tokens.length > 0);

  return {
    locale,
    categorySlugTokens: categoryTokens,
    categoryIdTokens: [],
    brandTokens: firstCsvTokens(params.brand),
    colorTokens: firstCsvTokens(params.colors, (token) => token.toLowerCase()),
    sizeTokens: firstCsvTokens(params.sizes, (token) => token.toUpperCase()),
    technicalSpecGroups,
    search: params.search?.trim() || null,
    minPrice: parseOptionalPrice(params.minPrice),
    maxPrice: parseOptionalPrice(params.maxPrice),
    promotion: filter === 'promotion' || filter === 'special_offer',
    newOnly: filter === 'new',
  };
}

/** Base conditions applied to every facet aggregation (never excluded by drill-down). */
function baseConditions(input: PlpFacetFilterInput): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`"locale" = ${input.locale}`,
    Prisma.sql`"isPublished" = true`,
    Prisma.sql`"deletedAt" IS NULL`,
  ];
  if (input.search) {
    conditions.push(Prisma.sql`"searchText" ILIKE ${`%${input.search}%`}`);
  }
  if (input.promotion) {
    conditions.push(Prisma.sql`("discountPercent" > 0 OR "isSpecialPrice" = true)`);
  }
  if (input.newOnly) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - NEW_PRODUCT_WINDOW_DAYS);
    conditions.push(Prisma.sql`"productCreatedAt" >= ${threshold}`);
  }
  return conditions;
}

/** Excludable sidebar facet dimensions (drill-down keeps a facet's own group visible). */
function dimensionConditions(
  input: PlpFacetFilterInput,
): Array<{ dimension: FacetFilterDimension; sql: Prisma.Sql }> {
  const conditions: Array<{ dimension: FacetFilterDimension; sql: Prisma.Sql }> = [];
  if (input.categoryIdTokens.length > 0) {
    conditions.push({
      dimension: 'category',
      sql: Prisma.sql`"categoryIds" && ARRAY[${Prisma.join(input.categoryIdTokens)}]::text[]`,
    });
  } else if (input.categorySlugTokens.length > 0) {
    conditions.push({
      dimension: 'category',
      sql: Prisma.sql`"categorySlugs" && ARRAY[${Prisma.join(input.categorySlugTokens)}]::text[]`,
    });
  }
  if (input.brandTokens.length > 0) {
    const lower = input.brandTokens.map((token) => token.toLowerCase());
    conditions.push({
      dimension: 'brand',
      sql: Prisma.sql`("brandId" = ANY(ARRAY[${Prisma.join(input.brandTokens)}]) OR "brandSlug" = ANY(ARRAY[${Prisma.join(lower)}]))`,
    });
  }
  if (input.colorTokens.length > 0) {
    conditions.push({
      dimension: 'color',
      sql: Prisma.sql`"colorTokens" && ARRAY[${Prisma.join(input.colorTokens)}]::text[]`,
    });
  }
  if (input.sizeTokens.length > 0) {
    conditions.push({
      dimension: 'size',
      sql: Prisma.sql`"sizeTokens" && ARRAY[${Prisma.join(input.sizeTokens)}]::text[]`,
    });
  }
  const priceBounds: Prisma.Sql[] = [];
  if (input.minPrice !== undefined) {
    priceBounds.push(Prisma.sql`"priceSort" >= ${input.minPrice}`);
  }
  if (input.maxPrice !== undefined) {
    priceBounds.push(Prisma.sql`"priceSort" <= ${input.maxPrice}`);
  }
  if (priceBounds.length > 0) {
    conditions.push({ dimension: 'price', sql: Prisma.join(priceBounds, ' AND ') });
  }
  for (const group of input.technicalSpecGroups) {
    conditions.push({
      dimension: group.dimension,
      sql: Prisma.sql`"technicalSpecTokens" && ARRAY[${Prisma.join(group.tokens)}]::text[]`,
    });
  }
  return conditions;
}

/**
 * Compose the `WHERE` clause for a facet, applying all active filters except the
 * dimensions in `except` so a facet group keeps showing its sibling options (drill-down).
 */
export function buildFacetWhere(
  input: PlpFacetFilterInput,
  except: ReadonlySet<FacetFilterDimension> = new Set(),
): Prisma.Sql {
  const dimensions = dimensionConditions(input)
    .filter((entry) => !except.has(entry.dimension))
    .map((entry) => entry.sql);
  return Prisma.join([...baseConditions(input), ...dimensions], ' AND ');
}
