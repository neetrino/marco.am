'use client';

import type { MouseEvent } from 'react';
import { ArrowUpRight, Heart } from 'lucide-react';

import { CompareIcon } from '@/components/icons/CompareIcon';
import { HEADER_FIGMA_PILL_RADIUS_CLASS } from '@/components/header/header.constants';
import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';

/** Buy CTA — taller row; trailing circle with light left nudge (−4px). */
const PRODUCT_BUY_CTA_HEIGHT_CLASS = 'h-12';
const PRODUCT_BUY_CTA_ICON_PX = 36;
const PRODUCT_BUY_CTA_ICON_NUDGE_LEFT_CLASS = 'translate-x-2';
/** Keeps CTA label on one line next to icons without stretching full width. */
const PRODUCT_BUY_CTA_LABEL_MAX_WIDTH_CLASS = 'max-w-[11rem] sm:max-w-[14rem]';

type ProductPurchaseActionsProps = {
  language: LanguageCode;
  price: number;
  quantity: number;
  maxQuantity: number;
  isOutOfStock: boolean;
  isVariationRequired: boolean;
  hasUnavailableAttributes: boolean;
  canAddToCart: boolean;
  isAddingToCart: boolean;
  isInWishlist: boolean;
  isInCompare: boolean;
  showMessage?: string | null;
  onQuantityAdjust: (delta: number) => void;
  onAddToCart: () => void | Promise<void>;
  onAddToWishlist: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  getRequiredAttributesMessage: () => string;
};

export function ProductPurchaseActions({
  language,
  price,
  quantity,
  maxQuantity,
  isOutOfStock,
  isVariationRequired,
  hasUnavailableAttributes,
  canAddToCart,
  isAddingToCart,
  isInWishlist,
  isInCompare,
  showMessage = null,
  onQuantityAdjust,
  onAddToCart,
  onAddToWishlist,
  onCompareToggle,
  getRequiredAttributesMessage,
}: ProductPurchaseActionsProps) {
  const buyNowFullLabel = t(language, 'product.buyNow');
  const hasDisplayPrice = Number.isFinite(price) && price > 0;

  return (
    <>
      <div className="mt-auto pt-6">
        {isVariationRequired ? (
          <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm font-medium text-yellow-800">
              {getRequiredAttributesMessage()}
            </p>
          </div>
        ) : null}
        <div className="flex -translate-y-0.5 pb-2 pt-4">
          <div className="flex min-w-0 flex-nowrap items-center gap-2 sm:gap-3">
            {hasDisplayPrice ? (
              <div
                className={`flex ${PRODUCT_BUY_CTA_HEIGHT_CLASS} shrink-0 items-center overflow-hidden rounded-xl border-2 border-gray-200 bg-white`}
              >
                <button
                  type="button"
                  onClick={() => onQuantityAdjust(-1)}
                  disabled={quantity <= 1}
                  className={`flex ${PRODUCT_BUY_CTA_HEIGHT_CLASS} w-8 items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  -
                </button>
                <div className="w-8 text-center text-sm font-bold tabular-nums">{quantity}</div>
                <button
                  type="button"
                  onClick={() => onQuantityAdjust(1)}
                  disabled={quantity >= maxQuantity}
                  className={`flex ${PRODUCT_BUY_CTA_HEIGHT_CLASS} w-8 items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  +
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onCompareToggle}
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200 ${isInCompare ? 'border-marco-yellow bg-marco-yellow text-marco-black dark:!text-marco-black' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <CompareIcon isActive={isInCompare} />
            </button>
            <button
              type="button"
              onClick={onAddToWishlist}
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl border-2 ${isInWishlist ? 'border-red-600 bg-red-600 text-white dark:border-red-600 dark:bg-red-600 dark:text-white' : 'border-gray-200'}`}
            >
              <Heart fill={isInWishlist ? 'currentColor' : 'none'} />
            </button>
            {hasDisplayPrice ? (
              <button
                type="button"
                disabled={!canAddToCart || isAddingToCart}
                className={`inline-flex shrink-0 items-center gap-1.5 bg-marco-yellow px-4 text-left text-sm font-bold leading-normal text-marco-black dark:!text-marco-black transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100 ${PRODUCT_BUY_CTA_HEIGHT_CLASS} ${HEADER_FIGMA_PILL_RADIUS_CLASS}`}
                onClick={onAddToCart}
              >
                <span
                  className={`${PRODUCT_BUY_CTA_LABEL_MAX_WIDTH_CLASS} truncate whitespace-nowrap ${
                    language === 'hy' ? 'pl-0.5' : 'pl-1'
                  }`}
                >
                  {isAddingToCart
                    ? t(language, 'product.adding')
                    : isVariationRequired
                      ? getRequiredAttributesMessage()
                      : language === 'hy'
                        ? buyNowFullLabel
                        : isOutOfStock || hasUnavailableAttributes
                          ? t(language, 'product.outOfStock')
                          : buyNowFullLabel}
                </span>
                <span
                  className={`flex shrink-0 items-center justify-center rounded-full bg-black text-white ${PRODUCT_BUY_CTA_ICON_NUDGE_LEFT_CLASS}`}
                  style={{
                    width: PRODUCT_BUY_CTA_ICON_PX,
                    height: PRODUCT_BUY_CTA_ICON_PX,
                  }}
                  aria-hidden
                >
                  <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {showMessage ? (
        <div className="mt-4 rounded-md bg-marco-black p-4 text-white shadow-lg">{showMessage}</div>
      ) : null}
    </>
  );
}
