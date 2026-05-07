'use client';

import { ProductCardBrandMark } from '../ProductCard/ProductCardBrandMark';
import { ProductColors } from '../ProductCard/ProductColors';
import { ProductPdpPrefetchLink } from '../ProductPdpPrefetchLink';

import {
  SPECIAL_OFFERS_COLOR_SWATCH_GAP_PX,
  SPECIAL_OFFERS_COLOR_SWATCH_SIZE_PX,
  SPECIAL_OFFERS_IMAGE_TO_TEXT_GAP_PX,
} from './home-special-offers.constants';
import type { SpecialOfferProduct } from './special-offer-product.types';

interface SpecialOfferCardInfoProps {
  product: SpecialOfferProduct;
  brandClass: string;
  /** Reserved layout while listing details load — no fake title text. */
  detailsPending?: boolean;
}

const skeletonBar = 'rounded-md bg-gray-200/90 dark:bg-white/10';

export function SpecialOfferCardInfo({
  product,
  brandClass,
  detailsPending = false,
}: SpecialOfferCardInfoProps) {
  if (detailsPending) {
    return (
      <div
        className="flex gap-2"
        style={{ marginTop: `${SPECIAL_OFFERS_IMAGE_TO_TEXT_GAP_PX}px` }}
        aria-busy="true"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className={`h-3 w-20 ${skeletonBar}`} />
          <div className={`h-4 w-full max-w-[200px] ${skeletonBar}`} />
          <div className={`h-4 w-[80%] max-w-[160px] ${skeletonBar}`} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex"
      style={{ marginTop: `${SPECIAL_OFFERS_IMAGE_TO_TEXT_GAP_PX}px` }}
    >
      <div className="min-w-0 flex-1">
        <div className={`min-h-[1rem] ${brandClass}`}>
          {product.brand ? (
            <ProductCardBrandMark
              name={product.brand.name}
              slug={product.brand.slug}
              logoUrl={product.brand.logoUrl}
              textClassName={`text-[12px] font-black uppercase tracking-[0.6px] ${brandClass}`}
              logoBoxClassName="h-5 w-[88px] md:h-6 md:w-[104px]"
            />
          ) : (
            <p className={`text-[12px] font-black uppercase tracking-[0.6px] ${brandClass}`}>—</p>
          )}
        </div>
        <ProductPdpPrefetchLink
          href={`/products/${product.slug}`}
          productSlug={product.slug}
          className="mt-1 block"
        >
          <h3 className="line-clamp-2 text-left text-[14px] font-bold leading-5 text-[#181111]">
            {product.title}
          </h3>
        </ProductPdpPrefetchLink>
        {product.colors && product.colors.length > 1 ? (
          <div className="mt-1">
            <ProductColors
              colors={product.colors}
              isCompact
              maxVisible={2}
              swatchSizePx={SPECIAL_OFFERS_COLOR_SWATCH_SIZE_PX}
              gapPx={SPECIAL_OFFERS_COLOR_SWATCH_GAP_PX}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
