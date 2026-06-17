'use client';

import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ProductPdpPrefetchLink } from '../ProductPdpPrefetchLink';
import { getStoredLanguage } from '@/lib/language';
import { seedProductPdpCache } from '@/lib/product-pdp/pdp-navigation-seed-cache';
import { resolveNavigationSeedImages } from '@/lib/product-pdp/pdp-navigation-seed';
import { ProductCardImage } from './ProductCardImage';
import { ProductCardInfo } from './ProductCardInfo';
import { ProductCardActions } from './ProductCardActions';
import { HeaderNavbarCartIcon } from '../icons/HeaderNavbarCartIcon';
import { NoPriceArrowIcon } from '../icons/NoPriceArrowIcon';
import { useTranslation } from '../../lib/i18n-client';
import type { CurrencyCode } from '../../lib/currency';
import type { ProductListingBrand } from '@/lib/types/product-listing-brand';
import type { ProductLabel } from '../ProductLabels';

interface ProductCardGridProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string | null;
    images?: string[];
    inStock: boolean;
    brand: ProductListingBrand | null;
    labels?: ProductLabel[];
    warrantyYears?: import('@/lib/constants/product-warranty').ProductWarrantyYears | null;
    warrantyBadge?: { years: import('@/lib/constants/product-warranty').ProductWarrantyYears } | null;
    compareAtPrice?: number | null;
    originalPrice?: number | null;
    discountPercent?: number | null;
    isSpecialPrice?: boolean;
    colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
    categories?: Array<{ id: string; slug: string; title: string }>;
  };
  currency: CurrencyCode;
  isInWishlist: boolean;
  isInCompare: boolean;
  isAddingToCart: boolean;
  imageError: boolean;
  isCompact?: boolean;
  onImageError: () => void;
  onWishlistToggle: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  onAddToCart: (e: MouseEvent) => void;
  /** Wishlist page: card border + X instead of heart on overlay actions. */
  wishlistPage?: boolean;
}

/**
 * Grid view layout for ProductCard
 */
export function ProductCardGrid({
  product,
  currency,
  isInWishlist,
  isInCompare,
  isAddingToCart,
  imageError,
  isCompact = false,
  onImageError,
  onWishlistToggle,
  onCompareToggle,
  onAddToCart,
  wishlistPage = false,
}: ProductCardGridProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const hasDisplayPrice = product.price > 0;
  const navigationSeed = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    image: product.image,
    images: resolveNavigationSeedImages(product.image, product.images),
    labels: product.labels,
    warrantyYears: product.warrantyYears ?? product.warrantyBadge?.years ?? null,
    inStock: product.inStock,
    brand: product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          logo: product.brand.logoUrl ?? null,
        }
      : null,
    categories: product.categories ?? [],
    price: product.price,
    oldPrice:
      product.originalPrice && product.originalPrice > product.price
        ? product.originalPrice
        : product.compareAtPrice ?? null,
    discountBadge:
      product.isSpecialPrice
        ? { type: 'special_price' as const, value: 0, label: 'special_price' }
        : product.discountPercent && product.discountPercent > 0
          ? {
              type: 'percentage' as const,
              value: product.discountPercent,
              label: `-${product.discountPercent}%`,
            }
          : null,
  };

  const handleNoPriceNavigate = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    seedProductPdpCache({
      queryClient,
      slug: product.slug,
      language: getStoredLanguage(),
      navigationSeed,
    });
    router.push(`/products/${encodeURIComponent(product.slug.trim())}`);
  };

  const cardSurfaceClass = wishlistPage
    ? 'border border-gray-200 shadow-sm hover:shadow-md dark:border-white/30'
    : 'hover:shadow-md';

  return (
    <div
      className={`bg-white rounded-lg overflow-hidden transition-shadow relative group ${cardSurfaceClass}`}
    >
      <ProductPdpPrefetchLink
        href={`/products/${product.slug}`}
        productSlug={product.slug}
        navigationSeed={navigationSeed}
        className="block cursor-pointer rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-marco-yellow focus-visible:ring-offset-2"
        aria-label={product.title}
      >
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <ProductCardImage
            id={product.id}
            slug={product.slug}
            image={product.image}
            title={product.title}
            labels={product.labels}
            inStock={product.inStock}
            brand={product.brand}
            categories={product.categories}
            price={product.price}
            originalPrice={product.originalPrice}
            compareAtPrice={product.compareAtPrice}
            discountPercent={product.discountPercent}
            isSpecialPrice={product.isSpecialPrice}
            warrantyYears={product.warrantyYears ?? product.warrantyBadge?.years ?? null}
            imageError={imageError}
            onImageError={onImageError}
            isCompact={isCompact}
            omitPdpLink
          />
        </div>

        {/* Product Info */}
        <ProductCardInfo
          id={product.id}
          slug={product.slug}
          title={product.title}
          brand={product.brand}
          price={product.price}
          inStock={product.inStock}
          labels={product.labels}
          warrantyYears={product.warrantyYears ?? product.warrantyBadge?.years ?? null}
          categories={product.categories}
          image={product.image}
          originalPrice={product.originalPrice}
          compareAtPrice={product.compareAtPrice}
          discountPercent={product.discountPercent}
          isSpecialPrice={product.isSpecialPrice}
          currency={currency}
          colors={product.colors}
          isCompact={isCompact}
          omitPdpLink
        />
      </ProductPdpPrefetchLink>

      {/* Action Icons - appear on hover (outside card link so buttons stay interactive) */}
      <ProductCardActions
        isInWishlist={isInWishlist}
        isInCompare={isInCompare}
        isAddingToCart={isAddingToCart}
        inStock={product.inStock}
        isCompact={isCompact}
        wishlistPage={wishlistPage}
        onWishlistToggle={onWishlistToggle}
        onCompareToggle={onCompareToggle}
        onAddToCart={onAddToCart}
        showOnHover
      />

      {/* Cart Button in Price Row */}
      <div className={`px-3 pb-5 sm:px-4 sm:pb-4 flex items-center justify-end ${isCompact ? 'gap-2' : 'gap-4'}`}>
        {hasDisplayPrice ? (
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!product.inStock || isAddingToCart}
            className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              product.inStock && !isAddingToCart
                ? 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={product.inStock ? t('common.buttons.addToCart') : t('common.stock.outOfStock')}
            aria-label={product.inStock ? t('common.ariaLabels.addToCart') : t('common.ariaLabels.outOfStock')}
          >
            {isAddingToCart ? (
              <svg className={`animate-spin ${isCompact ? 'h-5 w-5' : 'h-6 w-6'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <HeaderNavbarCartIcon className={isCompact ? 'h-[18px] w-[18px]' : 'h-[22px] w-[21px]'} />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNoPriceNavigate}
            className={`${isCompact ? 'h-[26px] w-[26px]' : 'h-8 w-8'} inline-flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
            aria-label={product.title}
          >
            <NoPriceArrowIcon className="h-full w-full" />
          </button>
        )}
      </div>
    </div>
  );
}
