import { db } from "@white-shop/db";
import { Prisma } from "@white-shop/db/prisma";
import { adminService } from "./admin.service";
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
  type CategoryFilterTreeNode,
} from "@/lib/shop-category-filter-tree";
import { getListingDiscountSettings, type ListingDiscountSettings } from "./listing-discount-settings";

/** Legacy demo categories — omit from shop sidebar (not part of MARCO nav taxonomy). */
const SHOP_FILTER_EXCLUDED_CATEGORY_CANONICAL = new Set([
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

function canonicalCategoryFilterKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, " and ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

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

  private async getPublishedVariantPriceBounds(
    where: Prisma.ProductWhereInput,
    discountSettings: ListingDiscountSettings,
  ): Promise<{
    min: number;
    max: number;
  }> {
    const products = await db.product.findMany({
      where: {
        ...where,
      },
      select: {
        discountPercent: true,
        primaryCategoryId: true,
        brandId: true,
        variants: {
          where: { published: true },
          select: { price: true },
        },
      },
    });

    let min = Infinity;
    let max = 0;
    for (const product of products) {
      const appliedDiscount = this.resolveAppliedListingDiscount(product, discountSettings);
      for (const variant of product.variants) {
        const effectivePrice = this.applyListingDiscount(variant.price, appliedDiscount);
        if (effectivePrice < min) {
          min = effectivePrice;
        }
        if (effectivePrice > max) {
          max = effectivePrice;
        }
      }
    }

    return {
      min: min === Infinity ? 0 : min,
      max,
    };
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

  /**
   * Match legacy demo categories in any locale — `en` slug may differ from `hy`/`ru` slug on the same row.
   */
  private isShopFilterCategoryExcludedFromTranslations(
    translations: Array<{ slug: string; title: string }>,
  ): boolean {
    for (const tr of translations) {
      const slugKey = canonicalCategoryFilterKey(tr.slug);
      const titleKey = canonicalCategoryFilterKey(tr.title);
      if (
        SHOP_FILTER_EXCLUDED_CATEGORY_CANONICAL.has(slugKey) ||
        SHOP_FILTER_EXCLUDED_CATEGORY_CANONICAL.has(titleKey)
      ) {
        return true;
      }
    }
    return false;
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
   * Get all child category IDs recursively
   */
  private async getAllChildCategoryIds(parentId: string): Promise<string[]> {
    const children = await db.category.findMany({
      where: {
        parentId: parentId,
        published: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    
    let allChildIds = children.map((c: { id: string }) => c.id);
    
    // Recursively get children of children
    for (const child of children) {
      const grandChildren = await this.getAllChildCategoryIds(child.id);
      allChildIds = [...allChildIds, ...grandChildren];
    }
    
    return allChildIds;
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
  }) {
    try {
      const discountSettings = await getListingDiscountSettings();
      const { where: listingWhere } = await buildWhereClause({
        category: filters.category?.trim(),
        search: filters.search?.trim(),
        filter: filters.filter?.trim(),
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

      const catalogPriceBounds = await this.getPublishedVariantPriceBounds(where, discountSettings);

      // Get products with variants (capped for non-price facets computation)
      const FILTERS_PRODUCTS_LIMIT = 1500;
      let products: ProductWithRelations[] = [];
      try {
        products = (await db.product.findMany({
          where,
          take: FILTERS_PRODUCTS_LIMIT,
          include: {
            brand: {
              include: {
                translations: true,
              },
            },
            variants: {
              where: {
                published: true,
              },
              include: {
                options: {
                  include: {
                    attributeValue: {
                      include: {
                        attribute: {
                          include: {
                            translations: true,
                          },
                        },
                        translations: true,
                      },
                    },
                  },
                },
              },
            },
            productAttributes: {
              include: {
                attribute: {
                  include: {
                    values: {
                      include: {
                        translations: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })) as unknown as ProductWithRelations[];
      } catch (dbError) {
        console.error('❌ [PRODUCTS FILTERS SERVICE] Error fetching products in getFilters:', dbError);
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
    const lang = filters.lang || 'en';
    const colorMap = new Map<string, { 
      count: number; 
      label: string; 
      imageUrl?: string | null; 
      colors?: string[] | null;
    }>();
    const sizeMap = new Map<string, number>();
    const extraAttributeFacetByKey = new Map<string, ExtraAttributeFacetAgg>();
    const brandMap = new Map<string, { id: string; slug: string; name: string; count: number }>();
    const categoryCountMap = new Map<string, number>();
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
      const categoryIdsForProduct = new Set<string>();
      if (catProduct.primaryCategoryId) {
        categoryIdsForProduct.add(catProduct.primaryCategoryId);
      }
      (catProduct.categoryIds || []).forEach((id) => {
        categoryIdsForProduct.add(id);
      });
      categoryIdsForProduct.forEach((id) => {
        categoryCountMap.set(id, (categoryCountMap.get(id) || 0) + 1);
      });
      if (product.brand?.id) {
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
      product.variants.forEach((v: { price?: number }) => {
        if (typeof v?.price === 'number') {
          const effectivePrice = this.applyListingDiscount(v.price, appliedDiscount);
          if (effectivePrice < rangeMin) rangeMin = effectivePrice;
          if (effectivePrice > rangeMax) rangeMax = effectivePrice;
        }
      });
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
      
      // Also check productAttributes for color attribute values with imageUrl and colors
      if ((product as any).productAttributes && Array.isArray((product as any).productAttributes)) {
        (product as any).productAttributes.forEach((productAttr: any) => {
          if (isColorAttributeKey(productAttr.attribute?.key) && productAttr.attribute?.values) {
            productAttr.attribute.values.forEach((attrValue: any) => {
              const colorValue = this.getLocalizedAttributeValueLabel(attrValue, lang);
              if (colorValue) {
                this.upsertColorFacet(colorMap, {
                  label: colorValue,
                  countIncrement: 0,
                  imageUrl: attrValue.imageUrl || null,
                  colors: attrValue.colors || null,
                });
              }
            });
          }
        });
      }
    });

    const categoryIdsWithProducts = Array.from(categoryCountMap.keys());
    let categories: CategoryFilterTreeNode[] = [];
    if (categoryIdsWithProducts.length > 0) {
      const categoryRows = await db.category.findMany({
        where: {
          id: { in: categoryIdsWithProducts },
          published: true,
          deletedAt: null,
        },
        include: { translations: true },
        orderBy: { position: "asc" },
      });
      type FilterCategoryRow = {
        id: string;
        parentId: string | null;
        position: number;
        slug: string;
        title: string;
        count: number;
      };

      const facetRows = categoryRows
        .filter(
          (cat) =>
            !this.isShopFilterCategoryExcludedFromTranslations(
              cat.translations.map((t) => ({ slug: t.slug, title: t.title })),
            ),
        )
        .map((cat) => {
          const tr =
            cat.translations.find((t) => t.locale === lang) || cat.translations[0];
          if (!tr) {
            return null;
          }
          const count = categoryCountMap.get(cat.id) || 0;
          if (count === 0) {
            return null;
          }
          return {
            id: cat.id,
            parentId: cat.parentId,
            position: cat.position,
            slug: tr.slug,
            title: tr.title,
            count,
          };
        })
        .filter((c): c is FilterCategoryRow => c !== null);

      const rowsById = new Map<string, FilterCategoryRow>();
      /** Omitted categories (excluded / no translation): map id → next parentId for chain resolution */
      const skippedParentById = new Map<string, string | null>();
      for (const r of facetRows) {
        rowsById.set(r.id, r);
      }

      let frontier = new Set(
        facetRows.map((r) => r.parentId).filter((pid): pid is string => Boolean(pid)),
      );
      let ancestorWalkGuard = 0;

      while (frontier.size > 0 && ancestorWalkGuard < 40) {
        ancestorWalkGuard += 1;
        const toFetch = [...frontier].filter((id) => !rowsById.has(id));
        frontier = new Set();
        if (toFetch.length === 0) {
          break;
        }
        const parentRows = await db.category.findMany({
          where: {
            id: { in: toFetch },
            published: true,
            deletedAt: null,
          },
          include: { translations: true },
          orderBy: { position: "asc" },
        });
        for (const cat of parentRows) {
          if (
            this.isShopFilterCategoryExcludedFromTranslations(
              cat.translations.map((t) => ({ slug: t.slug, title: t.title })),
            )
          ) {
            skippedParentById.set(cat.id, cat.parentId ?? null);
            if (cat.parentId) {
              frontier.add(cat.parentId);
            }
            continue;
          }
          const tr =
            cat.translations.find((t) => t.locale === lang) || cat.translations[0];
          if (!tr) {
            skippedParentById.set(cat.id, cat.parentId ?? null);
            if (cat.parentId) {
              frontier.add(cat.parentId);
            }
            continue;
          }
          const count = categoryCountMap.get(cat.id) || 0;
          rowsById.set(cat.id, {
            id: cat.id,
            parentId: cat.parentId,
            position: cat.position,
            slug: tr.slug,
            title: tr.title,
            count,
          });
          if (cat.parentId && !rowsById.has(cat.parentId)) {
            frontier.add(cat.parentId);
          }
        }
      }

      /** Load published subcategories from DB so every parent with real children gets an expand control (not only facets with products). */
      const enrichedOnlyIds = new Set<string>();
      let prevRowCount = -1;
      let descendantWalkGuard = 0;
      while (rowsById.size !== prevRowCount && descendantWalkGuard < 25) {
        descendantWalkGuard += 1;
        prevRowCount = rowsById.size;
        const parentIds = [...rowsById.keys()];
        if (parentIds.length === 0) {
          break;
        }
        const publishedChildren = await db.category.findMany({
          where: {
            parentId: { in: parentIds },
            published: true,
            deletedAt: null,
          },
          include: { translations: true },
          orderBy: { position: "asc" },
        });
        for (const cat of publishedChildren) {
          if (
            this.isShopFilterCategoryExcludedFromTranslations(
              cat.translations.map((t) => ({ slug: t.slug, title: t.title })),
            )
          ) {
            continue;
          }
          const tr =
            cat.translations.find((t) => t.locale === lang) || cat.translations[0];
          if (!tr) {
            continue;
          }
          if (rowsById.has(cat.id)) {
            continue;
          }
          const count = categoryCountMap.get(cat.id) || 0;
          rowsById.set(cat.id, {
            id: cat.id,
            parentId: cat.parentId,
            position: cat.position,
            slug: tr.slug,
            title: tr.title,
            count,
          });
          enrichedOnlyIds.add(cat.id);
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
      categories = buildShopCategoryFilterTree(treeRows, counts, enrichedOnlyIds);
    }

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

      // Shop sidebar: only brands that appear in the current facet sample (category + search from DB,
      // then price in memory). Omits brands with zero matching products on this PLP scope.
      const brands = Array.from(brandMap.values())
        .filter((b) => b.count > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
      const needsInMemoryPriceBounds =
        Boolean(filters.minPrice || filters.maxPrice) ||
        hasTechnicalSpecFilters(filters.technicalSpecs);
      const rawMin = needsInMemoryPriceBounds
        ? (rangeMin === Infinity ? 0 : rangeMin)
        : catalogPriceBounds.min;
      const rawMax = needsInMemoryPriceBounds ? rangeMax : catalogPriceBounds.max;
      const priceMin = rawMin <= 0 ? 0 : Math.floor(rawMin / 1000) * 1000;
      const priceMax = rawMax <= 0 ? 0 : Math.ceil(rawMax / 1000) * 1000;
      let stepSize: number | null = null;
      let stepSizePerCurrency: Record<string, number> | null = null;
      try {
        const settings = await adminService.getPriceFilterSettings();
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
      console.error('❌ [PRODUCTS FILTERS SERVICE] Error in getFilters:', error);
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
    const where: Prisma.ProductWhereInput = {
      published: true,
      deletedAt: null,
    };

    if (filters.category) {
      const slugs = filters.category
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const perSlugTrees: Prisma.ProductWhereInput[] = [];
      for (const slug of slugs) {
        const categoryDoc = await db.category.findFirst({
          where: {
            translations: {
              some: {
                slug,
                locale: filters.lang || "en",
              },
            },
            published: true,
            deletedAt: null,
          },
        });
        if (!categoryDoc) {
          continue;
        }
        const childCategoryIds = await this.getAllChildCategoryIds(categoryDoc.id);
        const allCategoryIds = [categoryDoc.id, ...childCategoryIds];
        const categoryConditions = allCategoryIds.flatMap((catId: string) => [
          { primaryCategoryId: catId },
          { categoryIds: { has: catId } },
        ]);
        perSlugTrees.push({ OR: categoryConditions });
      }
      if (perSlugTrees.length === 1) {
        where.OR = (perSlugTrees[0] as { OR: Prisma.ProductWhereInput[] }).OR;
      } else if (perSlugTrees.length > 1) {
        where.OR = perSlugTrees;
      }
    }

    const discountSettings = await getListingDiscountSettings();
    const bounds = await this.getPublishedVariantPriceBounds(where, discountSettings);
    let minPrice = bounds.min;
    let maxPrice = bounds.max;

    minPrice = minPrice <= 0 ? 0 : Math.floor(minPrice / 1000) * 1000;
    // No products / no prices: keep 0 — UI must not show a fake cap (e.g. 100000) that mismatches real catalog
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
      const settings = await adminService.getPriceFilterSettings();
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
      console.error('❌ [PRODUCTS FILTERS SERVICE] Error loading price filter settings for price range:', error);
    }

    return {
      min: minPrice,
      max: maxPrice,
      stepSize,
      stepSizePerCurrency,
    };
  }
}

export const productsFiltersService = new ProductsFiltersService();






