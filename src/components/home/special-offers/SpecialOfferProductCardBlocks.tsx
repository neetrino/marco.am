'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MouseEvent } from 'react';
import { CompareIcon } from '@/components/icons/CompareIcon';
import { CartIcon } from '@/components/icons/CartIcon';
import { ProductImagePlaceholder } from '@/components/ProductImagePlaceholder';
import { ProductLabels } from '@/components/ProductLabels';
import type { SpecialOfferProduct } from './SpecialOfferProductCardTypes';

const STAR_FILL_CLASS = 'text-[#ffca03]';

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

function WishlistGlyph({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M10 17L8.55 15.7C4.4 12.2 2 10.1 2 7.5C2 5.4 3.4 4 5.5 4C6.8 4 8.1 4.6 9 5.5C9.9 4.6 11.2 4 12.5 4C14.6 4 16 5.4 16 7.5C16 10.1 13.6 12.2 9.45 15.7L10 17Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
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
}: {
  product: SpecialOfferProduct;
  isInWishlist: boolean;
  isInCompare: boolean;
  onWishlist: (e: MouseEvent) => void;
  onCompare: (e: MouseEvent) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="absolute right-2 top-3 z-20 flex flex-col items-end gap-1.5 md:right-3 md:top-4 md:gap-2">
      <button
        type="button"
        onClick={onWishlist}
        className="flex size-8 items-center justify-center rounded-full bg-white/90 text-[#374151] shadow-sm backdrop-blur-sm transition-colors hover:bg-white md:size-9"
        title={isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')}
        aria-label={isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')}
      >
        <WishlistGlyph filled={isInWishlist} size={16} />
      </button>
      <button
        type="button"
        onClick={onCompare}
        className="flex size-8 items-center justify-center rounded-full bg-black text-white shadow-sm transition-opacity hover:opacity-90 md:size-9"
        title={isInCompare ? t('common.messages.removedFromCompare') : t('common.messages.addedToCompare')}
        aria-label={isInCompare ? t('common.ariaLabels.removeFromCompare') : t('common.ariaLabels.addToCompare')}
      >
        <CompareIcon isActive={isInCompare} size={16} className="text-white" />
      </button>
      {product.discountPercent != null && product.discountPercent > 0 ? (
        <div className="rounded-full bg-[#ffca03] px-2 py-1">
          <span className="text-[10px] font-bold text-white">-{product.discountPercent}%</span>
        </div>
      ) : null}
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
    <div className="relative z-0 mx-[6%] mt-4 overflow-hidden rounded-lg bg-[#f9fafb] md:mt-[17px]">
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
      className="absolute bottom-4 right-4 z-20 flex size-[54px] items-center justify-center rounded-[31px] border-[3px] border-white bg-[#ffca03] text-[#181111] shadow-md transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 md:bottom-5 md:right-5 md:size-[62px]"
      title={product.inStock ? t('common.buttons.addToCart') : t('common.stock.outOfStock')}
      aria-label={product.inStock ? t('common.ariaLabels.addToCart') : t('common.ariaLabels.outOfStock')}
    >
      {isAddingToCart ? (
        <svg className="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <CartIcon size={26} />
      )}
    </button>
  );
}
