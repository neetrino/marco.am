'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { RelatedProducts } from '@/components/RelatedProducts';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { t } from '@/lib/i18n';
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

const ProductReviews = dynamic(() =>
  import('@/components/ProductReviews').then((m) => ({ default: m.ProductReviews })),
);

export type ProductPageClientProps = {
  slugParam: string;
  serverLanguage: LanguageCode;
  initialVisual: PdpVisualPayload | null;
  /** SSR full product — hydrates client cache so refresh / hard navigation can paint without waiting on `/api`. */
  initialProduct: Product | null;
};

export function ProductPageClient({
  slugParam,
  serverLanguage,
  initialVisual,
  initialProduct,
}: ProductPageClientProps) {
  const { isLoggedIn } = useAuth();

  const {
    product,
    productVisual,
    displayProduct,
    blockingEmpty,
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
    setIsAddingToCart,
    showMessage,
    setShowMessage,
    isInWishlist,
    isInCompare,
    quantity,
    reviews,
    averageRating,
    slug,
    attributeGroups,
    colorGroups,
    sizeGroups,
    currentVariant,
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    maxQuantity,
    isOutOfStock,
    isVariationRequired,
    hasUnavailableAttributes,
    unavailableAttributes,
    canAddToCart,
    scrollToReviews,
    getOptionValue,
    adjustQuantity,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
    handleAddToWishlist,
    handleCompareToggle,
    getRequiredAttributesMessage,
  } = useProductPage({ slugParam, serverLanguage, initialVisual, initialProduct });

  const handleAddToCart = async () => {
    if (!canAddToCart || !product || !currentVariant) return;
    setIsAddingToCart(true);
    try {
      if (!isLoggedIn) {
        const stored = localStorage.getItem('shop_cart_guest');
        const cart = stored ? JSON.parse(stored) : [];
        const unitPrice =
          Number(currentVariant.currentPrice ?? currentVariant.price) || 0;
        const existing = cart.find(
          (
            i: unknown,
          ): i is {
            variantId: string;
            quantity: number;
            productId?: string;
            productSlug?: string;
            price?: number;
          } =>
            typeof i === 'object' &&
            i !== null &&
            'variantId' in i &&
            i.variantId === currentVariant.id,
        );
        if (existing) {
          existing.quantity += quantity;
          if (unitPrice > 0) {
            existing.price = unitPrice;
          }
        } else {
          cart.push({
            productId: product.id,
            productSlug: product.slug,
            variantId: currentVariant.id,
            quantity,
            price: unitPrice,
          });
        }
        localStorage.setItem('shop_cart_guest', JSON.stringify(cart));
      } else {
        await apiClient.post('/api/v1/cart/items', {
          productId: product.id,
          variantId: currentVariant.id,
          quantity,
        });
      }
      setShowMessage(`${t(language, 'product.addedToCart')} ${quantity} ${t(language, 'product.pcs')}`);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (_err) {
      setShowMessage(t(language, 'product.errorAddingToCart'));
    } finally {
      setIsAddingToCart(false);
      setTimeout(() => setShowMessage(null), 2000);
    }
  };

  if (blockingEmpty) {
    return (
      <div className="marco-header-container py-12">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
          <div className="mx-auto w-full max-w-[420px] md:mx-0 md:max-w-none md:flex-1">
            <div
              className="relative aspect-square w-full rounded-lg bg-gray-100 dark:bg-white/[0.06]"
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

  return (
    <div className="marco-header-container py-12">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        <ProductImageGallery
          images={images}
          product={displayProduct}
          discountPercent={galleryDiscount}
          language={language}
          currentImageIndex={currentImageIndex}
          onImageIndexChange={setCurrentImageIndex}
          thumbnailStartIndex={thumbnailStartIndex}
          onThumbnailStartIndexChange={setThumbnailStartIndex}
          mainImageHighPriority={Boolean(productVisual && !product)}
        />

        {product ? (
          <ProductInfoAndActions
            product={product}
            price={price}
            originalPrice={originalPrice}
            compareAtPrice={compareAtPrice}
            discountPercent={discountPercent}
            currency={currency}
            language={language}
            averageRating={averageRating}
            reviewsCount={reviews.length}
            quantity={quantity}
            maxQuantity={maxQuantity}
            isOutOfStock={isOutOfStock}
            isVariationRequired={isVariationRequired}
            hasUnavailableAttributes={hasUnavailableAttributes}
            unavailableAttributes={unavailableAttributes}
            canAddToCart={canAddToCart}
            isAddingToCart={isAddingToCart}
            isInWishlist={isInWishlist}
            isInCompare={isInCompare}
            showMessage={showMessage}
            isLoggedIn={isLoggedIn}
            currentVariant={currentVariant}
            attributeGroups={attributeGroups}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            selectedAttributeValues={selectedAttributeValues}
            colorGroups={colorGroups}
            sizeGroups={sizeGroups}
            onQuantityAdjust={adjustQuantity}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onCompareToggle={handleCompareToggle}
            onScrollToReviews={scrollToReviews}
            onColorSelect={handleColorSelect}
            onSizeSelect={handleSizeSelect}
            onAttributeValueSelect={handleAttributeValueSelect}
            getOptionValue={getOptionValue}
            getRequiredAttributesMessage={getRequiredAttributesMessage}
          />
        ) : (
          <ProductInfoPrimarySkeleton />
        )}
      </div>

      {product ? (
        <div className="mt-24">
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

      <div className={product ? 'mt-16' : 'mt-24'}>
        <RelatedProducts currentProductSlug={slug} language={language} />
      </div>

      {product ? (
        <Suspense
          fallback={
            <div
              className="mt-16 min-h-[160px] w-full rounded-lg bg-gray-100/90 dark:bg-white/[0.06]"
              aria-hidden
            />
          }
        >
          <div id="product-reviews" className="mt-16 scroll-mt-24">
            <ProductReviews productSlug={slug} productId={product.id} />
          </div>
        </Suspense>
      ) : null}
    </div>
  );
}
