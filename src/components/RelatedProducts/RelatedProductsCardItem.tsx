'use client';

import { memo, useState, type MouseEvent } from 'react';

import { useAddToCart } from '@/components/hooks/useAddToCart';
import type { CurrencyCode } from '@/lib/currency';
import type { RelatedProductRow } from '@/lib/product-pdp/fetch-related-products';
import type { LanguageCode } from '@/lib/language';

import { RelatedProductCard } from './RelatedProductCard';

interface RelatedProductsCardItemProps {
  product: RelatedProductRow;
  currency: CurrencyCode;
  language: LanguageCode;
  hasMoved: boolean;
  width: string;
}

function RelatedProductsCardItemInner({
  product,
  currency,
  language,
  hasMoved,
  width,
}: RelatedProductsCardItemProps) {
  const [imageError, setImageError] = useState(false);
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: product.id,
    productSlug: product.slug,
    inStock: product.inStock,
    price: product.price,
    colors: product.variants?.map((variant, idx) => ({
      value: variant.options?.[0]?.value ?? String(idx),
    })),
  });

  const handleAddToCart = (event: MouseEvent, _item: RelatedProductRow) => {
    event.preventDefault();
    event.stopPropagation();
    void addToCart();
  };

  return (
    <RelatedProductCard
      product={product}
      currency={currency}
      language={language}
      isAddingToCart={isAddingToCart}
      hasMoved={hasMoved}
      onAddToCart={handleAddToCart}
      onImageError={() => setImageError(true)}
      imageError={imageError}
      width={width}
    />
  );
}

export const RelatedProductsCardItem = memo(RelatedProductsCardItemInner);
