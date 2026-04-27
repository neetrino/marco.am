import { db } from "@white-shop/db";
import { Prisma } from "@white-shop/db/prisma";
import { adminService } from "./admin.service";
import { ProductWithRelations } from "./products-find-query.service";
import { getAttributeBucket, isColorAttributeKey, isSizeAttributeKey } from "@/lib/attribute-keys";

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

class ProductsFiltersService {
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
    minPrice?: number;
    maxPrice?: number;
    lang?: string;
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

      // Category filter is omitted so facet counts (including category list) match search scope.

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
        const prices = product.variants.map((v: { price?: number }) => v?.price).filter((p: number | undefined): p is number => p !== undefined);
        if (prices.length === 0) return false;
        const minPrice = Math.min(...prices);
        return minPrice >= min && minPrice <= max;
      });
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
      product.variants.forEach((v: { price?: number }) => {
        if (typeof v?.price === 'number') {
          if (v.price < rangeMin) rangeMin = v.price;
          if (v.price > rangeMax) rangeMax = v.price;
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
    let categories: Array<{ slug: string; title: string; count: number }> = [];
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
      categories = categoryRows
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
          return { slug: tr.slug, title: tr.title, count };
        })
        .filter((c): c is { slug: string; title: string; count: number } => c !== null);
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

      // Shop sidebar: list all published brands from DB, counts from current product facet (not only brands that appear in the capped sample)
      const publishedBrands = await db.brand.findMany({
        where: { published: true, deletedAt: null },
        include: { translations: true },
      });
      const brands = publishedBrands
        .map((row) => {
          const tr =
            row.translations.find((t) => t.locale === lang) ?? row.translations[0];
          const name = (tr?.name?.trim() || row.slug || '').trim();
          if (!name) {
            return null;
          }
          const facet = brandMap.get(row.id);
          return {
            id: row.id,
            slug: row.slug,
            name,
            count: facet?.count ?? 0,
          };
        })
        .filter((b): b is { id: string; slug: string; name: string; count: number } => b !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
      const priceMin = rangeMin === Infinity ? 0 : Math.floor(rangeMin / 1000) * 1000;
      const priceMax = rangeMax === 0 ? 0 : Math.ceil(rangeMax / 1000) * 1000;
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
        priceRange: { min: priceMin, max: priceMax, stepSize, stepSizePerCurrency },
      };
    } catch (error) {
      console.error('❌ [PRODUCTS FILTERS SERVICE] Error in getFilters:', error);
      return {
        colors: [],
        sizes: [],
        brands: [],
        categories: [],
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






