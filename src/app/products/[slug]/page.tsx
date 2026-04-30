'use client';

import dynamic from 'next/dynamic';
import { apiClient } from '../../../lib/api-client';
import { t } from '../../../lib/i18n';
import { useAuth } from '../../../lib/auth/AuthContext';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductInfoAndActions } from './ProductInfoAndActions';
import { useProductPage } from './useProductPage';
import type { ProductPageProps } from './types';

const ProductSpecifications = dynamic(() =>
  import('./ProductSpecifications').then((m) => ({ default: m.ProductSpecifications })),
);

const RelatedProducts = dynamic(() =>
  import('../../../components/RelatedProducts').then((m) => ({ default: m.RelatedProducts })),
);

const ProductReviews = dynamic(() =>
  import('../../../components/ProductReviews').then((m) => ({ default: m.ProductReviews })),
);

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
  } = useProductPage(params);

  const handleAddToCart = async () => {
    if (!canAddToCart || !product || !currentVariant) return;
    setIsAddingToCart(true);
    try {
      if (!isLoggedIn) {
        const stored = localStorage.getItem('shop_cart_guest');
        const cart = stored ? JSON.parse(stored) : [];
        const unitPrice =
          Number(currentVariant.currentPrice ?? currentVariant.price) || 0;
        const existing = cart.find((i: unknown): i is { variantId: string; quantity: number; productId?: string; productSlug?: string; price?: number } => 
          typeof i === 'object' && i !== null && 'variantId' in i && i.variantId === currentVariant.id
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
        await apiClient.post('/api/v1/cart/items', { productId: product.id, variantId: currentVariant.id, quantity });
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

  if (loading || !product) {
    return (
      <div className="marco-header-container py-16 text-center">
        {t(language, 'common.messages.loading')}
      </div>
    );
  }

  return (
    <div className="marco-header-container py-12">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
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
      </div>

      <ProductSpecifications product={product} language={language} />

      <div className="mt-24">
        <RelatedProducts currentProductSlug={slug} />
      </div>
      <div id="product-reviews" className="mt-16 scroll-mt-24">
        <ProductReviews productSlug={slug} productId={product.id} />
      </div>
    </div>
  );
}
