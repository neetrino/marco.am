'use client';

import type { MouseEvent } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { Heart } from 'lucide-react';

import { CompareIcon } from '../icons/CompareIcon';
import {
  SPECIAL_OFFERS_ACTIONS_STACK_INSET_RIGHT_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_INSET_TOP_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_MOBILE_GRID_EXTRA_RIGHT_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_RIGHT_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_TOP_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_SHIFT_LEFT_PX,
  SPECIAL_OFFERS_CARD_PADDING_TOP_CSS_VAR,
  SPECIAL_OFFERS_CARD_PADDING_TOP_PX,
  SPECIAL_OFFERS_CARD_PADDING_X_CSS_VAR,
  SPECIAL_OFFERS_CARD_PADDING_X_PX,
  SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_MOBILE_GRID_PX,
  SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_PX,
  SPECIAL_OFFERS_WARRANTY_BADGE_TOP_INSET_PX,
} from './home-special-offers.constants';
import { MARCO_SLATE_ICON_CHIP_CLASS } from '@/lib/constants/marco-brand-colors';
import { ProductWarrantyBadge } from '@/components/ProductCard/ProductWarrantyBadge';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';

interface SpecialOfferWarrantyBadgeProps {
  years: ProductWarrantyYears;
  layout?: 'default' | 'mobileGrid' | 'homeGrid';
}

export function SpecialOfferWarrantyBadge({
  years,
  layout = 'default',
}: SpecialOfferWarrantyBadgeProps) {
  const leftInsetPx =
    layout === 'mobileGrid'
      ? SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_MOBILE_GRID_PX
      : SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_PX;

  return (
    <div
      className="absolute z-30"
      style={{
        left: leftInsetPx,
        top: SPECIAL_OFFERS_WARRANTY_BADGE_TOP_INSET_PX,
      }}
    >
      <ProductWarrantyBadge years={years} size="promo" />
    </div>
  );
}

interface SpecialOfferActionsStackProps {
  showDiscountPill: boolean;
  isSpecialPrice?: boolean;
  discountPercent: number | null | undefined;
  isInWishlist: boolean;
  isInCompare: boolean;
  wishlistAria: string;
  compareAria: string;
  onWishlist: (e: MouseEvent) => void;
  onCompare: (e: MouseEvent) => void;
  layout?: 'default' | 'mobileGrid' | 'homeGrid';
  /** Pre-paint listing shells — hide hit targets without removing layout. */
  disabled?: boolean;
}

export function SpecialOfferActionsStack({
  showDiscountPill,
  isSpecialPrice = false,
  discountPercent,
  isInWishlist,
  isInCompare,
  wishlistAria,
  compareAria,
  onWishlist,
  onCompare,
  layout = 'default',
  disabled = false,
}: SpecialOfferActionsStackProps) {
  const { t } = useTranslation();
  const topOffsetPx =
    SPECIAL_OFFERS_ACTIONS_STACK_INSET_TOP_PX - SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_TOP_PX;
  const rightOffsetPx =
    SPECIAL_OFFERS_ACTIONS_STACK_INSET_RIGHT_PX -
    SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_RIGHT_PX +
    SPECIAL_OFFERS_ACTIONS_STACK_SHIFT_LEFT_PX +
    (layout === 'mobileGrid' ? SPECIAL_OFFERS_ACTIONS_STACK_MOBILE_GRID_EXTRA_RIGHT_PX : 0);

  return (
    <div
      className={`absolute z-50 flex flex-col items-end gap-2${disabled ? ' pointer-events-none opacity-40' : ''}`}
      aria-hidden={disabled || undefined}
      style={{
        top: `calc(var(${SPECIAL_OFFERS_CARD_PADDING_TOP_CSS_VAR}, ${SPECIAL_OFFERS_CARD_PADDING_TOP_PX}px) + ${topOffsetPx}px)`,
        right: `calc(var(${SPECIAL_OFFERS_CARD_PADDING_X_CSS_VAR}, ${SPECIAL_OFFERS_CARD_PADDING_X_PX}px) + ${rightOffsetPx}px)`,
      }}
    >
      <button
        type="button"
        onClick={onWishlist}
        className={`flex h-8 w-8 items-center justify-center rounded-full ${MARCO_SLATE_ICON_CHIP_CLASS}`}
        aria-label={wishlistAria}
      >
        <Heart
          className={`h-4 w-4 ${
            isInWishlist
              ? 'fill-red-500 text-red-500'
              : 'fill-none text-white'
          }`}
          strokeWidth={2}
        />
      </button>
      <button
        type="button"
        onClick={onCompare}
        className={`flex h-8 w-8 items-center justify-center rounded-full ${MARCO_SLATE_ICON_CHIP_CLASS}`}
        aria-label={compareAria}
      >
        <CompareIcon
          isActive={isInCompare}
          size={16}
          className={isInCompare ? 'text-marco-yellow' : 'text-white'}
        />
      </button>
      {showDiscountPill ? (
        <div className="max-w-[88px] rounded-full bg-marco-yellow px-2 py-1 text-center text-[10px] font-bold leading-tight text-white">
          {isSpecialPrice ? t('products.pricing.special_price') : `-${discountPercent}%`}
        </div>
      ) : null}
    </div>
  );
}
