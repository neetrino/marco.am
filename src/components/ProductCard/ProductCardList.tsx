'use client';

import { ProductPdpPrefetchLink } from '../ProductPdpPrefetchLink';
import Image from 'next/image';
import type { MouseEvent } from 'react';
import type { ProductListingBrand } from '@/lib/types/product-listing-brand';
import { formatCatalogPrice, type CurrencyCode } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { ProductCardBrandMark } from './ProductCardBrandMark';
import { ProductColors } from './ProductColors';
import { ProductCardActions } from './ProductCardActions';
import { ProductImagePlaceholder } from '../ProductImagePlaceholder';
import type { ProductLabel } from '../ProductLabels';

interface ProductCardListProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string | null;
    inStock: boolean;
    brand: ProductListingBrand | null;
    labels?: ProductLabel[];
    compareAtPrice?: number | null;
    originalPrice?: number | null;
    discountPercent?: number | null;
    colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  };
  currency: CurrencyCode;
  isInWishlist: boolean;
  isInCompare: boolean;
  isAddingToCart: boolean;
  imageError: boolean;
  onImageError: () => void;
  onWishlistToggle: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  onAddToCart: (e: MouseEvent) => void;
  wishlistPage?: boolean;
}

/**
 * List view layout for ProductCard
 */
export function ProductCardList({
  product,
  currency,
  isInWishlist,
  isInCompare,
  isAddingToCart,
  imageError,
  onImageError,
  onWishlistToggle,
  onCompareToggle,
  onAddToCart,
  wishlistPage = false,
}: ProductCardListProps) {
  const { t } = useTranslation();
  const listSurfaceClass = wishlistPage
    ? 'border border-gray-200 shadow-sm dark:border-white/30'
    : '';

  return (
    <div className={`bg-white rounded-lg overflow-hidden hover:bg-gray-50 transition-colors ${listSurfaceClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 sm:px-6 py-4 sm:py-5">
        <ProductPdpPrefetchLink
          href={`/products/${product.slug}`}
          productSlug={product.slug}
          className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-marco-yellow focus-visible:ring-offset-2 rounded-lg"
          aria-label={product.title}
        >
          {/* Product Image */}
          <div className="relative h-36 w-36 flex-shrink-0 self-start overflow-hidden rounded-xl border-2 border-gray-300 bg-gray-100 sm:self-center">
            {!imageError && product.image ? (
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover object-center"
                sizes="144px"
                unoptimized
                onError={onImageError}
              />
            ) : (
              <ProductImagePlaceholder
                className="h-full w-full"
                aria-label={product.title ? `No image for ${product.title}` : 'No image'}
              />
            )}
          </div>

          {/* Product Info */}
          <div className="w-full min-w-0 flex-1 sm:w-auto">
            <h3 className="line-clamp-2 text-xl font-medium text-gray-900 transition-colors sm:text-2xl">
              {product.title}
            </h3>
            <div className="mt-1">
              {product.brand ? (
                <ProductCardBrandMark
                  name={product.brand.name}
                  slug={product.brand.slug}
                  logoUrl={product.brand.logoUrl}
                  textClassName="text-lg text-gray-500 dark:text-[#050505] sm:text-xl"
                  logoBoxClassName="h-7 w-[120px] sm:h-8 sm:w-[140px]"
                />
              ) : (
                <p className="text-lg text-gray-500 dark:text-[#050505] sm:text-xl">
                  {t('common.defaults.category')}
                </p>
              )}
            </div>
            {/* Available Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <ProductColors colors={product.colors} maxVisible={6} />
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex w-full flex-shrink-0 flex-col sm:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-semibold text-marco-black sm:text-2xl">
                {formatCatalogPrice(product.price || 0, currency)}
              </span>
              {product.discountPercent && product.discountPercent > 0 ? (
                <span className="text-xs font-semibold text-marco-black sm:text-sm">
                  -{product.discountPercent}%
                </span>
              ) : null}
            </div>
            {(product.originalPrice && product.originalPrice > product.price) ||
            (product.compareAtPrice && product.compareAtPrice > product.price) ? (
              <span className="mt-0.5 text-lg text-gray-500 line-through sm:text-xl">
                {formatCatalogPrice(
                  product.originalPrice && product.originalPrice > product.price
                    ? product.originalPrice
                    : (product.compareAtPrice || 0),
                  currency
                )}
              </span>
            ) : null}
          </div>
        </ProductPdpPrefetchLink>

        {/* Action Buttons: outside PDP link to avoid anchor nesting with buttons */}
        <div className="self-start sm:self-center">
          <ProductCardActions
            isInWishlist={isInWishlist}
            isInCompare={isInCompare}
            isAddingToCart={isAddingToCart}
            inStock={product.inStock}
            isCompact
            wishlistPage={wishlistPage}
            onWishlistToggle={onWishlistToggle}
            onCompareToggle={onCompareToggle}
            onAddToCart={onAddToCart}
          />
        </div>
      </div>
    </div>
  );
}
