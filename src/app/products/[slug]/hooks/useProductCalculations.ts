import { useMemo } from 'react';
import type { Product, ProductVariant, AttributeGroupValue } from '../types';

interface UseProductCalculationsProps {
  product: Product | null;
  currentVariant: ProductVariant | null;
  attributeGroups: Map<string, AttributeGroupValue[]>;
  selectedColor: string | null;
  selectedSize: string | null;
}

export function useProductCalculations({
  product,
  currentVariant,
  attributeGroups,
  selectedColor,
  selectedSize,
}: UseProductCalculationsProps) {
  const variantCurrentPrice = currentVariant?.currentPrice ?? currentVariant?.price ?? 0;
  const price = variantCurrentPrice;
  const originalPrice = currentVariant?.oldPrice ?? currentVariant?.originalPrice;
  const compareAtPrice = currentVariant?.compareAtPrice;
  const fallbackOldPrice =
    originalPrice ??
    (typeof compareAtPrice === 'number' && compareAtPrice > variantCurrentPrice ? compareAtPrice : null);
  const inferredDiscountPercent =
    fallbackOldPrice && fallbackOldPrice > variantCurrentPrice
      ? Math.round(((fallbackOldPrice - variantCurrentPrice) / fallbackOldPrice) * 100)
      : null;
  const discountPercent =
    currentVariant?.discountBadge?.value ??
    currentVariant?.productDiscount ??
    product?.discountBadge?.value ??
    product?.productDiscount ??
    inferredDiscountPercent;
  const isOutOfStock = !currentVariant || currentVariant.stock <= 0;

  const colorGroups = useMemo(() => {
    const groups: Array<{ color: string; stock: number; variants: ProductVariant[] }> = [];
    const colorAttrGroup = attributeGroups.get('color');
    if (colorAttrGroup) {
      groups.push(...colorAttrGroup.map((g) => ({
        color: g.value,
        stock: g.stock,
        variants: g.variants,
      })));
    }
    return groups;
  }, [attributeGroups]);

  const sizeGroups = useMemo(() => {
    const groups: Array<{ size: string; stock: number; variants: ProductVariant[] }> = [];
    const sizeAttrGroup = attributeGroups.get('size');
    if (sizeAttrGroup) {
      groups.push(...sizeAttrGroup.map((g) => ({
        size: g.value,
        stock: g.stock,
        variants: g.variants,
      })));
    }
    return groups;
  }, [attributeGroups]);

  const hasColorAttribute = colorGroups.length > 1 && colorGroups.some((g) => g.stock > 0);
  const hasSizeAttribute = sizeGroups.length > 1 && sizeGroups.some((g) => g.stock > 0);
  const needsColor = hasColorAttribute && !selectedColor;
  const needsSize = hasSizeAttribute && !selectedSize;
  const isVariationRequired = needsColor || needsSize;

  const unavailableAttributes = useMemo(() => {
    const unavailable = new Map<string, boolean>();
    if (!currentVariant || !product) return unavailable;
    
    currentVariant.options?.forEach((option) => {
      const attrKey = option.key || option.attribute;
      if (!attrKey) return;
      
      const attrGroup = attributeGroups.get(attrKey);
      if (!attrGroup) return;
      
      const attrValue = attrGroup.find((g) => {
        if (option.valueId && g.valueId) return g.valueId === option.valueId;
        return g.value?.toLowerCase().trim() === option.value?.toLowerCase().trim();
      });
      
      if (attrValue && attrValue.stock <= 0) {
        unavailable.set(attrKey, true);
      }
    });
    
    return unavailable;
  }, [currentVariant, attributeGroups, product]);

  const hasUnavailableAttributes = unavailableAttributes.size > 0;
  const canAddToCart = !isOutOfStock && !isVariationRequired && !hasUnavailableAttributes;

  return {
    price,
    originalPrice: fallbackOldPrice ?? null,
    compareAtPrice: compareAtPrice ?? null,
    discountPercent,
    isOutOfStock,
    colorGroups,
    sizeGroups,
    isVariationRequired,
    unavailableAttributes,
    hasUnavailableAttributes,
    canAddToCart,
  };
}




