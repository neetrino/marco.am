'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../lib/i18n-client';
import { dedupeCardProductsByTitle } from '../lib/dedupeCardProductsByTitle';
import type { ProductListingBrand } from '@/lib/types/product-listing-brand';
import type { ProductLabel } from './ProductLabels';
import { ProductCard } from './ProductCard';
import { ProductsGridOfferCard } from './ProductsGridOfferCard';
import type { SpecialOfferProduct } from './home/special-offer-product.types';
import { useIsMaxMd } from './home/use-is-max-md';
import { SHOP_PLP_LCP_IMAGE_PRIORITY_COUNT } from '@/lib/constants/shop-plp-pagination';
import { useForcedShopGridColumns } from './useForcedShopGridColumns';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  image: string | null;
  inStock: boolean;
  brand: ProductListingBrand | null;
  categories?: Array<{ id: string; slug: string; title: string }>;
  defaultVariantId?: string | null;
  labels?: ProductLabel[];
  warrantyYears?: import('@/lib/constants/product-warranty').ProductWarrantyYears | null;
  warrantyBadge?: { years: import('@/lib/constants/product-warranty').ProductWarrantyYears } | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  requiresAttributeSelection?: boolean | null;
}

function toSpecialOfferProduct(p: Product): SpecialOfferProduct {
  const compareAt = p.compareAtPrice ?? null;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: compareAt ?? undefined,
    originalPrice: compareAt ?? undefined,
    image: p.image,
    images: p.image ? [p.image] : undefined,
    inStock: p.inStock,
    brand: p.brand,
    categories: p.categories,
    defaultVariantId: p.defaultVariantId ?? undefined,
    discountPercent: p.discountPercent ?? null,
    isSpecialPrice: p.isSpecialPrice ?? false,
    labels: p.labels,
    warrantyYears: p.warrantyYears ?? p.warrantyBadge?.years ?? null,
    warrantyBadge: p.warrantyBadge,
    colors: p.colors,
    requiresAttributeSelection: p.requiresAttributeSelection,
  };
}

type ViewMode = 'list' | 'grid-2' | 'grid-3';

/** Sort modes already applied by the listing API — skip redundant client re-sort. */
const SERVER_SORTED_SORT_KEYS = new Set([
  'default',
  'price-asc',
  'price-desc',
  'price',
  'popular',
  'bestseller',
  'newest',
  'createdAt',
  'createdAt-desc',
]);

/** Progressive paint kicks in for typical PLP page size (21 cards). */
const PRODUCTS_PROGRESSIVE_RENDER_THRESHOLD = 12;
const PRODUCTS_INITIAL_RENDER_BATCH_SIZE = 12;
const PRODUCTS_RENDER_BATCH_SIZE = 9;
const PRODUCTS_RENDER_BATCH_DELAY_MS = 16;

interface ProductsGridProps {
  products: Product[];
  sortBy?: string;
  /** PLP: render all cards at once — avoids batch paint flicker after filter changes. */
  disableProgressiveRender?: boolean;
}

const PRODUCTS_CARD_MAX_WIDTH_PX = 286;

export function ProductsGrid({
  products,
  sortBy = 'default',
  disableProgressiveRender = false,
}: ProductsGridProps) {
  const { t } = useTranslation();
  const isMaxMd = useIsMaxMd();
  const forcedShopCols = useForcedShopGridColumns();
  /** Same as home featured strip: `default` (fixed card width) on md+, `mobileGrid` on small screens */
  const specialOfferLayout = isMaxMd ? 'mobileGrid' : 'default';
  const [viewMode, setViewMode] = useState<ViewMode>('grid-2');
  const [visibleCount, setVisibleCount] = useState(() =>
    !disableProgressiveRender && products.length > PRODUCTS_PROGRESSIVE_RENDER_THRESHOLD
      ? Math.min(PRODUCTS_INITIAL_RENDER_BATCH_SIZE, products.length)
      : products.length,
  );

  // Load view mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('products-view-mode');
    if (stored && ['list', 'grid-2', 'grid-3'].includes(stored)) {
      setViewMode(stored as ViewMode);
    } else {
      // Default to grid-2 if nothing stored
      setViewMode('grid-2');
      localStorage.setItem('products-view-mode', 'grid-2');
    }
  }, []);

  // Listen for view mode changes
  useEffect(() => {
    const handleViewModeChange = (_event: CustomEvent) => {
      setViewMode((_event as CustomEvent).detail);
    };

    window.addEventListener('view-mode-changed', handleViewModeChange as (_event: Event) => void);
    return () => {
      window.removeEventListener('view-mode-changed', handleViewModeChange as (_event: Event) => void);
    };
  }, []);

  const sortedProducts = useMemo(() => {
    const sorted = [...products];

    if (!SERVER_SORTED_SORT_KEYS.has(sortBy)) {
      switch (sortBy) {
        case 'name-asc':
          sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'name-desc':
          sorted.sort((a, b) => b.title.localeCompare(a.title));
          break;
        default:
          break;
      }
    }

    return dedupeCardProductsByTitle(sorted);
  }, [products, sortBy]);

  const offerProducts = useMemo(
    () => sortedProducts.map((product) => toSpecialOfferProduct(product)),
    [sortedProducts],
  );

  const productsFingerprint = useMemo(
    () => sortedProducts.map((product) => product.id).join(','),
    [sortedProducts],
  );

  const shouldUseProgressiveRender =
    !disableProgressiveRender && sortedProducts.length > PRODUCTS_PROGRESSIVE_RENDER_THRESHOLD;

  useEffect(() => {
    if (!shouldUseProgressiveRender) {
      setVisibleCount(sortedProducts.length);
      return;
    }
    setVisibleCount(Math.min(PRODUCTS_INITIAL_RENDER_BATCH_SIZE, sortedProducts.length));
  }, [productsFingerprint, shouldUseProgressiveRender, sortedProducts.length]);

  useEffect(() => {
    if (!shouldUseProgressiveRender || visibleCount >= sortedProducts.length) {
      return;
    }
    const timerId = window.setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PRODUCTS_RENDER_BATCH_SIZE, sortedProducts.length),
      );
    }, PRODUCTS_RENDER_BATCH_DELAY_MS);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [shouldUseProgressiveRender, visibleCount, sortedProducts.length]);

  /** Tighter on smallest phones; roomier gaps on mobile shop before `md` desktop columns */
  const gridGapClass = 'gap-x-3 gap-y-10 sm:gap-x-4 sm:gap-y-12 md:gap-x-6 md:gap-y-12';

  /**
   * Touch iPad / tablet (see `useForcedShopGridColumns`): fixed 2 or 3 columns, no list mode.
   * Otherwise: user-selected view mode.
   */
  const getGridClasses = () => {
    if (forcedShopCols === 2) {
      return `grid grid-cols-2 ${gridGapClass}`;
    }
    if (forcedShopCols === 3) {
      return `grid grid-cols-3 ${gridGapClass}`;
    }
    switch (viewMode) {
      case 'list':
        return 'grid grid-cols-1 gap-y-6';
      case 'grid-2':
        return `grid grid-cols-2 md:grid-cols-3 ${gridGapClass}`;
      case 'grid-3':
        return `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${gridGapClass}`;
      default:
        return `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${gridGapClass}`;
    }
  };

  if (sortedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('products.grid.noProducts')}</p>
      </div>
    );
  }

  const useListLayout = forcedShopCols === null && viewMode === 'list';

  return (
    <div className={getGridClasses()}>
      {sortedProducts.slice(0, visibleCount).map((product, index) => (
        <div
          key={product.id}
          className={
            useListLayout
              ? 'min-w-0 w-full max-w-none'
              : 'flex min-w-0 justify-center sm:justify-end sm:pr-3 md:pr-4'
          }
        >
          {useListLayout ? (
            <ProductCard product={product} viewMode="list" />
          ) : (
            <ProductsGridOfferCard
              product={offerProducts[index]!}
              layout={specialOfferLayout}
              maxWidthPx={PRODUCTS_CARD_MAX_WIDTH_PX}
              imagePriority={index < SHOP_PLP_LCP_IMAGE_PRIORITY_COUNT}
            />
          )}
        </div>
      ))}
    </div>
  );
}
