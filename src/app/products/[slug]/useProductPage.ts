'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStoredCurrency } from '../../../lib/currency';
import { getStoredLanguage, type LanguageCode } from '../../../lib/language';
import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';
import type { CurrencyCode } from '../../../lib/currency';
import { t } from '../../../lib/i18n';
import type { Product } from './types';
import { useAttributeGroups } from './useAttributeGroups';
import { useProductImages } from './hooks/useProductImages';
import { buildGalleryStubProduct } from './buildGalleryStubProduct';
import { useProductFetch } from './hooks/useProductFetch';
import { useWishlistCompare } from './hooks/useWishlistCompare';
import { useReviews } from '../../../components/ProductReviews/hooks/useReviews';
import { useVariantSelection } from './hooks/useVariantSelection';
import { useProductActions } from './hooks/useProductActions';
import { useProductQuantity } from './hooks/useProductQuantity';
import { useProductCalculations } from './hooks/useProductCalculations';

export type UseProductPageInput = {
  /** Raw `[slug]` segment (may include `:variantId`). */
  slugParam: string;
  serverLanguage: LanguageCode;
  initialVisual: PdpVisualPayload | null;
  initialProduct: Product | null;
};

export function useProductPage({
  slugParam,
  serverLanguage,
  initialVisual,
  initialProduct,
}: UseProductPageInput) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Keep first SSR and client render identical to prevent hydration mismatch.
  const [currency, setCurrency] = useState<CurrencyCode>('AMD');
  const [language, setLanguage] = useState<LanguageCode>(() => serverLanguage);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showMessage, setShowMessage] = useState<string | null>(null);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);

  const slugParts = slugParam.includes(':') ? slugParam.split(':') : [slugParam];
  const slug = slugParts[0] ?? '';
  const variantIdFromUrl = slugParts.length > 1 ? slugParts[1] : null;

  const {
    product,
    productVisual,
    blockingEmpty,
    detailsPending,
    loading,
  } = useProductFetch({
    slug,
    variantIdFromUrl,
    serverLanguage,
    initialVisual,
    initialProduct,
  });

  const displayProduct = useMemo(() => {
    if (product) {
      return product;
    }
    if (productVisual) {
      return buildGalleryStubProduct(productVisual);
    }
    return null;
  }, [product, productVisual]);

  const images = useProductImages(displayProduct);

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
  });

  const { quantity, setQuantity: _setQuantity, maxQuantity, adjustQuantity } = useProductQuantity({
    currentVariant,
    isOutOfStock,
    isVariationRequired,
  });

  const { isInWishlist, setIsInWishlist, isInCompare, setIsInCompare } = useWishlistCompare({
    productId: displayProduct?.id || null,
  });

  const {
    reviews,
    aggregate,
    loading: reviewsLoading,
    loadReviews: reloadProductReviews,
  } = useReviews(displayProduct?.id ?? undefined, slug || undefined);

  const averageRating = aggregate.averageRating;
  const reviewCount = aggregate.reviewCount;

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
    if (images.length > 0 && currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

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

  const scrollToReviews = useCallback(() => {
    const reviewsElement = document.getElementById('product-reviews');
    if (reviewsElement) {
      reviewsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const getRequiredAttributesMessage = (): string => {
    const needsColor = colorGroups.length > 0 && colorGroups.some(g => g.stock > 0) && !selectedColor;
    const needsSize = sizeGroups.length > 0 && sizeGroups.some(g => g.stock > 0) && !selectedSize;
    
    if (needsColor && needsSize) return t(language, 'product.selectColorAndSize');
    if (needsColor) return t(language, 'product.selectColor');
    if (needsSize) return t(language, 'product.selectSize');
    return t(language, 'product.selectOptions');
  };

  return {
    product,
    productVisual,
    displayProduct,
    blockingEmpty,
    detailsPending,
    loading,
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
    reviews,
    aggregate,
    reviewsLoading,
    reloadProductReviews,
    averageRating,
    reviewCount,
    slug,
    attributeGroups,
    colorGroups,
    sizeGroups,
    currentVariant,
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    maxQuantity,
    isOutOfStock,
    isVariationRequired,
    hasUnavailableAttributes,
    unavailableAttributes,
    canAddToCart,
    scrollToReviews,
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
