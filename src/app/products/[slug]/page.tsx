'use client';

import { apiClient } from '../../../lib/api-client';
import { t } from '../../../lib/i18n';
import { useAuth } from '../../../lib/auth/AuthContext';
import { RelatedProducts } from '../../../components/RelatedProducts';
import { ProductReviews } from '../../../components/ProductReviews';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductInfoAndActions } from './ProductInfoAndActions';
import { useProductPage } from './useProductPage';
import type { ProductPageProps } from './types';

export default function ProductPage({ params }: ProductPageProps) {
  const { isLoggedIn } = useAuth();
  
  const {
    product,
    loading,
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
    aggregate,
    reviewsLoading,
    reloadProductReviews,
    averageRating,
    reviewCount,
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
  } = useProductPage(params);

  const handleAddToCart = async () => {
    if (!canAddToCart || !product || !currentVariant) return;
    setIsAddingToCart(true);
    try {
      const unitPrice = price;
      window.dispatchEvent(
        new CustomEvent('cart-updated', {
          detail: { optimisticAdd: { quantity, price: unitPrice } },
        })
      );

      if (!isLoggedIn) {
        const stored = localStorage.getItem('shop_cart_guest');
        const cart: Array<{
          productId: string;
          productSlug?: string;
          variantId: string;
          quantity: number;
          price?: number;
        }> = stored ? JSON.parse(stored) : [];
        const existing = cart.find((item) => item.variantId === currentVariant.id);
        const nextQuantity = (existing?.quantity ?? 0) + quantity;
        if (nextQuantity > currentVariant.stock) {
          setShowMessage(t(language, 'common.alerts.noMoreStockAvailable'));
          return;
        }

        if (existing) {
          existing.quantity = nextQuantity;
          existing.productSlug = product.slug;
          existing.price = unitPrice;
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
        const guestItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const guestTotal = cart.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
        window.dispatchEvent(
          new CustomEvent('cart-updated', {
            detail: { itemsCount: guestItemsCount, total: guestTotal },
          })
        );
      } else {
        const response = await apiClient.post<{
          cartSummary?: { itemsCount: number; total: number };
        }>('/api/v1/cart/items', {
          productId: product.id,
          variantId: currentVariant.id,
          quantity,
        });
        window.dispatchEvent(
          new CustomEvent('cart-updated', {
            detail: response.cartSummary ?? null,
          })
        );
      }

      setShowMessage(`${t(language, 'product.addedToCart')} ${quantity} ${t(language, 'product.pcs')}`);
    } catch (_err) { 
      window.dispatchEvent(new Event('cart-updated'));
      setShowMessage(t(language, 'product.errorAddingToCart')); 
    } finally { 
      setIsAddingToCart(false); 
      setTimeout(() => setShowMessage(null), 2000); 
    }
  };

  if (loading || !product) {
    return (
      <div className="page-shell py-16 text-center">
        {t(language, 'common.messages.loading')}
      </div>
    );
  }

  return (
    <div className="page-shell py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-start">
        <ProductImageGallery
          images={images}
          product={product}
          discountPercent={discountPercent}
          language={language}
          currentImageIndex={currentImageIndex}
          onImageIndexChange={setCurrentImageIndex}
          thumbnailStartIndex={thumbnailStartIndex}
          onThumbnailStartIndexChange={setThumbnailStartIndex}
        />

          <ProductInfoAndActions
            product={product}
            price={price}
            originalPrice={originalPrice}
            compareAtPrice={compareAtPrice}
            discountPercent={discountPercent}
            currency={currency}
            language={language}
            averageRating={averageRating}
            reviewsCount={reviewCount}
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
      </div>

      <div id="product-reviews" className="mt-24 scroll-mt-24">
        <ProductReviews
          productSlug={slug}
          productId={product.id}
          reviews={reviews}
          aggregate={aggregate}
          loading={reviewsLoading}
          loadReviews={reloadProductReviews}
        />
      </div>
      <div className="mt-16">
        <RelatedProducts productSlug={product.slug} />
      </div>
    </div>
  );
}
