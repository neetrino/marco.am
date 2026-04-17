'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n-client';
import type { ProductLabel } from './ProductLabels';
import { ProductCard } from './ProductCard';
import { SpecialOfferCard } from './home/SpecialOfferCard';
import type { SpecialOfferProduct } from './home/special-offer-product.types';
import { useIsMaxMd } from './home/use-is-max-md';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
  } | null;
  defaultVariantId?: string | null;
  labels?: ProductLabel[];
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
}

function toSpecialOfferProduct(p: Product): SpecialOfferProduct {
  const compareAt = p.compareAtPrice ?? null;
  let discountPercent: number | null = null;
  if (compareAt != null && compareAt > p.price) {
    discountPercent = Math.round(((compareAt - p.price) / compareAt) * 100);
  }
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
    defaultVariantId: p.defaultVariantId ?? undefined,
    discountPercent,
    labels: p.labels,
    reviewCount: undefined,
    colors: p.colors,
  };
}

type ViewMode = 'list' | 'grid-2' | 'grid-3';

interface ProductsGridProps {
  products: Product[];
  sortBy?: string;
}

export function ProductsGrid({ products, sortBy = 'default' }: ProductsGridProps) {
  const { t } = useTranslation();
  const isMaxMd = useIsMaxMd();
  /** Same as home featured strip: `default` (fixed card width) on md+, `mobileGrid` on small screens */
  const specialOfferLayout = isMaxMd ? 'mobileGrid' : 'default';
  const [viewMode, setViewMode] = useState<ViewMode>('grid-2');
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);

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

  // Sort products
  useEffect(() => {
    const sorted = [...products];

    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        // Keep original order
        break;
    }

    setSortedProducts(sorted);
  }, [products, sortBy]);

  /** Horizontal gap like home featured; larger vertical gap between card rows */
  const gridGapClass = 'gap-x-3 gap-y-10 md:gap-x-6 md:gap-y-12';

  // Get grid classes based on view mode
  const getGridClasses = () => {
    switch (viewMode) {
      case 'list':
        return `grid grid-cols-1 ${gridGapClass}`;
      case 'grid-2':
        return `grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 ${gridGapClass}`;
      case 'grid-3':
        return `grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 ${gridGapClass}`;
      default:
        return `grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 ${gridGapClass}`;
    }
  };

  if (sortedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('products.grid.noProducts')}</p>
      </div>
    );
  }

  return (
    <div className={getGridClasses()}>
      {sortedProducts.map((product) => (
        <div
          key={product.id}
          className={
            viewMode === 'list'
              ? 'min-w-0 w-full'
              : 'flex min-w-0 justify-end pr-2 sm:pr-3 md:pr-4'
          }
        >
          {viewMode === 'list' ? (
            <ProductCard product={product} viewMode="list" />
          ) : (
            <SpecialOfferCard
              product={toSpecialOfferProduct(product)}
              layout={specialOfferLayout}
              align="end"
            />
          )}
        </div>
      ))}
    </div>
  );
}

