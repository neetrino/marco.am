import { getShopCategoryFacetTreeCached } from '@/lib/cache/shop-category-facet-tree-cache';
import type { LanguageCode } from '@/lib/language';
import { ProductsFiltersCategoryHydration } from '@/components/ProductsFiltersProvider';

type ProductsShopCategoryTreeSectionProps = {
  readonly language: LanguageCode;
};

/** Streams the hot category facet tree into the mounted filter column. */
export async function ProductsShopCategoryTreeSection({
  language,
}: ProductsShopCategoryTreeSectionProps) {
  const categories = await getShopCategoryFacetTreeCached(language);

  return <ProductsFiltersCategoryHydration categories={categories} />;
}
