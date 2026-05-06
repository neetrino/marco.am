'use client';

import type { MouseEvent } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Heart } from 'lucide-react';
import { formatCatalogPrice, type CurrencyCode } from '../../../lib/currency';
import { t, getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { normalizeLiteralNewlinesToLineBreaks } from '../../../lib/utils/normalize-literal-newlines';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { CompareIcon } from '../../../components/icons/CompareIcon';
import {
  HEADER_FIGMA_PILL_RADIUS_CLASS,
} from '../../../components/header/header.constants';
import {
  ProductAttributesSelector,
  VARIANT_PICKER_ATTRIBUTE_KEYS,
} from './ProductAttributesSelector';
import { ProductPartialStar } from './ProductPartialStar';
import { stripDuplicateSpecificationDescriptionHtml } from './strip-duplicate-specification-description-html';
import type { AttributeGroupValue, Product, ProductVariant, VariantOption } from './types';

/** Buy CTA — taller row; trailing circle with light left nudge (−4px). */
const PRODUCT_BUY_CTA_HEIGHT_CLASS = 'h-12';
const PRODUCT_BUY_CTA_ICON_PX = 36;
const PRODUCT_BUY_CTA_ICON_NUDGE_LEFT_CLASS = 'translate-x-2';
/** Keeps CTA label on one line next to icons without stretching full width. */
const PRODUCT_BUY_CTA_LABEL_MAX_WIDTH_CLASS = 'max-w-[11rem] sm:max-w-[14rem]';

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
  attributeGroups: Map<string, AttributeGroupValue[]>;
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
  getOptionValue: (options: VariantOption[] | undefined, key: string) => string | null;
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
  const rawDescription = getProductText(language, product.id, 'longDescription') || product.description || '';
  const buyNowFullLabel = t(language, 'product.buyNow');
  const normalizedDescription = normalizeLiteralNewlinesToLineBreaks(rawDescription);
  const descriptionWithoutDuplicateSpecs =
    stripDuplicateSpecificationDescriptionHtml(normalizedDescription);
  const sanitizedDescription = sanitizeHtml(descriptionWithoutDuplicateSpecs);
  const hasDescription = sanitizedDescription
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;
  const hasVariantPickerAttributes = Array.from(VARIANT_PICKER_ATTRIBUTE_KEYS).some(
    (key) => (attributeGroups.get(key)?.length ?? 0) > 0,
  );
  const hasAttributeSelectors =
    hasVariantPickerAttributes ||
    colorGroups.length > 0 ||
    (!product?.productAttributes && sizeGroups.length > 0);

  const hasProductReviews = reviewsCount > 0;
  const displayRatingScore = hasProductReviews
    ? Math.min(5, Math.max(0, averageRating))
    : 5;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {product.brand && (
          <div className="mb-5 flex flex-wrap items-center gap-4 md:gap-5">
            {product.brand.logo ? (
              <Image
                src={product.brand.logo}
                alt={product.brand.name}
                width={140}
                height={42}
                className="h-7 w-auto max-w-[min(100%,140px)] shrink-0 object-contain object-left md:h-8 md:max-w-[min(100%,160px)]"
                sizes="(max-width: 768px) 140px, 160px"
              />
            ) : (
              <p className="text-sm text-gray-500">{product.brand.name}</p>
            )}
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
          <ProductPartialStar fillRatio={displayRatingScore / 5} />
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
              <p className="text-3xl font-bold text-marco-black">{formatCatalogPrice(price, currency as CurrencyCode)}</p>
            </div>
            {/* Original price below discounted price - full width, not inline */}
            {(originalPrice || (compareAtPrice && compareAtPrice > price)) && (
              <p className="mt-1 ml-px text-xl text-gray-500 line-through decoration-gray-400">
                {formatCatalogPrice(originalPrice || compareAtPrice || 0, currency as CurrencyCode)}
              </p>
            )}
          </div>
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
        <div className="flex -translate-y-0.5 pb-2 pt-4">
          <div className="flex min-w-0 flex-nowrap items-center gap-2 sm:gap-3">
            <div
              className={`flex ${PRODUCT_BUY_CTA_HEIGHT_CLASS} shrink-0 items-center overflow-hidden rounded-xl border-2 border-gray-200 bg-white`}
            >
              <button
                onClick={() => onQuantityAdjust(-1)}
                disabled={quantity <= 1}
                className={`flex ${PRODUCT_BUY_CTA_HEIGHT_CLASS} w-8 items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50`}
              >
                -
              </button>
              <div className="w-8 text-center text-sm font-bold tabular-nums">{quantity}</div>
              <button
                onClick={() => onQuantityAdjust(1)}
                disabled={quantity >= maxQuantity}
                className={`flex ${PRODUCT_BUY_CTA_HEIGHT_CLASS} w-8 items-center justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50`}
              >
                +
              </button>
            </div>
            <button
              onClick={onCompareToggle}
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200 ${isInCompare ? 'border-marco-yellow bg-marco-yellow text-[#050505] dark:!text-[#050505]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <CompareIcon isActive={isInCompare} />
            </button>
            <button
              onClick={onAddToWishlist}
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl border-2 ${isInWishlist ? 'border-red-600 bg-red-600 text-white dark:border-red-600 dark:bg-red-600 dark:text-white' : 'border-gray-200'}`}
            >
              <Heart fill={isInWishlist ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              disabled={!canAddToCart || isAddingToCart}
              className={`inline-flex shrink-0 items-center gap-1.5 bg-marco-yellow px-4 text-left text-sm font-bold leading-normal text-marco-black dark:!text-[#050505] transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100 ${PRODUCT_BUY_CTA_HEIGHT_CLASS} ${HEADER_FIGMA_PILL_RADIUS_CLASS}`}
              onClick={onAddToCart}
            >
              <span
                className={`${PRODUCT_BUY_CTA_LABEL_MAX_WIDTH_CLASS} whitespace-nowrap ${
                  language === 'hy' ? 'pl-0.5' : 'pl-1'
                } truncate`}
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
          </div>
        </div>
      </div>
      {showMessage && <div className="mt-4 p-4 bg-marco-black text-white rounded-md shadow-lg">{showMessage}</div>}
    </div>
  );
}



