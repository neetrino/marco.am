'use client';

import Link from 'next/link';
import { montserratArm } from '@/fonts/montserrat-arm';
import { formatCatalogPrice } from '@/lib/currency';
import { ProductColors } from '@/components/ProductCard/ProductColors';
import {
  SpecialOfferCartFab,
  SpecialOfferMedia,
  SpecialOfferSideActions,
  SpecialOfferWarrantyBadge,
  StarRow,
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
      <SpecialOfferMedia product={product} showPlaceholder={showPlaceholder} onImageError={() => setImageError(true)} />
      <div className="relative z-[2] flex flex-1 flex-col px-[6%] pb-20 pt-3 md:pt-4">
        {contentLayout === 'news' ? (
          <>
            <div className="flex min-h-[1.25rem] items-center justify-between gap-2">
              {product.brand?.name ? (
                <p className={`text-[11px] font-black uppercase tracking-[0.6px] md:text-xs ${brandClass}`}>
                  {product.brand.name}
                </p>
              ) : (
                <span />
              )}
              {product.colors && product.colors.length > 0 ? (
                <ProductColors colors={product.colors} isCompact maxVisible={4} />
              ) : null}
            </div>
            <Link href={`/products/${product.slug}`} className="mt-2 block">
              <h3 className="line-clamp-2 text-left text-[13px] font-bold leading-5 text-[#181111] dark:text-white md:text-sm md:leading-5">
                {product.title}
              </h3>
            </Link>
          </>
        ) : (
          <>
            {product.brand?.name ? (
              <p className={`text-[11px] font-black uppercase tracking-[0.6px] md:text-xs ${brandClass}`}>
                {product.brand.name}
              </p>
            ) : null}
            <Link href={`/products/${product.slug}`} className="mt-2 block">
              <h3 className="line-clamp-2 text-left text-[13px] font-bold leading-5 text-[#181111] dark:text-white md:text-sm md:leading-5">
                {product.title}
              </h3>
            </Link>
            {product.colors && product.colors.length > 0 ? (
              <div className="mt-2">
                <ProductColors colors={product.colors} isCompact maxVisible={4} />
              </div>
            ) : null}
          </>
        )}
        <div className="mt-3 flex items-center gap-1">
          <StarRow />
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <p className="text-lg font-black text-[#181111] dark:text-white md:text-xl">{formatCatalogPrice(product.price, currency)}</p>
          {strikePrice != null ? (
            <span className="text-xs text-[#9ca3af] dark:text-white/55 line-through md:text-sm">{formatCatalogPrice(strikePrice, currency)}</span>
          ) : null}
        </div>
      </div>
      <SpecialOfferCartFab product={product} isAddingToCart={isAddingToCart} onCart={handleCart} t={t} />
    </article>
  );
}
