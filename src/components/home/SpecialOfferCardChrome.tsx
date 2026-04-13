'use client';

import type { MouseEvent } from 'react';
import { Heart } from 'lucide-react';

import { CompareIcon } from '../icons/CompareIcon';

interface SpecialOfferWarrantyBadgeProps {
  line1: string;
  line2: string;
}

export function SpecialOfferWarrantyBadge({
  line1,
  line2,
}: SpecialOfferWarrantyBadgeProps) {
  return (
    <div className="absolute left-3 top-3 z-20 flex h-[43px] w-[81px] flex-col items-center justify-center rounded-2xl bg-[#1e1e1e] px-1 text-center font-bold leading-tight">
      <span className="text-[14px] text-marco-yellow">{line1}</span>
      <span className="text-[11px] text-white">{line2}</span>
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
}: SpecialOfferActionsStackProps) {
  return (
    <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onWishlist}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-marco-black shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        aria-label={wishlistAria}
      >
        <Heart
          className={`h-4 w-4 ${isInWishlist ? 'fill-red-600 text-red-600' : ''}`}
          strokeWidth={2}
        />
      </button>
      <button
        type="button"
        onClick={onCompare}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-marco-black text-white shadow-sm transition-colors hover:bg-marco-text"
        aria-label={compareAria}
      >
        <CompareIcon isActive={isInCompare} size={16} className="!text-white" />
      </button>
      {showDiscountPill ? (
        <div className="rounded-full bg-marco-yellow px-2 py-1 text-[10px] font-bold text-white">
          -{discountPercent}%
        </div>
      ) : null}
    </div>
  );
}
