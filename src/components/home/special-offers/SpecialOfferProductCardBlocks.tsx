'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MouseEvent } from 'react';
import { ProductImagePlaceholder } from '@/components/ProductImagePlaceholder';
import { ProductLabels } from '@/components/ProductLabels';
import { CompareIcon } from '@/components/icons/CompareIcon';
import type { SpecialOfferProduct } from './SpecialOfferProductCardTypes';

const STAR_FILL_CLASS = 'text-[#ffca03]';

/** Figma export — thin outline heart (black on transparent); inverted on black button. */
const SPECIAL_OFFER_WISHLIST_OUTLINE_SRC = '/images/special-offers/wishlist-heart-outline.png' as const;

/** Figma 101:3500 — exact vector path (asset was mis-saved as .png; inline SVG avoids MIME mismatch) */
function SpecialOfferAddToCartGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24.9919 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14.4928 9.90476H12.0773V6.19048H8.45411V3.71429H12.0773V0H14.4928V3.71429H18.1159V6.19048H14.4928V9.90476ZM7.24638 26C6.58078 26 6.01181 25.7579 5.53945 25.2737C5.0671 24.7894 4.83092 24.2061 4.83092 23.5238C4.83092 22.8415 5.0671 22.2582 5.53945 21.774C6.01181 21.2897 6.58078 21.0476 7.24638 21.0476C7.91197 21.0476 8.48094 21.2897 8.9533 21.774C9.42566 22.2582 9.66184 22.8415 9.66184 23.5238C9.66184 24.2061 9.42566 24.7894 8.9533 25.2737C8.48094 25.7579 7.91197 26 7.24638 26ZM19.3237 26C18.6581 26 18.0891 25.7579 17.6167 25.2737C17.1444 24.7894 16.9082 24.2061 16.9082 23.5238C16.9082 22.8415 17.1444 22.2582 17.6167 21.774C18.0891 21.2897 18.6581 21.0476 19.3237 21.0476C19.9893 21.0476 20.5582 21.2897 21.0306 21.774C21.503 22.2582 21.7391 22.8415 21.7391 23.5238C21.7391 24.2061 21.503 24.7894 21.0306 25.2737C20.5582 25.7579 19.9893 26 19.3237 26ZM2.41546 3.71429H0V1.2381H3.96135L9.08213 12.381H17.5362L22.2544 3.71429H24.9919L19.6779 13.553C19.4632 13.9712 19.168 14.2904 18.7923 14.5105C18.4165 14.7416 18.0086 14.8571 17.5684 14.8571H8.58293L7.24638 17.3333H21.7391V19.8095H7.24638C6.34461 19.8095 5.65754 19.4078 5.18519 18.6044C4.70209 17.8011 4.68599 16.9867 5.13688 16.1613L6.76328 13.1238L2.41546 3.71429Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function StarRow() {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-[11px] w-[11px] shrink-0 md:h-[13px] md:w-[13px] ${STAR_FILL_CLASS}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.9l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Outline from design asset on black button (`brightness-0 invert`);
 * liked state uses vector fill (no separate asset).
 */
function WishlistGlyph({ filled, size }: { filled: boolean; size: number }) {
  if (!filled) {
    return (
      <Image
        src={SPECIAL_OFFER_WISHLIST_OUTLINE_SRC}
        alt=""
        width={size}
        height={size}
        className="pointer-events-none shrink-0 brightness-0 invert"
        aria-hidden
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 21s-6.716-4.783-9-8.5C.5 9.5.5 6.4 3 4.5 5.2 2.9 8.5 3.5 12 7c3.5-3.5 6.8-4.1 9-2.5 2.5 1.9 2.5 5 0 8-2.284 3.717-9 8.5-9 8.5z"
        className="fill-white"
      />
    </svg>
  );
}

/** Compare glyph that switches to yellow when active. */
function CompareCircleGlyph({ isActive }: { isActive: boolean }) {
  return (
    <CompareIcon
      isActive={isActive}
      size={18}
      className={isActive ? 'text-marco-yellow' : 'text-white'}
    />
  );
}

export function SpecialOfferWarrantyBadge({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-2xl bg-[#1e1e1e] px-2 py-2 text-center leading-[15px] md:left-4 md:top-4">
      <p className="text-[12px] font-bold text-[#ffca03] md:text-[14px]">{line1}</p>
      <p className="text-[10px] font-bold uppercase text-white md:text-[11px]">{line2}</p>
    </div>
  );
}

export function SpecialOfferSideActions({
  product,
  isInWishlist,
  isInCompare,
  onWishlist,
  onCompare,
  t,
  stackOrder = 'wishlist-first',
}: {
  product: SpecialOfferProduct;
  isInWishlist: boolean;
  isInCompare: boolean;
  onWishlist: (e: MouseEvent) => void;
  onCompare: (e: MouseEvent) => void;
  t: (key: string) => string;
  /** Figma NEWS (751:1935): compare → wishlist → discount */
  stackOrder?: 'wishlist-first' | 'compare-first';
}) {
  const wishlistBtn = (
    <button
      key="wishlist"
      type="button"
      onClick={onWishlist}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition-opacity hover:opacity-90 md:size-10"
      title={isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')}
      aria-label={isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')}
    >
      <WishlistGlyph filled={isInWishlist} size={18} />
    </button>
  );

  const compareBtn = (
    <button
      key="compare"
      type="button"
      onClick={onCompare}
      className={`flex size-9 shrink-0 items-center justify-center overflow-visible rounded-full p-0 shadow-sm transition-opacity hover:opacity-90 md:size-10 ${
        isInCompare ? 'ring-2 ring-marco-yellow/60 ring-offset-2 ring-offset-[#f6f6f6]' : ''
      }`}
      title={isInCompare ? t('common.messages.removedFromCompare') : t('common.messages.addedToCompare')}
      aria-label={isInCompare ? t('common.ariaLabels.removeFromCompare') : t('common.ariaLabels.addToCompare')}
    >
      <CompareCircleGlyph isActive={isInCompare} />
    </button>
  );

  const discountPill =
    product.discountPercent != null && product.discountPercent > 0 ? (
      <div key="discount" className="rounded-full bg-[#ffca03] px-2 py-1">
        <span className="text-[10px] font-bold text-white">-{product.discountPercent}%</span>
      </div>
    ) : null;

  const ordered =
    stackOrder === 'compare-first'
      ? [compareBtn, wishlistBtn, discountPill].filter(Boolean)
      : [wishlistBtn, compareBtn, discountPill].filter(Boolean);

  return (
    <div className="absolute right-2 top-3 z-20 flex flex-col items-end gap-1.5 md:right-3 md:top-4 md:gap-2">
      {ordered}
    </div>
  );
}

export function SpecialOfferMedia({
  product,
  showPlaceholder,
  onImageError,
}: {
  product: SpecialOfferProduct;
  showPlaceholder: boolean;
  onImageError: () => void;
}) {
  return (
    <div className="relative z-[2] mx-[6%] mt-4 overflow-hidden rounded-lg bg-[#f9fafb] md:mt-[17px]">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[274/248] w-full">
        {showPlaceholder ? (
          <ProductImagePlaceholder className="h-full w-full" aria-label={product.title} />
        ) : (
          <Image
            src={product.image!}
            alt={product.title}
            fill
            className="object-contain mix-blend-multiply"
            sizes="(max-width: 768px) 45vw, 280px"
            unoptimized
            onError={onImageError}
          />
        )}
        {product.labels && product.labels.length > 0 ? (
          <div className="pointer-events-none absolute inset-0">
            <ProductLabels labels={product.labels} />
          </div>
        ) : null}
      </Link>
    </div>
  );
}

export function SpecialOfferCartFab({
  product,
  isAddingToCart,
  onCart,
  t,
}: {
  product: SpecialOfferProduct;
  isAddingToCart: boolean;
  onCart: (e: MouseEvent) => void;
  t: (key: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={onCart}
      disabled={!product.inStock || isAddingToCart}
      className="absolute bottom-0 right-0 z-20 flex size-[54px] translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[#ffca03] p-0 text-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#181111] disabled:cursor-not-allowed disabled:opacity-50 md:size-[62px]"
      title={product.inStock ? t('common.buttons.addToCart') : t('common.stock.outOfStock')}
      aria-label={product.inStock ? t('common.ariaLabels.addToCart') : t('common.ariaLabels.outOfStock')}
    >
      {isAddingToCart ? (
        <svg className="h-6 w-6 animate-spin text-[#181111]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <SpecialOfferAddToCartGlyph className="h-[22px] w-[21px] md:h-[26px] md:w-[25px]" />
      )}
    </button>
  );
}
