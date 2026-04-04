'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { MouseEvent } from 'react';

/** Figma node 101-3497 — add-to-cart control (MCP asset, ~7d TTL) */
const FIGMA_ADD_TO_CART_ASSET =
  'https://www.figma.com/api/mcp/asset/5fd511ed-fb30-49b8-8f11-2ea2ec588485';

/** Figma node 101-3481 — star raster (optional; SVG fallback below) */
const FIGMA_STAR_ASSET =
  'https://www.figma.com/api/mcp/asset/98baafd5-c656-4ec1-9ecc-2f4056feb12b';

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex h-4 items-center gap-1">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="relative h-[9.5px] w-[9.5px] shrink-0 overflow-hidden">
          <Image
            src={FIGMA_STAR_ASSET}
            alt=""
            width={10}
            height={10}
            className="object-contain"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

export interface ProductCardFigmaProps {
  slug: string;
  title: string;
  brandName: string | null;
  price: string;
  imageUrl: string | null;
  /** Figma: 5 stars shown */
  rating?: number;
  reviewCount?: number;
  warrantyLine1?: string;
  warrantyLine2?: string;
  /** If set, first two words → line1 (yellow), rest → line2 (white) */
  warrantyText?: string;
  discountPercent?: number | null;
  inStock?: boolean;
  isAddingToCart?: boolean;
  onAddToCart?: (e: MouseEvent) => void;
  onWishlistToggle?: (e: MouseEvent) => void;
  onCompareToggle?: (e: MouseEvent) => void;
  /** Override cart button graphic */
  cartIconSrc?: string;
}

/**
 * Product card from Figma node 101-3473 (get_design_context).
 * Desktop only, fixed 320×486. Token-based styles.
 */
export function ProductCardFigma({
  slug,
  title,
  brandName,
  price,
  imageUrl,
  rating = 5,
  reviewCount = 15,
  warrantyLine1: w1 = '3 ՏԱՐԻ ',
  warrantyLine2: w2 = 'ԵՐԱՇԽԻՔ',
  warrantyText,
  discountPercent = 15,
  inStock = true,
  isAddingToCart = false,
  onAddToCart,
  onWishlistToggle,
  onCompareToggle,
  cartIconSrc = FIGMA_ADD_TO_CART_ASSET,
}: ProductCardFigmaProps) {
  const parts = warrantyText?.trim().split(/\s+/) ?? [];
  const warrantyLine1 =
    warrantyText && parts.length > 0 ? parts.slice(0, 2).join(' ') : w1.trimEnd();
  const warrantyLine2 =
    warrantyText && parts.length > 2 ? parts.slice(2).join(' ') : w2;

  const fire = (fn?: (e: MouseEvent) => void) => (e: MouseEvent) => {
    fn?.(e);
  };

  return (
    <article
      className="relative h-[486px] w-[320px] shrink-0 overflow-visible rounded-card bg-surface-default font-montserrat-arm"
      data-node-id="101:3473"
    >
      {/* 101:3474 — image shell */}
      <div
        className="absolute left-[6.03%] right-[6.03%] top-[17px] h-[248px] overflow-hidden rounded-product-image bg-surface-elevated"
        data-node-id="101:3474"
      >
        {imageUrl ? (
          <div
            className="group absolute left-[9.68%] right-[9.68%] top-[24px] h-[200px] mix-blend-multiply"
            data-node-id="101:3475"
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-110"
              sizes="280px"
              unoptimized
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
            No image
          </div>
        )}

        {/* 101:3671 — warranty */}
        <div
          className="absolute left-1/2 top-[17px] z-20 h-[43px] w-[81px] -translate-x-1/2 rounded-product-badge-warranty bg-product-card-overlay text-center leading-[15px]"
          data-node-id="101:3671"
        >
          <p className="absolute left-[11.11%] right-[11.11%] top-2 whitespace-nowrap text-sm font-bold text-accent-yellow">
            {warrantyLine1.trimEnd()}
          </p>
          <p className="absolute left-[11.11%] right-[11.11%] top-[22px] text-[11px] font-bold text-secondary">
            {warrantyLine2}
          </p>
        </div>

        {/* 101:3617 — wishlist (white / blur) */}
        <button
          type="button"
          className="absolute right-0 top-[17px] z-20 size-8 rounded-full bg-white/80 shadow-sm backdrop-blur-sm"
          aria-label="Wishlist"
          data-node-id="101:3617"
          onClick={fire(onWishlistToggle)}
        >
          <span className="flex size-full items-center justify-center text-neutral-400">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M10 17L8.55 15.7C4.4 12.2 2 10.1 2 7.5C2 5.4 3.4 4 5.5 4C6.8 4 8.1 4.6 9 5.5C9.9 4.6 11.2 4 12.5 4C14.6 4 16 5.4 16 7.5C16 10.1 13.6 12.2 9.45 15.7L10 17Z" />
            </svg>
          </span>
        </button>

        {/* 101:3619 — compare (black) */}
        <button
          type="button"
          className="absolute right-0 top-[72px] z-20 flex size-8 items-center justify-center rounded-full bg-black"
          aria-label="Compare"
          data-node-id="101:3619"
          onClick={fire(onCompareToggle)}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-secondary">
            <path
              d="M4 7h12M4 13h12M7 4L4 7l3 3M13 16l3-3-3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 101:3615 — discount pill (below buttons, Figma top ~26.54% ≈ 129px) */}
        {discountPercent != null && discountPercent > 0 && (
          <div
            className="absolute right-0 top-[129px] z-20 flex h-[23px] min-w-[52px] items-center justify-center rounded-badge bg-accent-yellow px-2"
            data-node-id="101:3615"
          >
            <span className="text-[10px] font-bold leading-[15px] text-secondary">
              -{discountPercent}%
            </span>
          </div>
        )}
      </div>

      {/* 101:3476 — text block h 132, top 281 */}
      <div
        className="absolute left-[6.03%] right-[6.03%] top-[281px] h-[132px]"
        data-node-id="101:3476"
      >
        {brandName && (
          <p
            className="absolute left-0 top-0 text-xs font-black uppercase leading-4 tracking-[0.6px] text-primary-500"
            data-node-id="101:3477"
          >
            {brandName}
          </p>
        )}
        <div className="absolute left-0 right-0 top-6 h-10 overflow-hidden" data-node-id="101:3478">
          <Link href={`/products/${slug}`} className="block pt-0.5">
            <h3
              className="line-clamp-2 text-sm font-bold leading-5 text-neutral-900"
              data-node-id="101:3479"
            >
              {title}
            </h3>
          </Link>
        </div>
        <div
          className="absolute left-0 right-0 top-[72px] flex h-4 items-center gap-1"
          data-node-id="101:3480"
        >
          <StarRow count={5} />
          <span className="text-[10px] font-normal leading-[15px] text-neutral-400">
            ({reviewCount})
          </span>
        </div>
        <div className="absolute left-0 right-0 top-24 flex h-9 items-end gap-3 pt-2" data-node-id="101:3492">
          <p
            className="text-xl font-black leading-7 text-neutral-900"
            data-node-id="101:3493"
          >
            {price}
          </p>
        </div>
      </div>

      {/* 101:3497 — add to cart */}
      <div className="absolute left-[257px] top-[424px] z-30 size-[62px]" data-node-id="101:3497">
        <button
          type="button"
          disabled={!inStock || isAddingToCart}
          className="relative size-full rounded-full shadow-product-cta disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={inStock ? 'Add to cart' : 'Out of stock'}
          onClick={fire(onAddToCart)}
        >
          {isAddingToCart ? (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-accent-yellow">
              <svg className="h-6 w-6 animate-spin text-neutral-900" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          ) : (
            <Image
              src={cartIconSrc}
              alt=""
              width={84}
              height={84}
              className="pointer-events-none absolute left-1/2 top-1/2 max-h-none w-[133%] max-w-none -translate-x-1/2 -translate-y-1/2"
              unoptimized
            />
          )}
        </button>
      </div>
    </article>
  );
}
