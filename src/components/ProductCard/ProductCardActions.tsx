'use client';

import type { MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { CompareIcon } from '../icons/CompareIcon';
import { HeaderNavbarCartIcon } from '../icons/HeaderNavbarCartIcon';
import { useTranslation } from '../../lib/i18n-client';

interface ProductCardActionsProps {
  isInWishlist: boolean;
  isInCompare: boolean;
  isAddingToCart: boolean;
  inStock: boolean;
  isCompact?: boolean;
  onWishlistToggle: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  onAddToCart: (e: MouseEvent) => void;
  showOnHover?: boolean;
}

/**
 * Component for product action buttons (wishlist, compare, cart)
 */
export function ProductCardActions({
  isInWishlist,
  isInCompare,
  isAddingToCart,
  inStock,
  isCompact = false,
  onWishlistToggle,
  onCompareToggle,
  onAddToCart,
  showOnHover = false,
}: ProductCardActionsProps) {
  const { t } = useTranslation();
  const buttonSize = isCompact ? 'w-10 h-10' : 'w-12 h-12';
  const actionsGapClass = isCompact ? 'gap-2' : 'gap-3';

  const actions = (
    <>
      {/* Compare Icon */}
      <button
        type="button"
        onClick={onCompareToggle}
        className={`${buttonSize} rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          isInCompare
            ? 'border-marco-yellow bg-marco-yellow text-marco-black shadow-lg dark:border-marco-yellow dark:bg-marco-yellow dark:!text-[#050505]'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-marco-black dark:bg-marco-black dark:text-white dark:hover:border-marco-black dark:hover:bg-marco-black'
        }`}
        title={isInCompare ? t('common.messages.removedFromCompare') : t('common.messages.addedToCompare')}
        aria-label={isInCompare ? t('common.ariaLabels.removeFromCompare') : t('common.ariaLabels.addToCompare')}
      >
        <CompareIcon isActive={isInCompare} size={isCompact ? 16 : 18} />
      </button>

      {/* Wishlist Icon */}
      <button
        type="button"
        onClick={onWishlistToggle}
        className={`${buttonSize} rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          isInWishlist
            ? 'border-red-600 bg-red-600 text-white shadow-lg dark:border-red-600 dark:bg-red-600 dark:text-white'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-marco-black dark:bg-marco-black dark:text-white dark:hover:border-marco-black dark:hover:bg-marco-black'
        }`}
        title={isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')}
        aria-label={isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')}
      >
        <Heart
          className={`${isCompact ? 'h-[18px] w-[18px]' : 'h-6 w-6'} ${
            isInWishlist ? 'fill-current' : 'fill-none'
          }`}
          strokeWidth={2}
        />
      </button>
    </>
  );

  if (showOnHover) {
    return (
      <div className={`absolute ${isCompact ? 'top-1.5 right-1.5' : 'top-3 right-3'} flex flex-col ${actionsGapClass} opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}>
        {actions}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${actionsGapClass}`}>
      {actions}
      {/* Cart Icon */}
      <button
        type="button"
        onClick={onAddToCart}
        disabled={!inStock || isAddingToCart}
        className={`${buttonSize} rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          inStock && !isAddingToCart
            ? 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-marco-black dark:bg-marco-black dark:text-white dark:hover:border-marco-black dark:hover:bg-marco-black'
            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-[#1f1f1f] dark:bg-[#1f1f1f] dark:text-white/40'
        }`}
        title={inStock ? t('common.buttons.addToCart') : t('common.stock.outOfStock')}
        aria-label={inStock ? t('common.ariaLabels.addToCart') : t('common.ariaLabels.outOfStock')}
      >
        {isAddingToCart ? (
          <svg className={`animate-spin ${isCompact ? 'h-5 w-5' : 'h-6 w-6'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <HeaderNavbarCartIcon className={isCompact ? 'h-[18px] w-[18px]' : 'h-[22px] w-[21px]'} />
        )}
      </button>
    </div>
  );
}



