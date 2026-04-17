'use client';

import { useState, type MouseEvent } from 'react';

import { useCurrency } from '../hooks/useCurrency';
import { useWishlist } from '../hooks/useWishlist';
import { useCompare } from '../hooks/useCompare';
import { useAddToCart } from '../hooks/useAddToCart';
import { useTranslation } from '../../lib/i18n-client';

import type { SpecialOfferProduct } from './special-offer-product.types';

export interface UseSpecialOfferCardOptions {
  /**
   * When set, missing API images still show a real image (e.g. unified nature asset);
   * placeholder only if this URL fails to load.
   */
  guaranteedImageSrc?: string | null;
}

/**
 * Wishlist, compare, cart, and image error state for SpecialOfferCard.
 */
export function useSpecialOfferCard(
  product: SpecialOfferProduct,
  options?: UseSpecialOfferCardOptions,
) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const { isInWishlist, toggleWishlist } = useWishlist(product.id);
  const { isInCompare, toggleCompare } = useCompare(product.id);
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: product.id,
    productSlug: product.slug,
    inStock: product.inStock,
    defaultVariantId: product.defaultVariantId ?? undefined,
    price: product.price,
  });
  const [imageError, setImageError] = useState(false);

  const showDiscountPill =
    product.discountPercent != null && product.discountPercent > 0;

  const oldPrice =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice
      : product.compareAtPrice && product.compareAtPrice > product.price
        ? product.compareAtPrice
        : null;

  const handleWishlist = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleWishlist();
  };

  const handleCompare = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare();
  };

  const handleCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart();
  };

  const hasGallery =
    Boolean(options?.guaranteedImageSrc) ||
    (product.images && product.images.length > 0) ||
    Boolean(product.image);
  const showPlaceholder = !hasGallery || imageError;

  return {
    t,
    currency,
    isInWishlist,
    isInCompare,
    isAddingToCart,
    showDiscountPill,
    oldPrice,
    handleWishlist,
    handleCompare,
    handleCart,
    showPlaceholder,
    onImageError: () => {
      setImageError(true);
    },
    wishlistAria: isInWishlist
      ? t('common.ariaLabels.removeFromWishlist')
      : t('common.ariaLabels.addToWishlist'),
    compareAria: isInCompare
      ? t('common.ariaLabels.removeFromCompare')
      : t('common.ariaLabels.addToCompare'),
  };
}
