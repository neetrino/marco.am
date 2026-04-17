import { db } from "@white-shop/db";
import { Prisma } from "@prisma/client";
import { adminService } from "./admin.service";
import { ProductWithRelations } from "./products-find-query.service";
import type { TechnicalSpecFilters } from "./products-find-query/types";
import {
  productMatchesTechnicalSpecs,
  type TechnicalSpecFacet,
} from "./products-technical-filters";

class ProductsFiltersService {
  private splitCategoryTokens(category?: string): string[] {
    if (!category || typeof category !== "string") {
      return [];
    }
    return category
      .split(",")
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
  }

  private async resolveCategoryIds(category: string, lang: string): Promise<string[]> {
    const categoryTokens = this.splitCategoryTokens(category);
    if (categoryTokens.length === 0) {
      return [];
    }

    const allIds = new Set<string>();
    for (const token of categoryTokens) {
      let categoryDoc = await db.category.findFirst({
        where: {
          id: token,
          published: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!categoryDoc) {
        categoryDoc = await db.category.findFirst({
          where: {
            translations: {
              some: {
                slug: token,
                locale: lang,
              },
            },
            published: true,
            deletedAt: null,
          },
          select: { id: true },
        });
      }

      if (!categoryDoc) {
        categoryDoc = await db.category.findFirst({
          where: {
            translations: {
              some: {
                slug: token,
              },
            },
            published: true,
            deletedAt: null,
          },
          select: { id: true },
        });
      }

      if (!categoryDoc) {
        continue;
      }

      allIds.add(categoryDoc.id);
      const childIds = await this.getAllChildCategoryIds(categoryDoc.id);
      childIds.forEach((childId) => allIds.add(childId));
    }

    return Array.from(allIds);
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

  private normalizeTechnicalSpecFilters(
    technicalSpecs?: TechnicalSpecFilters
  ): TechnicalSpecFilters {
    if (!technicalSpecs) {
      return {};
    }

    const normalized: TechnicalSpecFilters = {};
    for (const [key, values] of Object.entries(technicalSpecs)) {
      const normalizedKey = key.trim().toLowerCase();
      if (!normalizedKey || normalizedKey === "color" || normalizedKey === "size") {
        continue;
      }
      const normalizedValues = Array.isArray(values)
        ? values
            .map((value) => value.trim().toLowerCase())
            .filter((value) => value.length > 0)
        : [];
      if (normalizedValues.length > 0) {
        normalized[normalizedKey] = Array.from(new Set(normalizedValues));
      }
    }
    return normalized;
  }

  private async loadFilterableAttributeMeta(lang: string) {
    const attributes = await db.attribute.findMany({
      where: {
        filterable: true,
        key: {
          notIn: ["color", "size"],
        },
      },
      include: {
        translations: true,
      },
      orderBy: [{ position: "asc" }, { key: "asc" }],
    });

    return new Map(
      attributes.map((attribute) => {
        const localizedName =
          attribute.translations.find((translation) => translation.locale === lang)?.name ??
          attribute.translations[0]?.name ??
          attribute.key;
        return [
          attribute.key.toLowerCase(),
          {
            key: attribute.key.toLowerCase(),
            label: localizedName,
            type: attribute.type || "select",
          },
        ] as const;
      })
    );
  }

  /**
   * Get available filters (colors and sizes)
   */
  async getFilters(filters: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    lang?: string;
    technicalSpecs?: TechnicalSpecFilters;
  }) {
    try {
      const where: Prisma.ProductWhereInput = {
        published: true,
        deletedAt: null,
      };

      // Add search filter
      if (filters.search && filters.search.trim()) {
        where.OR = [
          {
            translations: {
              some: {
                title: {
                  contains: filters.search.trim(),
                  mode: "insensitive",
                },
              },
            },
          },
          {
            translations: {
              some: {
                subtitle: {
                  contains: filters.search.trim(),
                  mode: "insensitive",
                },
              },
            },
          },
          {
            variants: {
              some: {
                sku: {
                  contains: filters.search.trim(),
                  mode: "insensitive",
                },
              },
            },
          },
        ];
      }

      // Add category filter
      if (filters.category) {
        try {
          const allCategoryIds = await this.resolveCategoryIds(
            filters.category,
            filters.lang || "en"
          );
          if (allCategoryIds.length > 0) {
            const categoryConditions = allCategoryIds.flatMap((catId: string) => [
              { primaryCategoryId: catId },
              { categoryIds: { has: catId } },
            ]);

            if (where.OR) {
              where.AND = [
                { OR: where.OR },
                {
                  OR: categoryConditions,
                },
              ];
              delete where.OR;
            } else {
              where.OR = categoryConditions;
            }
          }
        } catch (categoryError) {
          console.error('❌ [PRODUCTS FILTERS SERVICE] Error fetching category:', categoryError);
          // Continue without category filter if there's an error
        }
      }

      // Get products with variants (capped for filter computation)
      const FILTERS_PRODUCTS_LIMIT = 500;
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
                        attribute: true,
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
            categories: {
              where: {
                published: true,
                deletedAt: null,
              },
              include: {
                translations: true,
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

      const lang = filters.lang || "en";
      const normalizedTechnicalSpecs = this.normalizeTechnicalSpecFilters(
        filters.technicalSpecs
      );
      const filterableAttributeMeta = await this.loadFilterableAttributeMeta(lang);

    // Filter by price in memory
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice || 0;
      const max = filters.maxPrice || Infinity;
      products = products.filter((product: ProductWithRelations) => {
        if (!product || !product.variants || !Array.isArray(product.variants)) {
          return false;
        }
        const prices = product.variants.map((v: { price?: number }) => v?.price).filter((p: number | undefined): p is number => p !== undefined);
        if (prices.length === 0) return false;
        const minPrice = Math.min(...prices);
        return minPrice >= min && minPrice <= max;
      });
    }

    if (Object.keys(normalizedTechnicalSpecs).length > 0) {
      products = products.filter((product: ProductWithRelations) =>
        productMatchesTechnicalSpecs(product, normalizedTechnicalSpecs)
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
    const brandMap = new Map<string, { id: string; name: string; count: number }>();
    const categoryMap = new Map<string, { id: string; slug: string; name: string; count: number }>();
    const technicalFacetMap = new Map<
      string,
      {
        key: string;
        label: string;
        type: string;
        values: Map<string, { value: string; label: string; count: number }>;
      }
    >();
    let rangeMin = Infinity;
    let rangeMax = 0;

    type VariantRow = ProductWithRelations["variants"][number];
    type VariantOptionLike = VariantRow["options"][number] & {
      attributeKey?: string | null;
      key?: string | null;
      attribute?: string | null;
      value?: string | null;
      label?: string | null;
    };

    products.forEach((product: ProductWithRelations & { brand?: { id: string; translations?: Array<{ locale: string; name?: string }>; name?: string } | null }) => {
      if (!product || !product.variants || !Array.isArray(product.variants)) {
        return;
      }
      if (product.brand?.id) {
        const name = (product.brand as { translations?: Array<{ locale: string; name?: string }>; name?: string }).translations?.find((t: { locale: string }) => t.locale === lang)?.name || (product.brand as { name?: string }).name || '';
        if (name) {
          const existing = brandMap.get(product.brand.id);
          brandMap.set(product.brand.id, { id: product.brand.id, name, count: (existing?.count || 0) + 1 });
        }
      }
      const productCategories = Array.isArray(product.categories)
        ? product.categories
        : [];
      for (const category of productCategories) {
        if (!category?.id) {
          continue;
        }
        const localizedTranslation =
          category.translations?.find((translation) => translation.locale === lang) ??
          category.translations?.[0];
        const categorySlug = localizedTranslation?.slug?.trim();
        const categoryName = localizedTranslation?.title?.trim();
        if (!categorySlug || !categoryName) {
          continue;
        }
        const existingCategory = categoryMap.get(category.id);
        categoryMap.set(category.id, {
          id: category.id,
          slug: categorySlug,
          name: categoryName,
          count: (existingCategory?.count || 0) + 1,
        });
      }
      product.variants.forEach((v: { price?: number }) => {
        if (typeof v?.price === 'number') {
          if (v.price < rangeMin) rangeMin = v.price;
          if (v.price > rangeMax) rangeMax = v.price;
        }
      });
      product.variants.forEach((variant: VariantRow) => {
        if (!variant || !variant.options || !Array.isArray(variant.options)) {
          return;
        }
        variant.options.forEach((option: VariantOptionLike) => {
          if (!option) return;
          const rawTechnicalKey =
            option.attributeValue?.attribute?.key ||
            option.attributeKey ||
            option.key ||
            option.attribute;
          const technicalKey = rawTechnicalKey?.trim().toLowerCase();
          if (technicalKey && filterableAttributeMeta.has(technicalKey)) {
            const attrMeta = filterableAttributeMeta.get(technicalKey);
            const rawTechnicalLabel =
              option.attributeValue?.translations?.find(
                (translation: { locale: string }) => translation.locale === lang
              )?.label ||
              option.attributeValue?.translations?.[0]?.label ||
              option.attributeValue?.value ||
              option.value ||
              option.label;
            const technicalLabel = rawTechnicalLabel?.trim();
            if (technicalLabel && attrMeta) {
              const normalizedValue = technicalLabel.toLowerCase();
              let facet = technicalFacetMap.get(technicalKey);
              if (!facet) {
                facet = {
                  key: attrMeta.key,
                  label: attrMeta.label,
                  type: attrMeta.type,
                  values: new Map<string, { value: string; label: string; count: number }>(),
                };
                technicalFacetMap.set(technicalKey, facet);
              }
              const existingFacetValue = facet.values.get(normalizedValue);
              facet.values.set(normalizedValue, {
                value: normalizedValue,
                label:
                  existingFacetValue?.label ??
                  technicalLabel,
                count: (existingFacetValue?.count || 0) + 1,
              });
            }
          }
          
          // Check if it's a color option (support multiple formats)
          const isColor = option.attributeKey === "color" || 
                         option.key === "color" ||
                         option.attribute === "color" ||
                         (option.attributeValue && option.attributeValue.attribute?.key === "color");
          
          if (isColor) {
            let colorValue = "";
            let imageUrl: string | null | undefined = null;
            let colorsHex: string[] | null | undefined = null;
            
            // New format: Use AttributeValue if available
            if (option.attributeValue) {
              const translation = option.attributeValue.translations?.find((t: { locale: string }) => t.locale === lang) || option.attributeValue.translations?.[0];
              colorValue = translation?.label || option.attributeValue.value || "";
              imageUrl = option.attributeValue.imageUrl || null;
              const rawColorsHex = option.attributeValue.colors;
              colorsHex =
                Array.isArray(rawColorsHex) &&
                rawColorsHex.every((c): c is string => typeof c === "string")
                  ? rawColorsHex
                  : null;
            } else if (option.value) {
              // Old format: use value directly
              colorValue = option.value.trim();
            } else if (option.key === "color" || option.attribute === "color") {
              // Fallback: try to get from option itself
              colorValue = option.value || option.label || "";
            }
            
            if (colorValue) {
              const colorKey = colorValue.toLowerCase();
              const existing = colorMap.get(colorKey);
              
              // Prefer capitalized version for label (e.g., "Black" over "black")
              // If both exist, keep the one that starts with uppercase
              const preferredLabel = existing 
                ? (colorValue[0] === colorValue[0].toUpperCase() ? colorValue : existing.label)
                : colorValue;
              
              // Prefer imageUrl and colors from AttributeValue if available
              const finalImageUrl = imageUrl || existing?.imageUrl || null;
              const finalColors = colorsHex || existing?.colors || null;
              
              colorMap.set(colorKey, {
                count: (existing?.count || 0) + 1,
                label: preferredLabel,
                imageUrl: finalImageUrl,
                colors: finalColors,
              });
            }
          } else {
            // Check if it's a size option (support multiple formats)
            const isSize = option.attributeKey === "size" || 
                          option.key === "size" ||
                          option.attribute === "size" ||
                          (option.attributeValue && option.attributeValue.attribute?.key === "size");
            
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
            }
          }
        });
      });
      
      // Also check productAttributes for color attribute values with imageUrl and colors
      if (product.productAttributes && Array.isArray(product.productAttributes)) {
        product.productAttributes.forEach((productAttr) => {
          const pa = productAttr as {
            attribute?: {
              key: string;
              values?: Array<{
                translations?: Array<{ locale: string; label?: string }>;
                value?: string;
                imageUrl?: string | null;
                colors?: string[] | null | unknown;
              }>;
            };
          };
          if (pa.attribute?.key === 'color' && pa.attribute?.values) {
            pa.attribute.values.forEach((attrValue) => {
              const translation = attrValue.translations?.find((t: { locale: string }) => t.locale === lang) || attrValue.translations?.[0];
              const colorValue = translation?.label || attrValue.value || "";
              if (colorValue) {
                const colorKey = colorValue.toLowerCase();
                const existing = colorMap.get(colorKey);
                // Update if we have imageUrl or colors hex and they're not already set
                const rawColors = attrValue.colors;
                const normalizedColors =
                  Array.isArray(rawColors) && rawColors.every((c): c is string => typeof c === "string")
                    ? rawColors
                    : null;
                if (attrValue.imageUrl || normalizedColors) {
                  colorMap.set(colorKey, {
                    count: existing?.count || 0,
                    label: existing?.label || colorValue,
                    imageUrl: attrValue.imageUrl || existing?.imageUrl || null,
                    colors: normalizedColors ?? existing?.colors ?? null,
                  });
                }
              }
            });
          }
        });
      }
    });

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

      const brands = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      const categories = Array.from(categoryMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      const technicalSpecs: TechnicalSpecFacet[] = Array.from(
        technicalFacetMap.values()
      )
        .map((facet) => ({
          key: facet.key,
          label: facet.label,
          type: facet.type,
          values: Array.from(facet.values.values()).sort((a, b) =>
            a.label.localeCompare(b.label)
          ),
        }))
        .filter((facet) => facet.values.length > 0)
        .sort((a, b) => a.label.localeCompare(b.label));
      const priceMin = rangeMin === Infinity ? 0 : Math.floor(rangeMin / 1000) * 1000;
      const priceMax = rangeMax === 0 ? 100000 : Math.ceil(rangeMax / 1000) * 1000;
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

      return {
        colors,
        sizes,
        brands,
        categories,
        technicalSpecs,
        priceRange: { min: priceMin, max: priceMax, stepSize, stepSizePerCurrency },
      };
    } catch (error) {
      console.error('❌ [PRODUCTS FILTERS SERVICE] Error in getFilters:', error);
      return {
        colors: [],
        sizes: [],
        brands: [],
        categories: [],
        technicalSpecs: [],
        priceRange: { min: 0, max: 100000, stepSize: null, stepSizePerCurrency: null },
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
      const allCategoryIds = await this.resolveCategoryIds(
        filters.category,
        filters.lang || "en"
      );

      if (allCategoryIds.length > 0) {
        where.OR = allCategoryIds.flatMap((categoryId) => [
          { primaryCategoryId: categoryId },
          { categoryIds: { has: categoryId } },
        ]);
      }
    }

    const products = await db.product.findMany({
      where,
      include: {
        variants: {
          where: {
            published: true,
          },
        },
      },
    });

    let minPrice = Infinity;
    let maxPrice = 0;

    products.forEach((product: { variants: Array<{ price: number }> }) => {
      if (product.variants.length > 0) {
        const prices = product.variants.map((v: { price: number }) => v.price);
        const productMin = Math.min(...prices);
        const productMax = Math.max(...prices);
        if (productMin < minPrice) minPrice = productMin;
        if (productMax > maxPrice) maxPrice = productMax;
      }
    });

    minPrice = minPrice === Infinity ? 0 : Math.floor(minPrice / 1000) * 1000;
    maxPrice = maxPrice === 0 ? 100000 : Math.ceil(maxPrice / 1000) * 1000;

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






