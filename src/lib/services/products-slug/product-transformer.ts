import { db } from "@white-shop/db";
import {
  processImageUrl,
  smartSplitUrls,
  normalizeUrlForComparison,
} from "../../utils/image-utils";
import { logger } from "../../utils/logger";
import { getOutOfStockLabel } from "./utils";
import type { ProductWithFullRelations, ProductVariantWithOptions } from "./types";

type ProductTranslationShape = {
  locale: string;
  title?: string | null;
  slug?: string | null;
  subtitle?: string | null;
  descriptionHtml?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type ProductDescriptionI18nMap = Record<
  string,
  {
    shortDescription: string | null;
    fullDescription: string | null;
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

type RawProductMediaItem = {
  url?: string;
  src?: string;
  value?: string;
  alt?: string;
  title?: string;
  mimeType?: string;
  mime?: string;
  width?: number | string;
  height?: number | string;
  type?: string;
  isPrimary?: boolean;
  primary?: boolean;
  position?: number | string;
  sortOrder?: number | string;
  metadata?: unknown;
};

function parseNumericMetadata(value: number | string | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseMediaObjectMetadata(raw: RawProductMediaItem) {
  const metadata =
    raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
      ? (raw.metadata as Record<string, unknown>)
      : null;

  const positionCandidate = parseNumericMetadata(raw.position ?? raw.sortOrder);
  const sortOrder = positionCandidate ?? Number.MAX_SAFE_INTEGER;

  return {
    alt: typeof raw.alt === "string" ? raw.alt : null,
    title: typeof raw.title === "string" ? raw.title : null,
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : typeof raw.mime === "string" ? raw.mime : null,
    width: parseNumericMetadata(raw.width),
    height: parseNumericMetadata(raw.height),
    isPrimary: raw.isPrimary === true || raw.primary === true,
    sortOrder,
    metadata,
  };
}

/**
 * Get discount settings from database
 */
async function getDiscountSettings() {
  const discountSettings = await db.settings.findMany({
    where: {
      key: {
        in: ["globalDiscount", "categoryDiscounts", "brandDiscounts"],
      },
    },
  });

  const globalDiscountSetting = discountSettings.find((s: { key: string; value: unknown }) => s.key === "globalDiscount");
  const globalDiscount = Number(globalDiscountSetting?.value) || 0;
  
  const categoryDiscountsSetting = discountSettings.find((s: { key: string; value: unknown }) => s.key === "categoryDiscounts");
  const categoryDiscounts = categoryDiscountsSetting ? (categoryDiscountsSetting.value as Record<string, number>) || {} : {};
  
  const brandDiscountsSetting = discountSettings.find((s: { key: string; value: unknown }) => s.key === "brandDiscounts");
  const brandDiscounts = brandDiscountsSetting ? (brandDiscountsSetting.value as Record<string, number>) || {} : {};

  return { globalDiscount, categoryDiscounts, brandDiscounts };
}

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

function collectVariantImageSet(variants: ProductVariantWithOptions[]): Set<string> {
  const variantImageSet = new Set<string>();

  for (const variant of variants) {
    if (!variant.imageUrl) {
      continue;
    }

    const urls = smartSplitUrls(variant.imageUrl);
    for (const rawUrl of urls) {
      const processedUrl = processImageUrl(rawUrl);
      if (processedUrl) {
        variantImageSet.add(normalizeUrlForComparison(processedUrl));
      }
    }
  }

  return variantImageSet;
}

function toGalleryItem(
  mediaItem: unknown,
  fallbackAlt: string | null,
  variantImageSet: Set<string>
): (ProductGalleryImage & { sortOrder: number }) | null {
  let rawItem: RawProductMediaItem = {};
  let sourceUrl: string | null = null;

  if (typeof mediaItem === "string") {
    sourceUrl = mediaItem;
  } else if (mediaItem && typeof mediaItem === "object") {
    rawItem = mediaItem as RawProductMediaItem;
    sourceUrl = rawItem.url ?? rawItem.src ?? rawItem.value ?? null;
  }

  const processedUrl = processImageUrl(sourceUrl);
  if (!processedUrl) {
    return null;
  }

  const normalizedUrl = normalizeUrlForComparison(processedUrl);
  if (variantImageSet.has(normalizedUrl)) {
    return null;
  }

  const parsedMetadata = parseMediaObjectMetadata(rawItem);

  return {
    url: processedUrl,
    type: "image",
    alt: parsedMetadata.alt ?? fallbackAlt,
    title: parsedMetadata.title,
    mimeType: parsedMetadata.mimeType,
    width: parsedMetadata.width,
    height: parsedMetadata.height,
    isPrimary: parsedMetadata.isPrimary,
    position: 0,
    source: "product_media",
    metadata: parsedMetadata.metadata,
    sortOrder: parsedMetadata.sortOrder,
  };
}

function deduplicateGallery(
  galleryWithOrder: Array<ProductGalleryImage & { sortOrder: number }>
): ProductGalleryImage[] {
  const deduplicatedGallery: ProductGalleryImage[] = [];
  const seenUrls = new Set<string>();

  for (const galleryItem of galleryWithOrder) {
    const normalizedUrl = normalizeUrlForComparison(galleryItem.url);
    if (seenUrls.has(normalizedUrl)) {
      continue;
    }

    seenUrls.add(normalizedUrl);
    deduplicatedGallery.push({
      ...galleryItem,
      position: deduplicatedGallery.length,
    });
  }

  if (deduplicatedGallery.length > 0 && !deduplicatedGallery.some((image) => image.isPrimary)) {
    deduplicatedGallery[0] = {
      ...deduplicatedGallery[0],
      isPrimary: true,
    };
  }

  return deduplicatedGallery;
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
  const variantImageSet = collectVariantImageSet(variants);

  const galleryWithOrder: Array<ProductGalleryImage & { sortOrder: number }> = [];
  for (const mediaItem of product.media) {
    const galleryItem = toGalleryItem(mediaItem, fallbackAlt, variantImageSet);
    if (galleryItem) {
      galleryWithOrder.push(galleryItem);
    }
  }

  galleryWithOrder.sort((left, right) => left.sortOrder - right.sortOrder);
  return deduplicateGallery(galleryWithOrder);
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
      const originalPrice = variant.price;
      let finalPrice = originalPrice;
      let discountPrice = null;

      if (actualDiscount > 0 && originalPrice > 0) {
        discountPrice = originalPrice;
        finalPrice = originalPrice * (1 - actualDiscount / 100);
      }

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
        price: finalPrice,
        originalPrice: discountPrice || variant.compareAtPrice || null,
        compareAtPrice: variant.compareAtPrice || null,
        globalDiscount: globalDiscount > 0 ? globalDiscount : null,
        productDiscount: productDiscount > 0 ? productDiscount : null,
        stock: variant.stock,
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
function transformProductAttributes(
  product: ProductWithFullRelations,
  lang: string
) {
  const productAttrs = (product as { productAttributes?: unknown[] }).productAttributes;
  logger.debug('Raw productAttributes from DB', {
    isArray: Array.isArray(productAttrs),
    length: productAttrs?.length || 0,
  });
  
  if (Array.isArray(productAttrs) && productAttrs.length > 0) {
    type ProductAttribute = {
      id: string;
      attribute: {
        id: string;
        key: string;
        translations?: Array<{ locale: string; name: string }>;
        values: Array<{
          id: string;
          value: string;
          translations?: Array<{ locale: string; label: string }>;
          imageUrl: string | null;
          colors: string | null;
        }>;
      };
    };
    
    const mapped = (productAttrs as ProductAttribute[]).map((pa) => {
      const attr = pa.attribute;
      const attrTranslation = attr.translations?.find((t: { locale: string }) => t.locale === lang) || attr.translations?.[0];
      
      return {
        id: pa.id,
        attribute: {
          id: attr.id,
          key: attr.key,
          name: attrTranslation?.name || attr.key,
          values: Array.isArray(attr.values) ? attr.values.map((val: {
            id: string;
            value: string;
            translations?: Array<{ locale: string; label: string }>;
            imageUrl: string | null;
            colors: string | null;
          }) => {
            const valTranslation = val.translations?.find((t: { locale: string }) => t.locale === lang) || val.translations?.[0];
            return {
              id: val.id,
              value: val.value,
              label: valTranslation?.label || val.value,
              imageUrl: val.imageUrl || null,
              colors: val.colors || null,
            };
          }) : [],
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
      fullDescription: item.descriptionHtml ?? null,
    };

    return acc;
  }, {});
}

/**
 * Transform product data to response format
 */
export async function transformProduct(
  product: ProductWithFullRelations,
  lang: string = "en"
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

  // Get discount settings
  const { globalDiscount, categoryDiscounts, brandDiscounts } = await getDiscountSettings();
  
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

  return {
    id: product.id,
    slug: translation?.slug || "",
    title: translation?.title || "",
    subtitle: translation?.subtitle || null,
    shortDescription: translation?.subtitle || null,
    description: translation?.descriptionHtml || null,
    fullDescription: translation?.descriptionHtml || null,
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
    variants: Array.isArray(product.variants) ? transformVariants(
      product.variants,
      actualDiscount,
      globalDiscount,
      productDiscount,
      lang
    ) : [],
    globalDiscount: globalDiscount > 0 ? globalDiscount : null,
    productDiscount: productDiscount > 0 ? productDiscount : null,
    seo: {
      title: translation?.seoTitle || translation?.title,
      description: translation?.seoDescription || null,
    },
    published: product.published,
    publishedAt: product.publishedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    productAttributes: transformProductAttributes(product, lang),
  };
}

