'use client';

import { memo, useCallback, useState, type MouseEvent } from 'react';

import type { ProductListingBrand } from '@/lib/types/product-listing-brand';
import { useWishlist } from './hooks/useWishlist';
import { useCompare } from './hooks/useCompare';
import { useAddToCart } from './hooks/useAddToCart';
import { useCurrency } from './hooks/useCurrency';
import type { ProductLabel } from './ProductLabels';
import { ProductCardList } from './ProductCard/ProductCardList';

type ProductsGridListCardProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  image: string | null;
  images?: string[];
  inStock: boolean;
  brand: ProductListingBrand | null;
  categories?: Array<{ id: string; slug: string; title: string }>;
  defaultVariantId?: string | null;
  labels?: ProductLabel[];
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  requiresAttributeSelection?: boolean | null;
};

interface ProductsGridListCardProps {
  readonly product: ProductsGridListCardProduct;
}

function ProductsGridListCardInner({ product }: ProductsGridListCardProps) {
  const currency = useCurrency();
  const { isInWishlist, toggleWishlist } = useWishlist(product.id);
  const { isInCompare, toggleCompare } = useCompare(product.id);
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: product.id,
    productSlug: product.slug,
    inStock: product.inStock,
    defaultVariantId: product.defaultVariantId ?? undefined,
    price: product.price,
    title: product.title,
    image: product.image,
    requiresAttributeSelection: product.requiresAttributeSelection,
    colors: product.colors,
  });
  const [imageError, setImageError] = useState(false);

  const handleWishlistToggle = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleWishlist();
  }, [toggleWishlist]);

  const handleCompareToggle = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleCompare();
  }, [toggleCompare]);

  const handleAddToCart = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void addToCart();
  }, [addToCart]);

  return (
    <ProductCardList
      product={{
        ...product,
        compareAtPrice: product.compareAtPrice,
        originalPrice: product.compareAtPrice,
      }}
      currency={currency}
      isInWishlist={isInWishlist}
      isInCompare={isInCompare}
      isAddingToCart={isAddingToCart}
      imageError={imageError}
      onImageError={() => setImageError(true)}
      onWishlistToggle={handleWishlistToggle}
      onCompareToggle={handleCompareToggle}
      onAddToCart={handleAddToCart}
    />
  );
}

export const ProductsGridListCard = memo(ProductsGridListCardInner);
