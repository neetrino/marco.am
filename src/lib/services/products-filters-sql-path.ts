import { Prisma } from "@white-shop/db/prisma";
import { unstable_cache } from "next/cache";
import { adminService } from "./admin.service";
import { collectAttributeFacetsFromSampleProducts } from "./products-filters-attribute-facets";
import { buildShopFilterCategoriesFromCountMap } from "./products-filters-category-tree";
import {
  aggregateBrandFacetsFromWhere,
  aggregateColorFacetsFromWhere,
  aggregateSizeFacetsFromWhere,
  buildCategoryCountMapFromRows,
  fetchAttributeFacetSample,
  fetchCategoryFacetProductRows,
  getPublishedVariantPriceBounds,
} from "./products-filters-sql-facets";

const getPriceFilterSettingsCached = unstable_cache(
  async () => adminService.getPriceFilterSettings(),
  ["products-filters-price-settings-v1"],
  { revalidate: 300, tags: ["price-filter-settings"] },
);

async function resolvePriceRangeSettings(): Promise<{
  stepSize: number | null;
  stepSizePerCurrency: Record<string, number> | null;
}> {
  try {
    const settings = await getPriceFilterSettingsCached();
    let stepSizePerCurrency: Record<string, number> | null = null;
    if (settings.stepSizePerCurrency) {
      stepSizePerCurrency = {
        USD: settings.stepSizePerCurrency.USD ?? undefined,
        AMD: settings.stepSizePerCurrency.AMD ?? undefined,
        RUB: settings.stepSizePerCurrency.RUB ?? undefined,
        GEL: settings.stepSizePerCurrency.GEL ?? undefined,
      } as Record<string, number>;
    }
    return {
      stepSize: settings.stepSize ?? null,
      stepSizePerCurrency,
    };
  } catch {
    return { stepSize: null, stepSizePerCurrency: null };
  }
}

export async function buildShopFiltersViaSqlAggregation(args: {
  where: Prisma.ProductWhereInput;
  filters: {
    category?: string;
    search?: string;
    filter?: string;
    lang?: string;
  };
  lang: string;
  preferredLocales: string[];
  includeCategories: boolean;
}) {
  const scopeFilters = {
    category: args.filters.category,
    search: args.filters.search,
    filter: args.filters.filter,
  };

  const [
    catalogPriceBounds,
    brands,
    colors,
    sizes,
    categoryRows,
    attributeSample,
  ] = await Promise.all([
    getPublishedVariantPriceBounds(args.where),
    aggregateBrandFacetsFromWhere(args.where, args.lang, args.preferredLocales),
    aggregateColorFacetsFromWhere(args.where, args.lang, scopeFilters),
    aggregateSizeFacetsFromWhere(args.where, args.lang, scopeFilters),
    args.includeCategories
      ? fetchCategoryFacetProductRows(args.where, scopeFilters)
      : Promise.resolve([]),
    fetchAttributeFacetSample(args.where, args.preferredLocales),
  ]);

  const categoryCountMap = buildCategoryCountMapFromRows(categoryRows);
  const categories = await buildShopFilterCategoriesFromCountMap(
    args.includeCategories ? categoryCountMap : null,
    args.lang,
  );
  const attributeFacets = collectAttributeFacetsFromSampleProducts(attributeSample, args.lang);
  const { stepSize, stepSizePerCurrency } = await resolvePriceRangeSettings();
  const priceMin =
    catalogPriceBounds.min <= 0 ? 0 : Math.floor(catalogPriceBounds.min / 1000) * 1000;
  const priceMax =
    catalogPriceBounds.max <= 0 ? 0 : Math.ceil(catalogPriceBounds.max / 1000) * 1000;

  return {
    colors,
    sizes,
    brands,
    categories,
    attributeFacets,
    priceRange: { min: priceMin, max: priceMax, stepSize, stepSizePerCurrency },
  };
}
