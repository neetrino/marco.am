import { normalizeProductWarrantyYears } from "@/lib/constants/product-warranty";
import { pickVariantForListingPrice } from "@/lib/product-variant-listing-pick";
import {
  processImageUrl,
  smartSplitUrls,
} from "../../utils/image-utils";
import { logger } from "../../utils/logger";
import { resolveProductPrice } from "@/lib/pricing/product-price";
import { getOutOfStockLabel } from "./utils";
import {
  buildTechnicalSpecifications,
  type ProductAttributeForTechnicalSpecification,
  type ProductVariantForTechnicalSpecification,
} from "./technical-specifications";
import type { ProductWithFullRelations, ProductVariantWithOptions } from "./types";
import {
  parseProductDescriptionJson,
  type ProductDescriptionEntry,
} from "@/lib/products/product-description";
import { buildProductGalleryUrls } from "@/lib/products/product-gallery-urls";
import {
  getListingDiscountSettings,
  type ListingDiscountSettings,
} from "../listing-discount-settings";

type ProductTranslationShape = {
  locale: string;
  title?: string | null;
  slug?: string | null;
  subtitle?: string | null;
  description?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type ProductAttributeValueTranslationShape = {
  locale: string;
  label: string;
};

type ProductAttributeValueShape = {
  id: string;
  value: string;
  imageUrl: string | null;
  colors: string | null;
  translations?: ProductAttributeValueTranslationShape[];
};

type ProductAttributeShape = {
  id: string;
  key: string;
  translations?: Array<{ locale: string; name: string }>;
  values?: ProductAttributeValueShape[];
};

type ProductAttributeLinkShape = {
  id: string;
  attribute: ProductAttributeShape;
};

type ProductDescriptionI18nMap = Record<
  string,
  {
    shortDescription: string | null;
    entries: ProductDescriptionEntry[];
  }
>;

type ProductGalleryImage = {
  url: string;
  type: "image";
  alt: string | null;
  title: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
  position: number;
  source: "product_media";
  metadata: Record<string, unknown> | null;
};

type ProductDiscountBadge = {
  type: "percentage" | "special_price";
  value: number;
  label: string;
};

type StockStatus = "in_stock" | "out_of_stock";


/**
 * Calculate actual discount with priority: productDiscount > categoryDiscount > brandDiscount > globalDiscount
 */
function calculateActualDiscount(
  productDiscount: number,
  primaryCategoryId: string | null,
  brandId: string | null,
  categoryDiscounts: Record<string, number>,
  brandDiscounts: Record<string, number>,
  globalDiscount: number
): number {
  if (productDiscount > 0) {
    return productDiscount;
  }

  // Check category discounts
  if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
    return categoryDiscounts[primaryCategoryId];
  }

  // Check brand discounts
  if (brandId && brandDiscounts[brandId]) {
    return brandDiscounts[brandId];
  }

  if (globalDiscount > 0) {
    return globalDiscount;
  }

  return 0;
}

function transformGallery(
  product: ProductWithFullRelations,
  fallbackAlt: string | null
): ProductGalleryImage[] {
  if (!Array.isArray(product.media)) {
    logger.warn("Product media is not an array, returning empty gallery");
    return [];
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const urls = buildProductGalleryUrls(product.media, variants);

  return urls.map((url, position) => ({
    url,
    type: "image",
    alt: fallbackAlt,
    title: null,
    mimeType: null,
    width: null,
    height: null,
    isPrimary: position === 0,
    position,
    source: "product_media",
    metadata: null,
  }));
}

/**
 * Transform product labels (add "Out of Stock" if needed)
 */
function transformLabels(
  product: ProductWithFullRelations,
  lang: string
): Array<{
  id: string;
  type: string;
  value: string;
  position: string;
  color: string | null;
}> {
  // Map existing labels
  const existingLabels = Array.isArray(product.labels) ? product.labels.map((label: { id: string; type: string; value: string; position: string; color: string | null }) => ({
    id: label.id,
    type: label.type,
    value: label.value,
    position: label.position,
    color: label.color,
  })) : [];
  
  // Check if all variants are out of stock
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const isOutOfStock = variants.length === 0 || variants.every((v: { stock: number }) => (v.stock || 0) <= 0);
  
  // If out of stock, add "Out of Stock" label
  if (isOutOfStock) {
    const outOfStockText = getOutOfStockLabel(lang);
    const hasOutOfStockLabel = existingLabels.some(
      (label: { value: string }) => label.value.toLowerCase() === outOfStockText.toLowerCase() ||
                 label.value.toLowerCase().includes('out of stock') ||
                 label.value.toLowerCase().includes('արտադրված') ||
                 label.value.toLowerCase().includes('нет в наличии') ||
                 label.value.toLowerCase().includes('არ არის მარაგში')
    );
    
    if (!hasOutOfStockLabel) {
      const topLeftOccupied = existingLabels.some((l: { position: string }) => l.position === 'top-left');
      const position = topLeftOccupied ? 'top-right' : 'top-left';
      
      existingLabels.push({
        id: `out-of-stock-${product.id}`,
        type: 'text',
        value: outOfStockText,
        position: position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
        color: '#6B7280', // Gray color for out of stock
      });
      
      logger.debug('Added "Out of Stock" label to product', { productId: product.id, lang });
    }
  }
  
  return existingLabels;
}

/**
 * Transform variant image URL
 */
function transformVariantImageUrl(variant: ProductVariantWithOptions): string | null {
  if (!variant.imageUrl) {
    return null;
  }

  // Use smartSplitUrls to handle comma-separated URLs
  const urls = smartSplitUrls(variant.imageUrl);
  // Process and validate each URL
  const processedUrls = urls.map(url => processImageUrl(url)).filter((url): url is string => url !== null);
  // Use first valid URL, or join if multiple (comma-separated)
  return processedUrls.length > 0 ? processedUrls.join(',') : null;
}

function buildDiscountBadge(
  discountPercent: number | null,
  isSpecialPrice: boolean,
): ProductDiscountBadge | null {
  if (isSpecialPrice) {
    return {
      type: "special_price",
      value: 0,
      label: "special_price",
    };
  }

  if (!discountPercent || discountPercent <= 0) {
    return null;
  }

  return {
    type: "percentage",
    value: discountPercent,
    label: `-${discountPercent}%`,
  };
}

function toStockStatus(stock: number): StockStatus {
  return stock > 0 ? "in_stock" : "out_of_stock";
}

function resolveProductStockSummary(variants: ProductVariantWithOptions[]): {
  inStock: boolean;
  stockStatus: StockStatus;
  stockQuantity: number;
} {
  if (variants.length === 0) {
    return {
      inStock: false,
      stockStatus: "out_of_stock",
      stockQuantity: 0,
    };
  }

  const stockQuantity = variants.reduce((sum, variant) => {
    const currentStock = Number.isFinite(variant.stock) ? Math.max(0, variant.stock) : 0;
    return sum + currentStock;
  }, 0);

  const inStock = variants.some((variant) => variant.stock > 0);

  return {
    inStock,
    stockStatus: inStock ? "in_stock" : "out_of_stock",
    stockQuantity,
  };
}

function buildVariantPricing(
  originalPrice: number,
  compareAtPrice: number | null,
  actualDiscount: number
): {
  currentPrice: number;
  oldPrice: number | null;
  discountPercent: number | null;
  discountBadge: ProductDiscountBadge | null;
} {
  const resolved = resolveProductPrice({
    currentPrice: originalPrice,
    compareAtPrice,
    fallbackDiscountPercent: actualDiscount,
  });

  return {
    currentPrice: resolved.currentPrice,
    oldPrice: resolved.oldPrice,
    discountPercent: resolved.discountPercent,
    discountBadge: buildDiscountBadge(resolved.discountPercent, resolved.isSpecialPrice),
  };
}

/**
 * Transform product variants
 */
function transformVariants(
  variants: ProductVariantWithOptions[],
  actualDiscount: number,
  globalDiscount: number,
  productDiscount: number,
  lang: string
) {
  return variants
    .sort((a: { price: number }, b: { price: number }) => a.price - b.price)
    .map((variant: ProductVariantWithOptions) => {
      const basePrice = variant.price;
      const compareAtPrice =
        typeof variant.compareAtPrice === "number" && Number.isFinite(variant.compareAtPrice)
          ? variant.compareAtPrice
          : null;
      const pricing = buildVariantPricing(basePrice, compareAtPrice, actualDiscount);

      const variantImageUrl = transformVariantImageUrl(variant);
      
      if (variantImageUrl) {
        logger.debug('Variant has imageUrl', {
          variantId: variant.id,
          sku: variant.sku,
          imageUrl: variantImageUrl.substring(0, 50) + (variantImageUrl.length > 50 ? '...' : ''),
        });
      }

      return {
        id: variant.id,
        sku: variant.sku || "",
        price: pricing.currentPrice,
        originalPrice: pricing.oldPrice,
        currentPrice: pricing.currentPrice,
        oldPrice: pricing.oldPrice,
        discountBadge: pricing.discountBadge,
        compareAtPrice,
        globalDiscount: globalDiscount > 0 ? globalDiscount : null,
        productDiscount: productDiscount > 0 ? productDiscount : null,
        stock: variant.stock,
        inStock: variant.stock > 0,
        stockStatus: toStockStatus(variant.stock),
        imageUrl: variantImageUrl,
        options: Array.isArray(variant.options) ? variant.options.map((opt: ProductVariantWithOptions['options'][number]) => {
          // Support both new format (AttributeValue) and old format (attributeKey/value)
          if (opt.attributeValue) {
            // New format: use AttributeValue
            const attrValue = opt.attributeValue;
            const attr = attrValue.attribute;
            const translation = attrValue.translations?.find((t: { locale: string }) => t.locale === lang) || attrValue.translations?.[0];
            return {
              attribute: attr?.key || "",
              value: translation?.label || attrValue.value || "",
              key: attr?.key || "",
              valueId: attrValue.id,
              attributeId: attr?.id,
            };
          } else {
            // Old format: use attributeKey/value
            return {
              attribute: opt.attributeKey || "",
              value: opt.value || "",
              key: opt.attributeKey || "",
            };
          }
        }) : [],
        available: variant.stock > 0,
      };
    });
}

/**
 * Transform productAttributes
 */
function collectAttributeValueOptions(
  variants: ProductVariantWithOptions[],
  lang: string,
): Record<string, ProductAttributeValueShape[]> {
  const valuesByAttributeId = new Map<string, Map<string, ProductAttributeValueShape>>();

  for (const variant of variants) {
    for (const option of variant.options ?? []) {
      const attributeValue = option.attributeValue;
      const attribute = attributeValue?.attribute;
      if (!attributeValue || !attribute?.id) {
        continue;
      }
      const translation =
        attributeValue.translations?.find((entry) => entry.locale === lang) ??
        attributeValue.translations?.[0];
      const valueEntry: ProductAttributeValueShape = {
        id: attributeValue.id,
        value: attributeValue.value,
        imageUrl: attributeValue.imageUrl ?? null,
        colors: typeof attributeValue.colors === "string" ? attributeValue.colors : null,
        translations: translation
          ? [{ locale: translation.locale, label: translation.label }]
          : [],
      };

      const valuesForAttribute = valuesByAttributeId.get(attribute.id) ?? new Map();
      valuesForAttribute.set(attributeValue.id, valueEntry);
      valuesByAttributeId.set(attribute.id, valuesForAttribute);
    }
  }

  return Object.fromEntries(
    Array.from(valuesByAttributeId.entries()).map(([attributeId, valuesMap]) => [
      attributeId,
      Array.from(valuesMap.values()),
    ]),
  );
}

function transformProductAttributes(
  product: ProductWithFullRelations,
  lang: string
) {
  const productAttrs = (product as unknown as { productAttributes?: ProductAttributeLinkShape[] })
    .productAttributes;
  logger.debug('Raw productAttributes from DB', {
    isArray: Array.isArray(productAttrs),
    length: productAttrs?.length || 0,
  });
  
  if (Array.isArray(productAttrs) && productAttrs.length > 0) {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const valuesByAttributeId = collectAttributeValueOptions(variants, lang);
    const mapped = productAttrs.map((pa) => {
      const attr = pa.attribute;
      const attrTranslation = attr.translations?.find((t: { locale: string }) => t.locale === lang) || attr.translations?.[0];
      const values = valuesByAttributeId[attr.id] ?? [];
      
      return {
        id: pa.id,
        attribute: {
          id: attr.id,
          key: attr.key,
          name: attrTranslation?.name || attr.key,
          values: values.map((val) => {
            const valTranslation = val.translations?.find((t: { locale: string }) => t.locale === lang) || val.translations?.[0];
            return {
              id: val.id,
              value: val.value,
              label: valTranslation?.label || val.value,
              imageUrl: val.imageUrl || null,
              colors: val.colors || null,
            };
          }),
        },
      };
    });
    logger.debug('Mapped productAttributes', { count: mapped.length });
    return mapped;
  }
  logger.debug('No productAttributes, returning empty array');
  return [];
}

function resolveProductTranslation(
  translations: ProductTranslationShape[],
  lang: string
): ProductTranslationShape | null {
  const exactMatch = translations.find((item) => item.locale === lang);
  if (exactMatch) {
    return exactMatch;
  }

  const englishFallback = translations.find((item) => item.locale === "en");
  if (englishFallback) {
    return englishFallback;
  }

  return translations[0] ?? null;
}

function buildProductDescriptionI18nMap(
  translations: ProductTranslationShape[]
): ProductDescriptionI18nMap {
  return translations.reduce<ProductDescriptionI18nMap>((acc, item) => {
    if (!item.locale) {
      return acc;
    }

    acc[item.locale] = {
      shortDescription: item.subtitle ?? null,
      entries: parseProductDescriptionJson(item.description),
    };

    return acc;
  }, {});
}

/**
 * Transform product data to response format
 */
export async function transformProduct(
  product: ProductWithFullRelations,
  lang: string = "en",
  injectedDiscountSettings?: ListingDiscountSettings
) {
  // Get translations
  const translations = Array.isArray(product.translations)
    ? (product.translations as ProductTranslationShape[])
    : [];
  const translation = resolveProductTranslation(translations, lang);
  
  // Get brand translation
  const brandTranslations = product.brand && Array.isArray(product.brand.translations)
    ? product.brand.translations
    : [];
  const brandTranslation = brandTranslations.length > 0
    ? brandTranslations.find((t: { locale: string }) => t.locale === lang) || brandTranslations[0]
    : null;

  // Discount settings: injected during read-model build (loaded once), else fetched (cached).
  const { globalDiscount, categoryDiscounts, brandDiscounts } =
    injectedDiscountSettings ?? (await getListingDiscountSettings());
  
  const productDiscount = product.discountPercent || 0;
  
  // Calculate actual discount
  const actualDiscount = calculateActualDiscount(
    productDiscount,
    product.primaryCategoryId,
    product.brandId,
    categoryDiscounts,
    brandDiscounts,
    globalDiscount
  );

  // Transform categories
  const categories = Array.isArray(product.categories) ? product.categories.map((cat: { id: string; translations?: Array<{ locale: string; slug: string; title: string }> }) => {
    const catTranslations = Array.isArray(cat.translations) ? cat.translations : [];
    const catTranslation = catTranslations.find((t: { locale: string }) => t.locale === lang) || catTranslations[0] || null;
    return {
      id: cat.id,
      slug: catTranslation?.slug || "",
      title: catTranslation?.title || "",
    };
  }) : [];

  const gallery = transformGallery(product, translation?.title || null);
  const media = gallery.map((item) => item.url);
  const descriptionI18n = buildProductDescriptionI18nMap(translations);
  const productAttributesForTechnicalSpecifications = (
    product as { productAttributes?: ProductAttributeForTechnicalSpecification[] }
  ).productAttributes;
  const productVariantsForTechnicalSpecifications = (
    product as { variants?: ProductVariantForTechnicalSpecification[] }
  ).variants;
  const technicalSpecifications = buildTechnicalSpecifications(
    productAttributesForTechnicalSpecifications,
    productVariantsForTechnicalSpecifications,
    lang
  );
  const rawVariantsForTransform = Array.isArray(product.variants) ? product.variants : [];
  const transformedVariants = rawVariantsForTransform.length
    ? transformVariants(
        rawVariantsForTransform,
        actualDiscount,
        globalDiscount,
        productDiscount,
        lang
      )
    : [];
  const listingPick = pickVariantForListingPrice(rawVariantsForTransform);
  const listingId = listingPick?.id;
  const variantsForResponse =
    listingId && transformedVariants.length > 0
      ? (() => {
          const primary = transformedVariants.find((v) => v.id === listingId);
          if (!primary) {
            return transformedVariants;
          }
          return [primary, ...transformedVariants.filter((v) => v.id !== listingId)];
        })()
      : transformedVariants;
  const primaryVariant = variantsForResponse[0] ?? null;
  const productStockSummary = resolveProductStockSummary(Array.isArray(product.variants) ? product.variants : []);

  return {
    id: product.id,
    slug: translation?.slug || "",
    title: translation?.title || "",
    subtitle: translation?.subtitle || null,
    shortDescription: translation?.subtitle || null,
    description: parseProductDescriptionJson(translation?.description),
    i18n: {
      requestedLocale: lang,
      availableLocales: Object.keys(descriptionI18n),
      descriptions: descriptionI18n,
    },
    brand: product.brand
      ? {
          id: product.brand.id,
          slug: product.brand.slug,
          name: brandTranslation?.name || "",
          logo: product.brand.logoUrl,
        }
      : null,
    categories,
    media,
    gallery,
    labels: transformLabels(product, lang),
    variants: variantsForResponse,
    currentPrice: primaryVariant?.currentPrice ?? null,
    oldPrice: primaryVariant?.oldPrice ?? null,
    discountBadge: primaryVariant?.discountBadge ?? null,
    inStock: productStockSummary.inStock,
    stockStatus: productStockSummary.stockStatus,
    stockQuantity: productStockSummary.stockQuantity,
    pricing: {
      currentPrice: primaryVariant?.currentPrice ?? null,
      oldPrice: primaryVariant?.oldPrice ?? null,
      discountBadge: primaryVariant?.discountBadge ?? null,
    },
    globalDiscount: globalDiscount > 0 ? globalDiscount : null,
    productDiscount: productDiscount > 0 ? productDiscount : null,
    technicalSpecifications,
    seo: {
      title: translation?.seoTitle || translation?.title,
      description: translation?.seoDescription || null,
    },
    published: product.published,
    publishedAt: product.publishedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    productAttributes: transformProductAttributes(product, lang),
    warrantyYears: normalizeProductWarrantyYears(product.warrantyYears),
  };
}

