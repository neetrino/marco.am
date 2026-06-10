import { useMemo } from 'react';
import type { Product, ProductVariant, AttributeGroupValue } from '../types';

interface UseProductCalculationsProps {
  product: Product | null;
  currentVariant: ProductVariant | null;
  attributeGroups: Map<string, AttributeGroupValue[]>;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedAttributeValues: Map<string, string>;
}

export function useProductCalculations({
  product,
  currentVariant,
  attributeGroups,
  selectedColor,
  selectedSize,
  selectedAttributeValues,
}: UseProductCalculationsProps) {
  const variantCurrentPrice = currentVariant?.currentPrice ?? currentVariant?.price ?? 0;
  const fallbackCurrentPrice =
    product?.currentPrice ?? product?.pricing?.currentPrice ?? 0;
  const price = variantCurrentPrice > 0 ? variantCurrentPrice : fallbackCurrentPrice;
  const originalPrice =
    currentVariant?.oldPrice ??
    currentVariant?.originalPrice ??
    product?.oldPrice ??
    product?.pricing?.oldPrice;
  const compareAtPrice = currentVariant?.compareAtPrice ?? null;
  const fallbackOldPrice =
    originalPrice ??
    (typeof compareAtPrice === 'number' && compareAtPrice > variantCurrentPrice ? compareAtPrice : null);
  const isSpecialPrice =
    currentVariant?.discountBadge?.type === 'special_price' ||
    product?.discountBadge?.type === 'special_price' ||
    product?.pricing?.discountBadge?.type === 'special_price';
  const inferredDiscountPercent =
    !isSpecialPrice &&
    fallbackOldPrice &&
    fallbackOldPrice > variantCurrentPrice
      ? Math.round(((fallbackOldPrice - variantCurrentPrice) / fallbackOldPrice) * 100)
      : null;
  const discountPercent = isSpecialPrice
    ? null
    : currentVariant?.discountBadge?.type === 'percentage'
      ? currentVariant.discountBadge.value
      : product?.discountBadge?.type === 'percentage'
        ? product.discountBadge.value
        : currentVariant?.productDiscount ??
          product?.productDiscount ??
          inferredDiscountPercent;
  const isOutOfStock = currentVariant ? currentVariant.stock <= 0 : true;

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

  const isValueSelectedForAttribute = (attrKey: string): boolean => {
    if (attrKey === 'color') {
      return Boolean(selectedColor);
    }
    if (attrKey === 'size') {
      return Boolean(selectedSize);
    }
    return Boolean(selectedAttributeValues.get(attrKey));
  };

  const isVariationRequired = Array.from(attributeGroups.entries()).some(([attrKey, values]) => {
    const hasSelectableValues = values.length > 1 && values.some((value) => value.stock > 0);
    if (!hasSelectableValues) {
      return false;
    }
    return !isValueSelectedForAttribute(attrKey);
  });

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
    isSpecialPrice,
    isOutOfStock,
    colorGroups,
    sizeGroups,
    isVariationRequired,
    unavailableAttributes,
    hasUnavailableAttributes,
    canAddToCart,
  };
}




