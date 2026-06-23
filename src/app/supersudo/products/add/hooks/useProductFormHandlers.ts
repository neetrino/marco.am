import type { FormEvent, MutableRefObject } from 'react';
import { CATALOG_PRICE_CURRENCY, convertPrice, type CurrencyCode } from '@/lib/currency';
import type { Attribute, Variant, GeneratedVariant } from '../types';
import {
  toApiVariantDiscount,
  type VariantDiscount,
} from '../utils/variant-discount';
import { resolveProductPrice } from '@/lib/pricing/product-price';
import { activeTypedDiscount } from '@/lib/discount/discount-expiry';
import { useVariantConversionToFormData } from './useVariantConversionToFormData';
import { useVariantValidation } from './useVariantValidation';
import { processImagesForSubmit } from './useImageProcessingForSubmit';
import { buildProductPayload, type OptimisticSaveRequest } from './useProductPayloadCreation';
import {
  computeGatedFingerprints,
  resolveDirtySections,
  type SectionFingerprints,
} from '../utils/product-editor-dirty';
import type { ProductClass } from '@/lib/constants/product-class';
import { logger } from "@/lib/utils/logger";
import { findAttributeBySemanticKey } from '@/lib/attribute-keys';
import type { ProductDescriptionEntry } from '@/lib/products/product-description';
import { t as translateByLocale } from '@/lib/i18n';
import { getStoredLanguage } from '@/lib/language';

interface UseProductFormHandlersProps {
  formData: {
    title: string;
    slug: string;
    subtitleHtml: string;
    description: ProductDescriptionEntry[];
    productClass: ProductClass;
    brandIds: string[];
    primaryCategoryId: string;
    categoryIds: string[];
    published: boolean;
    featured: boolean;
    imageUrls: string[];
    featuredImageIndex: number;
    mainProductImage: string;
    variants: Variant[];
    labels: any[];
    warrantyYears: number | null;
  };
  setFormData: (updater: (prev: any) => any) => void;
  setLoading: (loading: boolean) => void;
  productType: 'simple' | 'variable';
  simpleProductData: {
    price: string;
    discount: VariantDiscount;
    sku: string;
    quantity: string;
    variantId: string;
  };
  selectedAttributesForVariants: Set<string>;
  selectedAttributeValueIds: Record<string, string[]>;
  generatedVariants: GeneratedVariant[];
  attributes: Attribute[];
  defaultCurrency: CurrencyCode;
  isEditMode: boolean;
  productId: string | null;
  /** Hands the built payload + optimistic row to the list page, which persists it in the background. */
  onSubmit: (request: OptimisticSaveRequest) => void;
  /** Baseline fingerprints captured on load; unchanged heavy sections are stripped from the update payload. */
  baselineRef?: MutableRefObject<SectionFingerprints>;
}

export function useProductFormHandlers({
  formData,
  setFormData,
  setLoading,
  productType,
  simpleProductData,
  selectedAttributesForVariants,
  selectedAttributeValueIds,
  generatedVariants,
  attributes,
  defaultCurrency,
  isEditMode,
  productId,
  onSubmit,
  baselineRef,
}: UseProductFormHandlersProps) {
  const mt = (path: string): string => translateByLocale(getStoredLanguage(), path);
  const { convertGeneratedVariantsToFormData } = useVariantConversionToFormData({
    productType,
    selectedAttributesForVariants,
    generatedVariants,
    attributes,
    setFormData,
  });

  const { validateVariants } = useVariantValidation({
    productType,
    variants: formData.variants,
    setLoading,
  });


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      logger.devLog('📝 [ADMIN] Submitting product form:', formData);

      const finalBrandIds = [...formData.brandIds];
      const finalPrimaryCategoryId = formData.primaryCategoryId;
      const finalCategoryIds = [...formData.categoryIds];

      // Convert generated variants to formData format
      convertGeneratedVariantsToFormData();

      // Get current formData after potential update
      const currentFormData = formData.variants.length > 0 ? formData : { ...formData, variants: [] };

      // Validate variants
      if (productType === 'variable' && currentFormData.variants.length === 0) {
        setLoading(false);
        return;
      }
      const validationError = validateVariants();
      if (validationError) {
        alert(validationError);
        return;
      }

      // Process variants for API
      const variants: any[] = [];
      const selectedProductClass = formData.productClass || "retail";
      const variantSkuSet = new Set<string>();
      const convertAmountToCatalog = (value: number): number =>
        convertPrice(value, defaultCurrency, CATALOG_PRICE_CURRENCY);

      if (productType === 'simple') {
        logger.devLog('📦 [ADMIN] Processing Simple Product');
        const simplePriceRaw = simpleProductData.price.trim();
        const simplePriceValue =
          simplePriceRaw === '' ? 0 : parseFloat(simplePriceRaw);
        const priceCatalog = convertPrice(
          Number.isNaN(simplePriceValue) ? 0 : simplePriceValue,
          defaultCurrency,
          CATALOG_PRICE_CURRENCY
        );
        const simpleDiscount = toApiVariantDiscount(
          simpleProductData.discount,
          convertAmountToCatalog,
        );
        const trimmedSku = simpleProductData.sku.trim();
        const simpleVariant: Record<string, unknown> = {
          price: priceCatalog,
          stock: parseInt(simpleProductData.quantity) || 0,
          productClass: selectedProductClass,
          published: true,
          discountType: simpleDiscount.discountType,
          discountValue: simpleDiscount.discountValue,
          discountExpiresAt: simpleDiscount.discountExpiresAt,
        };
        if (trimmedSku) {
          simpleVariant.sku = trimmedSku;
        }
        if (isEditMode && simpleProductData.variantId) {
          simpleVariant.id = simpleProductData.variantId;
        }
        variants.push(simpleVariant);
        if (trimmedSku) {
          variantSkuSet.add(trimmedSku);
        }
        logger.devLog('✅ [ADMIN] Simple product variant created:', simpleVariant);
      } else {
        // Variable products variant processing (simplified - full logic remains in original)
        const useGeneratedVariants = generatedVariants.length > 0 && selectedAttributesForVariants.size > 0;
        
        if (useGeneratedVariants) {
          logger.devLog('📦 [ADMIN] Using generatedVariants format:', generatedVariants.length, 'variants');
          
          generatedVariants.forEach((genVariant) => {
            const variantPriceCatalog = convertPrice(
              parseFloat(genVariant.price || '0'),
              defaultCurrency,
              CATALOG_PRICE_CURRENCY
            );
            const variantDiscount = toApiVariantDiscount(genVariant.discount, convertAmountToCatalog);
            
            const attributeValueMap: Record<string, Array<{ valueId: string; value: string }>> = {};
            
            genVariant.selectedValueIds.forEach((valueId) => {
              const attribute = attributes.find(a => a.values.some(v => v.id === valueId));
              if (attribute) {
                const value = attribute.values.find(v => v.id === valueId);
                if (value) {
                  if (!attributeValueMap[attribute.key]) {
                    attributeValueMap[attribute.key] = [];
                  }
                  attributeValueMap[attribute.key].push({ valueId: value.id, value: value.value });
                }
              }
            });
            
            const attributeKeys = Object.keys(attributeValueMap);
            if (attributeKeys.length === 0) {
              const finalSku = genVariant.sku?.trim() ?? '';
              if (finalSku && variantSkuSet.has(finalSku)) {
                alert(mt('admin.products.add.duplicateSku').replace('{sku}', finalSku));
                setLoading(false);
                return;
              }
              if (finalSku) {
                variantSkuSet.add(finalSku);
              }
              variants.push({
                price: variantPriceCatalog,
                ...variantDiscount,
                stock: parseInt(genVariant.stock || '0') || 0,
                sku: finalSku || undefined,
                imageUrl: genVariant.image || undefined,
                published: true,
              });
            } else {
              const attributeValueGroups = attributeKeys.map(key => 
                attributeValueMap[key].map(v => v.valueId)
              );
              
              const generateCombinations = (groups: string[][]): string[][] => {
                if (groups.length === 0) return [[]];
                if (groups.length === 1) return groups[0].map(v => [v]);
                const [firstGroup, ...restGroups] = groups;
                const restCombinations = generateCombinations(restGroups);
                const result: string[][] = [];
                for (const value of firstGroup) {
                  for (const combination of restCombinations) {
                    result.push([value, ...combination]);
                  }
                }
                return result;
              };
              
              const combinations = generateCombinations(attributeValueGroups);
              
              combinations.forEach((combination) => {
                const variantOptions: Array<{ attributeKey: string; value: string; valueId?: string }> = [];
                combination.forEach((valueId) => {
                  const attribute = attributes.find(a => a.values.some(v => v.id === valueId));
                  if (attribute) {
                    const value = attribute.values.find(v => v.id === valueId);
                    if (value) {
                      variantOptions.push({ attributeKey: attribute.key, value: value.value, valueId: value.id });
                    }
                  }
                });
                
                const finalSku = genVariant.sku?.trim() ?? '';
                if (finalSku && variantSkuSet.has(finalSku)) {
                  alert(mt('admin.products.add.duplicateSku').replace('{sku}', finalSku));
                  setLoading(false);
                  return;
                }
                if (finalSku) {
                  variantSkuSet.add(finalSku);
                }

                variants.push({
                  price: variantPriceCatalog,
                  ...variantDiscount,
                  stock: parseInt(genVariant.stock || '0') || 0,
                  sku: finalSku || undefined,
                  imageUrl: genVariant.image || undefined,
                  published: true,
                  options: variantOptions.length > 0 ? variantOptions : undefined,
                });
              });
            }
          });
        } else {
          // Legacy formData.variants processing (simplified)
          logger.devLog('📦 [ADMIN] Using formData.variants format (legacy)');
          currentFormData.variants.forEach((variant) => {
            const variantPriceCatalog = convertPrice(
              parseFloat(variant.price || '0'),
              defaultCurrency,
              CATALOG_PRICE_CURRENCY
            );
            const variantDiscount = toApiVariantDiscount(variant.discount, convertAmountToCatalog);
            const baseVariantData: any = {
              price: variantPriceCatalog,
              published: true,
              ...variantDiscount,
            };
            const colorDataArray = variant.colors || [];
            // Simplified variant processing - full logic would be in separate hook
            if (colorDataArray.length > 0) {
              colorDataArray.forEach((colorData) => {
                const colorSizes = colorData.sizes || [];
                const colorSizeStocks = colorData.sizeStocks || {};
                if (colorSizes.length > 0) {
                  colorSizes.forEach((size) => {
                    const stockForVariant = colorSizeStocks[size] || colorData.stock || '0';
                    const finalSku = (colorData.sizeLabels?.[size] || variant.sku || '').trim();
                    if (finalSku && variantSkuSet.has(finalSku)) {
                      alert(mt('admin.products.add.duplicateSku').replace('{sku}', finalSku));
                      setLoading(false);
                      return;
                    }
                    if (finalSku) {
                      variantSkuSet.add(finalSku);
                    }
                    const variantImageUrl = colorData.images && colorData.images.length > 0 ? colorData.images.join(',') : undefined;
                    const sizePrice = colorData.sizePrices?.[size];
                    const finalPrice =
                      sizePrice && sizePrice.trim() !== ''
                        ? convertPrice(parseFloat(sizePrice), defaultCurrency, CATALOG_PRICE_CURRENCY)
                        : colorData.price && colorData.price.trim() !== ''
                          ? convertPrice(parseFloat(colorData.price), defaultCurrency, CATALOG_PRICE_CURRENCY)
                          : baseVariantData.price;
                    const variantOptions: Array<{ attributeKey: string; value: string; valueId?: string }> = [];
                    if (colorData.colorValue && colorData.colorValue.trim() !== '') {
                      const colorAttr = findAttributeBySemanticKey(attributes, 'color');
                      const colorValue = colorAttr?.values.find(v => v.value === colorData.colorValue);
                      if (colorValue) {
                        variantOptions.push({ attributeKey: 'color', value: colorData.colorValue, valueId: colorValue.id });
                      } else {
                        variantOptions.push({ attributeKey: 'color', value: colorData.colorValue });
                      }
                    }
                    if (size && size.trim() !== '') {
                      const sizeAttr = findAttributeBySemanticKey(attributes, 'size');
                      const sizeValue = sizeAttr?.values.find(v => v.value === size);
                      if (sizeValue) {
                        variantOptions.push({ attributeKey: 'size', value: size, valueId: sizeValue.id });
                      } else {
                        variantOptions.push({ attributeKey: 'size', value: size });
                      }
                    }
                    variants.push({
                      ...baseVariantData,
                      price: finalPrice,
                      color: colorData.colorValue,
                      size: size,
                      stock: parseInt(stockForVariant) || 0,
                      sku: finalSku || undefined,
                      imageUrl: variantImageUrl,
                      options: variantOptions.length > 0 ? variantOptions : undefined,
                    });
                  });
                }
              });
            }
          });
        }
      }

      // SKU is optional. Enforce uniqueness only across provided (non-empty) SKUs.
      const finalSkuSet = new Set<string>();
      for (const variant of variants) {
        const sku = variant.sku?.trim() ?? '';
        variant.productClass = variant.productClass || selectedProductClass;
        if (!sku) {
          variant.sku = undefined;
          continue;
        }
        if (finalSkuSet.has(sku)) {
          alert(mt('admin.products.add.duplicateSku').replace('{sku}', sku));
          setLoading(false);
          return;
        }
        variant.sku = sku;
        finalSkuSet.add(sku);
      }

      // Persist filter/spec attributes independently from sellable variants.
      const attributeIds = Array.from(selectedAttributesForVariants);
      const selectedAttributeValueIdList = [
        ...Object.values(selectedAttributeValueIds).flat(),
        ...(productType === 'variable'
          ? generatedVariants.flatMap((variant) => variant.selectedValueIds)
          : []),
      ];
      const attributeValueIds = [...new Set(selectedAttributeValueIdList.filter(Boolean))];

      // Process images
      const { finalMedia, mainImage, processedVariants } = processImagesForSubmit({
        imageUrls: currentFormData.imageUrls,
        featuredImageIndex: currentFormData.featuredImageIndex,
        mainProductImage: currentFormData.mainProductImage,
        variants: variants,
      });
      const finalVariants = processedVariants.length > 0 ? processedVariants : variants;

      const payload = buildProductPayload({
        formData: currentFormData,
        finalBrandIds,
        finalPrimaryCategoryId,
        finalCategoryIds,
        variants: finalVariants,
        attributeIds,
        attributeValueIds,
        finalMedia,
        mainImage,
        isEditMode,
      });

      // Skip re-sending heavy sections the user did not touch → backend takes its fast path.
      if (isEditMode && baselineRef) {
        const current = computeGatedFingerprints({
          imageUrls: currentFormData.imageUrls,
          featuredImageIndex: currentFormData.featuredImageIndex,
          mainProductImage: currentFormData.mainProductImage,
          subtitleHtml: currentFormData.subtitleHtml,
          description: currentFormData.description,
          productType,
          simpleProductData,
          variants: currentFormData.variants,
          generatedVariants,
          selectedAttributeIds: Array.from(selectedAttributesForVariants),
          selectedAttributeValueIds: attributeValueIds,
        });
        const dirty = resolveDirtySections(current, baselineRef.current);
        if (!dirty.media) {
          delete payload.media;
          delete payload.mainProductImage;
        }
        if (!dirty.description) {
          delete payload.subtitle;
          delete payload.description;
        }
        if (!dirty.pricing) {
          delete payload.variants;
          delete payload.attributeIds;
          delete payload.attributeValueIds;
        }
      }

      const primaryVariant = finalVariants[0] as
        | {
            price?: unknown;
            discountType?: unknown;
            discountValue?: unknown;
            discountExpiresAt?: unknown;
          }
        | undefined;
      const standardPrice = Number(primaryVariant?.price) || 0;
      const appliedDiscount = activeTypedDiscount({
        type: (primaryVariant?.discountType as VariantDiscount['type'] | undefined) ?? 'NONE',
        value: (primaryVariant?.discountValue as number | null | undefined) ?? null,
        expiresAt: (primaryVariant?.discountExpiresAt as string | null | undefined) ?? null,
      });
      const resolvedOptimisticPrice = resolveProductPrice({
        standardPrice,
        discount: appliedDiscount,
      });
      const optimisticPrice = resolvedOptimisticPrice.currentPrice;
      const optimisticStock = finalVariants.reduce(
        (sum, variant) => sum + (Number((variant as { stock?: unknown }).stock) || 0),
        0,
      );
      const optimisticOriginalPrice = resolvedOptimisticPrice.oldPrice;
      const optimisticDiscountPercent = resolvedOptimisticPrice.discountPercent ?? 0;
      const optimisticDiscountExpiresAt =
        (primaryVariant?.discountExpiresAt as string | null | undefined) ?? null;
      const optimisticImage =
        mainImage ?? finalMedia[0] ?? (currentFormData.mainProductImage || currentFormData.imageUrls[0] || null);

      const optimisticRow = {
        id: isEditMode && productId ? productId : `temp-${Date.now()}`,
        title: currentFormData.title,
        slug: currentFormData.slug,
        price: optimisticPrice,
        stock: optimisticStock,
        originalPrice: optimisticOriginalPrice,
        discountPercent: optimisticDiscountPercent,
        discountExpiresAt: optimisticDiscountExpiresAt,
        image: optimisticImage,
        featured: currentFormData.featured,
        published: isEditMode ? currentFormData.published : true,
        productClass: currentFormData.productClass,
        createdAt: new Date().toISOString(),
        pendingSync: true,
      };

      onSubmit({ isEditMode, productId, payload, optimisticRow });
      setLoading(false);
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error preparing product submit:', err);
      setLoading(false);
    }
  };

  return { handleSubmit };
}
