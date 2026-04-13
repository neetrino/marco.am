'use client';

import type { MouseEvent } from 'react';
import { ShoppingCart } from 'lucide-react';

import { formatPrice } from '../../lib/currency';
import type { CurrencyCode } from '../../lib/currency';

interface SpecialOfferCardPricingProps {
  price: number;
  oldPrice: number | null;
  currency: CurrencyCode;
  inStock: boolean;
  isAddingToCart: boolean;
  addToCartAria: string;
  outOfStockAria: string;
  onAddToCart: (e: MouseEvent) => void;
}

export function SpecialOfferCardPricing({
  price,
  oldPrice,
  currency,
  inStock,
  isAddingToCart,
  addToCartAria,
  outOfStockAria,
  onAddToCart,
}: SpecialOfferCardPricingProps) {
  return (
    <div className="mt-3 flex items-end justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[20px] font-black leading-7 text-[#181111]">
          {formatPrice(price, currency)}
        </p>
        {oldPrice ? (
          <p className="text-[12px] text-gray-400 line-through">
            {formatPrice(oldPrice, currency)}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onAddToCart}
        disabled={!inStock || isAddingToCart}
        className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full border-4 border-white bg-marco-yellow text-white shadow-sm transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={inStock ? addToCartAria : outOfStockAria}
      >
        {isAddingToCart ? (
          <svg
            className="h-6 w-6 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <ShoppingCart className="h-7 w-7 text-white" strokeWidth={2} aria-hidden />
        )}
      </button>
    </div>
  );
}
