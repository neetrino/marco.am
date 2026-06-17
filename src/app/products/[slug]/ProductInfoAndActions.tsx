'use client';

import type { MouseEvent } from 'react';
import { formatCatalogPrice, type CurrencyCode } from '../../../lib/currency';
import { t, getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { getProductDescriptionNotes } from '../../../lib/products/product-description';
import { ProductWarrantyBadge } from '../../../components/ProductCard/ProductWarrantyBadge';
import { ProductCardBrandMark } from '../../../components/ProductCard/ProductCardBrandMark';
import {
  ProductAttributesSelector,
} from './ProductAttributesSelector';
import { ProductPurchaseActions } from './ProductPurchaseActions';
import type { AttributeGroupValue, Product, ProductVariant, VariantOption } from './types';

interface ProductInfoAndActionsProps {
  product: Product;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  currency: string;
  language: LanguageCode;
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
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  getOptionValue: (options: VariantOption[] | undefined, key: string) => string | null;
  getRequiredAttributesMessage: () => string;
  /** True while full PDP detail (description, variants) is still loading. */
  detailsPending?: boolean;
}

export function ProductInfoAndActions({
  product,
  price,
  originalPrice,
  compareAtPrice,
  discountPercent: _discountPercent,
  currency,
  language,
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
  currentVariant,
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
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  getOptionValue,
  getRequiredAttributesMessage,
  detailsPending = false,
}: ProductInfoAndActionsProps) {
  const localizedEntries = product.i18n?.descriptions[language]?.entries ?? product.description ?? [];
  const descriptionNotes = getProductDescriptionNotes(localizedEntries).filter(
    (note) => note.value.trim().length >= 24,
  );
  const noPriceLabel = t(language, 'products.noPrice.label');
  const hasMultiValueAttributeGroup = Array.from(attributeGroups.values()).some(
    (values) => values.length > 1,
  );
  const hasDescription = descriptionNotes.length > 0;
  const showDescriptionSkeleton = detailsPending && !hasDescription;
  const displaySku = currentVariant?.sku || product.variants.find((variant) => Boolean(variant.sku))?.sku || null;
  const hasAttributeSelectors =
    hasMultiValueAttributeGroup ||
    colorGroups.length > 1 ||
    (!product?.productAttributes && sizeGroups.length > 1);
  const primaryCategory = product.categories?.[0] ?? null;
  const hasDisplayPrice = Number.isFinite(price) && price > 0;

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="flex-1">
        {(product.brand || primaryCategory) && (
          <div className="mb-5 flex flex-wrap items-center gap-3 md:gap-4">
            {product.brand ? (
              <ProductCardBrandMark
                name={product.brand.name}
                slug={product.brand.name}
                logoUrl={product.brand.logo}
                size="pdp"
              />
            ) : null}
            {primaryCategory ? (
              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {primaryCategory.title}
              </span>
            ) : null}
          </div>
        )}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-marco-black sm:text-3xl md:text-4xl">
              {getProductText(language, product.id, 'title') || product.title}
            </h1>
            {displaySku ? (
              <p className="mt-2 text-sm text-gray-500">
                {t(language, 'common.messages.sku')}: <span className="font-medium text-gray-700">{displaySku}</span>
              </p>
            ) : detailsPending ? (
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200/80 dark:bg-white/10" aria-hidden />
            ) : null}
          </div>
          {product.warrantyYears ? (
            <ProductWarrantyBadge years={product.warrantyYears} size="promo" className="shrink-0" />
          ) : null}
        </div>
        <div className="mb-6">
          <div className="flex flex-col gap-1">
            {hasDisplayPrice ? (
              <>
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
              </>
            ) : (
              <span className="inline-flex w-fit rounded-full bg-[#f4f4f4] px-3 py-1 text-sm font-semibold text-[#383838]">
                {noPriceLabel}
              </span>
            )}
          </div>
        </div>
        {showDescriptionSkeleton ? (
          <div className="mb-8 space-y-2" aria-hidden>
            <div className="h-4 w-full animate-pulse rounded bg-gray-200/80 dark:bg-white/10" />
            <div className="h-4 w-[88%] animate-pulse rounded bg-gray-200/80 dark:bg-white/10" />
          </div>
        ) : hasDescription ? (
          <div className="mb-8 animate-fade-in space-y-2 text-sm text-gray-600">
            {descriptionNotes.map((note, index) => (
              <p key={`description-note-${index}`}>{note.value}</p>
            ))}
          </div>
        ) : null}

        {detailsPending && !hasAttributeSelectors ? (
          <div className="mb-8 space-y-3" aria-hidden>
            <div className="h-10 w-full max-w-xs animate-pulse rounded-lg bg-gray-200/80 dark:bg-white/10" />
          </div>
        ) : null}

        {/* Attributes Section */}
        {hasAttributeSelectors ? (
          <div className="mb-8 animate-fade-in">
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
        ) : null}

      </div>
      
      <ProductPurchaseActions
        language={language}
        price={price}
        quantity={quantity}
        maxQuantity={maxQuantity}
        isOutOfStock={isOutOfStock}
        isVariationRequired={isVariationRequired}
        hasUnavailableAttributes={hasUnavailableAttributes}
        canAddToCart={canAddToCart}
        isAddingToCart={isAddingToCart}
        isInWishlist={isInWishlist}
        isInCompare={isInCompare}
        showMessage={showMessage}
        onQuantityAdjust={onQuantityAdjust}
        onAddToCart={onAddToCart}
        onAddToWishlist={onAddToWishlist}
        onCompareToggle={onCompareToggle}
        getRequiredAttributesMessage={getRequiredAttributesMessage}
      />
    </div>
  );
}



