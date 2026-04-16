'use client';

import type { MouseEvent } from 'react';

import { formatPrice } from '../../lib/currency';
import type { CurrencyCode } from '../../lib/currency';
import {
  SpecialOfferCartFigmaCircle,
  SpecialOfferCartFigmaIcon,
} from './SpecialOfferCartFigmaArt';
import {
  SPECIAL_OFFERS_CART_BUTTON_SIZE_PX,
  SPECIAL_OFFERS_CART_BUTTON_SPINNER_PX,
  SPECIAL_OFFERS_OLD_PRICE_FONT_SIZE_PX,
  SPECIAL_OFFERS_PRICE_FONT_SIZE_PX,
  SPECIAL_OFFERS_PRICE_LINE_HEIGHT_PX,
} from './home-special-offers.constants';

interface SpecialOfferCardPricingProps {
  price: number;
  oldPrice: number | null;
  currency: CurrencyCode;
}

export function SpecialOfferCardPricing({
  price,
  oldPrice,
  currency,
}: SpecialOfferCardPricingProps) {
  return (
    <div className="min-w-0 max-md:pr-0 md:[padding-right:var(--special-offers-price-pad-end)]">
      <p
        className="font-black text-[#181111]"
        style={{
          fontSize: SPECIAL_OFFERS_PRICE_FONT_SIZE_PX,
          lineHeight: `${SPECIAL_OFFERS_PRICE_LINE_HEIGHT_PX}px`,
        }}
      >
        {formatPrice(price, currency)}
      </p>
      {oldPrice ? (
        <p
          className="text-gray-400 line-through"
          style={{ fontSize: SPECIAL_OFFERS_OLD_PRICE_FONT_SIZE_PX }}
        >
          {formatPrice(oldPrice, currency)}
        </p>
      ) : null}
    </div>
  );
}

interface SpecialOfferCartFloatingButtonProps {
  inStock: boolean;
  isAddingToCart: boolean;
  addToCartAria: string;
  outOfStockAria: string;
  onAddToCart: (e: MouseEvent) => void;
}

/**
 * Absolutely positioned at the bottom-right of the card — does not affect card height.
 */
export function SpecialOfferCartFloatingButton({
  inStock,
  isAddingToCart,
  addToCartAria,
  outOfStockAria,
  onAddToCart,
}: SpecialOfferCartFloatingButtonProps) {
  return (
    <div className="pointer-events-none absolute max-md:z-50 max-md:bottom-[var(--so-cart-bottom-mobile)] max-md:left-1/2 max-md:right-auto max-md:-translate-x-1/2 md:z-30 md:bottom-[var(--so-cart-bottom-desktop)] md:left-auto md:right-[var(--so-cart-right-desktop)] md:translate-x-0">
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!inStock || isAddingToCart}
          className="relative flex items-center justify-center overflow-hidden rounded-full shadow-sm transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            width: SPECIAL_OFFERS_CART_BUTTON_SIZE_PX,
            height: SPECIAL_OFFERS_CART_BUTTON_SIZE_PX,
          }}
          aria-label={inStock ? addToCartAria : outOfStockAria}
        >
          {isAddingToCart ? (
            <>
              <SpecialOfferCartFigmaCircle />
              <svg
                className="relative z-10 animate-spin text-white"
                style={{
                  width: SPECIAL_OFFERS_CART_BUTTON_SPINNER_PX,
                  height: SPECIAL_OFFERS_CART_BUTTON_SPINNER_PX,
                }}
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
            </>
          ) : (
            <>
              <SpecialOfferCartFigmaCircle />
              <SpecialOfferCartFigmaIcon />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
