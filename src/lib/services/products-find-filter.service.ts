import type { ProductFilters, ProductWithRelations } from "./products-find-query/types";
import { productMatchesTechnicalSpecs } from "./products-technical-filters";

/**
 * Normalize comma-separated filter values and drop placeholders like "undefined" or "null".
 */
const normalizeFilterList = (
  value?: string,
  transform?: (v: string) => string
): string[] => {
  if (!value || typeof value !== "string") return [];

  const invalidTokens = new Set(["undefined", "null", ""]);
  const items = value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => !invalidTokens.has(v.toLowerCase()));

  if (transform) {
    return items.map(transform);
  }

  return items;
};

const normalizeBrandTokens = (brand?: string): { raw: Set<string>; normalized: Set<string> } => {
  const rawList = normalizeFilterList(brand);
  const normalizedList = normalizeFilterList(brand, (token) => token.toLowerCase());
  return {
    raw: new Set(rawList),
    normalized: new Set(normalizedList),
  };
};

type SupportedSort = "newest" | "popular" | "price-asc" | "price-desc";

function resolveSort(sort?: string): SupportedSort {
  switch (sort) {
    case "price-asc":
      return "price-asc";
    case "price-desc":
    case "price":
      return "price-desc";
    case "popular":
    case "bestseller":
      return "popular";
    case "createdAt":
    case "createdAt-desc":
    case "newest":
    default:
      return "newest";
  }
}

function getMinVariantPrice(product: ProductWithRelations): number {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...variants.map((variant: { price: number }) => variant.price));
}

class ProductsFindFilterService {
  /**
   * Filter products by price, colors, sizes, brand in memory
   */
  filterProducts(
    products: ProductWithRelations[],
    filters: ProductFilters,
    bestsellerProductIds: string[]
  ): ProductWithRelations[] {
    const { minPrice, maxPrice, colors, sizes, brand, technicalSpecs } = filters;

    // Filter by price
    if (minPrice || maxPrice) {
      const min = minPrice || 0;
      const max = maxPrice || Infinity;
      products = products.filter((product: ProductWithRelations) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        if (variants.length === 0) return false;
        const prices = variants.map((v: { price: number }) => v.price).filter((p: number | undefined) => p !== undefined);
        if (prices.length === 0) return false;
        const minPrice = Math.min(...prices);
        return minPrice >= min && minPrice <= max;
      });
    }

    // Filter by brand(s) - support multiple brands (comma-separated)
    const brandTokens = normalizeBrandTokens(brand);
    if (brandTokens.raw.size > 0 || brandTokens.normalized.size > 0) {
      products = products.filter((product: ProductWithRelations) => {
        if (product.brandId && brandTokens.raw.has(product.brandId)) {
          return true;
        }

        const brandTranslations = product.brand?.translations ?? [];
        const brandSlug = product.brand?.slug?.trim().toLowerCase();
        const matchesSlug = brandSlug
          ? brandTokens.normalized.has(brandSlug)
          : false;

        if (matchesSlug) {
          return true;
        }

        const fallbackBrandName = brandTranslations
          .find((translation) => translation.name?.trim())
          ?.name?.trim()
          .toLowerCase();
        if (!fallbackBrandName) {
          return false;
        }
        return brandTokens.normalized.has(fallbackBrandName);
      });
    }

    // Filter by colors and sizes together if both are provided.
    // Skip filtering when only placeholder values (e.g., "undefined") are passed.
    const colorList = normalizeFilterList(colors, (v) => v.toLowerCase());
    const sizeList = normalizeFilterList(sizes, (v) => v.toUpperCase());

    if (colorList.length > 0 || sizeList.length > 0) {
      products = products.filter((product: ProductWithRelations) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        
        if (variants.length === 0) {
          return false;
        }
        
        // Find variants that match ALL specified filters
        type VariantRow = ProductWithRelations["variants"][number];
        /** Prisma option row plus legacy attributeKey/value fields */
        type VariantOptionLike = VariantRow["options"][number] & {
          attributeKey?: string | null;
          key?: string | null;
          attribute?: string | null;
          value?: string | null;
          label?: string | null;
        };

        const matchingVariants = variants.filter((variant: VariantRow) => {
          const options = Array.isArray(variant.options) ? variant.options : [];
          
          if (options.length === 0) {
            return false;
          }
          
          // Helper function to get color value from option (support all formats)
          const getColorValue = (opt: VariantOptionLike, lang: string = 'en'): string | null => {
            // New format: Use AttributeValue if available
            if (opt.attributeValue && opt.attributeValue.attribute?.key === "color") {
              const translation = opt.attributeValue.translations?.find((t: { locale: string }) => t.locale === lang) || opt.attributeValue.translations?.[0];
              return (translation?.label || opt.attributeValue.value || "").trim().toLowerCase();
            }
            // Old format: check attributeKey, key, or attribute
            if (opt.attributeKey === "color" || opt.key === "color" || opt.attribute === "color") {
              return (opt.value || opt.label || "").trim().toLowerCase();
            }
            return null;
          };
          
          // Helper function to get size value from option (support all formats)
          const getSizeValue = (opt: VariantOptionLike, lang: string = 'en'): string | null => {
            // New format: Use AttributeValue if available
            if (opt.attributeValue && opt.attributeValue.attribute?.key === "size") {
              const translation = opt.attributeValue.translations?.find((t: { locale: string }) => t.locale === lang) || opt.attributeValue.translations?.[0];
              return (translation?.label || opt.attributeValue.value || "").trim().toUpperCase();
            }
            // Old format: check attributeKey, key, or attribute
            if (opt.attributeKey === "size" || opt.key === "size" || opt.attribute === "size") {
              return (opt.value || opt.label || "").trim().toUpperCase();
            }
            return null;
          };
          
          // Check color match if colors filter is provided
          if (colorList.length > 0) {
            let colorMatched = false;
            for (const opt of options) {
              const variantColorValue = getColorValue(opt, filters.lang || 'en');
              if (variantColorValue && colorList.includes(variantColorValue)) {
                colorMatched = true;
                break;
              }
            }
            if (!colorMatched) {
              return false;
            }
          }
          
          // Check size match if sizes filter is provided
          if (sizeList.length > 0) {
            let sizeMatched = false;
            for (const opt of options) {
              const variantSizeValue = getSizeValue(opt, filters.lang || 'en');
              if (variantSizeValue && sizeList.includes(variantSizeValue)) {
                sizeMatched = true;
                break;
              }
            }
            if (!sizeMatched) {
              return false;
            }
          }
          
          return true;
        });
        
        const hasMatch = matchingVariants.length > 0;
        return hasMatch;
      });
    }

    if (technicalSpecs && Object.keys(technicalSpecs).length > 0) {
      products = products.filter((product: ProductWithRelations) =>
        productMatchesTechnicalSpecs(product, technicalSpecs)
      );
    }

    // Sort
    const { filter } = filters;
    const sort = resolveSort(filters.sort);
    if (filter === "promotion" || filter === "special_offer") {
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aD = a.discountPercent ?? 0;
        const bD = b.discountPercent ?? 0;
        if (bD !== aD) return bD - aD;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (filter === "bestseller" && bestsellerProductIds.length > 0) {
      const rank = new Map<string, number>();
      bestsellerProductIds.forEach((id, index) => rank.set(id, index));
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aRank = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bRank = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return aRank - bRank;
      });
    } else if (sort === "price-desc" || sort === "price-asc") {
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aPrice = getMinVariantPrice(a);
        const bPrice = getMinVariantPrice(b);
        if (sort === "price-asc") {
          return aPrice - bPrice;
        }
        return bPrice - aPrice;
      });
    } else if (sort === "popular" && bestsellerProductIds.length > 0) {
      const rank = new Map<string, number>();
      bestsellerProductIds.forEach((id, index) => rank.set(id, index));
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aRank = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bRank = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        if (aRank !== bRank) {
          return aRank - bRank;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return products;
  }
}

export const productsFindFilterService = new ProductsFindFilterService();






