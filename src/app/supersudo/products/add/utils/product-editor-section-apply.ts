import { CATALOG_PRICE_CURRENCY, convertPrice, type CurrencyCode } from '@/lib/currency';
import { cleanImageUrls, separateMainAndVariantImages } from '@/lib/utils/image-utils';
import type { ProductEditorSection } from '../product-editor-tabs';
import type { Product } from '../../types';
import type { ProductData, ColorData, Variant, Attribute, AdminProductVariantRow } from '../types';
import type { AddProductFormState } from './productFormDataBuilder';
import { extractColor, extractSize } from '../utils/variantAttributeExtraction';
import {
  createDefaultColorData,
  updateDefaultColorData,
  createColorData,
  updateColorData,
} from '../utils/colorDataBuilder';
import {
  collectVariantImagesFromColors,
  collectVariantImagesFromProductVariants,
} from '../utils/variantImageCollector';
import { hasVariantsWithAttributes } from '../utils/productTypeDetector';
import { logger } from '@/lib/utils/logger';

interface ApplyGeneralParams {
  product: ProductData;
  setFormData: (updater: (prev: AddProductFormState) => AddProductFormState) => void;
}

export function applyGeneralSection({ product, setFormData }: ApplyGeneralParams): void {
  setFormData((prev) => ({
    ...prev,
    title: product.title || '',
    slug: product.slug || '',
    featured: product.featured || false,
    productClass: product.productClass || 'retail',
    warrantyYears:
      product.warrantyYears === 1 || product.warrantyYears === 2 || product.warrantyYears === 3
        ? product.warrantyYears
        : null,
    labels: (product.labels || []).map((label) => ({
      id: label.id || '',
      type: label.type || 'text',
      value: label.value || '',
      position: label.position || 'top-left',
      color: label.color || null,
    })),
  }));
}

/** Instant general-tab seed from products list row (no labels/warranty until API refresh). */
export function applyGeneralSectionFromListProduct(
  product: Product,
  setFormData: ApplyGeneralParams['setFormData'],
): void {
  setFormData((prev) => ({
    ...prev,
    title: product.title || '',
    slug: product.slug || '',
    featured: product.featured ?? false,
    productClass: product.productClass ?? 'retail',
  }));
}

interface ApplyDescriptionParams {
  product: ProductData;
  setFormData: (updater: (prev: AddProductFormState) => AddProductFormState) => void;
}

export function applyDescriptionSection({ product, setFormData }: ApplyDescriptionParams): void {
  setFormData((prev) => ({
    ...prev,
    description: product.description ?? [],
  }));
}

interface ApplyMediaParams {
  product: ProductData;
  setFormData: (updater: (prev: AddProductFormState) => AddProductFormState) => void;
}

export function applyMediaSection({ product, setFormData }: ApplyMediaParams): void {
  const variantImagesFromProduct = collectVariantImagesFromProductVariants(product.variants || []);
  const variantImages = new Set([...variantImagesFromProduct]);
  const mediaList = product.media || [];

  const { main } = separateMainAndVariantImages(
    Array.isArray(mediaList) ? mediaList : [],
    variantImages.size > 0 ? Array.from(variantImages) : [],
  );

  const normalizedMedia = cleanImageUrls(main);

  const featuredIndexFromApi = Array.isArray(mediaList)
    ? mediaList.findIndex((item: unknown) => {
        const url = typeof item === 'string' ? item : (item as { url?: string })?.url || '';
        if (!url) return false;
        return typeof item === 'object' && (item as { isFeatured?: boolean })?.isFeatured === true;
      })
    : -1;

  const mainProductImage =
    product.mainProductImage || (normalizedMedia.length > 0 ? normalizedMedia[0] : '');

  setFormData((prev) => ({
    ...prev,
    imageUrls: normalizedMedia,
    featuredImageIndex:
      featuredIndexFromApi >= 0 && featuredIndexFromApi < normalizedMedia.length
        ? featuredIndexFromApi
        : 0,
    mainProductImage:
      normalizedMedia.length > 0 &&
      normalizedMedia[
        featuredIndexFromApi >= 0 && featuredIndexFromApi < normalizedMedia.length
          ? featuredIndexFromApi
          : 0
      ]
        ? normalizedMedia[
            featuredIndexFromApi >= 0 && featuredIndexFromApi < normalizedMedia.length
              ? featuredIndexFromApi
              : 0
          ]
        : mainProductImage || '',
  }));

  logger.devLog('✅ [ADMIN] Media section applied', { images: normalizedMedia.length });
}

interface ApplyCatalogParams {
  product: ProductData;
  setFormData: (updater: (prev: AddProductFormState) => AddProductFormState) => void;
  setUseNewBrand: (use: boolean) => void;
  setUseNewCategory: (use: boolean) => void;
  setNewBrandName: (name: string) => void;
  setNewCategoryName: (name: string) => void;
}

export function applyCatalogSection({
  product,
  setFormData,
  setUseNewBrand,
  setUseNewCategory,
  setNewBrandName,
  setNewCategoryName,
}: ApplyCatalogParams): void {
  const brandIds = product.brandId ? [product.brandId] : [];

  setFormData((prev) => ({
    ...prev,
    brandIds,
    primaryCategoryId: product.primaryCategoryId || '',
    categoryIds: product.categoryIds || [],
  }));

  setUseNewBrand(false);
  setUseNewCategory(false);
  setNewBrandName('');
  setNewCategoryName('');
}

interface ApplyPricingParams {
  product: ProductData;
  defaultCurrency: CurrencyCode;
  defaultColorLabel: string;
  setFormData: (updater: (prev: AddProductFormState) => AddProductFormState) => void;
  setHasVariantsToLoad: (has: boolean) => void;
  setProductType: (type: 'simple' | 'variable') => void;
  setSimpleProductData: (data: {
    price: string;
    compareAtPrice: string;
    sku: string;
    quantity: string;
  }) => void;
  attributes: Attribute[];
}

export function applyPricingSection({
  product,
  defaultCurrency,
  defaultColorLabel,
  setFormData,
  setHasVariantsToLoad,
  setProductType,
  setSimpleProductData,
  attributes,
}: ApplyPricingParams): void {
  const colorDataMap = new Map<string, ColorData>();
  let firstPrice = '';
  let firstCompareAtPrice = '';
  let firstSku = '';

  (product.variants || []).forEach((rawVariant, index) => {
    const variantRow = rawVariant as AdminProductVariantRow;
    const variantForBuilder = variantRow as unknown as Variant;
    const color = extractColor(variantForBuilder);
    const size = extractSize(variantForBuilder);
    const stockValue =
      variantRow.stock !== undefined && variantRow.stock !== null ? String(variantRow.stock) : '';

    if (!color) {
      const defaultColor = 'default';
      if (!colorDataMap.has(defaultColor)) {
        colorDataMap.set(
          defaultColor,
          createDefaultColorData(variantForBuilder, defaultCurrency, defaultColorLabel, size, stockValue),
        );
      } else {
        updateDefaultColorData(
          colorDataMap.get(defaultColor)!,
          variantForBuilder,
          defaultCurrency,
          size,
          stockValue,
        );
      }
    } else if (!colorDataMap.has(color)) {
      colorDataMap.set(
        color,
        createColorData(variantForBuilder, color, attributes, defaultCurrency, size, stockValue),
      );
    } else {
      updateColorData(colorDataMap.get(color)!, variantForBuilder, defaultCurrency, size, stockValue);
    }

    if (index === 0) {
      const firstPriceCatalog =
        variantRow.price !== undefined && variantRow.price !== null
          ? typeof variantRow.price === 'number'
            ? variantRow.price
            : parseFloat(String(variantRow.price || '0'))
          : 0;
      const firstCompareAtPriceCatalog =
        variantRow.compareAtPrice !== undefined && variantRow.compareAtPrice !== null
          ? typeof variantRow.compareAtPrice === 'number'
            ? variantRow.compareAtPrice
            : parseFloat(String(variantRow.compareAtPrice || '0'))
          : 0;
      firstPrice =
        firstPriceCatalog > 0
          ? String(convertPrice(firstPriceCatalog, CATALOG_PRICE_CURRENCY, defaultCurrency))
          : '';
      firstCompareAtPrice =
        firstCompareAtPriceCatalog > 0
          ? String(convertPrice(firstCompareAtPriceCatalog, CATALOG_PRICE_CURRENCY, defaultCurrency))
          : '';
      firstSku = variantRow.sku || '';
    }
  });

  const mergedVariant: Variant = {
    id: `variant-${Date.now()}-${Math.random()}`,
    price: firstPrice,
    compareAtPrice: firstCompareAtPrice,
    sku: firstSku,
    colors: Array.from(colorDataMap.values()),
  };

  setFormData((prev) => ({
    ...prev,
    variants: [mergedVariant],
  }));

  if (product.variants && product.variants.length > 0) {
    (window as Window & { __productVariantsToConvert?: unknown }).__productVariantsToConvert =
      product.variants;
    setHasVariantsToLoad(true);
  }

  const productAttributeIds = Array.isArray(product.attributeIds) ? product.attributeIds : [];
  (window as Window & { __productAttributeIds?: string[] }).__productAttributeIds =
    productAttributeIds;
  (window as Window & { __productAttributeIdsLoaded?: boolean }).__productAttributeIdsLoaded = true;

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  const hasVariantsWithAttrs = hasVariantsWithAttributes(variants);

  if (!hasVariantsWithAttrs) {
    setProductType('simple');
    if (hasVariants && variants.length > 0) {
      const firstVariant = variants[0];
      setSimpleProductData({
        price: firstVariant.price
          ? String(
              convertPrice(
                typeof firstVariant.price === 'number'
                  ? firstVariant.price
                  : parseFloat(String(firstVariant.price || '0')),
                CATALOG_PRICE_CURRENCY,
                defaultCurrency,
              ),
            )
          : '',
        compareAtPrice: firstVariant.compareAtPrice
          ? String(
              convertPrice(
                typeof firstVariant.compareAtPrice === 'number'
                  ? firstVariant.compareAtPrice
                  : parseFloat(String(firstVariant.compareAtPrice || '0')),
                CATALOG_PRICE_CURRENCY,
                defaultCurrency,
              ),
            )
          : '',
        sku: firstVariant.sku || '',
        quantity: String(firstVariant.stock || 0),
      });
    } else {
      setSimpleProductData({ price: '', compareAtPrice: '', sku: '', quantity: '0' });
    }
  } else {
    setProductType('variable');
  }

  logger.devLog('✅ [ADMIN] Pricing section applied');
}

type SectionApplyHandlers = Omit<ApplyGeneralParams, 'product'> &
  Omit<ApplyCatalogParams, 'product'> &
  Omit<ApplyPricingParams, 'product'>;

export function applyProductEditorSection(
  section: ProductEditorSection,
  product: ProductData,
  handlers: SectionApplyHandlers,
): void {
  switch (section) {
    case 'general':
      applyGeneralSection({ product, setFormData: handlers.setFormData });
      break;
    case 'description':
      applyDescriptionSection({ product, setFormData: handlers.setFormData });
      break;
    case 'media':
      applyMediaSection({ product, setFormData: handlers.setFormData });
      break;
    case 'catalog':
      applyCatalogSection({
        product,
        setFormData: handlers.setFormData,
        setUseNewBrand: handlers.setUseNewBrand,
        setUseNewCategory: handlers.setUseNewCategory,
        setNewBrandName: handlers.setNewBrandName,
        setNewCategoryName: handlers.setNewCategoryName,
      });
      break;
    case 'pricing':
      applyPricingSection({
        product,
        setFormData: handlers.setFormData,
        setHasVariantsToLoad: handlers.setHasVariantsToLoad,
        setProductType: handlers.setProductType,
        setSimpleProductData: handlers.setSimpleProductData,
        defaultCurrency: handlers.defaultCurrency,
        defaultColorLabel: handlers.defaultColorLabel,
        attributes: handlers.attributes,
      });
      break;
    default:
      break;
  }
}
