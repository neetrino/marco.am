'use client';

import { memo } from 'react';

import { SpecialOfferCard } from './home/SpecialOfferCard';
import type { SpecialOfferCardLayout } from './home/SpecialOfferCard';
import type { SpecialOfferProduct } from './home/special-offer-product.types';

interface ProductsGridOfferCardProps {
  product: SpecialOfferProduct;
  layout: SpecialOfferCardLayout;
  maxWidthPx: number;
  imagePriority?: boolean;
}

function ProductsGridOfferCardInner({
  product,
  layout,
  maxWidthPx,
  imagePriority = false,
}: ProductsGridOfferCardProps) {
  return (
    <SpecialOfferCard
      product={product}
      layout={layout}
      align={layout === 'mobileGrid' ? 'center' : 'end'}
      maxWidthPx={maxWidthPx}
      imagePriority={imagePriority}
    />
  );
}

export const ProductsGridOfferCard = memo(ProductsGridOfferCardInner);
