'use client';

import { useRouter } from 'next/navigation';
import { useState, type MouseEvent } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useWishlist } from '@/components/hooks/useWishlist';
import { useCompare } from '@/components/hooks/useCompare';
import { useAddToCart } from '@/components/hooks/useAddToCart';
import { useCurrency } from '@/components/hooks/useCurrency';
import type { CurrencyCode } from '@/lib/currency';
import type { SpecialOfferProduct } from './SpecialOfferProductCardTypes';

export interface CardLogic {
  currency: CurrencyCode;
  showPlaceholder: boolean;
  setImageError: (v: boolean) => void;
  strikePrice: number | null;
  isInWishlist: boolean;
  isInCompare: boolean;
  isAddingToCart: boolean;
  handleWishlist: (e: MouseEvent) => void;
  handleCompare: (e: MouseEvent) => void;
  handleCart: (e: MouseEvent) => void;
  t: (key: string) => string;
}

export function resolveStrikePrice(product: SpecialOfferProduct): number | null {
  if (product.originalPrice && product.originalPrice > product.price) {
    return product.originalPrice;
  }
  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    return product.compareAtPrice;
  }
  return null;
}

export function useSpecialOfferCardLogic(product: SpecialOfferProduct): CardLogic {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
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

  const handleWishlist = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push('/login?redirect=/products');
      return;
    }
    void toggleWishlist();
  };

  const handleCompare = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleCompare();
  };

  const handleCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void addToCart();
  };

  const showPlaceholder = !product.image || imageError;

  return {
    currency,
    showPlaceholder,
    setImageError,
    strikePrice: resolveStrikePrice(product),
    isInWishlist,
    isInCompare,
    isAddingToCart,
    handleWishlist,
    handleCompare,
    handleCart,
    t,
  };
}
