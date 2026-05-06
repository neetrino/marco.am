'use client';

import type { MouseEvent } from 'react';
import { Heart } from 'lucide-react';

import { CompareIcon } from '../icons/CompareIcon';
import {
  SPECIAL_OFFERS_ACTIONS_STACK_MOBILE_GRID_EXTRA_RIGHT_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_RIGHT_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_TOP_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_RIGHT_FROM_CARD_OUTER_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_SHIFT_LEFT_PX,
  SPECIAL_OFFERS_ACTIONS_STACK_TOP_FROM_CARD_OUTER_PX,
  SPECIAL_OFFERS_WARRANTY_BADGE_ACCENT,
  SPECIAL_OFFERS_WARRANTY_BADGE_BG,
  SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_MOBILE_GRID_PX,
  SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_PX,
  SPECIAL_OFFERS_WARRANTY_BADGE_MIN_HEIGHT_PX,
  SPECIAL_OFFERS_WARRANTY_BADGE_MIN_WIDTH_PX,
  SPECIAL_OFFERS_WARRANTY_BADGE_RADIUS_PX,
  SPECIAL_OFFERS_WARRANTY_BADGE_TOP_INSET_PX,
} from './home-special-offers.constants';

interface SpecialOfferWarrantyBadgeProps {
  line1: string;
  line2: string;
  layout?: 'default' | 'mobileGrid' | 'homeGrid';
}

export function SpecialOfferWarrantyBadge({
  line1,
  line2,
  layout = 'default',
}: SpecialOfferWarrantyBadgeProps) {
  const leftInsetPx =
    layout === 'mobileGrid'
      ? SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_MOBILE_GRID_PX
      : SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_PX;

  return (
    <div
      className="absolute z-30 flex flex-col items-center justify-center px-2 py-1 text-center font-bold not-italic"
      style={{
        left: leftInsetPx,
        top: SPECIAL_OFFERS_WARRANTY_BADGE_TOP_INSET_PX,
        minWidth: SPECIAL_OFFERS_WARRANTY_BADGE_MIN_WIDTH_PX,
        minHeight: SPECIAL_OFFERS_WARRANTY_BADGE_MIN_HEIGHT_PX,
        borderRadius: SPECIAL_OFFERS_WARRANTY_BADGE_RADIUS_PX,
        backgroundColor: SPECIAL_OFFERS_WARRANTY_BADGE_BG,
      }}
    >
      <span
        className="whitespace-nowrap text-[14px] leading-[15px]"
        style={{ color: SPECIAL_OFFERS_WARRANTY_BADGE_ACCENT }}
      >
        {line1}
      </span>
      <span className="text-[11px] leading-[15px] text-white">{line2}</span>
    </div>
  );
}

interface SpecialOfferActionsStackProps {
  showDiscountPill: boolean;
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
  const rightPx =
    SPECIAL_OFFERS_ACTIONS_STACK_RIGHT_FROM_CARD_OUTER_PX -
    SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_RIGHT_PX +
    SPECIAL_OFFERS_ACTIONS_STACK_SHIFT_LEFT_PX +
    (layout === 'mobileGrid' ? SPECIAL_OFFERS_ACTIONS_STACK_MOBILE_GRID_EXTRA_RIGHT_PX : 0);

  return (
    <div
      className={`absolute z-50 flex flex-col items-end gap-2${disabled ? ' pointer-events-none opacity-40' : ''}`}
      aria-hidden={disabled || undefined}
      style={{
        top:
          SPECIAL_OFFERS_ACTIONS_STACK_TOP_FROM_CARD_OUTER_PX -
          SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_TOP_PX,
        right: rightPx,
      }}
    >
      <button
        type="button"
        onClick={onWishlist}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-marco-black text-white shadow-sm transition-colors hover:bg-marco-text"
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
        className="flex h-8 w-8 items-center justify-center rounded-full bg-marco-black text-white shadow-sm transition-colors hover:bg-marco-text"
        aria-label={compareAria}
      >
        <CompareIcon
          isActive={isInCompare}
          size={16}
          className={isInCompare ? 'text-marco-yellow' : 'text-white'}
        />
      </button>
      {showDiscountPill ? (
        <div className="rounded-full bg-marco-yellow px-2 py-1 text-[10px] font-bold text-white">
          -{discountPercent}%
        </div>
      ) : null}
    </div>
  );
}
