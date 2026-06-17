import { db } from "@white-shop/db";
import { Prisma } from "@white-shop/db/prisma";
import { unstable_cache } from "next/cache";
import { adminSettingsService } from "./admin/admin-settings.service";
import { buildWhereClause } from "./products-find-query/query-builder";
import { ProductWithRelations } from "./products-find-query.service";
import type { TechnicalSpecFilters } from "./products-find-query/types";
import {
  hasTechnicalSpecFilters,
  isReservedShopAttributeFilterKey,
  normalizeTechnicalFilterToken,
  productMatchesTechnicalSpecs,
  type TechnicalSpecFacet,
} from "./products-technical-filters";
import { getAttributeBucket, isColorAttributeKey, isSizeAttributeKey } from "@/lib/attribute-keys";
import {
  buildShopCategoryFilterTree,
  resolveVisibleCategoryParentId,
} from "@/lib/shop-category-filter-tree";
import {
  PRODUCT_FILTERS_SAMPLE_PRODUCT_LIMIT,
  PRODUCT_FILTERS_VARIANTS_PER_PRODUCT_LIMIT,
} from "@/lib/constants/product-filters-query-limits";
import { isShopFilterCategoryExcludedFromTranslations } from "@/lib/constants/shop-filter-excluded-categories";
import { buildShopFilterCategoriesFromCountMap } from "./products-filters-category-tree";
import {
  expandCategoryIdsWithAncestors,
  loadCategoryParentMap,
} from "./category-ancestors.service";
import { aggregateBrandFacetsFromWhere, getPublishedVariantPriceBounds } from "./products-filters-sql-facets";
import { buildShopFiltersCoreViaSql, buildShopFiltersExtendedViaSql } from "./products-filters-sql-path";
import type {
  ProductsFiltersCoreData,
  ProductsFiltersExtendedData,
} from "@/lib/shop-products-filters-types";
import { buildShopFiltersViaSqlAggregation } from "./products-filters-sql-path";
import { getListingDiscountSettings, type ListingDiscountSettings } from "./listing-discount-settings";
import { resolveCategoryTranslation } from "@/lib/i18n/category-translation";

function buildPreferredLocales(lang: string): string[] {
  const normalized = lang.trim().toLowerCase();
  return normalized === "en" ? ["en"] : [normalized, "en"];
}

const getPriceFilterSettingsCached = unstable_cache(
  async () => adminSettingsService.getPriceFilterSettings(),
  ["products-filters-price-settings-v1"],
  { revalidate: 300, tags: ["price-filter-settings"] },
);

function humanizeAttributeKeyTitle(key: string): string {
  const k = key.trim();
  if (!k) {
    return "";
  }
  return k
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

type ExtraAttributeFacetAgg = {
  key: string;
  label: string;
  labelFromDb: boolean;
  type: string;
  values: Map<string, { value: string; label: string; count: number }>;
};

class ProductsFiltersService {
  private resolveAppliedListingDiscount(
    product: {
      discountPercent?: number | null;
      primaryCategoryId?: string | null;
      brandId?: string | null;
    },
    discountSettings: ListingDiscountSettings,
  ): number {
    const productDiscount = Number(product.discountPercent) || 0;
    if (productDiscount > 0) {
      return productDiscount;
    }
    if (product.primaryCategoryId && discountSettings.categoryDiscounts[product.primaryCategoryId]) {
      return discountSettings.categoryDiscounts[product.primaryCategoryId];
    }
    if (product.brandId && discountSettings.brandDiscounts[product.brandId]) {
      return discountSettings.brandDiscounts[product.brandId];
    }
    return discountSettings.globalDiscount > 0 ? discountSettings.globalDiscount : 0;
  }

  private applyListingDiscount(price: number, discountPercent: number): number {
    if (!Number.isFinite(price) || price <= 0 || discountPercent <= 0) {
      return Number.isFinite(price) ? price : 0;
    }
    return price * (1 - discountPercent / 100);
  }

  private getLocalizedAttributeValueLabel(
    attributeValue: {
      value?: string | null;
      translations?: Array<{ locale?: string | null; label?: string | null }>;
    } | null | undefined,
    lang: string,
  ): string {
    if (!attributeValue) {
      return "";
    }

    const translation =
      attributeValue.translations?.find((t) => t.locale === lang) ??
      attributeValue.translations?.find((t) => Boolean(t?.label)) ??
      null;

    return (translation?.label || attributeValue.value || "").trim();
  }

  private getLocalizedAttributeName(
    attribute:
      | {
          translations?: Array<{ locale: string; name: string }> | null;
          key?: string | null;
          filterable?: boolean | null;
        }
      | null
      | undefined,
    lang: string,
    fallbackKey: string,
  ): string {
    const trList = attribute?.translations;
    if (trList && trList.length > 0) {
      const tr =
        trList.find((t) => t.locale === lang) ??
        trList.find((t) => Boolean(t?.name?.trim())) ??
        trList[0];
      const name = tr?.name?.trim();
      if (name) {
        return name;
      }
    }
    return humanizeAttributeKeyTitle(fallbackKey);
  }

  private upsertExtraAttributeFacet(
    facetByKey: Map<string, ExtraAttributeFacetAgg>,
    keyNorm: string,
    sectionLabel: string,
    sectionLabelFromDb: boolean,
    attrType: string,
    displayLabel: string,
  ): void {
    const trimmed = displayLabel.trim();
    if (!trimmed || !keyNorm) {
      return;
    }
    const token = normalizeTechnicalFilterToken(trimmed);
    if (!token) {
      return;
    }

    let facet = facetByKey.get(keyNorm);
    if (!facet) {
      facet = {
        key: keyNorm,
        label: sectionLabel,
        labelFromDb: sectionLabelFromDb,
        type: attrType,
        values: new Map(),
      };
      facetByKey.set(keyNorm, facet);
    } else if (sectionLabelFromDb && !facet.labelFromDb) {
      facet.label = sectionLabel;
      facet.labelFromDb = true;
      facet.type = attrType;
    }

    const existingVal = facet.values.get(token);
    if (existingVal) {
      existingVal.count += 1;
      if (trimmed.length > existingVal.label.length) {
        existingVal.label = trimmed;
      }
    } else {
      facet.values.set(token, { value: token, label: trimmed, count: 1 });
    }
  }

  private collectExtraFacetsFromVariantJson(
    attrs: Record<string, unknown> | null | undefined,
    facetByKey: Map<string, ExtraAttributeFacetAgg>,
  ): void {
    if (!attrs || typeof attrs !== "object") {
      return;
    }
    for (const [rawKey, rawVal] of Object.entries(attrs)) {
      const keyNorm = normalizeTechnicalFilterToken(rawKey);
      if (!keyNorm || isReservedShopAttributeFilterKey(keyNorm)) {
        continue;
      }
      const title = humanizeAttributeKeyTitle(rawKey);
      const entries = Array.isArray(rawVal) ? rawVal : rawVal != null ? [rawVal] : [];
      for (const entry of entries) {
        let displayLabel = "";
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const o = entry as { label?: unknown; value?: unknown };
          const fromLabel = typeof o.label === "string" ? o.label.trim() : "";
          const fromValue = typeof o.value === "string" ? o.value.trim() : "";
          displayLabel = (fromLabel || fromValue).trim();
        } else if (entry != null) {
          displayLabel = String(entry).trim();
        }
        if (!displayLabel) {
          continue;
        }
        this.upsertExtraAttributeFacet(facetByKey, keyNorm, title, false, "select", displayLabel);
      }
    }
  }

  private upsertColorFacet(
    colorMap: Map<
      string,
      { count: number; label: string; imageUrl?: string | null; colors?: string[] | null }
    >,
    input: {
      label: string;
      countIncrement?: number;
      imageUrl?: string | null;
      colors?: string[] | null;
    },
  ) {
    const normalizedLabel = input.label.trim();
    if (!normalizedLabel) {
      return;
    }

    const key = normalizedLabel.toLowerCase();
    const existing = colorMap.get(key);
    const preferredLabel = existing
      ? normalizedLabel[0] === normalizedLabel[0]?.toUpperCase()
        ? normalizedLabel
        : existing.label
      : normalizedLabel;

    colorMap.set(key, {
      count: (existing?.count || 0) + (input.countIncrement ?? 1),
      label: preferredLabel,
      imageUrl: input.imageUrl ?? existing?.imageUrl ?? null,
      colors: input.colors ?? existing?.colors ?? null,
    });
  }

  /**
   * Get available filters (colors and sizes)
   */
  async getFilters(filters: {
    category?: string;
    search?: string;
    filter?: string;
    minPrice?: number;
    maxPrice?: number;
    lang?: string;
    technicalSpecs?: TechnicalSpecFilters;
    includeCategories?: boolean;
    categoriesOnly?: boolean;
  }) {
    try {
      const preferredLocales = buildPreferredLocales(filters.lang || "en");
      const lang = filters.lang || "en";
      const includeCategories = filters.includeCategories !== false;
      const categoriesOnly = filters.categoriesOnly === true;
      const discountSettings = await getListingDiscountSettings();
      const { where: listingWhere } = await buildWhereClause({
        category: filters.category?.trim(),
        search: filters.search?.trim(),
        filter: filters.filter?.trim(),
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        lang: filters.lang || "en",
      });
      if (listingWhere === null) {
        return {
          colors: [],
          sizes: [],
          brands: [],
          categories: [],
          attributeFacets: [] as TechnicalSpecFacet[],
          priceRange: { min: 0, max: 0, stepSize: null, stepSizePerCurrency: null },
        };
      }

      const where: Prisma.ProductWhereInput = listingWhere;

      if (categoriesOnly && includeCategories) {
        const categoryRows = await db.category.findMany({
          where: {
            published: true,
            deletedAt: null,
            products: { some: where },
          },
          include: { translations: true },
          orderBy: { position: "asc" },
        });

        const categoryCounts = new Map<string, number>();
        for (const cat of categoryRows) {
          categoryCounts.set(cat.id, 1);
        }

        const rowsById = new Map<
          string,
          { id: string; parentId: string | null; position: number; slug: string; title: string; count: number }
        >();
        const skippedParentById = new Map<string, string | null>();
        const rootRows: Array<{ id: string; parentId: string | null }> = [];

        for (const cat of categoryRows) {
          if (
            isShopFilterCategoryExcludedFromTranslations(
              cat.translations.map((t) => ({ slug: t.slug, title: t.title })),
            )
          ) {
            continue;
          }
          const tr = resolveCategoryTranslation(cat.translations, lang);
          if (!tr) {
            continue;
          }
          const row = {
            id: cat.id,
            parentId: cat.parentId,
            position: cat.position,
            slug: tr.slug,
            title: tr.title,
            count: categoryCounts.get(cat.id) || 1,
          };
          rowsById.set(cat.id, row);
          rootRows.push({ id: cat.id, parentId: cat.parentId });
        }

        let frontier = new Set(
          rootRows.map((r) => r.parentId).filter((pid): pid is string => Boolean(pid)),
        );
        let guard = 0;
        while (frontier.size > 0 && guard < 40) {
          guard += 1;
          const toFetch = [...frontier].filter((id) => !rowsById.has(id));
          frontier = new Set();
          if (toFetch.length === 0) {
            break;
          }
          const parents = await db.category.findMany({
            where: {
              id: { in: toFetch },
              published: true,
              deletedAt: null,
            },
            include: { translations: true },
            orderBy: { position: "asc" },
          });
          for (const cat of parents) {
            if (
              isShopFilterCategoryExcludedFromTranslations(
                cat.translations.map((t) => ({ slug: t.slug, title: t.title })),
              )
            ) {
              skippedParentById.set(cat.id, cat.parentId ?? null);
              if (cat.parentId) {
                frontier.add(cat.parentId);
              }
              continue;
            }
            const tr = resolveCategoryTranslation(cat.translations, lang);
            if (!tr) {
              skippedParentById.set(cat.id, cat.parentId ?? null);
              if (cat.parentId) {
                frontier.add(cat.parentId);
              }
              continue;
            }
            if (!rowsById.has(cat.id)) {
              rowsById.set(cat.id, {
                id: cat.id,
                parentId: cat.parentId,
                position: cat.position,
                slug: tr.slug,
                title: tr.title,
                count: categoryCounts.get(cat.id) || 0,
              });
            }
            if (cat.parentId && !rowsById.has(cat.parentId)) {
              frontier.add(cat.parentId);
            }
          }
        }

        const visibleIds = new Set(rowsById.keys());
        const allRows = Array.from(rowsById.values());
        const treeRows = allRows.map((r) => ({
          id: r.id,
          parentId: resolveVisibleCategoryParentId(r.parentId, visibleIds, skippedParentById),
          position: r.position,
          slug: r.slug,
          title: r.title,
        }));
        const counts = new Map(allRows.map((r) => [r.id, r.count] as const));
        const categories = buildShopCategoryFilterTree(treeRows, counts, new Set<string>());

        return {
          colors: [],
          sizes: [],
          brands: [],
          categories,
          attributeFacets: [] as TechnicalSpecFacet[],
          priceRange: { min: 0, max: 0, stepSize: null, stepSizePerCurrency: null },
        };
      }

      const needsInMemoryPostFilter = hasTechnicalSpecFilters(filters.technicalSpecs);

      if (!needsInMemoryPostFilter) {
        return buildShopFiltersViaSqlAggregation({
          where,
          filters,
          lang,
          preferredLocales,
          includeCategories,
        });
      }

      const needsInMemoryPriceBounds = needsInMemoryPostFilter;
      const collectBrandsInMemory = needsInMemoryPostFilter;

      const facetProductSelect = {
        id: true,
        brandId: true,
        primaryCategoryId: true,
        categoryIds: true,
        discountPercent: true,
        brand: collectBrandsInMemory
          ? {
              select: {
                id: true,
                slug: true,
                translations: {
                  where: { locale: { in: preferredLocales } },
                  select: { locale: true, name: true },
                },
              },
            }
          : false,
        variants: {
          where: {
            published: true,
          },
          take: PRODUCT_FILTERS_VARIANTS_PER_PRODUCT_LIMIT,
          select: {
            price: true,
            attributes: true,
            options: {
              select: {
                attributeKey: true,
                value: true,
                attributeValue: {
                  select: {
                    value: true,
                    imageUrl: true,
                    colors: true,
                    attribute: {
                      select: { key: true, type: true, filterable: true },
                    },
                    translations: {
                      where: { locale: { in: preferredLocales } },
                      select: { locale: true, label: true },
                    },
                  },
                },
              },
            },
          },
        },
      } as const;

      let products: ProductWithRelations[] = [];
      let catalogPriceBounds = { min: 0, max: 0 };
      try {
        const [priceBounds, productRows] = await Promise.all([
          getPublishedVariantPriceBounds(where),
          db.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: PRODUCT_FILTERS_SAMPLE_PRODUCT_LIMIT,
            select: facetProductSelect,
          }),
        ]);
        catalogPriceBounds = priceBounds;
        products = productRows as unknown as ProductWithRelations[];
      } catch (dbError) {
        console.error('âŒ [PRODUCTS FILTERS SERVICE] Error fetching products in getFilters:', dbError);
        throw dbError;
      }

      // Ensure products is an array
      if (!products || !Array.isArray(products)) {
        products = [];
      }

    // Filter by price in memory
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice || 0;
      const max = filters.maxPrice || Infinity;
      products = products.filter((product: ProductWithRelations) => {
        if (!product || !product.variants || !Array.isArray(product.variants)) {
          return false;
        }
        const typedProduct = product as ProductWithRelations & {
          discountPercent?: number | null;
          primaryCategoryId?: string | null;
          brandId?: string | null;
        };
        const appliedDiscount = this.resolveAppliedListingDiscount(typedProduct, discountSettings);
        const prices = product.variants
          .map((v: { price?: number }) => v?.price)
          .filter((p: number | undefined): p is number => p !== undefined)
          .map((p) => this.applyListingDiscount(p, appliedDiscount));
        if (prices.length === 0) return false;
        const minPrice = Math.min(...prices);
        return minPrice >= min && minPrice <= max;
      });
    }

    const technicalSpecs = filters.technicalSpecs;
    if (hasTechnicalSpecFilters(technicalSpecs)) {
      products = products.filter((product: ProductWithRelations) =>
        productMatchesTechnicalSpecs(product, technicalSpecs),
      );
    }

    // Collect colors and sizes from variants
    // Use Map with lowercase key to merge colors with different cases
    // Store both count, canonical label, imageUrl and colors hex
    const colorMap = new Map<string, { 
      count: number; 
      label: string; 
      imageUrl?: string | null; 
      colors?: string[] | null;
    }>();
    const sizeMap = new Map<string, number>();
    const extraAttributeFacetByKey = new Map<string, ExtraAttributeFacetAgg>();
    const brandMap = new Map<string, { id: string; slug: string; name: string; count: number }>();
    const categoryCountMap = includeCategories ? new Map<string, number>() : null;
    const categoryParentMap = includeCategories ? await loadCategoryParentMap() : null;
    let rangeMin = Infinity;
    let rangeMax = 0;

    products.forEach((product: ProductWithRelations & { brand?: { id: string; translations?: Array<{ locale: string; name?: string }>; name?: string } | null }) => {
      if (!product || !product.variants || !Array.isArray(product.variants)) {
        return;
      }
      const catProduct = product as ProductWithRelations & {
        primaryCategoryId?: string | null;
        categoryIds?: string[];
      };
      if (includeCategories && categoryCountMap) {
        const directIds = new Set<string>();
        if (catProduct.primaryCategoryId) {
          directIds.add(catProduct.primaryCategoryId);
        }
        (catProduct.categoryIds || []).forEach((id) => {
          directIds.add(id);
        });
        const categoryIdsForProduct = categoryParentMap
          ? expandCategoryIdsWithAncestors(directIds, categoryParentMap)
          : directIds;
        categoryIdsForProduct.forEach((id) => {
          categoryCountMap.set(id, (categoryCountMap.get(id) || 0) + 1);
        });
      }
      if (collectBrandsInMemory && product.brand?.id) {
        const b = product.brand as {
          id: string;
          slug?: string;
          translations?: Array<{ locale: string; name: string }>;
        };
        const tr =
          b.translations?.find((t) => t.locale === lang) ?? b.translations?.[0];
        const name = (tr?.name?.trim() || b.slug || '').trim();
        if (name) {
          const existing = brandMap.get(product.brand.id);
          brandMap.set(product.brand.id, {
            id: product.brand.id,
            slug: b.slug || "",
            name,
            count: (existing?.count || 0) + 1,
          });
        }
      }
      const typedProduct = product as ProductWithRelations & {
        discountPercent?: number | null;
        primaryCategoryId?: string | null;
        brandId?: string | null;
      };
      const appliedDiscount = this.resolveAppliedListingDiscount(typedProduct, discountSettings);
      if (needsInMemoryPriceBounds) {
        product.variants.forEach((v: { price?: number }) => {
          if (typeof v?.price === 'number') {
            const effectivePrice = this.applyListingDiscount(v.price, appliedDiscount);
            if (effectivePrice < rangeMin) rangeMin = effectivePrice;
            if (effectivePrice > rangeMax) rangeMax = effectivePrice;
          }
        });
      }
      product.variants.forEach((variant: any) => {
        if (!variant || !variant.options || !Array.isArray(variant.options)) {
          return;
        }
        variant.options.forEach((option: any) => {
          if (!option) return;
          
          // Check if it's a color option (support multiple formats)
          const isColor = isColorAttributeKey(option.attributeKey) ||
                         isColorAttributeKey(option.key) ||
                         isColorAttributeKey(option.attribute) ||
                         (option.attributeValue && isColorAttributeKey(option.attributeValue.attribute?.key));
          
          if (isColor) {
            let colorValue = "";
            let imageUrl: string | null | undefined = null;
            let colorsHex: string[] | null | undefined = null;

            if (option.attributeValue) {
              colorValue = this.getLocalizedAttributeValueLabel(option.attributeValue, lang);
              imageUrl = option.attributeValue.imageUrl || null;
              colorsHex = option.attributeValue.colors || null;
            } else if (option.value) {
              colorValue = option.value.trim();
            } else if (option.key === "color" || option.attribute === "color") {
              colorValue = (option.value || option.label || "").trim();
            }

            if (colorValue) {
              this.upsertColorFacet(colorMap, {
                label: colorValue,
                imageUrl,
                colors: colorsHex,
              });
            }
          } else {
            // Check if it's a size option (support multiple formats)
            const isSize = isSizeAttributeKey(option.attributeKey) ||
                          isSizeAttributeKey(option.key) ||
                          isSizeAttributeKey(option.attribute) ||
                          (option.attributeValue && isSizeAttributeKey(option.attributeValue.attribute?.key));
            
            if (isSize) {
              let sizeValue = "";
              
              // New format: Use AttributeValue if available
              if (option.attributeValue) {
                const translation = option.attributeValue.translations?.find((t: { locale: string }) => t.locale === lang) || option.attributeValue.translations?.[0];
                sizeValue = translation?.label || option.attributeValue.value || "";
              } else if (option.value) {
                // Old format: use value directly
                sizeValue = option.value.trim();
              } else if (option.key === "size" || option.attribute === "size") {
                // Fallback: try to get from option itself
                sizeValue = option.value || option.label || "";
              }
              
              if (sizeValue) {
                const normalizedSize = sizeValue.trim().toUpperCase();
                sizeMap.set(normalizedSize, (sizeMap.get(normalizedSize) || 0) + 1);
              }
            } else {
              const attrEntity = option.attributeValue?.attribute as
                | {
                    key?: string | null;
                    type?: string | null;
                    filterable?: boolean | null;
                    translations?: Array<{ locale: string; name: string }> | null;
                  }
                | null
                | undefined;

              if (attrEntity && attrEntity.filterable === false) {
                return;
              }

              const attrKeyRaw =
                (typeof attrEntity?.key === "string" && attrEntity.key.trim()
                  ? attrEntity.key
                  : null) ??
                (typeof option.attributeKey === "string" ? option.attributeKey : null) ??
                (typeof option.key === "string" ? option.key : null) ??
                (typeof option.attribute === "string" ? option.attribute : null);

              if (!attrKeyRaw || typeof attrKeyRaw !== "string") {
                return;
              }

              const keyNorm = normalizeTechnicalFilterToken(attrKeyRaw);
              if (!keyNorm || isReservedShopAttributeFilterKey(keyNorm)) {
                return;
              }

              let displayLabel = "";
              if (option.attributeValue) {
                displayLabel = this.getLocalizedAttributeValueLabel(option.attributeValue, lang);
              } else {
                displayLabel = String(option.value || option.label || "").trim();
              }
              if (!displayLabel) {
                return;
              }

              const sectionLabel = this.getLocalizedAttributeName(attrEntity, lang, attrKeyRaw);
              const attrType = typeof attrEntity?.type === "string" ? attrEntity.type : "select";
              const labelFromDb = Boolean(attrEntity?.translations && attrEntity.translations.length > 0);
              this.upsertExtraAttributeFacet(
                extraAttributeFacetByKey,
                keyNorm,
                sectionLabel,
                labelFromDb,
                attrType,
                displayLabel,
              );
            }
          }
        });

        const attributeColors = getAttributeBucket(
          variant.attributes && typeof variant.attributes === "object"
            ? (variant.attributes as Record<string, unknown>)
            : null,
          'color'
        );

        attributeColors.forEach((entry: any) => {
          const colorLabel = String(entry?.label || entry?.value || "").trim();
          if (!colorLabel) {
            return;
          }

          this.upsertColorFacet(colorMap, {
            label: colorLabel,
            imageUrl: typeof entry?.imageUrl === "string" ? entry.imageUrl : null,
            colors: Array.isArray(entry?.colors)
              ? entry.colors.filter((color: unknown): color is string => typeof color === "string")
              : null,
          });
        });

        const attributeSizes = getAttributeBucket(
          variant.attributes && typeof variant.attributes === "object"
            ? (variant.attributes as Record<string, unknown>)
            : null,
          'size'
        );

        attributeSizes.forEach((entry: any) => {
          const sizeValue = String(entry?.label || entry?.value || "").trim();
          if (!sizeValue) {
            return;
          }

          const normalizedSize = sizeValue.toUpperCase();
          sizeMap.set(normalizedSize, (sizeMap.get(normalizedSize) || 0) + 1);
        });

        this.collectExtraFacetsFromVariantJson(
          variant.attributes && typeof variant.attributes === "object"
            ? (variant.attributes as Record<string, unknown>)
            : null,
          extraAttributeFacetByKey,
        );
      });
      
    });

    const categories = await buildShopFilterCategoriesFromCountMap(
      includeCategories && categoryCountMap ? categoryCountMap : null,
      lang,
    );

    // Convert maps to arrays
    const colors: Array<{ value: string; label: string; count: number; imageUrl?: string | null; colors?: string[] | null }> = Array.from(
      colorMap.entries()
    ).map(([key, data]) => ({
      value: key, // lowercase for filtering
      label: data.label, // canonical label (prefer capitalized)
      count: data.count, // merged count
      imageUrl: data.imageUrl || null,
      colors: data.colors || null,
    }));

    const sizes: Array<{ value: string; count: number }> = Array.from(
      sizeMap.entries()
    ).map(([value, count]: [string, number]) => ({
      value,
      count,
    }));

    // Sort sizes by predefined order
    const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    sizes.sort((a: { value: string }, b: { value: string }) => {
      const aIndex = SIZE_ORDER.indexOf(a.value);
      const bIndex = SIZE_ORDER.indexOf(b.value);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.value.localeCompare(b.value);
    });

      // Sort colors alphabetically
      colors.sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));

      const brands = collectBrandsInMemory
        ? Array.from(brandMap.values())
            .filter((b) => b.count > 0)
            .sort((a, b) => a.name.localeCompare(b.name))
        : await aggregateBrandFacetsFromWhere(where, lang, preferredLocales);
      const rawMin = needsInMemoryPriceBounds
        ? (rangeMin === Infinity ? 0 : rangeMin)
        : catalogPriceBounds.min;
      const rawMax = needsInMemoryPriceBounds ? rangeMax : catalogPriceBounds.max;
      const priceMin = rawMin <= 0 ? 0 : Math.floor(rawMin / 1000) * 1000;
      const priceMax = rawMax <= 0 ? 0 : Math.ceil(rawMax / 1000) * 1000;
      let stepSize: number | null = null;
      let stepSizePerCurrency: Record<string, number> | null = null;
      try {
        const settings = await getPriceFilterSettingsCached();
        stepSize = settings.stepSize ?? null;
        if (settings.stepSizePerCurrency) {
          stepSizePerCurrency = {
            USD: settings.stepSizePerCurrency.USD ?? undefined,
            AMD: settings.stepSizePerCurrency.AMD ?? undefined,
            RUB: settings.stepSizePerCurrency.RUB ?? undefined,
            GEL: settings.stepSizePerCurrency.GEL ?? undefined,
          } as Record<string, number>;
        }
      } catch {
        // use defaults
      }

      const attributeFacets: TechnicalSpecFacet[] = Array.from(extraAttributeFacetByKey.values())
        .map((facet) => ({
          key: facet.key,
          label: facet.label,
          type: facet.type,
          values: Array.from(facet.values.values()).sort((a, b) => a.label.localeCompare(b.label)),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      return {
        colors,
        sizes,
        brands,
        categories,
        attributeFacets,
        priceRange: { min: priceMin, max: priceMax, stepSize, stepSizePerCurrency },
      };
    } catch (error) {
      console.error('âŒ [PRODUCTS FILTERS SERVICE] Error in getFilters:', error);
      return {
        colors: [],
        sizes: [],
        brands: [],
        categories: [],
        attributeFacets: [] as TechnicalSpecFacet[],
        priceRange: { min: 0, max: 0, stepSize: null, stepSizePerCurrency: null },
      };
    }
  }


  /**
   * Get price range
   */
  async getPriceRange(filters: { category?: string; lang?: string }) {
    const { where } = await buildWhereClause({
      category: filters.category?.trim(),
      lang: filters.lang || "en",
    });

    if (where === null) {
      return {
        min: 0,
        max: 0,
        stepSize: null,
        stepSizePerCurrency: null,
      };
    }

    const bounds = await getPublishedVariantPriceBounds(where);
    let minPrice = bounds.min;
    let maxPrice = bounds.max;

    minPrice = minPrice <= 0 ? 0 : Math.floor(minPrice / 1000) * 1000;
    // No products / no prices: keep 0 â€” UI must not show a fake cap (e.g. 100000) that mismatches real catalog
    maxPrice = maxPrice === 0 ? 0 : Math.ceil(maxPrice / 1000) * 1000;

    // Load price filter settings to provide optional step sizes per currency
    let stepSize: number | null = null;
    let stepSizePerCurrency: {
      USD?: number;
      AMD?: number;
      RUB?: number;
      GEL?: number;
    } | null = null;

    try {
      const settings = await getPriceFilterSettingsCached();
      stepSize = settings.stepSize ?? null;

      if (settings.stepSizePerCurrency) {
        // stepSizePerCurrency in settings is stored in display currency units.
        // Here we pass them through to the frontend as-is; the slider logic
        // will choose the appropriate value for the active currency.
        stepSizePerCurrency = {
          USD: settings.stepSizePerCurrency.USD ?? undefined,
          AMD: settings.stepSizePerCurrency.AMD ?? undefined,
          RUB: settings.stepSizePerCurrency.RUB ?? undefined,
          GEL: settings.stepSizePerCurrency.GEL ?? undefined,
        };
      }
    } catch (error) {
      console.error('âŒ [PRODUCTS FILTERS SERVICE] Error loading price filter settings for price range:', error);
    }

    return {
      min: minPrice,
      max: maxPrice,
      stepSize,
      stepSizePerCurrency,
    };
  }

  async getFiltersExtended(filters: {
    category?: string;
    search?: string;
    filter?: string;
    minPrice?: number;
    maxPrice?: number;
    lang?: string;
    technicalSpecs?: TechnicalSpecFilters;
  }): Promise<ProductsFiltersExtendedData> {
    const preferredLocales = buildPreferredLocales(filters.lang || "en");
    const lang = filters.lang || "en";
    const { where: listingWhere } = await buildWhereClause({
      category: filters.category?.trim(),
      search: filters.search?.trim(),
      filter: filters.filter?.trim(),
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      lang,
    });
    if (listingWhere === null) {
      return { colors: [], sizes: [], attributeFacets: [] };
    }

    if (hasTechnicalSpecFilters(filters.technicalSpecs)) {
      const full = await this.getFilters({ ...filters, categoriesOnly: false });
      return {
        colors: full.colors,
        sizes: full.sizes,
        attributeFacets: full.attributeFacets,
      };
    }

    return buildShopFiltersExtendedViaSql({
      where: listingWhere,
      filters,
      lang,
      preferredLocales,
    });
  }

  async getFiltersCoreFast(filters: {
    category?: string;
    search?: string;
    filter?: string;
    minPrice?: number;
    maxPrice?: number;
    lang?: string;
    technicalSpecs?: TechnicalSpecFilters;
    includeCategories?: boolean;
  }): Promise<ProductsFiltersCoreData> {
    const preferredLocales = buildPreferredLocales(filters.lang || "en");
    const lang = filters.lang || "en";
    const includeCategories = filters.includeCategories !== false;
    const { where: listingWhere } = await buildWhereClause({
      category: filters.category?.trim(),
      search: filters.search?.trim(),
      filter: filters.filter?.trim(),
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      lang,
    });
    if (listingWhere === null) {
      return {
        categories: [],
        brands: [],
        priceRange: { min: 0, max: 0, stepSize: null, stepSizePerCurrency: null },
      };
    }

    if (hasTechnicalSpecFilters(filters.technicalSpecs)) {
      const full = await this.getFilters({ ...filters, categoriesOnly: false });
      return {
        categories: full.categories,
        brands: full.brands,
        priceRange: full.priceRange,
      };
    }

    return buildShopFiltersCoreViaSql({
      where: listingWhere,
      filters,
      lang,
      preferredLocales,
      includeCategories,
    });
  }
}

export const productsFiltersService = new ProductsFiltersService();





