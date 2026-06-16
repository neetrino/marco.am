'use client';

import dynamic from 'next/dynamic';
import { Suspense, useRef } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import {
  readStoredGuestCart,
  runGuestCartMutation,
  upsertGuestCartItem,
} from '@/app/cart/guest-cart-local';
import { computeGuestCartTotalsFromStorage } from '@/lib/cart/guest-cart-totals';
import { t } from '@/lib/i18n';
import type { RelatedProductsApiResponse } from '@/lib/product-pdp/fetch-related-products';
import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';
import type { LanguageCode } from '@/lib/language';

import type { Product } from './types';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductInfoAndActions } from './ProductInfoAndActions';
import { ProductInfoPrimarySkeleton } from './ProductInfoPrimarySkeleton';
import { useProductPage } from './useProductPage';

const ProductSpecifications = dynamic(() =>
  import('./ProductSpecifications').then((m) => ({ default: m.ProductSpecifications })),
);

const RelatedProducts = dynamic(() =>
  import('@/components/RelatedProducts').then((m) => ({ default: m.RelatedProducts })),
);

export type ProductPageClientProps = {
  slugParam: string;
  serverLanguage: LanguageCode;
  initialVisual: PdpVisualPayload | null;
  /** SSR full product when available; otherwise detail streams or client fetch. */
  initialProduct: Product | null;
  /** SSR related carousel — instant «Նմանատիպ ապրանքներ» on first paint. */
  initialRelatedProducts?: RelatedProductsApiResponse | null;
};

export function ProductPageClient({
  slugParam,
  serverLanguage,
  initialVisual,
  initialProduct,
  initialRelatedProducts = null,
}: ProductPageClientProps) {
  const { isLoggedIn } = useAuth();

  const {
    product,
    productVisual,
    displayProduct,
    blockingEmpty,
    isInstantShellPaint,
    isListingShell,
    detailsPending,
    images,
    currentImageIndex,
    setCurrentImageIndex,
    thumbnailStartIndex,
    setThumbnailStartIndex,
    currency,
    language,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
    isAddingToCart,
    showMessage,
    setShowMessage,
    isInWishlist,
    isInCompare,
    quantity,
    slug,
    attributeGroups,
    colorGroups,
    sizeGroups,
    currentVariant,
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    isSpecialPrice,
    maxQuantity,
    isOutOfStock,
    isVariationRequired,
    hasUnavailableAttributes,
    unavailableAttributes,
    canAddToCart,
    getOptionValue,
    adjustQuantity,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
    handleAddToWishlist,
    handleCompareToggle,
    getRequiredAttributesMessage,
  } = useProductPage({ slugParam, serverLanguage, initialVisual, initialProduct });

  const addToCartInFlightRef = useRef(false);

  const handleAddToCart = async () => {
    if (!canAddToCart || !product || !currentVariant || addToCartInFlightRef.current) return;
    const unitPrice = Number(currentVariant.currentPrice ?? currentVariant.price) || 0;
    if (unitPrice <= 0) {
      return;
    }

    const snapshotImage = images[currentImageIndex] ?? images[0] ?? null;
    addToCartInFlightRef.current = true;

    window.dispatchEvent(
      new CustomEvent('cart-updated', {
        detail: {
          optimisticAdd: {
            quantity,
            price: unitPrice,
            productId: product.id,
            variantId: currentVariant.id,
            productSlug: product.slug,
            title: product.title,
            image: snapshotImage,
          },
        },
      }),
    );
    setShowMessage(`${t(language, 'product.addedToCart')} ${quantity} ${t(language, 'product.pcs')}`);
    const messageTimeout = window.setTimeout(() => setShowMessage(null), 2000);

    try {
      if (!isLoggedIn) {
        await runGuestCartMutation(() => {
          upsertGuestCartItem({
            productId: product.id,
            productSlug: product.slug,
            variantId: currentVariant.id,
            quantityDelta: quantity,
            price: unitPrice,
            title: product.title,
            image: snapshotImage,
            sku: currentVariant.sku,
            stock: currentVariant.stock,
          });
        });
        const guestTotals = computeGuestCartTotalsFromStorage(readStoredGuestCart());
        window.dispatchEvent(
          new CustomEvent('cart-updated', {
            detail: {
              itemsCount: guestTotals.itemsCount,
              total: guestTotals.total,
              currency: 'AMD',
            },
          }),
        );
      } else {
        const response = await apiClient.post<{
          cartSummary?: { itemsCount: number; total: number };
        }>('/api/v1/cart/items', {
          productId: product.id,
          variantId: currentVariant.id,
          quantity,
        });
        if (response.cartSummary) {
          window.dispatchEvent(
            new CustomEvent('cart-updated', {
              detail: response.cartSummary,
            }),
          );
        }
      }
    } catch (_err) {
      window.clearTimeout(messageTimeout);
      setShowMessage(t(language, 'product.errorAddingToCart'));
      window.setTimeout(() => setShowMessage(null), 2000);
      window.dispatchEvent(new Event('cart-updated'));
    } finally {
      addToCartInFlightRef.current = false;
    }
  };

  if (blockingEmpty) {
    return (
      <div className="marco-header-container py-12">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
          <div className="mx-auto w-full max-w-[420px] md:mx-0 md:max-w-none md:flex-1">
            <div
              className="relative aspect-square w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06]"
              aria-hidden
            />
          </div>
          <ProductInfoPrimarySkeleton />
        </div>
      </div>
    );
  }

  if (!displayProduct) {
    return (
      <div className="marco-header-container py-16 text-center text-gray-600">
        {t(language, 'home.featured_products.errorLoading')}
      </div>
    );
  }

  const galleryDiscount =
    product != null ? discountPercent : (productVisual?.discountPercent ?? null);
  const galleryIsSpecialPrice = product != null ? isSpecialPrice : false;
  const relatedEnabled = Boolean(slug.trim());

  return (
    <div className="marco-header-container py-12">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        <ProductImageGallery
          images={images}
          product={displayProduct}
          discountPercent={galleryDiscount}
          isSpecialPrice={galleryIsSpecialPrice}
          language={language}
          currentImageIndex={currentImageIndex}
          onImageIndexChange={setCurrentImageIndex}
          thumbnailStartIndex={thumbnailStartIndex}
          onThumbnailStartIndexChange={setThumbnailStartIndex}
          mainImageHighPriority={isInstantShellPaint || Boolean(productVisual && !product)}
        />

        {displayProduct ? (
          <ProductInfoAndActions
            product={displayProduct}
            price={price}
            originalPrice={originalPrice}
            compareAtPrice={compareAtPrice}
            discountPercent={discountPercent}
            currency={currency}
            language={language}
            quantity={quantity}
            maxQuantity={maxQuantity}
            isOutOfStock={isOutOfStock}
            isVariationRequired={isVariationRequired}
            hasUnavailableAttributes={hasUnavailableAttributes}
            unavailableAttributes={unavailableAttributes}
            canAddToCart={canAddToCart && !isListingShell}
            isAddingToCart={isAddingToCart}
            isInWishlist={isInWishlist}
            isInCompare={isInCompare}
            showMessage={showMessage}
            isLoggedIn={isLoggedIn}
            currentVariant={product ? currentVariant : null}
            attributeGroups={attributeGroups}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            selectedAttributeValues={selectedAttributeValues}
            colorGroups={colorGroups}
            sizeGroups={sizeGroups}
            onQuantityAdjust={adjustQuantity}
            onAddToCart={product && !isListingShell ? handleAddToCart : async () => {}}
            onAddToWishlist={handleAddToWishlist}
            onCompareToggle={handleCompareToggle}
            onColorSelect={handleColorSelect}
            onSizeSelect={handleSizeSelect}
            onAttributeValueSelect={handleAttributeValueSelect}
            getOptionValue={getOptionValue}
            getRequiredAttributesMessage={getRequiredAttributesMessage}
            detailsPending={detailsPending || isListingShell}
          />
        ) : null}
      </div>

      {product && !isListingShell ? (
        <div className="mt-24 animate-fade-in">
          <Suspense
            fallback={
              <div
                className="min-h-[120px] w-full rounded-lg bg-gray-100/90 dark:bg-white/[0.06]"
                aria-hidden
              />
            }
          >
            <ProductSpecifications product={product} language={language} />
          </Suspense>
        </div>
      ) : null}

      <div className="mt-16">
        <RelatedProducts
          currentProductSlug={slug}
          language={language}
          initialRelatedProducts={initialRelatedProducts}
          enabled={relatedEnabled && !isListingShell}
        />
      </div>
    </div>
  );
}
