import type { Variant } from '../types';

interface UseVariantValidationProps {
  productType: 'simple' | 'variable';
  variants: Variant[];
  simpleProductData: {
    price: string;
    sku: string;
    quantity: string;
  };
  isClothingCategory: () => boolean;
  setLoading: (loading: boolean) => void;
}

export function useVariantValidation({
  productType,
  variants,
  simpleProductData,
  isClothingCategory,
  setLoading,
}: UseVariantValidationProps) {
  const validateVariants = (): string | null => {
    // Skip variant validation for Simple products - they create variants later in the process
    if (productType === 'variable' && variants.length === 0) {
      setLoading(false);
      return 'Ընտրեք ատրիբուտներ և լրացրեք տարբերակները';
    }

    // Validate all variants (skip for simple products - validation is done in variant creation)
    if (productType === 'variable') {
      const skuSet = new Set<string>();
      for (const variant of variants) {
        const variantSku = variant.sku ? variant.sku.trim() : '';
        if (!variantSku || variantSku === '') {
          setLoading(false);
          return 'Բոլոր տարբերակների SKU-ն պարտադիր է';
        }
        
        if (skuSet.has(variantSku)) {
          setLoading(false);
          return `Կրկնվող SKU՝ «${variantSku}»`;
        }
        skuSet.add(variantSku);
        
        const _categoryRequiresSizes = isClothingCategory();
        const colorData = variant.colors && variant.colors.length > 0 ? variant.colors : [];
        
        if (colorData.length > 0) {
          for (const colorDataItem of colorData) {
            const colorSizes = colorDataItem.sizes || [];
            const colorSizeStocks = colorDataItem.sizeStocks || {};
            
            const hasColor = colorDataItem.colorValue && colorDataItem.colorValue.trim() !== '';
            
            if (hasColor) {
              const colorPriceValue = parseFloat(colorDataItem.price || '0');
              if (!colorDataItem.price || isNaN(colorPriceValue) || colorPriceValue <= 0) {
                setLoading(false);
                return null;
              }
            } else {
              if (colorData.indexOf(colorDataItem) === 0) {
                const variantPriceValue = parseFloat(variant.price || '0');
                if (!variant.price || isNaN(variantPriceValue) || variantPriceValue <= 0) {
                  setLoading(false);
                  return null;
                }
              }
            }

            if (colorSizes.length > 0) {
              for (const size of colorSizes) {
                const stock = colorSizeStocks[size];
                if (!stock || typeof stock !== 'string' || stock.trim() === '' || parseInt(stock) < 0) {
                  setLoading(false);
                  return null;
                }
              }
            } else {
              if (!colorDataItem.stock || typeof colorDataItem.stock !== 'string' || colorDataItem.stock.trim() === '' || parseInt(colorDataItem.stock) < 0) {
                setLoading(false);
                return null;
              }
            }
          }
        }
      }
    }

    // Validate simple product fields
    if (productType === 'simple') {
      if (!simpleProductData.price || simpleProductData.price.trim() === '') {
        setLoading(false);
        return null;
      }
      if (!simpleProductData.sku || simpleProductData.sku.trim() === '') {
        setLoading(false);
        return 'SKU-ն պարտադիր է';
      }
      if (!simpleProductData.quantity || simpleProductData.quantity.trim() === '') {
        setLoading(false);
        return null;
      }
    }

    return null;
  };

  return { validateVariants };
}



