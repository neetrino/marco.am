'use client';

import { memo, useMemo } from 'react';

import { SpecialOfferCard } from '@/components/home/SpecialOfferCard';
import { useIsMaxMd } from '@/components/home/use-is-max-md';
import { SPECIAL_OFFERS_CARD_MAX_WIDTH_PX } from '@/components/home/home-special-offers.constants';
import { toSpecialOfferProduct } from '@/lib/product-listing/to-special-offer-product';
import type { RelatedProductRow } from '@/lib/product-pdp/fetch-related-products';

interface RelatedProductsCardItemProps {
  product: RelatedProductRow;
  hasMoved: boolean;
  imagePriority?: boolean;
}

function RelatedProductsCardItemInner({
  product,
  hasMoved,
  imagePriority = false,
}: RelatedProductsCardItemProps) {
  const isMaxMd = useIsMaxMd();
  const specialOfferProduct = useMemo(() => toSpecialOfferProduct(product), [product]);

  return (
    <div
      className="flex h-full w-full justify-center"
      onClickCapture={(event) => {
        if (hasMoved) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <SpecialOfferCard
        product={specialOfferProduct}
        layout={isMaxMd ? 'mobileGrid' : 'default'}
        align="center"
        maxWidthPx={SPECIAL_OFFERS_CARD_MAX_WIDTH_PX}
        imagePriority={imagePriority}
      />
    </div>
  );
}

export const RelatedProductsCardItem = memo(RelatedProductsCardItemInner);
