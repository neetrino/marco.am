import { Prisma } from "@white-shop/db/prisma";
import { unstable_cache } from "next/cache";
import { adminSettingsService } from "./admin/admin-settings.service";
import { collectAttributeFacetsFromSampleProducts } from "./products-filters-attribute-facets";
import { loadCategoryParentMap } from "./category-ancestors.service";
import { buildShopFilterCategoriesFromCountMap } from "./products-filters-category-tree";
import type {
  ProductsFiltersCoreData,
  ProductsFiltersExtendedData,
} from "@/lib/shop-products-filters-types";
import {
  aggregateBrandFacetsFromWhere,
  aggregateColorFacetsFromWhere,
  aggregateSizeFacetsFromWhere,
  buildCategoryCountMapFromRows,
  fetchAttributeFacetSample,
  fetchCategoryFacetProductRows,
  fetchShopFacetProductIds,
  getPublishedVariantPriceBounds,
} from "./products-filters-sql-facets";

const getPriceFilterSettingsCached = unstable_cache(
  async () => adminSettingsService.getPriceFilterSettings(),
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

function buildScopeFilters(filters: {
  category?: string;
  search?: string;
  filter?: string;
}) {
  return {
    category: filters.category,
    search: filters.search,
    filter: filters.filter,
  };
}

export async function buildShopFiltersCoreViaSql(args: {
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
}): Promise<ProductsFiltersCoreData> {
  const scopeFilters = buildScopeFilters(args.filters);

  const [catalogPriceBounds, brands, categoryRows, categoryParentMap] = await Promise.all([
    getPublishedVariantPriceBounds(args.where),
    aggregateBrandFacetsFromWhere(args.where, args.lang, args.preferredLocales),
    args.includeCategories
      ? fetchCategoryFacetProductRows(args.where, scopeFilters)
      : Promise.resolve([]),
    args.includeCategories ? loadCategoryParentMap() : Promise.resolve(undefined),
  ]);

  const categoryCountMap = buildCategoryCountMapFromRows(categoryRows, categoryParentMap);
  const categories = await buildShopFilterCategoriesFromCountMap(
    args.includeCategories ? categoryCountMap : null,
    args.lang,
  );
  const { stepSize, stepSizePerCurrency } = await resolvePriceRangeSettings();
  const priceMin =
    catalogPriceBounds.min <= 0 ? 0 : Math.floor(catalogPriceBounds.min / 1000) * 1000;
  const priceMax =
    catalogPriceBounds.max <= 0 ? 0 : Math.ceil(catalogPriceBounds.max / 1000) * 1000;

  return {
    brands,
    categories,
    priceRange: { min: priceMin, max: priceMax, stepSize, stepSizePerCurrency },
  };
}

export async function buildShopFiltersExtendedViaSql(args: {
  where: Prisma.ProductWhereInput;
  filters: {
    category?: string;
    search?: string;
    filter?: string;
    lang?: string;
  };
  lang: string;
  preferredLocales: string[];
}): Promise<ProductsFiltersExtendedData> {
  const scopeFilters = buildScopeFilters(args.filters);
  const facetProductIdsPromise = fetchShopFacetProductIds(args.where, scopeFilters);

  const [colors, sizes, attributeSample] = await Promise.all([
    facetProductIdsPromise.then((productIds) =>
      aggregateColorFacetsFromWhere(args.where, args.lang, scopeFilters, productIds),
    ),
    facetProductIdsPromise.then((productIds) =>
      aggregateSizeFacetsFromWhere(args.where, args.lang, scopeFilters, productIds),
    ),
    fetchAttributeFacetSample(args.where, args.preferredLocales),
  ]);

  return {
    colors,
    sizes,
    attributeFacets: collectAttributeFacetsFromSampleProducts(attributeSample, args.lang),
  };
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
  const [core, extended] = await Promise.all([
    buildShopFiltersCoreViaSql(args),
    buildShopFiltersExtendedViaSql(args),
  ]);

  return {
    ...core,
    ...extended,
  };
}
