import {
  findCategoryBySlug,
  getAllChildCategoryIds,
} from '@/lib/services/products-find-query/category-utils';

/** Split a comma-separated query value into trimmed, optionally transformed tokens. */
export function firstCsvTokens(
  raw: string | undefined,
  transform?: (token: string) => string,
): string[] {
  return (
    raw
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  ).map((token) => (transform ? transform(token) : token));
}

export function parsePositiveInt(raw: string | undefined, fallback: number, max: number): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

export function parseOptionalPrice(raw: string | undefined): number | undefined {
  const parsed = raw ? Number(raw) : undefined;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/** Resolve category slug tokens to the set of matching category ids including descendants. */
export async function resolveCategoryIdsForFilter(
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
