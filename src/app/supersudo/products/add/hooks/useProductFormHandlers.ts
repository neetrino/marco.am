import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOG_PRICE_CURRENCY, convertPrice, type CurrencyCode } from '@/lib/currency';
import type { Attribute, Variant, GeneratedVariant } from '../types';
import { useBrandAndCategoryCreation } from './useBrandAndCategoryCreation';
import { useVariantConversionToFormData } from './useVariantConversionToFormData';
import { useVariantValidation } from './useVariantValidation';
import { processImagesForSubmit } from './useImageProcessingForSubmit';
import { createAndSubmitPayload } from './useProductPayloadCreation';
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
  setBrands: (updater: (prev: any[]) => any[]) => void;
  setCategories: (updater: (prev: any[]) => any[]) => void;
  productType: 'simple' | 'variable';
  simpleProductData: {
    price: string;
    compareAtPrice: string;
    sku: string;
    quantity: string;
  };
  selectedAttributesForVariants: Set<string>;
  generatedVariants: GeneratedVariant[];
  attributes: Attribute[];
  defaultCurrency: CurrencyCode;
  useNewBrand: boolean;
  newBrandName: string;
  useNewCategory: boolean;
  newCategoryName: string;
  isEditMode: boolean;
  productId: string | null;
  isClothingCategory: () => boolean;
}

export function useProductFormHandlers({
  formData,
  setFormData,
  setLoading,
  setBrands,
  setCategories,
  productType,
  simpleProductData,
  selectedAttributesForVariants,
  generatedVariants,
  attributes,
  defaultCurrency,
  useNewBrand,
  newBrandName,
  useNewCategory,
  newCategoryName,
  isEditMode,
  productId,
  isClothingCategory,
}: UseProductFormHandlersProps) {
  const mt = (path: string): string => translateByLocale(getStoredLanguage(), path);
  const router = useRouter();
  
  const { createBrandAndCategory } = useBrandAndCategoryCreation({
    formData,
    useNewBrand,
    newBrandName,
    useNewCategory,
    newCategoryName,
    setBrands,
    setCategories,
    setLoading,
  });

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
    simpleProductData,
    isClothingCategory,
    setLoading,
  });


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      logger.devLog('📝 [ADMIN] Submitting product form:', formData);

      // Create brand and category if needed
      const brandCategoryResult = await createBrandAndCategory();
      if (brandCategoryResult.error) {
        return;
      }
      const { finalBrandIds, finalPrimaryCategoryId, finalCategoryIds, creationMessages } = brandCategoryResult;

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

      if (productType === 'variable' && generatedVariants.length > 0) {
        for (const genVariant of generatedVariants) {
          if (!genVariant.sku?.trim()) {
            alert(mt('admin.products.add.allVariantSkuRequired'));
            setLoading(false);
            return;
          }
        }
      }

      // Process variants for API
      const variants: any[] = [];
      const selectedProductClass = formData.productClass || "retail";
      const variantSkuSet = new Set<string>();

      if (productType === 'simple') {
        logger.devLog('📦 [ADMIN] Processing Simple Product');
        const priceCatalog = convertPrice(
          parseFloat(simpleProductData.price),
          defaultCurrency,
          CATALOG_PRICE_CURRENCY
        );
        const compareAtPriceCatalog =
          simpleProductData.compareAtPrice && simpleProductData.compareAtPrice.trim() !== ''
            ? convertPrice(parseFloat(simpleProductData.compareAtPrice), defaultCurrency, CATALOG_PRICE_CURRENCY)
            : undefined;
        const simpleVariant: any = {
          price: priceCatalog,
          stock: parseInt(simpleProductData.quantity) || 0,
          sku: simpleProductData.sku.trim(),
          productClass: selectedProductClass,
          published: true,
        };
        if (compareAtPriceCatalog !== undefined) {
          simpleVariant.compareAtPrice = compareAtPriceCatalog;
        }
        variants.push(simpleVariant);
        variantSkuSet.add(simpleProductData.sku.trim());
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
            const variantCompareAtPriceCatalog = genVariant.compareAtPrice
              ? convertPrice(parseFloat(genVariant.compareAtPrice), defaultCurrency, CATALOG_PRICE_CURRENCY)
              : undefined;
            
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
              if (!finalSku) {
                alert(mt('admin.products.add.allVariantSkuRequired'));
                setLoading(false);
                return;
              }
              if (variantSkuSet.has(finalSku)) {
                alert(mt('admin.products.add.duplicateSku').replace('{sku}', finalSku));
                setLoading(false);
                return;
              }
              variantSkuSet.add(finalSku);
              variants.push({
                price: variantPriceCatalog,
                compareAtPrice: variantCompareAtPriceCatalog,
                stock: parseInt(genVariant.stock || '0') || 0,
                sku: finalSku,
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
                if (!finalSku) {
                  alert(mt('admin.products.add.allVariantSkuRequired'));
                  setLoading(false);
                  return;
                }
                if (variantSkuSet.has(finalSku)) {
                  alert(mt('admin.products.add.duplicateSku').replace('{sku}', finalSku));
                  setLoading(false);
                  return;
                }
                variantSkuSet.add(finalSku);
                
                variants.push({
                  price: variantPriceCatalog,
                  compareAtPrice: variantCompareAtPriceCatalog,
                  stock: parseInt(genVariant.stock || '0') || 0,
                  sku: finalSku,
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
            const baseVariantData: any = { price: variantPriceCatalog, published: true };
            if (variant.compareAtPrice) {
              baseVariantData.compareAtPrice = convertPrice(
                parseFloat(variant.compareAtPrice),
                defaultCurrency,
                CATALOG_PRICE_CURRENCY
              );
            }
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
                    if (!finalSku) {
                      alert(mt('admin.products.add.allVariantSkuRequired'));
                      setLoading(false);
                      return;
                    }
                    if (variantSkuSet.has(finalSku)) {
                      alert(mt('admin.products.add.duplicateSku').replace('{sku}', finalSku));
                      setLoading(false);
                      return;
                    }
                    variantSkuSet.add(finalSku);
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
                      sku: finalSku,
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

      // Final SKU validation — manual entry only, no auto-generation
      const finalSkuSet = new Set<string>();
      for (const variant of variants) {
        const sku = variant.sku?.trim() ?? '';
        if (!sku) {
          alert(mt('admin.products.add.allVariantSkuRequired'));
          setLoading(false);
          return;
        }
        if (finalSkuSet.has(sku)) {
          alert(mt('admin.products.add.duplicateSku').replace('{sku}', sku));
          setLoading(false);
          return;
        }
        variant.sku = sku;
        variant.productClass = variant.productClass || selectedProductClass;
        finalSkuSet.add(sku);
      }

      // Persist only attributes explicitly selected for this product.
      const attributeIds =
        productType === 'variable' ? Array.from(selectedAttributesForVariants) : [];

      // Process images
      const { finalMedia, mainImage, processedVariants } = processImagesForSubmit({
        imageUrls: currentFormData.imageUrls,
        featuredImageIndex: currentFormData.featuredImageIndex,
        mainProductImage: currentFormData.mainProductImage,
        variants: variants,
      });
      const finalVariants = processedVariants.length > 0 ? processedVariants : variants;

      // Create and submit payload
      await createAndSubmitPayload({
        formData: currentFormData,
        finalBrandIds,
        finalPrimaryCategoryId,
        finalCategoryIds,
        variants: finalVariants,
        attributeIds,
        finalMedia,
        mainImage,
        isEditMode,
        productId,
        creationMessages,
        setLoading,
        router,
      });
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit };
}
