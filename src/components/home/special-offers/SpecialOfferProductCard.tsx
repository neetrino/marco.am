'use client';

import Link from 'next/link';
import { montserratArm } from '@/fonts/montserrat-arm';
import { formatPrice } from '@/lib/currency';
import { ProductColors } from '@/components/ProductCard/ProductColors';
import {
  SpecialOfferCartFab,
  SpecialOfferMedia,
  SpecialOfferSideActions,
  SpecialOfferWarrantyBadge,
  StarRow,
} from './SpecialOfferProductCardBlocks';
import type { SpecialOfferProduct } from './SpecialOfferProductCardTypes';

export type { SpecialOfferProduct };
import { useSpecialOfferCardLogic, type CardLogic } from './useSpecialOfferCardLogic';

interface SpecialOfferProductCardProps {
  product: SpecialOfferProduct;
}

/**
 * Home «Special offers» strip — Figma node 214:1058 (card chrome: #f6f6f6, 32px radius, side actions).
 */
export function SpecialOfferProductCard({ product }: SpecialOfferProductCardProps) {
  const logic = useSpecialOfferCardLogic(product);
  return <SpecialOfferProductCardView product={product} logic={logic} />;
}

function SpecialOfferProductCardView({ product, logic }: { product: SpecialOfferProduct; logic: CardLogic }) {
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

  return (
    <article
      className={`${montserratArm.className} special-offer-card-cutout relative flex h-full min-h-[420px] flex-col overflow-visible rounded-[32px] bg-[#f6f6f6] shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:min-h-[486px]`}
    >
      <SpecialOfferWarrantyBadge line1={t('home.special_offers_warranty_line1')} line2={t('home.special_offers_warranty_line2')} />
      <SpecialOfferSideActions
        product={product}
        isInWishlist={isInWishlist}
        isInCompare={isInCompare}
        onWishlist={handleWishlist}
        onCompare={handleCompare}
        t={t}
      />
      <SpecialOfferMedia product={product} showPlaceholder={showPlaceholder} onImageError={() => setImageError(true)} />
      <div className="relative z-[2] flex flex-1 flex-col px-[6%] pb-20 pt-3 md:pt-4">
        {product.brand?.name ? (
          <p className="text-[11px] font-black uppercase tracking-[0.6px] text-[#0f0f0f] md:text-xs">
            {product.brand.name}
          </p>
        ) : null}
        <Link href={`/products/${product.slug}`} className="mt-2 block">
          <h3 className="line-clamp-2 text-left text-[13px] font-bold leading-5 text-[#181111] md:text-sm md:leading-5">
            {product.title}
          </h3>
        </Link>
        {product.colors && product.colors.length > 0 ? (
          <div className="mt-2">
            <ProductColors colors={product.colors} isCompact maxVisible={4} />
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-1">
          <StarRow />
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <p className="text-lg font-black text-[#181111] md:text-xl">{formatPrice(product.price, currency)}</p>
          {strikePrice != null ? (
            <span className="text-xs text-[#9ca3af] line-through md:text-sm">{formatPrice(strikePrice, currency)}</span>
          ) : null}
        </div>
      </div>
      <SpecialOfferCartFab product={product} isAddingToCart={isAddingToCart} onCart={handleCart} t={t} />
    </article>
  );
}
