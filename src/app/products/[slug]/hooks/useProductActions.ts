import type { MouseEvent } from 'react';
import { t } from '../../../../lib/i18n';
import type { LanguageCode } from '../../../../lib/language';
import { getApiOrErrorMessage, getErrorHttpStatus } from '../../../../lib/api-client';
import {
  addWishlistItemClient,
  removeWishlistItemClient,
} from '@/lib/wishlist/wishlist-client';
import { addCompareItemClient, removeCompareItemClient } from '@/lib/compare/compare-client';
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
      } else {
        await addWishlistItemClient(productId, language);
        setIsInWishlist(true);
      }
    } catch (error: unknown) {
      logger.error('Wishlist update failed', { error });
      void getApiOrErrorMessage(error, t(language, 'common.alerts.invalidProduct'));
    }
  };

  const handleCompareToggle = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId || typeof window === 'undefined') return;

    try {
      if (isInCompare) {
        await removeCompareItemClient(productId, language);
        setIsInCompare(false);
        setShowMessage(t(language, 'product.removedFromCompare'));
      } else {
        try {
          await addCompareItemClient(productId, language);
          setIsInCompare(true);
          setShowMessage(t(language, 'product.addedToCompare'));
        } catch (error: unknown) {
          if (getErrorHttpStatus(error) === 422) {
            setShowMessage(t(language, 'product.compareListFull'));
          } else {
            setShowMessage(t(language, 'common.alerts.invalidProduct'));
          }
        }
      }

      setTimeout(() => setShowMessage(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return {
    handleAddToWishlist,
    handleCompareToggle,
  };
}
