import { useState, useEffect, useCallback } from 'react';
import type { ProductVariant } from '../types';

/** Max qty shown before variant stock is resolved (PLP shell → PDP). */
const PENDING_VARIANT_MAX_QUANTITY = 99;

interface UseProductQuantityProps {
  currentVariant: ProductVariant | null;
  isOutOfStock: boolean;
  isVariationRequired: boolean;
}

export function useProductQuantity({
  currentVariant,
  isOutOfStock,
  isVariationRequired,
}: UseProductQuantityProps) {
  const [quantity, setQuantity] = useState(1);
  const maxQuantity =
    currentVariant?.stock && currentVariant.stock > 0
      ? currentVariant.stock
      : isOutOfStock
        ? 0
        : PENDING_VARIANT_MAX_QUANTITY;

  useEffect(() => {
    if (currentVariant && currentVariant.stock <= 0) {
      setQuantity(0);
      return;
    }

    if (!currentVariant) {
      setQuantity(isOutOfStock ? 0 : 1);
      return;
    }

    setQuantity((prev) => {
      const currentStock = currentVariant.stock;
      if (prev > currentStock) {
        return currentStock;
      }
      if (prev <= 0 && currentStock > 0) {
        return 1;
      }
      return prev;
    });
  }, [currentVariant?.id, currentVariant?.stock, currentVariant, isOutOfStock]);

  const adjustQuantity = useCallback((delta: number) => {
    if (isOutOfStock || isVariationRequired) {
      return;
    }

    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) {
        return isOutOfStock ? 0 : 1;
      }
      return next > maxQuantity ? maxQuantity : next;
    });
  }, [isOutOfStock, isVariationRequired, maxQuantity]);

  return { quantity, setQuantity, maxQuantity, adjustQuantity };
}




