import { db } from '@white-shop/db';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { buildDistinctSubtreeProductCountMap } from '@/lib/services/category-product-counts.service';
import { buildShopFilterCategoriesFromCountMap } from '@/lib/services/products-filters-category-tree';
import type { CategoryFilterOption } from '@/lib/shop-products-filters-types';

export const SHOP_CATEGORY_FACET_TREE_TTL_SEC = 600;

const SHOP_CATEGORY_FACET_TREE_CACHE_PREFIX = 'shop:category-facet-tree:v2';

export function buildShopCategoryFacetTreeCacheKey(lang: string): string {
  return `${SHOP_CATEGORY_FACET_TREE_CACHE_PREFIX}:${lang.trim().toLowerCase()}`;
}

/**
 * Distinct product counts per category subtree over the full published catalog.
 *
 * Mirrors the admin panel and PLP facets: a product is counted once for every
 * category whose subtree it belongs to (no per-level summing, no sample cap),
 * so the storefront counts stay consistent across surfaces.
 */
async function buildUnscopedCategoryCountMap(): Promise<Map<string, number>> {
  const [categoryRows, products] = await Promise.all([
    db.category.findMany({
      where: { published: true, deletedAt: null },
      select: { id: true, parentId: true },
    }),
    db.product.findMany({
      where: { published: true, deletedAt: null },
      select: { primaryCategoryId: true, categoryIds: true },
    }),
  ]);

  const countMap = buildDistinctSubtreeProductCountMap(categoryRows, products);
  const nonEmptyCounts = new Map<string, number>();
  for (const [categoryId, count] of countMap) {
    if (count > 0) {
      nonEmptyCounts.set(categoryId, count);
    }
  }
  return nonEmptyCounts;
}

/** Always-hot PLP category tree with accurate product counts (all roots + subcategories). */
export async function getShopCategoryFacetTreeCached(
  lang: string,
): Promise<CategoryFilterOption[]> {
  return getCachedJson(
    buildShopCategoryFacetTreeCacheKey(lang),
    SHOP_CATEGORY_FACET_TREE_TTL_SEC,
    async () => {
      const countMap = await buildUnscopedCategoryCountMap();
      return buildShopFilterCategoriesFromCountMap(countMap, lang);
    },
  );
}

export async function warmShopCategoryFacetTreeCaches(
  locales: readonly string[] = ['en', 'hy', 'ru'],
): Promise<void> {
  await Promise.all(locales.map((lang) => getShopCategoryFacetTreeCached(lang)));
}

export async function invalidateShopCategoryFacetTreeCache(): Promise<void> {
  const { cacheService } = await import('@/lib/services/cache.service');
  await cacheService.deletePattern(`${SHOP_CATEGORY_FACET_TREE_CACHE_PREFIX}:*`);
}
