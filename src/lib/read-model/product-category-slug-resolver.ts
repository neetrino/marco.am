import { cache } from 'react';
import { db } from '@white-shop/db';

/**
 * Resolve PLP category URL slugs (from any locale) to stable category IDs.
 *
 * Category slugs are presentation/SEO values and differ per locale, while the
 * listing read-model denormalizes the locale-independent `categoryIds`. Filtering
 * by ID keeps category navigation correct across languages and shared links
 * (e.g. an Armenian slug opened under an English locale). Returns an empty array
 * for unknown slugs so callers can fall back to slug matching.
 *
 * Memoized per request via React `cache` so the listing query and the sidebar
 * facet aggregation resolve the same slugs only once.
 */
export const resolveCategoryIdsFromSlugs = cache(
  async (slugs: readonly string[]): Promise<string[]> => {
    if (slugs.length === 0) {
      return [];
    }
    const rows = await db.categoryTranslation.findMany({
      where: { slug: { in: [...slugs] } },
      select: { categoryId: true },
    });
    return [...new Set(rows.map((row) => row.categoryId))];
  },
);
