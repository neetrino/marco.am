/** Same normalization as header `categoryNavList` for stable title matching. */
function normalizeShopCategoryTitleKey(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ');
}

/** Legacy slug and duplicate “AC only” rows (full nav uses AC + heaters combined label). */
const EXCLUDED_SHOP_CATEGORY_SLUGS = new Set(['odorakichner']);

const EXCLUDED_SHOP_CATEGORY_TITLE_KEYS = new Set([
  normalizeShopCategoryTitleKey('Օդորակիչներ'),
  normalizeShopCategoryTitleKey('Air conditioners'),
  normalizeShopCategoryTitleKey('Кондиционеры'),
]);

export function isExcludedShopCategory(slug: string, title: string): boolean {
  if (EXCLUDED_SHOP_CATEGORY_SLUGS.has(slug.trim().toLowerCase())) {
    return true;
  }
  const key = normalizeShopCategoryTitleKey(title);
  return key.length > 0 && EXCLUDED_SHOP_CATEGORY_TITLE_KEYS.has(key);
}

type ShopCategoryTreeNode = {
  slug: string;
  title: string;
  children: ShopCategoryTreeNode[];
};

export function filterExcludedShopCategoryTree<T extends ShopCategoryTreeNode>(nodes: T[]): T[] {
  return nodes
    .filter((node) => !isExcludedShopCategory(node.slug, node.title))
    .map((node) => ({
      ...node,
      children: filterExcludedShopCategoryTree(node.children),
    }));
}
