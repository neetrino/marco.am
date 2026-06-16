'use client';

import { memo, useMemo } from 'react';

import { SpecialOfferCard } from '@/components/home/SpecialOfferCard';
import type { SpecialOfferProduct } from '@/components/home/special-offer-product.types';
import { useIsMaxMd } from '@/components/home/use-is-max-md';
import { SPECIAL_OFFERS_CARD_MAX_WIDTH_PX } from '@/components/home/home-special-offers.constants';
import type { RelatedProductRow } from '@/lib/product-pdp/fetch-related-products';

interface RelatedProductsCardItemProps {
  product: RelatedProductRow;
  hasMoved: boolean;
  imagePriority?: boolean;
}

function toSpecialOfferProduct(row: RelatedProductRow): SpecialOfferProduct {
  const compareAt = row.compareAtPrice ?? null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: row.price,
    defaultVariantId: row.defaultVariantId ?? null,
    compareAtPrice: compareAt ?? undefined,
    originalPrice: row.originalPrice ?? compareAt ?? undefined,
    image: row.image,
    images: row.image ? [row.image] : undefined,
    inStock: row.inStock,
    brand: row.brand ?? null,
    discountPercent: row.discountPercent ?? null,
    isSpecialPrice: row.isSpecialPrice ?? false,
    warrantyYears: row.warrantyYears ?? row.warrantyBadge?.years ?? null,
    warrantyBadge: row.warrantyBadge,
  };
}

function RelatedProductsCardItemInner({
  product,
  hasMoved,
  imagePriority = false,
}: RelatedProductsCardItemProps) {
  const isMaxMd = useIsMaxMd();
  const specialOfferProduct = useMemo(
    () => toSpecialOfferProduct(product),
    [product],
  );

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
