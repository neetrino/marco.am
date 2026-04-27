'use client';

import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Heart } from 'lucide-react';
import { formatPrice, type CurrencyCode } from '../../../lib/currency';
import { t, getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { CompareIcon } from '../../../components/icons/CompareIcon';
import {
  HEADER_FIGMA_PILL_RADIUS_CLASS,
} from '../../../components/header/header.constants';
import { ProductAttributesSelector } from './ProductAttributesSelector';
import { ProductPartialStar } from './ProductPartialStar';
import type { Product, ProductVariant } from './types';

/** Buy CTA — taller row; trailing circle with light left nudge (−4px). */
const PRODUCT_BUY_CTA_HEIGHT_CLASS = 'h-12';
const PRODUCT_BUY_CTA_ICON_PX = 36;
const PRODUCT_BUY_CTA_ICON_NUDGE_LEFT_CLASS = 'translate-x-2';

interface ProductInfoAndActionsProps {
  product: Product;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  currency: string;
  language: LanguageCode;
  averageRating: number;
  reviewsCount: number;
  quantity: number;
  maxQuantity: number;
  isOutOfStock: boolean;
  isVariationRequired: boolean;
  hasUnavailableAttributes: boolean;
  unavailableAttributes: Map<string, boolean>;
  canAddToCart: boolean;
  isAddingToCart: boolean;
  isInWishlist: boolean;
  isInCompare: boolean;
  showMessage: string | null;
  isLoggedIn: boolean;
  currentVariant: ProductVariant | null;
  attributeGroups: Map<string, any[]>;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedAttributeValues: Map<string, string>;
  colorGroups: Array<{ color: string; stock: number; variants: ProductVariant[] }>;
  sizeGroups: Array<{ size: string; stock: number; variants: ProductVariant[] }>;
  onQuantityAdjust: (delta: number) => void;
  onAddToCart: () => Promise<void>;
  onAddToWishlist: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  onScrollToReviews: () => void;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  getOptionValue: (options: any[] | undefined, key: string) => string | null;
  getRequiredAttributesMessage: () => string;
}

export function ProductInfoAndActions({
  product,
  price,
  originalPrice,
  compareAtPrice,
  discountPercent: _discountPercent,
  currency,
  language,
  averageRating,
  reviewsCount,
  quantity,
  maxQuantity,
  isOutOfStock,
  isVariationRequired,
  hasUnavailableAttributes,
  unavailableAttributes,
  canAddToCart,
  isAddingToCart,
  isInWishlist,
  isInCompare,
  showMessage,
  isLoggedIn: _isLoggedIn,
  currentVariant: _currentVariant,
  attributeGroups,
  selectedColor,
  selectedSize,
  selectedAttributeValues,
  colorGroups,
  sizeGroups,
  onQuantityAdjust,
  onAddToCart,
  onAddToWishlist,
  onCompareToggle,
  onScrollToReviews,
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  getOptionValue,
  getRequiredAttributesMessage,
}: ProductInfoAndActionsProps) {
  const buyNowLabelSlotRef = useRef<HTMLSpanElement | null>(null);
  const buyNowLabelProbeRef = useRef<HTMLSpanElement | null>(null);
  const [useShortHyBuyLabel, setUseShortHyBuyLabel] = useState(false);
  const rawDescription = getProductText(language, product.id, 'longDescription') || product.description || '';
  const buyNowFullLabel = t(language, 'product.buyNow');
  const sanitizedDescription = sanitizeHtml(rawDescription);
  const hasDescription = sanitizedDescription
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;
  const hasAttributeSelectors =
    attributeGroups.size > 0 ||
    colorGroups.length > 0 ||
    (!product?.productAttributes && sizeGroups.length > 0);

  const hasProductReviews = reviewsCount > 0;
  const displayRatingScore = hasProductReviews
    ? Math.min(5, Math.max(0, averageRating))
    : 5;
  const starFillRatio = displayRatingScore / 5;

  useEffect(() => {
    if (language !== 'hy') {
      setUseShortHyBuyLabel(false);
      return;
    }

    const syncHyBuyLabel = () => {
      const slot = buyNowLabelSlotRef.current;
      const probe = buyNowLabelProbeRef.current;
      if (!slot || !probe) {
        return;
      }
      if (!window.matchMedia('(max-width: 767px)').matches) {
        setUseShortHyBuyLabel(false);
        return;
      }
      setUseShortHyBuyLabel(probe.offsetWidth > slot.clientWidth);
    };

    syncHyBuyLabel();
    const resizeObserver = new ResizeObserver(syncHyBuyLabel);
    if (buyNowLabelSlotRef.current) {
      resizeObserver.observe(buyNowLabelSlotRef.current);
    }
    window.addEventListener('resize', syncHyBuyLabel);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncHyBuyLabel);
    };
  }, [language, buyNowFullLabel, quantity, isOutOfStock, isVariationRequired, hasUnavailableAttributes]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {product.brand && (
          <div className="mb-5 flex flex-wrap items-center gap-4 md:gap-5">
            {product.brand.logo && (
              <Image
                src={product.brand.logo}
                alt={product.brand.name}
                width={140}
                height={42}
                className="h-7 w-auto max-w-[min(100%,140px)] shrink-0 object-contain object-left md:h-8 md:max-w-[min(100%,160px)]"
                sizes="(max-width: 768px) 140px, 160px"
              />
            )}
            <p className="text-sm text-gray-500">{product.brand.name}</p>
          </div>
        )}
        <div className="mb-5 flex items-start justify-between gap-4">
          <h1 className="min-w-0 flex-1 text-4xl font-bold text-marco-black">
            {getProductText(language, product.id, 'title') || product.title}
          </h1>
          <div className="shrink-0 rounded-2xl bg-[#1e1e1e] px-4 py-2.5 text-center leading-tight">
            <p className="text-base font-bold text-marco-yellow">3 ՏԱՐԻ</p>
            <p className="text-xs font-bold uppercase tracking-[0.3px] text-white">ԵՐԱՇԽԻՔ</p>
          </div>
        </div>
        <div className="-mt-2 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1">
          <ProductPartialStar fillRatio={starFillRatio} />
          <span className="text-sm font-semibold tabular-nums text-marco-black">
            {displayRatingScore.toFixed(1)}
          </span>
          <span className="text-sm text-gray-400" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={onScrollToReviews}
            className="text-sm text-gray-600 underline-offset-2 transition-colors hover:text-marco-black hover:underline"
          >
            {reviewsCount}{' '}
            {reviewsCount === 1
              ? t(language, 'common.reviews.review')
              : t(language, 'common.reviews.reviews')}
          </button>
        </div>
        <div className="mb-6">
          <div className="flex flex-col gap-1">
            {/* Discounted price with discount percentage */}
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-marco-black">{formatPrice(price, currency as CurrencyCode)}</p>
            </div>
            {/* Original price below discounted price - full width, not inline */}
            {(originalPrice || (compareAtPrice && compareAtPrice > price)) && (
              <p className="mt-1 ml-px text-xl text-gray-500 line-through decoration-gray-400">
                {formatPrice(originalPrice || compareAtPrice || 0, currency as CurrencyCode)}
              </p>
            )}
          </div>
          <p
            className={`mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              isOutOfStock ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {isOutOfStock ? t(language, 'common.stock.outOfStock') : t(language, 'common.stock.inStock')}
          </p>
        </div>
        {hasDescription && (
          <div
            className="text-gray-600 mb-8 prose prose-sm"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        )}

        {/* Attributes Section */}
        {hasAttributeSelectors && (
          <div className="mb-8">
            <ProductAttributesSelector
              product={product}
              attributeGroups={attributeGroups}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              selectedAttributeValues={selectedAttributeValues}
              unavailableAttributes={unavailableAttributes}
              colorGroups={colorGroups}
              sizeGroups={sizeGroups}
              language={language}
              quantity={quantity}
              maxQuantity={maxQuantity}
              isOutOfStock={isOutOfStock}
              isVariationRequired={isVariationRequired}
              hasUnavailableAttributes={hasUnavailableAttributes}
              canAddToCart={canAddToCart}
              isAddingToCart={isAddingToCart}
              showMessage={showMessage}
              onColorSelect={onColorSelect}
              onSizeSelect={onSizeSelect}
              onAttributeValueSelect={onAttributeValueSelect}
              onQuantityAdjust={onQuantityAdjust}
              onAddToCart={onAddToCart}
              getOptionValue={getOptionValue}
              getRequiredAttributesMessage={getRequiredAttributesMessage}
            />
          </div>
        )}

      </div>
      
      {/* Action Buttons - Aligned with bottom of image */}
      <div className="mt-auto pt-6">
        {/* Show required attributes message if needed */}
        {isVariationRequired && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              {getRequiredAttributesMessage()}
            </p>
          </div>
        )}
        {/* Show unavailable attributes message if needed */}
        {hasUnavailableAttributes && !isVariationRequired && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              {Array.from(unavailableAttributes.entries()).map(([attrKey]) => {
                const productAttr = product?.productAttributes?.find((pa: any) => pa.attribute?.key === attrKey);
                const attributeName = productAttr?.attribute?.name || attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
                return attrKey === 'color' ? t(language, 'product.color') : 
                       attrKey === 'size' ? t(language, 'product.size') : 
                       attributeName;
              }).join(', ')} {t(language, 'product.outOfStock')}
            </p>
          </div>
        )}
        <div className="flex -translate-y-0.5 pb-2 pt-4">
          <div className="flex w-full min-w-0 flex-nowrap items-center gap-3">
            <div className="flex h-10 shrink-0 items-center overflow-hidden rounded-xl border-2 border-gray-200 bg-white">
              <button
                onClick={() => onQuantityAdjust(-1)}
                disabled={quantity <= 1}
                className="flex h-10 w-7 items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                -
              </button>
              <div className="w-7 text-center text-sm font-bold">{quantity}</div>
              <button
                onClick={() => onQuantityAdjust(1)}
                disabled={quantity >= maxQuantity}
                className="flex h-10 w-7 items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>
            <button
              onClick={onCompareToggle}
              className={`w-10 h-10 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${isInCompare ? 'border-marco-yellow bg-marco-yellow text-[#050505] dark:!text-[#050505]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <CompareIcon isActive={isInCompare} />
            </button>
            <button
              onClick={onAddToWishlist}
              className={`w-10 h-10 shrink-0 rounded-xl border-2 flex items-center justify-center ${isInWishlist ? 'border-red-600 bg-red-600 text-white dark:border-red-600 dark:bg-red-600 dark:text-white' : 'border-gray-200'}`}
            >
              <Heart fill={isInWishlist ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              disabled={!canAddToCart || isAddingToCart}
              className={`ml-auto flex min-w-0 flex-1 items-center gap-1.5 bg-marco-yellow pl-4 pr-4 text-left text-sm font-bold leading-normal text-marco-black dark:!text-[#050505] transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100 md:max-w-72 md:flex-none md:pl-7 ${PRODUCT_BUY_CTA_HEIGHT_CLASS} ${HEADER_FIGMA_PILL_RADIUS_CLASS}`}
              onClick={onAddToCart}
            >
              <span
                ref={buyNowLabelSlotRef}
                className={`min-w-0 flex-1 whitespace-nowrap truncate ${
                  language === 'hy' ? '-ml-0.5 pl-0 md:ml-0 md:pl-2' : 'pl-2'
                }`}
              >
                {language === 'hy' ? (
                  <span
                    ref={buyNowLabelProbeRef}
                    className="pointer-events-none absolute invisible whitespace-nowrap"
                    aria-hidden
                  >
                    {buyNowFullLabel}
                  </span>
                ) : null}
                {isAddingToCart
                  ? t(language, 'product.adding')
                  : isOutOfStock
                    ? t(language, 'product.outOfStock')
                    : isVariationRequired
                      ? getRequiredAttributesMessage()
                      : hasUnavailableAttributes
                        ? t(language, 'product.outOfStock')
                        : language === 'hy'
                          ? useShortHyBuyLabel
                            ? 'Գնել'
                            : buyNowFullLabel
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
          </div>
        </div>
      </div>
      {showMessage && <div className="mt-4 p-4 bg-marco-black text-white rounded-md shadow-lg">{showMessage}</div>}
    </div>
  );
}



