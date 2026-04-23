'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { MouseEvent } from 'react';
import { formatPrice } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { ProductColors } from './ProductColors';
import { ProductCardActions } from './ProductCardActions';
import { ProductImagePlaceholder } from '../ProductImagePlaceholder';
import type { CurrencyCode } from '../../lib/currency';
import type { ProductLabel } from '../ProductLabels';

interface ProductCardListProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string | null;
    inStock: boolean;
    brand: { id: string; name: string } | null;
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
}: ProductCardListProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg overflow-hidden hover:bg-gray-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 sm:px-6 py-4 sm:py-5">
        {/* Product Image */}
        <Link
          href={`/products/${product.slug}`}
          className="w-36 h-36 bg-gray-100 rounded-xl border-2 border-gray-300 flex-shrink-0 relative overflow-hidden self-start sm:self-center"
        >
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
              className="w-full h-full"
              aria-label={product.title ? `No image for ${product.title}` : 'No image'}
            />
          )}
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-xl sm:text-2xl font-medium text-gray-900 transition-colors line-clamp-2">
              {product.title}
            </h3>
            <p className="text-lg sm:text-xl text-gray-500 mt-1">
              {product.brand?.name || t('common.defaults.category')}
            </p>
          </Link>
          {/* Available Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <ProductColors colors={product.colors} maxVisible={6} />
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {/* Price */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-semibold text-marco-black">
                {formatPrice(product.price || 0, currency)}
              </span>
              {product.discountPercent && product.discountPercent > 0 ? (
                <span className="text-xs sm:text-sm font-semibold text-marco-black">
                  -{product.discountPercent}%
                </span>
              ) : null}
            </div>
            {(product.originalPrice && product.originalPrice > product.price) || 
             (product.compareAtPrice && product.compareAtPrice > product.price) ? (
              <span className="text-base sm:text-lg text-gray-500 line-through mt-0.5">
                {formatPrice(
                  (product.originalPrice && product.originalPrice > product.price) 
                    ? product.originalPrice 
                    : (product.compareAtPrice || 0), 
                  currency
                )}
              </span>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="self-start sm:self-center">
            <ProductCardActions
              isInWishlist={isInWishlist}
              isInCompare={isInCompare}
              isAddingToCart={isAddingToCart}
              inStock={product.inStock}
              isCompact
              onWishlistToggle={onWishlistToggle}
              onCompareToggle={onCompareToggle}
              onAddToCart={onAddToCart}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
