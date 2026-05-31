'use client';

import { memo } from 'react';

import { SpecialOfferCard } from './home/SpecialOfferCard';
import type { SpecialOfferCardLayout } from './home/SpecialOfferCard';
import type { SpecialOfferProduct } from './home/special-offer-product.types';

interface ProductsGridOfferCardProps {
  product: SpecialOfferProduct;
  layout: SpecialOfferCardLayout;
  maxWidthPx: number;
}

function ProductsGridOfferCardInner({
  product,
  layout,
  maxWidthPx,
}: ProductsGridOfferCardProps) {
  return (
    <SpecialOfferCard
      product={product}
      layout={layout}
      align="end"
      maxWidthPx={maxWidthPx}
    />
  );
}

export const ProductsGridOfferCard = memo(ProductsGridOfferCardInner);
