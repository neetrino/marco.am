'use client';

import {
  getSpecialOfferBrandTextClass,
  SPECIAL_OFFERS_CARD_BG,
  SPECIAL_OFFERS_CARD_PADDING_TOP_PX,
} from './home-special-offers.constants';
import { SpecialOfferActionsStack } from './SpecialOfferCardChrome';
import { SpecialOfferCardInfo } from './SpecialOfferCardInfo';
import { SpecialOfferCardMedia } from './SpecialOfferCardMedia';
import { SpecialOfferCardPricing } from './SpecialOfferCardPricing';
import { SpecialOfferCardStars } from './SpecialOfferCardStars';
import type { SpecialOfferProduct } from './special-offer-product.types';
import { useSpecialOfferCard } from './useSpecialOfferCard';

export type { SpecialOfferProduct };

interface SpecialOfferCardProps {
  product: SpecialOfferProduct;
}

/**
 * Figma «Special offers» product tile — warranty pill, side actions, yellow cart.
 */
export function SpecialOfferCard({ product }: SpecialOfferCardProps) {
  const {
    t,
    currency,
    isInWishlist,
    isInCompare,
    isAddingToCart,
    showDiscountPill,
    oldPrice,
    handleWishlist,
    handleCompare,
    handleCart,
    showPlaceholder,
    onImageError,
    wishlistAria,
    compareAria,
  } = useSpecialOfferCard(product);

  const brandClass = getSpecialOfferBrandTextClass(product.brand?.name);

  return (
    <article
      className="relative flex min-w-0 flex-col overflow-visible rounded-[32px] px-4 pb-6"
      style={{
        backgroundColor: SPECIAL_OFFERS_CARD_BG,
        paddingTop: SPECIAL_OFFERS_CARD_PADDING_TOP_PX,
      }}
    >
      <SpecialOfferActionsStack
        showDiscountPill={showDiscountPill}
        discountPercent={product.discountPercent}
        isInWishlist={isInWishlist}
        isInCompare={isInCompare}
        wishlistAria={wishlistAria}
        compareAria={compareAria}
        onWishlist={handleWishlist}
        onCompare={handleCompare}
      />

      <SpecialOfferCardMedia
        slug={product.slug}
        title={product.title}
        image={product.image}
        showPlaceholder={showPlaceholder}
        onImageError={onImageError}
      />

      <SpecialOfferCardInfo product={product} brandClass={brandClass} />

      <SpecialOfferCardStars />

      <SpecialOfferCardPricing
        price={product.price}
        oldPrice={oldPrice}
        currency={currency}
        inStock={product.inStock}
        isAddingToCart={isAddingToCart}
        addToCartAria={t('common.ariaLabels.addToCart')}
        outOfStockAria={t('common.ariaLabels.outOfStock')}
        onAddToCart={handleCart}
      />
    </article>
  );
}
