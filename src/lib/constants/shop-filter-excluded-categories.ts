/** Legacy demo categories — omit from shop sidebar (not part of MARCO nav taxonomy). */
export const SHOP_FILTER_EXCLUDED_CATEGORY_CANONICAL = new Set([
  "accessories",
  "books",
  "clothing",
  "electronics",
  "home and garden",
  /** Slug `home-garden` normalizes to spaces without "and". */
  "home garden",
  "shoes",
  "sports",
]);

export function canonicalShopFilterCategoryKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, " and ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

export function isShopFilterCategoryExcludedFromTranslations(
  translations: Array<{ slug: string; title: string }>,
): boolean {
  for (const translation of translations) {
    const slugKey = canonicalShopFilterCategoryKey(translation.slug);
    const titleKey = canonicalShopFilterCategoryKey(translation.title);
    if (
      SHOP_FILTER_EXCLUDED_CATEGORY_CANONICAL.has(slugKey) ||
      SHOP_FILTER_EXCLUDED_CATEGORY_CANONICAL.has(titleKey)
    ) {
      return true;
    }
  }
  return false;
}
