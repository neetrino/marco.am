import { filterExcludedShopCategoryTree } from '@/lib/constants/excluded-shop-category-slugs';
import { getShopFilterBrandLabelsCached } from '@/lib/cache/shop-filter-brand-labels-cache';
import type { CategoryFilterOption, ProductsFiltersShellData } from '@/lib/shop-products-filters-types';
import {
  categoriesMegaMenuService,
  type MegaMenuCategoryNode,
} from '@/lib/services/categories-mega-menu.service';

function mapMegaNodeToFilterOption(node: MegaMenuCategoryNode): CategoryFilterOption {
  return {
    slug: node.slug,
    title: node.title,
    count: node.productCount,
    children: node.children.map(mapMegaNodeToFilterOption),
  };
}

/** Fast PLP sidebar shell — category tree + brand labels from shared navigation caches. */
export async function getShopFiltersInstantShell(lang: string): Promise<ProductsFiltersShellData> {
  const [categoryRoots, brands] = await Promise.all([
    categoriesMegaMenuService.getShopFilterCategoryTree(lang),
    getShopFilterBrandLabelsCached(lang),
  ]);

  return {
    categories: categoryRoots.map(mapMegaNodeToFilterOption),
    brands,
    priceRange: { min: 0, max: 0, stepSize: null, stepSizePerCurrency: null },
  };
}
