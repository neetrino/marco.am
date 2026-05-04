'use client';

import { ProductPdpPrefetchLink } from '@/components/ProductPdpPrefetchLink';
import { montserratArm } from '@/fonts/montserrat-arm';
import { formatCatalogPrice } from '@/lib/currency';
import { ProductCardBrandMark } from '@/components/ProductCard/ProductCardBrandMark';
import { ProductColors } from '@/components/ProductCard/ProductColors';
import {
  SpecialOfferCartFab,
  SpecialOfferMedia,
  SpecialOfferSideActions,
  SpecialOfferWarrantyBadge,
} from './SpecialOfferProductCardBlocks';
import type { SpecialOfferProduct } from './SpecialOfferProductCardTypes';
import { useSpecialOfferCardLogic, type CardLogic } from './useSpecialOfferCardLogic';
import { brandAccentClass } from './brandAccentClass';

export type { SpecialOfferProduct };

interface SpecialOfferProductCardProps {
  product: SpecialOfferProduct;
  /** Figma NEWS (751:1935) — compare on top */
  sideActionStack?: 'wishlist-first' | 'compare-first';
  /** NEWS: brand + color dots on one row */
  contentLayout?: 'default' | 'news';
  showWarrantyBadge?: boolean;
}

/**
 * Home «Special offers» / «New arrivals» — Figma card chrome (#f6f6f6, 32px radius, side actions).
 */
export function SpecialOfferProductCard({
  product,
  sideActionStack = 'wishlist-first',
  contentLayout = 'default',
  showWarrantyBadge = true,
}: SpecialOfferProductCardProps) {
  const logic = useSpecialOfferCardLogic(product);
  return (
    <SpecialOfferProductCardView
      product={product}
      logic={logic}
      sideActionStack={sideActionStack}
      contentLayout={contentLayout}
      showWarrantyBadge={showWarrantyBadge}
    />
  );
}

function SpecialOfferProductCardView({
  product,
  logic,
  sideActionStack,
  contentLayout,
  showWarrantyBadge,
}: {
  product: SpecialOfferProduct;
  logic: CardLogic;
  sideActionStack: 'wishlist-first' | 'compare-first';
  contentLayout: 'default' | 'news';
  showWarrantyBadge: boolean;
}) {
  const {
    currency,
    showPlaceholder,
    setImageError,
    strikePrice,
    isInWishlist,
    isInCompare,
    isAddingToCart,
    handleWishlist,
    handleCompare,
    handleCart,
    t,
  } = logic;

  const brandClass = brandAccentClass(product.brand?.name);

  return (
    <article
      className={`${montserratArm.className} special-offer-card-cutout relative mx-auto flex h-full w-full max-w-[306px] min-h-[420px] flex-col overflow-visible rounded-[32px] bg-[#f6f6f6] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:bg-[var(--app-bg)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.3)] md:mx-0 md:w-[306px] md:max-w-none md:min-h-[486px] md:shrink-0`}
    >
      {/* Full-card PDP target; action buttons stay outside this link */}
      <ProductPdpPrefetchLink
        href={`/products/${product.slug}`}
        productSlug={product.slug}
        className="absolute inset-0 z-[1] rounded-[32px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffca03] focus-visible:ring-offset-2"
        aria-label={product.title}
      >
        <span className="sr-only">{product.title}</span>
      </ProductPdpPrefetchLink>
      {showWarrantyBadge ? (
        <SpecialOfferWarrantyBadge line1={t('home.special_offers_warranty_line1')} line2={t('home.special_offers_warranty_line2')} />
      ) : null}
      <SpecialOfferSideActions
        product={product}
        isInWishlist={isInWishlist}
        isInCompare={isInCompare}
        onWishlist={handleWishlist}
        onCompare={handleCompare}
        t={t}
        stackOrder={sideActionStack}
      />
      <div className="pointer-events-none relative z-[2] flex min-h-0 flex-1 flex-col">
        <SpecialOfferMedia product={product} showPlaceholder={showPlaceholder} onImageError={() => setImageError(true)} />
        <div className="flex flex-1 flex-col px-[6%] pb-20 pt-3 md:pt-4">
          {contentLayout === 'news' ? (
            <>
              <div className="flex min-h-[1.25rem] items-center justify-between gap-2">
                {product.brand ? (
                  <div className="min-w-0 flex-1">
                    <ProductCardBrandMark
                      name={product.brand.name}
                      slug={product.brand.slug}
                      logoUrl={product.brand.logoUrl}
                      textClassName={`text-[11px] font-black uppercase tracking-[0.6px] md:text-xs ${brandClass}`}
                      logoBoxClassName="h-5 w-[88px] md:h-6 md:w-[104px]"
                    />
                  </div>
                ) : (
                  <span />
                )}
                {product.colors && product.colors.length > 0 ? (
                  <ProductColors colors={product.colors} isCompact maxVisible={4} />
                ) : null}
              </div>
              <h3 className="mt-2 line-clamp-2 text-left text-[13px] font-bold leading-5 text-[#181111] dark:text-white md:text-sm md:leading-5">
                {product.title}
              </h3>
            </>
          ) : (
            <>
              {product.brand ? (
                <ProductCardBrandMark
                  name={product.brand.name}
                  slug={product.brand.slug}
                  logoUrl={product.brand.logoUrl}
                  textClassName={`text-[11px] font-black uppercase tracking-[0.6px] md:text-xs ${brandClass}`}
                  logoBoxClassName="h-5 w-[88px] md:h-6 md:w-[104px]"
                />
              ) : null}
              <h3 className="mt-2 line-clamp-2 text-left text-[13px] font-bold leading-5 text-[#181111] dark:text-white md:text-sm md:leading-5">
                {product.title}
              </h3>
              {product.colors && product.colors.length > 0 ? (
                <div className="mt-2">
                  <ProductColors colors={product.colors} isCompact maxVisible={4} />
                </div>
              ) : null}
            </>
          )}
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <p className="text-xl font-black text-[#181111] dark:text-white md:text-2xl">
              {formatCatalogPrice(product.price, currency)}
            </p>
            {strikePrice != null ? (
              <span className="text-sm text-[#9ca3af] dark:text-white/55 line-through md:text-base">
                {formatCatalogPrice(strikePrice, currency)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <SpecialOfferCartFab product={product} isAddingToCart={isAddingToCart} onCart={handleCart} t={t} />
    </article>
  );
}
