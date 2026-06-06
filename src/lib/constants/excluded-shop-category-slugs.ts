/** Same normalization as header `categoryNavList` for stable title matching. */
export function normalizeShopCategoryTitleKey(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ');
}

/** Canonical key for slug/title matching (aligned with shop filter sidebar). */
export function canonicalShopCategoryKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, ' and ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Legacy seed/demo taxonomy slugs — not part of MARCO storefront nav.
 * Real categories use `cat-*` ids; these English slugs duplicate nav labels with empty trees.
 */
const LEGACY_SHOP_CATEGORY_SLUGS = new Set([
  'accessories',
  'air-conditioners',
  'audio-video',
  'books',
  'clothing',
  'electronics',
  'furniture',
  'home',
  'home-and-garden',
  'home-garden',
  'home-appliances',
  'kitchen-appliances',
  'large-appliances',
  'shoes',
  'sports',
  'water-dispensers',
]);

/** Real MARCO categories use generated `cat-*` slugs in every locale. */
export function isMarcoStorefrontCategorySlug(slug: string): boolean {
  return /^cat-[a-f0-9]+$/i.test(slug.trim());
}

/** Legacy slug and duplicate “AC only” rows (full nav uses AC + heaters combined label). */
const EXCLUDED_SHOP_CATEGORY_SLUGS = new Set(['odorakichner']);

const EXCLUDED_SHOP_CATEGORY_TITLE_KEYS = new Set([
  normalizeShopCategoryTitleKey('Օդորակիչներ'),
  normalizeShopCategoryTitleKey('Air conditioners'),
  normalizeShopCategoryTitleKey('Кондиционеры'),
]);

export function isLegacyShopCategorySlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  if (isMarcoStorefrontCategorySlug(normalized)) {
    return false;
  }
  return LEGACY_SHOP_CATEGORY_SLUGS.has(normalized);
}

export function isLegacyShopCategoryFromTranslations(
  translations: ReadonlyArray<{ slug: string; title: string }>,
): boolean {
  if (translations.some((tr) => isMarcoStorefrontCategorySlug(tr.slug))) {
    return false;
  }
  return translations.some((tr) => isLegacyShopCategorySlug(tr.slug));
}

export function isExcludedHeaderNavCategory(slug: string, title: string): boolean {
  if (EXCLUDED_SHOP_CATEGORY_SLUGS.has(slug.trim().toLowerCase())) {
    return true;
  }
  const key = normalizeShopCategoryTitleKey(title);
  return key.length > 0 && EXCLUDED_SHOP_CATEGORY_TITLE_KEYS.has(key);
}

export function isExcludedShopCategory(slug: string, title: string): boolean {
  if (isLegacyShopCategorySlug(slug)) {
    return true;
  }
  return isExcludedHeaderNavCategory(slug, title);
}

type ShopCategoryTreeNode = {
  slug: string;
  title: string;
  children: ShopCategoryTreeNode[];
};

export function filterHeaderNavCategoryTree<T extends ShopCategoryTreeNode>(nodes: T[]): T[] {
  return nodes
    .filter((node) => !isExcludedHeaderNavCategory(node.slug, node.title))
    .map((node) => ({
      ...node,
      children: filterHeaderNavCategoryTree(node.children),
    }));
}

export function filterExcludedShopCategoryTree<T extends ShopCategoryTreeNode>(nodes: T[]): T[] {
  return nodes
    .filter((node) => !isExcludedShopCategory(node.slug, node.title))
    .map((node) => ({
      ...node,
      children: filterExcludedShopCategoryTree(node.children),
    }));
}
