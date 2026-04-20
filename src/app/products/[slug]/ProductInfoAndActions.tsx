'use client';

import type { MouseEvent } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Heart } from 'lucide-react';
import { formatPrice, type CurrencyCode } from '../../../lib/currency';
import { t, getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { CompareIcon } from '../../../components/icons/CompareIcon';
import {
  HEADER_FIGMA_PILL_RADIUS_CLASS,
  HEADER_ROW2_BAR_HEIGHT_CLASS,
} from '../../../components/header/header.constants';
import { ProductAttributesSelector } from './ProductAttributesSelector';
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
  discountPercent,
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
  const sanitizedDescription = sanitizeHtml(rawDescription);
  const hasDescription = sanitizedDescription
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;
  const hasAttributeSelectors =
    attributeGroups.size > 0 ||
    colorGroups.length > 0 ||
    (!product?.productAttributes && sizeGroups.length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {product.brand && (
          <div className="mb-2 flex items-center gap-2">
            {product.brand.logo && (
              <Image
                src={product.brand.logo}
                alt={product.brand.name}
                width={20}
                height={20}
                className="h-5 w-5 rounded-sm object-contain"
              />
            )}
            <p className="text-sm text-gray-500">{product.brand.name}</p>
          </div>
        )}
        <h1 className="text-4xl font-bold text-marco-black mb-4">
          {getProductText(language, product.id, 'title') || product.title}
        </h1>
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
        </div>
        {/* Rating Section */}
        <div className="mb-6 p-4 bg-white rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 -ml-[17px]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(averageRating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-marco-black">
                {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
              </span>
            </div>
            <span
              onClick={onScrollToReviews}
              className="text-sm text-gray-600 cursor-pointer hover:text-marco-black hover:underline transition-colors"
            >
              ({reviewsCount} {reviewsCount === 1 ? t(language, 'common.reviews.review') : t(language, 'common.reviews.reviews')})
            </span>
          </div>
        </div>
        {hasDescription && (
          <div
            className="-mt-[19px] text-gray-600 mb-8 prose prose-sm"
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
        <div className="flex -translate-y-0.5 border-t pb-2 pt-7">
          <div className="flex w-full min-w-0 flex-nowrap items-center gap-3">
            <button
              type="button"
              disabled={!canAddToCart || isAddingToCart}
                className={`flex min-w-0 flex-1 items-center gap-1.5 bg-marco-yellow pl-4 pr-4 text-left text-sm font-semibold leading-normal text-marco-black transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100 md:max-w-72 md:flex-none md:pl-7 ${PRODUCT_BUY_CTA_HEIGHT_CLASS} ${HEADER_FIGMA_PILL_RADIUS_CLASS}`}
              onClick={onAddToCart}
            >
              <span className="min-w-0 flex-1">
                {isAddingToCart
                  ? t(language, 'product.adding')
                  : isOutOfStock
                    ? t(language, 'product.outOfStock')
                    : isVariationRequired
                      ? getRequiredAttributesMessage()
                      : hasUnavailableAttributes
                        ? t(language, 'product.outOfStock')
                        : t(language, 'product.buyNow')}
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
            <div className="ml-auto flex h-11 shrink-0 items-center overflow-hidden rounded-xl border-2 border-gray-200 bg-white">
              <button
                onClick={() => onQuantityAdjust(-1)}
                disabled={quantity <= 1}
                className="flex h-11 w-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                -
              </button>
              <div className="w-11 text-center text-sm font-bold">{quantity}</div>
              <button
                onClick={() => onQuantityAdjust(1)}
                disabled={quantity >= maxQuantity}
                className="flex h-11 w-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>
            <button
              onClick={onCompareToggle}
              className={`w-11 h-11 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${isInCompare ? 'border-marco-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <CompareIcon isActive={isInCompare} />
            </button>
            <button
              onClick={onAddToWishlist}
              className={`w-11 h-11 shrink-0 rounded-xl border-2 flex items-center justify-center ${isInWishlist ? 'border-marco-black bg-gray-50' : 'border-gray-200'}`}
            >
              <Heart fill={isInWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
      {showMessage && <div className="mt-4 p-4 bg-marco-black text-white rounded-md shadow-lg">{showMessage}</div>}
    </div>
  );
}



