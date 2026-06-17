'use client';

import { useState, useEffect, useRef } from 'react';
import { getStoredCurrency } from '../../../lib/currency';
import { getStoredLanguage, type LanguageCode } from '../../../lib/language';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';
import { normalizeUrlForComparison } from '@/lib/utils/image-utils';
import type { CurrencyCode } from '../../../lib/currency';
import { t } from '../../../lib/i18n';
import { useAttributeGroups } from './useAttributeGroups';
import { useProductImages } from './hooks/useProductImages';
import { useProductFetch } from './hooks/useProductFetch';
import { useWishlistCompare } from './hooks/useWishlistCompare';
import { useVariantSelection } from './hooks/useVariantSelection';
import { useProductActions } from './hooks/useProductActions';
import { useProductQuantity } from './hooks/useProductQuantity';
import { useProductCalculations } from './hooks/useProductCalculations';

export type UseProductPageInput = {
  slugParam: string;
  serverLanguage: LanguageCode;
};

export function useProductPage({
  slugParam,
  serverLanguage,
}: UseProductPageInput) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>('AMD');
  const [language, setLanguage] = useState<LanguageCode>(() => serverLanguage);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showMessage, setShowMessage] = useState<string | null>(null);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const lastGalleryUrlRef = useRef<string | null>(null);

  let decodedSlugParam = slugParam;
  try {
    decodedSlugParam = decodeURIComponent(slugParam);
  } catch {
    decodedSlugParam = slugParam;
  }
  const slugParts = decodedSlugParam.includes(':')
    ? decodedSlugParam.split(':')
    : [decodedSlugParam];
  const slug = normalizePdpSlug(slugParts[0] ?? decodedSlugParam);
  const variantIdFromUrl = slugParts.length > 1 ? slugParts[1] ?? null : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const {
    product,
    blockingEmpty,
    detailsPending,
    loading,
    isListingShell,
  } = useProductFetch({
    slug,
    serverLanguage,
  });

  const displayProduct = product;
  const images = useProductImages(displayProduct);

  useEffect(() => {
    if (images.length === 0) {
      setCurrentImageIndex(0);
      lastGalleryUrlRef.current = null;
      return;
    }

    const lastUrl = lastGalleryUrlRef.current;
    if (lastUrl) {
      const preservedIndex = images.findIndex(
        (url) => normalizeUrlForComparison(url) === normalizeUrlForComparison(lastUrl),
      );
      if (preservedIndex >= 0) {
        setCurrentImageIndex(preservedIndex);
        lastGalleryUrlRef.current = images[preservedIndex] ?? null;
        return;
      }
    }

    setCurrentImageIndex((prev) => {
      const next = Math.min(prev, images.length - 1);
      lastGalleryUrlRef.current = images[next] ?? null;
      return next;
    });
  }, [images]);

  useEffect(() => {
    lastGalleryUrlRef.current = images[currentImageIndex] ?? null;
  }, [currentImageIndex, images]);

  const {
    selectedVariant,
    setSelectedVariant,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
    currentVariant,
    getOptionValue,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
  } = useVariantSelection({
    product: displayProduct,
    images,
    setCurrentImageIndex,
  });

  const attributeGroups = useAttributeGroups({
    product: displayProduct,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
  });

  const {
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    isSpecialPrice,
    isOutOfStock,
    colorGroups,
    sizeGroups,
    isVariationRequired,
    unavailableAttributes,
    hasUnavailableAttributes,
    canAddToCart,
  } = useProductCalculations({
    product: displayProduct,
    currentVariant,
    attributeGroups,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
  });

  const { quantity, setQuantity: _setQuantity, maxQuantity, adjustQuantity } = useProductQuantity({
    currentVariant,
    isOutOfStock,
    isVariationRequired,
  });

  const { isInWishlist, setIsInWishlist, isInCompare, setIsInCompare } = useWishlistCompare({
    productId: displayProduct?.id || null,
  });

  const { handleAddToWishlist, handleCompareToggle } = useProductActions({
    productId: displayProduct?.id || null,
    isInWishlist,
    setIsInWishlist,
    isInCompare,
    setIsInCompare,
    setShowMessage,
    language,
  });

  useEffect(() => {
    setLanguage(getStoredLanguage());
    const handleLanguageUpdate = () => {
      setLanguage(getStoredLanguage());
    };
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, []);

  useEffect(() => {
    setCurrency(getStoredCurrency());
    const handleCurrencyUpdate = () => setCurrency(getStoredCurrency());
    const handleCurrencyRatesUpdate = () => setCurrency(getStoredCurrency());
    
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, []);

  useEffect(() => {
    if (
      product &&
      product.variants &&
      product.variants.length > 0 &&
      variantIdFromUrl
    ) {
      const variantById = product.variants.find(
        (v) => v.id === variantIdFromUrl || v.id.endsWith(variantIdFromUrl),
      );
      const variantByIndex = product.variants[parseInt(variantIdFromUrl, 10) - 1];
      const initialVariant = variantById || variantByIndex || product.variants[0];
      setSelectedVariant(initialVariant);
      setCurrentImageIndex(0);
      setThumbnailStartIndex(0);
    }
  }, [product, variantIdFromUrl, setSelectedVariant]);

  const getRequiredAttributesMessage = (): string => {
    const needsColor = colorGroups.length > 1 && colorGroups.some((g) => g.stock > 0) && !selectedColor;
    const needsSize = sizeGroups.length > 1 && sizeGroups.some((g) => g.stock > 0) && !selectedSize;
    
    if (needsColor && needsSize) return t(language, 'product.selectColorAndSize');
    if (needsColor) return t(language, 'product.selectColor');
    if (needsSize) return t(language, 'product.selectSize');
    return t(language, 'product.selectOptions');
  };

  return {
    product,
    displayProduct,
    blockingEmpty,
    detailsPending,
    loading,
    isListingShell,
    images,
    currentImageIndex,
    setCurrentImageIndex,
    thumbnailStartIndex,
    setThumbnailStartIndex,
    currency,
    language,
    selectedVariant,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
    isAddingToCart,
    setIsAddingToCart,
    showMessage,
    setShowMessage,
    isInWishlist,
    isInCompare,
    quantity,
    slug,
    attributeGroups,
    colorGroups,
    sizeGroups,
    currentVariant,
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    isSpecialPrice,
    maxQuantity,
    isOutOfStock,
    isVariationRequired,
    hasUnavailableAttributes,
    unavailableAttributes,
    canAddToCart,
    getOptionValue,
    adjustQuantity,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
    handleAddToWishlist,
    handleCompareToggle,
    getRequiredAttributesMessage,
  };
}
