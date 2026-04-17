import type { MouseEvent } from 'react';
import { COMPARE_KEY } from '../types';
import { t } from '../../../../lib/i18n';
import type { LanguageCode } from '../../../../lib/language';
import { getApiOrErrorMessage } from '../../../../lib/api-client';
import {
  addWishlistItemClient,
  removeWishlistItemClient,
} from '@/lib/wishlist/wishlist-client';
import { logger } from '@/lib/utils/logger';

interface UseProductActionsProps {
  productId: string | null;
  isInWishlist: boolean;
  setIsInWishlist: (value: boolean) => void;
  isInCompare: boolean;
  setIsInCompare: (value: boolean) => void;
  setShowMessage: (message: string | null) => void;
  language: LanguageCode;
}

export function useProductActions({
  productId,
  isInWishlist,
  setIsInWishlist,
  isInCompare,
  setIsInCompare,
  setShowMessage,
  language,
}: UseProductActionsProps) {
  const handleAddToWishlist = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId || typeof window === 'undefined') return;

    try {
      if (isInWishlist) {
        await removeWishlistItemClient(productId, language);
        setIsInWishlist(false);
        setShowMessage(t(language, 'product.removedFromWishlist'));
      } else {
        await addWishlistItemClient(productId, language);
        setIsInWishlist(true);
        setShowMessage(t(language, 'product.addedToWishlist'));
      }

      setTimeout(() => setShowMessage(null), 2000);
    } catch (error: unknown) {
      logger.error('Wishlist update failed', { error });
      setShowMessage(
        getApiOrErrorMessage(error, t(language, 'common.alerts.invalidProduct'))
      );
      setTimeout(() => setShowMessage(null), 3000);
    }
  };

  const handleCompareToggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      const compare: string[] = stored ? JSON.parse(stored) : [];

      if (isInCompare) {
        localStorage.setItem(COMPARE_KEY, JSON.stringify(compare.filter((id) => id !== productId)));
        setIsInCompare(false);
        setShowMessage(t(language, 'product.removedFromCompare'));
      } else {
        if (compare.length >= 4) {
          setShowMessage(t(language, 'product.compareListFull'));
        } else {
          compare.push(productId);
          localStorage.setItem(COMPARE_KEY, JSON.stringify(compare));
          setIsInCompare(true);
          setShowMessage(t(language, 'product.addedToCompare'));
        }
      }

      setTimeout(() => setShowMessage(null), 2000);
      window.dispatchEvent(new Event('compare-updated'));
    } catch {
      /* ignore */
    }
  };

  return {
    handleAddToWishlist,
    handleCompareToggle,
  };
}
