import { getAttributeBucket, isColorAttributeKey } from '@/lib/attribute-keys';
import { productRequiresAttributeSelection } from '@/lib/product-requires-attribute-selection';
import {
  normalizeProductWarrantyYears,
  type ProductWarrantyYears,
} from '@/lib/constants/product-warranty';
import { pickVariantForListingPrice } from '@/lib/product-variant-listing-pick';
import { resolveProductPrice } from '@/lib/pricing/product-price';
import { getListingDiscountSettings } from './listing-discount-settings';
import { processImageUrl } from "../utils/image-utils";
import { translations } from "../translations";
import { ProductWithRelations } from "./products-find-query.service";

const WARRANTY_LABEL_PATTERN = /(warranty|guarantee|երաշխ|гарант|garanti)/i;

type ProductListLabel = {
  id: string;
  type: string;
  value: string;
  position: string;
  color: string | null;
};

type WarrantyBadge = {
  years: ProductWarrantyYears;
};

function extractWarrantyYearsFromLabel(labels: ProductListLabel[]): ProductWarrantyYears | null {
  const warrantyLabel = labels.find((label) => WARRANTY_LABEL_PATTERN.test(label.value));
  if (!warrantyLabel) {
    return null;
  }
  const match = warrantyLabel.value.match(/([123])/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[1], 10);
  return normalizeProductWarrantyYears(parsed);
}

function filterListingLabels(labels: ProductListLabel[]): ProductListLabel[] {
  return labels.filter((label) => !WARRANTY_LABEL_PATTERN.test(label.value));
}

function resolveWarrantyBadge(
  warrantyYears: number | null | undefined,
  labels: ProductListLabel[],
): WarrantyBadge | null {
  const fromField = normalizeProductWarrantyYears(warrantyYears);
  if (fromField) {
    return { years: fromField };
  }
  const fromLabel = extractWarrantyYearsFromLabel(labels);
  return fromLabel ? { years: fromLabel } : null;
}

/**
 * Get "Out of Stock" translation for a given language
 */
const getOutOfStockLabel = (lang: string = "en"): string => {
  const langKey = lang as keyof typeof translations;
  const translation = translations[langKey] || translations.en;
  return translation.stock.outOfStock;
};

class ProductsFindTransformService {
  /**
   * Transform products to response format
   */
  async transformProducts(
    products: ProductWithRelations[],
    lang: string = "en"
  ): Promise<unknown[]> {
    const { globalDiscount, categoryDiscounts, brandDiscounts } = await getListingDiscountSettings();

    // Format response
    const data = products.map((product: ProductWithRelations) => {
      // Безопасное получение translation с проверкой на существование массива
      const translations = Array.isArray(product.translations) ? product.translations : [];
      const translation = translations.find((t: { locale: string }) => t.locale === lang) || translations[0] || null;
      
      // Безопасное получение brand translation
      const brandTranslations = product.brand && Array.isArray(product.brand.translations)
        ? product.brand.translations
        : [];
      const brandTranslation = brandTranslations.length > 0
        ? brandTranslations.find((t: { locale: string }) => t.locale === lang) || brandTranslations[0]
        : null;
      
      // Listing / card price: same variant logic as PDP default (not raw min price — avoids 0-priced placeholder SKUs).
      const variants = Array.isArray(product.variants) ? product.variants : [];
      const variant = pickVariantForListingPrice(variants);

      // Get all unique colors from variants with imageUrl + hex colors.
      // Limit scanned variants on PLP to keep filter interactions responsive.
      const colorMap = new Map<string, { value: string; imageUrl?: string | null; colors?: string[] | null }>();
      const variantsForColorScan = variants.slice(0, 10);

      variantsForColorScan.forEach((v) => {
        // First, try to get ALL color options from variant.options (not just the first one)
        const options = Array.isArray(v.options) ? v.options : [];
        const colorOptions = options.filter((opt: ProductWithRelations['variants'][number]['options'][number]) => {
          // Support both new format (AttributeValue) and old format (attributeKey/value)
          if ('attributeValue' in opt && opt.attributeValue) {
            return opt.attributeValue.attribute?.key === "color";
          }
          return opt.attributeKey === "color";
        });
        
        // Process all color options from this variant
        colorOptions.forEach((colorOption: ProductWithRelations['variants'][number]['options'][number]) => {
          let colorValue = "";
          let imageUrl: string | null | undefined = null;
          let colorsHex: string[] | null | undefined = null;
          
          if ('attributeValue' in colorOption && colorOption.attributeValue) {
            // New format: get from translation or value
            const translation = colorOption.attributeValue.translations?.find((t: { locale: string }) => t.locale === lang) || colorOption.attributeValue.translations?.[0];
            colorValue = translation?.label || colorOption.attributeValue.value || "";
            // Get imageUrl and colors from AttributeValue
            imageUrl = colorOption.attributeValue.imageUrl || null;
            const colorsValue = colorOption.attributeValue.colors;
            colorsHex = Array.isArray(colorsValue) && colorsValue.every((c): c is string => typeof c === 'string') ? colorsValue : null;
          } else {
            // Old format: use value directly
            colorValue = colorOption.value || "";
          }
          
          if (colorValue) {
            const normalizedValue = colorValue.trim().toLowerCase();
            // Store color with imageUrl and colors hex if not already stored or if we have better data
            if (!colorMap.has(normalizedValue) || (imageUrl && !colorMap.get(normalizedValue)?.imageUrl)) {
              colorMap.set(normalizedValue, {
                value: colorValue.trim(),
                imageUrl: imageUrl || null,
                colors: colorsHex || null,
              });
            }
          }
        });
        
        // Fallback: check variant.attributes JSONB column if options don't have color
        // This handles cases where colors are stored in JSONB but not in options
        if (colorOptions.length === 0 && v.attributes && typeof v.attributes === 'object' && !Array.isArray(v.attributes)) {
          const colorAttributes = getAttributeBucket(v.attributes as Record<string, unknown>, 'color');
          colorAttributes.forEach((colorAttrItem: unknown) => {
            const colorValue = (colorAttrItem && typeof colorAttrItem === 'object' && 'value' in colorAttrItem) 
              ? (colorAttrItem as { value?: unknown }).value 
              : colorAttrItem;
            if (colorValue && typeof colorValue === 'string') {
              const normalizedValue = colorValue.trim().toLowerCase();
              // Only add if not already in colorMap
              if (!colorMap.has(normalizedValue)) {
                colorMap.set(normalizedValue, {
                  value: colorValue.trim(),
                  imageUrl: null,
                  colors: null,
                });
              }
            }
          });
        }
      });
      
      
      // Also check productAttributes for color attribute values with imageUrl and colors
      // IMPORTANT: Only update colors that already exist in variants (already in colorMap)
      // Do not add new colors that don't exist in variants
      const productAttrs = product && 'productAttributes' in product && Array.isArray(product.productAttributes) ? product.productAttributes : [];
      if (productAttrs.length > 0) {
        productAttrs.forEach((productAttr) => {
          const row = productAttr as NonNullable<ProductWithRelations["productAttributes"]>[number] & {
            attribute?: {
              key: string;
              values?: Array<{
                translations?: Array<{ locale: string; label?: string }>;
                value?: string;
                imageUrl?: string | null;
                colors?: string[] | null;
              }>;
            };
          };
          const attr = row.attribute;
          if (attr && typeof attr === 'object' && 'key' in attr && isColorAttributeKey(attr.key) && 'values' in attr && Array.isArray(attr.values)) {
            attr.values.forEach((attrValue: { translations?: Array<{ locale: string; label?: string }>; value?: string; imageUrl?: string | null; colors?: string[] | null }) => {
              const translation = attrValue.translations?.find((t: { locale: string }) => t.locale === lang) || attrValue.translations?.[0];
              const colorValue = translation?.label || attrValue.value || "";
              if (colorValue) {
                const normalizedValue = colorValue.trim().toLowerCase();
                // Only update if color already exists in colorMap (i.e., exists in variants)
                // This ensures we only show colors that actually exist in product variants
                if (colorMap.has(normalizedValue)) {
                  const existing = colorMap.get(normalizedValue);
                  // Update with imageUrl and colors hex from productAttributes if available
                  if (attrValue.imageUrl || attrValue.colors) {
                    colorMap.set(normalizedValue, {
                      value: colorValue.trim(),
                      imageUrl: attrValue.imageUrl || existing?.imageUrl || null,
                      colors: attrValue.colors || existing?.colors || null,
                    });
                  }
                }
              }
            });
          }
        });
      }
      
      const availableColors = Array.from(colorMap.values());

      const currentPrice = variant?.price || 0;
      const productDiscount = product.discountPercent || 0;
      
      // Calculate applied discount with priority: productDiscount > categoryDiscount > brandDiscount > globalDiscount
      let appliedDiscount = 0;
      if (productDiscount > 0) {
        appliedDiscount = productDiscount;
      } else {
        // Check category discounts
        const primaryCategoryId = product.primaryCategoryId;
        if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
          appliedDiscount = categoryDiscounts[primaryCategoryId];
        } else {
          // Check brand discounts
          const brandId = product.brandId;
          if (brandId && brandDiscounts[brandId]) {
            appliedDiscount = brandDiscounts[brandId];
          } else if (globalDiscount > 0) {
            appliedDiscount = globalDiscount;
          }
        }
      }

      const pricing = resolveProductPrice({
        currentPrice,
        compareAtPrice: variant?.compareAtPrice ?? null,
        fallbackDiscountPercent: appliedDiscount > 0 ? appliedDiscount : null,
      });

      const slug = translation?.slug || "";
      const labels: ProductListLabel[] = (() => {
        // Map existing labels
        const existingLabels = Array.isArray(product.labels) ? product.labels.map((label: { id: string; type: string; value: string; position: string; color: string | null }) => ({
          id: label.id,
          type: label.type,
          value: label.value,
          position: label.position,
          color: label.color,
        })) : [];
        
        // Check if product is out of stock
        const isOutOfStock = (variant?.stock || 0) <= 0;
        
        // If out of stock, add "Out of Stock" label
        if (isOutOfStock) {
          // Check if "Out of Stock" label already exists
          const outOfStockText = getOutOfStockLabel(lang);
          const hasOutOfStockLabel = existingLabels.some(
            (label) => label.value.toLowerCase() === outOfStockText.toLowerCase() ||
                       label.value.toLowerCase().includes('out of stock') ||
                       label.value.toLowerCase().includes('արտադրված') ||
                       label.value.toLowerCase().includes('нет в наличии') ||
                       label.value.toLowerCase().includes('არ არის მარაგში')
          );
          
          if (!hasOutOfStockLabel) {
            // Check if top-left position is available, otherwise use top-right
            const topLeftOccupied = existingLabels.some((l) => l.position === 'top-left');
            const position = topLeftOccupied ? 'top-right' : 'top-left';
            
            existingLabels.push({
              id: `out-of-stock-${product.id}`,
              type: 'text',
              value: outOfStockText,
              position: position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
              color: '#6B7280', // Gray color for out of stock
            });
            
          }
        }
        
        return filterListingLabels(existingLabels);
      })();
      const warrantyBadge = resolveWarrantyBadge(
        product.warrantyYears,
        Array.isArray(product.labels) ? product.labels : [],
      );
      return {
        id: product.id,
        slug,
        title: translation?.title || "",
        defaultVariantId: variant?.id ?? null,
        brand: product.brand
          ? {
              id: product.brand.id,
              slug: product.brand.slug,
              name: brandTranslation?.name || "",
              logoUrl: processImageUrl(product.brand.logoUrl),
            }
          : null,
        price: pricing.currentPrice,
        originalPrice: pricing.oldPrice,
        compareAtPrice: pricing.compareAtPrice,
        discountPercent: pricing.discountPercent,
        isSpecialPrice: pricing.isSpecialPrice,
        ...(() => {
          if (!Array.isArray(product.media) || product.media.length === 0) {
            return { image: null as string | null, images: [] as string[] };
          }
          const images = product.media
            .map((m) =>
              processImageUrl(
                m as string | null | undefined | { url?: string; src?: string; value?: string },
              ),
            )
            .filter((url): url is string => Boolean(url));
          return {
            image: images[0] ?? null,
            images,
          };
        })(),
        inStock: (variant?.stock || 0) > 0,
        labels,
        warrantyBadge,
        colors: availableColors, // Add available colors array
        requiresAttributeSelection: productRequiresAttributeSelection(variants),
      };
    });

    return data;
  }
}
export const productsFindTransformService = new ProductsFindTransformService();
