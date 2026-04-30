'use client';

import {
  getSpecialOfferBrandTextClass,
  SPECIAL_OFFERS_CARD_BG,
  SPECIAL_OFFERS_CARD_CORNER_MASK_SIZE_PX,
  SPECIAL_OFFERS_CARD_CORNER_MASK_TRANSLATE_PERCENT,
  SPECIAL_OFFERS_CARD_HEIGHT_PX,
  SPECIAL_OFFERS_CARD_MOBILE_NOTCH_HEIGHT_PX,
  SPECIAL_OFFERS_CARD_MOBILE_NOTCH_TOP_RADIUS_PX,
  SPECIAL_OFFERS_CARD_MOBILE_NOTCH_WIDTH_PX,
  SPECIAL_OFFERS_CARD_MAX_WIDTH_PX,
  SPECIAL_OFFERS_CARD_PADDING_TOP_PX,
  SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
  SPECIAL_OFFERS_CART_BUTTON_INSET_BOTTOM_PX,
  SPECIAL_OFFERS_CART_BUTTON_INSET_RIGHT_PX,
  SPECIAL_OFFERS_CART_BUTTON_MOBILE_BOTTOM_PX,
  SPECIAL_OFFERS_CARD_TEXT_SHIFT_DOWN_MOBILE_PX,
  SPECIAL_OFFERS_PRICE_BLOCK_LIFT_FROM_BOTTOM_PX,
  SPECIAL_OFFERS_PRICE_ROW_END_PADDING_PX,
} from './home-special-offers.constants';
import {
  SpecialOfferActionsStack,
  SpecialOfferWarrantyBadge,
} from './SpecialOfferCardChrome';
import { SpecialOfferCardInfo } from './SpecialOfferCardInfo';
import { SpecialOfferCardMedia } from './SpecialOfferCardMedia';
import {
  SpecialOfferCardPricing,
  SpecialOfferCartFloatingButton,
} from './SpecialOfferCardPricing';
import { SpecialOfferCardStars } from './SpecialOfferCardStars';
import type { SpecialOfferProduct } from './special-offer-product.types';
import { duplicateSingleImageForDevGalleryTest } from './special-offer-dev-gallery';
import { useSpecialOfferCard } from './useSpecialOfferCard';

export type { SpecialOfferProduct };

interface SpecialOfferCardProps {
  product: SpecialOfferProduct;
  /**
   * `mobileGrid` — 2×2 home strip: card fills the grid cell (no 252px cap).
   */
  layout?: 'default' | 'mobileGrid';
  /**
   * `end` — align tile to the right of the cell (e.g. products catalog). Default: centered (`mx-auto`).
   */
  align?: 'center' | 'end';
  /** Optional per-context override for mobile floating cart button bottom inset. */
  mobileCartButtonBottomPx?: number;
  /** Set false to hide the decorative mobile bottom notch in specific contexts. */
  showMobileBottomNotch?: boolean;
  /** Optional desktop max-width override for contexts like products catalog. */
  maxWidthPx?: number;
  imagePriority?: boolean;
  detailsPending?: boolean;
}

/**
 * Figma «Special offers» product tile — warranty pill, side actions, yellow cart.
 */
export function SpecialOfferCard({
  product,
  layout = 'default',
  align = 'center',
  mobileCartButtonBottomPx,
  showMobileBottomNotch = true,
  maxWidthPx,
  imagePriority = false,
  detailsPending: detailsPendingProp = false,
}: SpecialOfferCardProps) {
  const detailsPending = detailsPendingProp || Boolean(product.detailsPending);
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

  const galleryImages = duplicateSingleImageForDevGalleryTest(
    product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [],
  );

  const cornerTranslatePx = Math.round(
    (SPECIAL_OFFERS_CARD_CORNER_MASK_SIZE_PX * SPECIAL_OFFERS_CARD_CORNER_MASK_TRANSLATE_PERCENT) / 100,
  );

  const shellMaxWidthStyle = {
    maxWidth:
      layout === 'mobileGrid'
        ? maxWidthPx ?? SPECIAL_OFFERS_CARD_MAX_WIDTH_PX
        : maxWidthPx ?? SPECIAL_OFFERS_CARD_MAX_WIDTH_PX,
  };

  const textBlockShiftStyle =
    layout === 'mobileGrid'
      ? { transform: `translateY(${SPECIAL_OFFERS_CARD_TEXT_SHIFT_DOWN_MOBILE_PX}px)` }
      : undefined;

  const shellAlignClass =
    align === 'end' ? 'ml-auto mr-0' : 'mx-auto';

  return (
    <div
      className={`relative z-10 min-w-0 w-full max-w-full font-sans hover:z-30 focus-within:z-30 ${shellAlignClass}`}
      style={{
        ...shellMaxWidthStyle,
        ['--so-cart-bottom-mobile' as string]: `${
          mobileCartButtonBottomPx ?? SPECIAL_OFFERS_CART_BUTTON_MOBILE_BOTTOM_PX
        }px`,
        ['--so-cart-bottom-desktop' as string]: `${SPECIAL_OFFERS_CART_BUTTON_INSET_BOTTOM_PX}px`,
        ['--so-cart-right-desktop' as string]: `${SPECIAL_OFFERS_CART_BUTTON_INSET_RIGHT_PX}px`,
      }}
    >
      <article
        className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
        style={{
          backgroundColor: SPECIAL_OFFERS_CARD_BG,
          height: SPECIAL_OFFERS_CARD_HEIGHT_PX,
          borderRadius: SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
          ['--special-offers-price-pad-end' as string]: `${SPECIAL_OFFERS_PRICE_ROW_END_PADDING_PX}px`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 z-0 max-md:hidden rounded-full [box-shadow:inset_0_0_0_1px_var(--special-offers-card-cutout-bg)] dark:[box-shadow:inset_0_0_0_1px_#050505]"
          style={{
            width: SPECIAL_OFFERS_CARD_CORNER_MASK_SIZE_PX,
            height: SPECIAL_OFFERS_CARD_CORNER_MASK_SIZE_PX,
            backgroundColor: 'var(--special-offers-card-cutout-bg)',
            transform: `translate(${cornerTranslatePx}px, ${cornerTranslatePx}px)`,
          }}
        />
        {showMobileBottomNotch ? (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/2 z-0 md:hidden max-w-full -translate-x-1/2"
            style={{
              width: `min(100%, ${SPECIAL_OFFERS_CARD_MOBILE_NOTCH_WIDTH_PX}px)`,
              height: SPECIAL_OFFERS_CARD_MOBILE_NOTCH_HEIGHT_PX,
              backgroundColor: 'var(--special-offers-card-cutout-bg)',
              borderTopLeftRadius: SPECIAL_OFFERS_CARD_MOBILE_NOTCH_TOP_RADIUS_PX,
              borderTopRightRadius: SPECIAL_OFFERS_CARD_MOBILE_NOTCH_TOP_RADIUS_PX,
            }}
          />
        ) : null}
        <div
          className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-6"
          style={{ paddingTop: SPECIAL_OFFERS_CARD_PADDING_TOP_PX }}
        >
          <SpecialOfferWarrantyBadge
            layout={layout}
            line1={t('home.special_offers.warranty_line1')}
            line2={t('home.special_offers.warranty_line2')}
          />

          <SpecialOfferCardMedia
            layout={layout}
            slug={product.slug}
            title={
              detailsPending
                ? product.slug || t('home.featured_products.card_loading_aria')
                : product.title
            }
            images={galleryImages}
            showPlaceholder={showPlaceholder}
            onImageError={onImageError}
            imagePriority={imagePriority}
            navigationDisabled={Boolean(product.shellPlaceholder)}
          />

          <div
            className="flex min-h-0 w-full flex-1 flex-col"
            style={textBlockShiftStyle}
          >
            <SpecialOfferCardInfo
              product={product}
              brandClass={brandClass}
              detailsPending={detailsPending}
            />

            <SpecialOfferCardStars
              reviewCount={product.reviewCount}
              detailsPending={detailsPending}
            />

            <div
              className="mt-auto w-full min-w-0"
              style={{
                marginBottom: SPECIAL_OFFERS_PRICE_BLOCK_LIFT_FROM_BOTTOM_PX,
              }}
            >
              <SpecialOfferCardPricing
                price={product.price}
                oldPrice={oldPrice}
                currency={currency}
                detailsPending={detailsPending}
              />
            </div>
          </div>
        </div>
      </article>

      <SpecialOfferCartFloatingButton
        inStock={product.inStock}
        isAddingToCart={isAddingToCart}
        addToCartAria={t('common.ariaLabels.addToCart')}
        outOfStockAria={t('common.ariaLabels.outOfStock')}
        onAddToCart={handleCart}
        interactionLocked={detailsPending}
      />

      <SpecialOfferActionsStack
        layout={layout}
        showDiscountPill={!detailsPending && showDiscountPill}
        discountPercent={product.discountPercent}
        isInWishlist={isInWishlist}
        isInCompare={isInCompare}
        wishlistAria={wishlistAria}
        compareAria={compareAria}
        onWishlist={handleWishlist}
        onCompare={handleCompare}
        disabled={Boolean(product.shellPlaceholder)}
      />
    </div>
  );
}
