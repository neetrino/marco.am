'use client';

import Link from 'next/link';

import { ProductColors } from '../ProductCard/ProductColors';

import { SPECIAL_OFFERS_IMAGE_TO_TEXT_GAP_PX } from './home-special-offers.constants';
import type { SpecialOfferProduct } from './special-offer-product.types';

interface SpecialOfferCardInfoProps {
  product: SpecialOfferProduct;
  brandClass: string;
}

export function SpecialOfferCardInfo({
  product,
  brandClass,
}: SpecialOfferCardInfoProps) {
  return (
    <div
      className="flex gap-2"
      style={{ marginTop: `${SPECIAL_OFFERS_IMAGE_TO_TEXT_GAP_PX}px` }}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`text-[12px] font-black uppercase tracking-[0.6px] ${brandClass}`}
        >
          {product.brand?.name ?? '—'}
        </p>
        <Link href={`/products/${product.slug}`} className="mt-1 block">
          <h3 className="line-clamp-2 text-left text-[14px] font-bold leading-5 text-[#181111]">
            {product.title}
          </h3>
        </Link>
      </div>
      {product.colors && product.colors.length > 0 ? (
        <div className="shrink-0 pt-0.5">
          <ProductColors colors={product.colors} isCompact maxVisible={2} />
        </div>
      ) : null}
    </div>
  );
}
