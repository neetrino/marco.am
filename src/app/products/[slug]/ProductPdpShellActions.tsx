'use client';

import { useCallback, useState } from 'react';

import { getStoredLanguage } from '@/lib/language';
import { t } from '@/lib/i18n';

import { useProductActions } from './hooks/useProductActions';
import { useWishlistCompare } from './hooks/useWishlistCompare';
import { ProductPurchaseActions } from './ProductPurchaseActions';
import type { Product } from './types';

/** Fallback max qty before variant stock is known (PLP → PDP instant paint). */
const SHELL_PAINT_MAX_QUANTITY = 99;

type ProductPdpShellActionsProps = {
  shell: Product;
  price: number;
};

export function ProductPdpShellActions({ shell, price }: ProductPdpShellActionsProps) {
  const language = getStoredLanguage();
  const [quantity, setQuantity] = useState(1);
  const [showMessage, setShowMessage] = useState<string | null>(null);
  const isOutOfStock = shell.inStock === false;
  const maxQuantity = isOutOfStock ? 0 : SHELL_PAINT_MAX_QUANTITY;

  const { isInWishlist, setIsInWishlist, isInCompare, setIsInCompare } = useWishlistCompare({
    productId: shell.id,
  });

  const { handleAddToWishlist, handleCompareToggle } = useProductActions({
    productId: shell.id,
    isInWishlist,
    setIsInWishlist,
    isInCompare,
    setIsInCompare,
    setShowMessage,
    language,
  });

  const adjustQuantity = useCallback(
    (delta: number) => {
      if (isOutOfStock) {
        return;
      }
      setQuantity((prev) => {
        const next = prev + delta;
        if (next < 1) {
          return 1;
        }
        return next > maxQuantity ? maxQuantity : next;
      });
    },
    [isOutOfStock, maxQuantity],
  );

  const getRequiredAttributesMessage = (): string => t(language, 'product.selectOptions');

  return (
    <ProductPurchaseActions
      language={language}
      price={price}
      quantity={quantity}
      maxQuantity={maxQuantity}
      isOutOfStock={isOutOfStock}
      isVariationRequired={false}
      hasUnavailableAttributes={false}
      canAddToCart={!isOutOfStock && price > 0}
      isAddingToCart={false}
      isInWishlist={isInWishlist}
      isInCompare={isInCompare}
      showMessage={showMessage}
      onQuantityAdjust={adjustQuantity}
      onAddToCart={() => {}}
      onAddToWishlist={handleAddToWishlist}
      onCompareToggle={handleCompareToggle}
      getRequiredAttributesMessage={getRequiredAttributesMessage}
    />
  );
}
