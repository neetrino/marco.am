'use client';

import { useCallback, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';

import { ProductPdpPrefetchLink } from '@/components/ProductPdpPrefetchLink';
import { useQueryClient } from '@tanstack/react-query';
import { getStoredLanguage } from '@/lib/language';
import { seedProductPdpCache } from '@/lib/product-pdp/pdp-navigation-seed-cache';
import { resolveNavigationSeedImages } from '@/lib/product-pdp/pdp-navigation-seed';

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
  SPECIAL_OFFERS_CARD_PADDING_TOP_CSS_VAR,
  SPECIAL_OFFERS_CARD_PADDING_X_CSS_VAR,
  SPECIAL_OFFERS_CARD_PADDING_X_PX,
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
import type { SpecialOfferProduct } from './special-offer-product.types';
import { useSpecialOfferCard } from './useSpecialOfferCard';

export type { SpecialOfferProduct };

/** Tile layout: `mobileGrid` = 2×2 phone strip + compact chrome; `homeGrid` = fill grid cell on home desktop/tablet rails. */
export type SpecialOfferCardLayout = 'default' | 'mobileGrid' | 'homeGrid';

interface SpecialOfferCardProps {
  product: SpecialOfferProduct;
  /**
   * `mobileGrid` — 2×2 home strip (compact warranty/actions, text nudge).
   * `homeGrid` — home «Նորույթներ» 2×4 desktop page: same fill as mobile grid, default chrome.
   */
  layout?: SpecialOfferCardLayout;
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
  const hasDisplayPrice = product.price > 0;
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
  const navigationSeed = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    image: product.image,
    images: resolveNavigationSeedImages(product.image, product.images),
    brand: product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          logo: product.brand.logoUrl ?? null,
        }
      : null,
    categories: product.categories ?? [],
    price: product.price,
    oldPrice: oldPrice ?? null,
    discountBadge:
      product.isSpecialPrice
        ? { type: 'special_price' as const, value: 0, label: 'special_price' }
        : product.discountPercent && product.discountPercent > 0
          ? {
              type: 'percentage' as const,
              value: product.discountPercent,
              label: `-${product.discountPercent}%`,
            }
          : null,
  };

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  const cornerTranslatePx = Math.round(
    (SPECIAL_OFFERS_CARD_CORNER_MASK_SIZE_PX * SPECIAL_OFFERS_CARD_CORNER_MASK_TRANSLATE_PERCENT) / 100,
  );

  const fillsHomeGridCell =
    maxWidthPx === undefined &&
    (layout === 'mobileGrid' || layout === 'homeGrid');

  const shellMaxWidthStyle = maxWidthPx !== undefined
    ? { maxWidth: maxWidthPx }
    : fillsHomeGridCell
      ? {
          /** Fill the grid column up to the Figma rail cap — even tiles. */
          maxWidth: `min(100%, ${SPECIAL_OFFERS_CARD_MAX_WIDTH_PX}px)`,
        }
      : { maxWidth: SPECIAL_OFFERS_CARD_MAX_WIDTH_PX };

  const textBlockShiftStyle =
    layout === 'mobileGrid'
      ? { transform: `translateY(${SPECIAL_OFFERS_CARD_TEXT_SHIFT_DOWN_MOBILE_PX}px)` }
      : undefined;

  const shellAlignClass =
    align === 'end'
      ? 'ml-auto mr-0'
      : fillsHomeGridCell
        ? 'mx-0 w-full'
        : 'mx-auto';

  const router = useRouter();
  const queryClient = useQueryClient();
  const cardPdpEnabled = Boolean(product.slug) && !product.shellPlaceholder;
  const warrantyYears = product.warrantyYears ?? product.warrantyBadge?.years ?? null;
  const shouldShowCartCutouts = true;
  const handleNoPriceButtonClick = useCallback((event: MouseEvent) => {
    if (hasDisplayPrice || detailsPending || !product.slug) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    seedProductPdpCache({
      queryClient,
      slug: product.slug,
      language: getStoredLanguage(),
      navigationSeed,
    });
    router.push(`/products/${encodeURIComponent(product.slug.trim())}`);
  }, [detailsPending, hasDisplayPrice, navigationSeed, product.slug, queryClient, router]);

  return (
    <div
      className={`relative z-10 min-w-0 w-full max-w-full font-sans hover:z-30 focus-within:z-30 max-md:[--special-offers-card-pad-x:0px] max-md:[--special-offers-card-pad-top:0px] ${shellAlignClass}`}
      style={{
        ...shellMaxWidthStyle,
        [SPECIAL_OFFERS_CARD_PADDING_X_CSS_VAR as string]: `${SPECIAL_OFFERS_CARD_PADDING_X_PX}px`,
        [SPECIAL_OFFERS_CARD_PADDING_TOP_CSS_VAR as string]: `${SPECIAL_OFFERS_CARD_PADDING_TOP_PX}px`,
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
        {cardPdpEnabled ? (
          <ProductPdpPrefetchLink
            href={`/products/${product.slug}`}
            productSlug={product.slug}
            navigationSeed={navigationSeed}
            className="absolute inset-0 z-[1] focus:outline-none focus-visible:ring-2 focus-visible:ring-marco-yellow focus-visible:ring-offset-2"
            style={{ borderRadius: SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX }}
            aria-label={product.title}
          >
            <span className="sr-only">{product.title}</span>
          </ProductPdpPrefetchLink>
        ) : null}
        {shouldShowCartCutouts ? (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 z-0 max-md:hidden rounded-full [box-shadow:inset_0_0_0_1px_var(--special-offers-card-cutout-bg)]"
            style={{
              width: SPECIAL_OFFERS_CARD_CORNER_MASK_SIZE_PX,
              height: SPECIAL_OFFERS_CARD_CORNER_MASK_SIZE_PX,
              backgroundColor: 'var(--special-offers-card-cutout-bg)',
              transform: `translate(${cornerTranslatePx}px, ${cornerTranslatePx}px)`,
            }}
          />
        ) : null}
        {shouldShowCartCutouts && showMobileBottomNotch ? (
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
          className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-6 pt-3 max-md:px-0 max-md:pt-0"
        >
          {warrantyYears ? (
            <SpecialOfferWarrantyBadge layout={layout} years={warrantyYears} />
          ) : null}

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
            navigationSeed={navigationSeed}
          />

          <div
            className="pointer-events-none flex min-h-0 w-full flex-1 flex-col max-md:px-4"
            style={textBlockShiftStyle}
          >
            <SpecialOfferCardInfo
              product={product}
              brandClass={brandClass}
              detailsPending={detailsPending}
              navigationSeed={navigationSeed}
            />

            {hasDisplayPrice ? (
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
            ) : null}
          </div>
        </div>
      </article>

      <SpecialOfferCartFloatingButton
        hasDisplayPrice={hasDisplayPrice}
        inStock={product.inStock}
        isAddingToCart={isAddingToCart}
        addToCartAria={t('common.ariaLabels.addToCart')}
        outOfStockAria={t('common.ariaLabels.outOfStock')}
        onAddToCart={handleCart}
        onNoPriceClick={handleNoPriceButtonClick}
        interactionLocked={detailsPending}
      />

      <SpecialOfferActionsStack
        layout={layout}
        showDiscountPill={!detailsPending && showDiscountPill}
        isSpecialPrice={product.isSpecialPrice}
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
