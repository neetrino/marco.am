import { Prisma } from '@white-shop/db/prisma';
import { db } from '@white-shop/db';
import {
  EMPTY_PRICE_RANGE,
  type BrandOption,
  type CategoryFilterOption,
  type ColorOption,
  type PriceRangeOption,
  type ProductsFiltersData,
  type SizeOption,
} from '@/lib/shop-products-filters-types';
import type { TechnicalSpecFacet } from '@/lib/services/products-technical-filters';
import { buildShopCategoryFilterTree, type ShopCategoryFilterRow } from '@/lib/shop-category-filter-tree';
import {
  buildFacetFilterInput,
  buildFacetWhere,
  type PlpFacetFilterInput,
} from './product-facet-live-where';
import type { PlpReadModelSearchParams } from './products-plp-read-model-types';
import { filterVisibleAttributeFacets } from './product-facet-visibility';
import { resolveCategoryIdsFromSlugs } from './product-category-slug-resolver';
import { findProductIdsBySkuSearch } from '@/lib/product-search/find-product-ids-by-sku';

const LISTING_TABLE = Prisma.sql`"product_listing_rows"`;

type CategoryRow = {
  id: string;
  parentId: string | null;
  position: number;
  slug: string | null;
  title: string | null;
};

function toCount(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

/**
 * Run a composed `Prisma.sql` via `$queryRawUnsafe`. The extended Prisma client
 * (`$allOperations`) is incompatible with `$queryRaw(Prisma.sql`...`)`, and the
 * tagged-template form sends nested `Prisma.sql` fragments as bind params instead of
 * inlining them — so we expand the composed query to its parameterized text + values.
 */
function runFacetQuery<T>(query: Prisma.Sql): Promise<T> {
  return db.$queryRawUnsafe<T>(query.text, ...query.values);
}

async function fetchBrandFacets(input: PlpFacetFilterInput): Promise<BrandOption[]> {
  const where = buildFacetWhere(input, new Set(['brand']));
  const rows = await runFacetQuery<
    Array<{ id: string | null; slug: string; name: string | null; count: bigint }>
  >(Prisma.sql`
    SELECT MIN("brandId") AS id, "brandSlug" AS slug, MIN("brandName") AS name, COUNT(DISTINCT "productId") AS count
    FROM ${LISTING_TABLE}
    WHERE ${where} AND "brandSlug" IS NOT NULL AND "brandName" IS NOT NULL
    GROUP BY "brandSlug"
  `);
  return rows
    .filter((row) => row.name)
    .map((row) => ({
      id: row.id ?? row.slug,
      slug: row.slug,
      name: row.name as string,
      count: toCount(row.count),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

async function fetchColorFacets(input: PlpFacetFilterInput): Promise<ColorOption[]> {
  const where = buildFacetWhere(input, new Set(['color']));
  const rows = await runFacetQuery<
    Array<{ value: string; label: string; imageUrl: string | null; colorsJson: string | null; count: bigint }>
  >(Prisma.sql`
    SELECT
      lower(c->>'value') AS value,
      MIN(c->>'value') AS label,
      MIN(c->>'imageUrl') AS "imageUrl",
      MIN((c->'colors')::text) AS "colorsJson",
      COUNT(DISTINCT "productId") AS count
    FROM ${LISTING_TABLE}, jsonb_array_elements("colors") AS c
    WHERE ${where} AND c->>'value' IS NOT NULL AND c->>'value' <> ''
    GROUP BY lower(c->>'value')
  `);
  return rows
    .map((row) => ({
      value: row.value,
      label: row.label,
      count: toCount(row.count),
      imageUrl: row.imageUrl,
      colors: parseHexColors(row.colorsJson),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function parseHexColors(raw: string | null): string[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    const colors = parsed.filter((item): item is string => typeof item === 'string');
    return colors.length > 0 ? colors : null;
  } catch {
    return null;
  }
}

async function fetchSizeFacets(input: PlpFacetFilterInput): Promise<SizeOption[]> {
  const where = buildFacetWhere(input, new Set(['size']));
  const rows = await runFacetQuery<Array<{ value: string; count: bigint }>>(Prisma.sql`
    SELECT upper(token) AS value, COUNT(DISTINCT "productId") AS count
    FROM ${LISTING_TABLE}, unnest("sizeTokens") AS token
    WHERE ${where} AND token <> ''
    GROUP BY upper(token)
  `);
  return rows
    .map((row) => ({ value: row.value, count: toCount(row.count) }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

async function fetchPriceRange(input: PlpFacetFilterInput): Promise<PriceRangeOption> {
  const where = buildFacetWhere(input, new Set(['price']));
  const rows = await runFacetQuery<Array<{ min: number | null; max: number | null }>>(Prisma.sql`
    SELECT MIN("priceSort") AS min, MAX("priceSort") AS max
    FROM ${LISTING_TABLE}
    WHERE ${where} AND "priceSort" > 0
  `);
  const row = rows[0];
  if (!row || row.min === null || row.max === null) {
    return EMPTY_PRICE_RANGE;
  }
  return { min: toCount(row.min), max: toCount(row.max), stepSize: null, stepSizePerCurrency: null };
}

type AttributeRow = {
  key: string;
  label: string;
  type: string;
  value: string;
  valueLabel: string;
  count: bigint;
};

async function runAttributeQuery(
  input: PlpFacetFilterInput,
  except: ReadonlySet<string>,
): Promise<AttributeRow[]> {
  const where = buildFacetWhere(input, except);
  return runFacetQuery<AttributeRow[]>(Prisma.sql`
    SELECT
      spec->>'key' AS key,
      MIN(spec->>'label') AS label,
      MIN(spec->>'type') AS type,
      spec->>'value' AS value,
      MIN(spec->>'valueLabel') AS "valueLabel",
      COUNT(DISTINCT "productId") AS count
    FROM ${LISTING_TABLE}, jsonb_array_elements("technicalSpecs") AS spec
    WHERE ${where} AND spec->>'key' IS NOT NULL AND spec->>'value' IS NOT NULL
    GROUP BY spec->>'key', spec->>'value'
  `);
}

async function fetchAttributeFacets(input: PlpFacetFilterInput): Promise<TechnicalSpecFacet[]> {
  const selectedKeys = input.technicalSpecGroups.map((group) => group.key);
  const selectedSet = new Set(selectedKeys);
  const [sharedRows, perKeyResults] = await Promise.all([
    runAttributeQuery(input, new Set()),
    Promise.all(selectedKeys.map((key) => runAttributeQuery(input, new Set([`spec:${key}`])))),
  ]);

  const rows: AttributeRow[] = sharedRows.filter((row) => !selectedSet.has(row.key));
  perKeyResults.forEach((keyRows, index) => {
    const key = selectedKeys[index];
    rows.push(...keyRows.filter((row) => row.key === key));
  });

  const byKey = new Map<string, TechnicalSpecFacet>();
  for (const row of rows) {
    const facet =
      byKey.get(row.key) ?? { key: row.key, label: row.label, type: row.type || 'select', values: [] };
    facet.values.push({ value: row.value, label: row.valueLabel, count: toCount(row.count) });
    byKey.set(row.key, facet);
  }
  return filterVisibleAttributeFacets(
    [...byKey.values()]
      .map((facet) => ({
        ...facet,
        values: facet.values.sort((a, b) => a.label.localeCompare(b.label)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    { categorySlugTokens: input.categorySlugTokens },
  );
}

async function loadCategoryRows(locale: string): Promise<CategoryRow[]> {
  const categories = await db.category.findMany({
    where: { published: true, deletedAt: null },
    select: {
      id: true,
      parentId: true,
      position: true,
      translations: { where: { locale }, select: { slug: true, title: true } },
    },
  });
  return categories.map((category) => ({
    id: category.id,
    parentId: category.parentId,
    position: category.position,
    slug: category.translations[0]?.slug ?? null,
    title: category.translations[0]?.title ?? null,
  }));
}

/** Roll leaf-category product hits up to ancestors so a parent counts its whole subtree (distinct products). */
export function rollupCategoryCounts(
  pairs: ReadonlyArray<{ categoryId: string; productId: string }>,
  parentById: ReadonlyMap<string, string | null>,
): Map<string, number> {
  const productSets = new Map<string, Set<string>>();
  for (const pair of pairs) {
    let current: string | null | undefined = pair.categoryId;
    let guard = 0;
    while (current && guard < 64) {
      guard += 1;
      const set = productSets.get(current) ?? new Set<string>();
      set.add(pair.productId);
      productSets.set(current, set);
      current = parentById.get(current) ?? null;
    }
  }
  const counts = new Map<string, number>();
  for (const [categoryId, set] of productSets) {
    counts.set(categoryId, set.size);
  }
  return counts;
}

async function fetchCategoryFacets(input: PlpFacetFilterInput): Promise<CategoryFilterOption[]> {
  const where = buildFacetWhere(input, new Set(['category']));
  const [pairs, categoryRows] = await Promise.all([
    runFacetQuery<Array<{ categoryId: string; productId: string }>>(Prisma.sql`
      SELECT cat AS "categoryId", "productId"
      FROM ${LISTING_TABLE}, unnest("categoryIds") AS cat
      WHERE ${where}
    `),
    loadCategoryRows(input.locale),
  ]);

  const parentById = new Map(categoryRows.map((row) => [row.id, row.parentId]));
  const counts = rollupCategoryCounts(pairs, parentById);
  const treeRows: ShopCategoryFilterRow[] = categoryRows
    .filter((row): row is CategoryRow & { slug: string; title: string } => Boolean(row.slug && row.title))
    .map((row) => ({
      id: row.id,
      parentId: row.parentId,
      position: row.position,
      slug: row.slug,
      title: row.title,
    }));
  return buildShopCategoryFilterTree(treeRows, counts);
}

/** Compute all PLP sidebar facets live from the listing projection with drill-down counts. */
export async function aggregateProductsPlpFacets(
  params: PlpReadModelSearchParams,
): Promise<ProductsFiltersData> {
  const input = buildFacetFilterInput(params);
  input.categoryIdTokens = await resolveCategoryIdsFromSlugs(input.categorySlugTokens);
  if (input.search) {
    input.productIdsFromSku = await findProductIdsBySkuSearch(input.search);
  }
  const [brands, colors, sizes, priceRange, attributeFacets, categories] = await Promise.all([
    fetchBrandFacets(input),
    fetchColorFacets(input),
    fetchSizeFacets(input),
    fetchPriceRange(input),
    fetchAttributeFacets(input),
    fetchCategoryFacets(input),
  ]);
  return { brands, categories, priceRange, colors, sizes, attributeFacets };
}
