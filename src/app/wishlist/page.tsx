'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@shop/ui';
import { apiClient } from '../../lib/api-client';
import { getStoredLanguage } from '../../lib/language';
import { useTranslation } from '../../lib/i18n-client';
import { logger } from "@/lib/utils/logger";
import { ProductCard } from '@/components/ProductCard';
import {
  ensureLegacyWishlistMigratedForGuest,
  fetchWishlistPayload,
} from '@/lib/wishlist/wishlist-client';

const WISHLIST_PRODUCT_GRID_CLASS =
  'grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 md:gap-6';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  image: string | null;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
  } | null;
}

type FetchWishlistOptions = {
  /** When true, skip full-page loading skeleton (e.g. after heart toggle on this page). */
  silent?: boolean;
};

/**
 * Wishlist page that shows saved products and supports lightweight CRUD actions.
 */
export default function WishlistPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches wishlist products for provided ids and updates component state.
   */
  const fetchWishlistProducts = useCallback(async (options?: FetchWishlistOptions) => {
    const showLoading = !options?.silent;
    try {
      if (showLoading) {
        setLoading(true);
      }
      const languagePreference = getStoredLanguage();
      await ensureLegacyWishlistMigratedForGuest(languagePreference);
      const payload = await fetchWishlistPayload(languagePreference);
      const idsToLoad = payload.wishlist.items.map((item) => item.productId);
      if (idsToLoad.length === 0) {
        logger.devInfo('[Wishlist] Skip fetch because ids array is empty');
        setProducts([]);
        return;
      }

      logger.devInfo(`[Wishlist] Fetching ${idsToLoad.length} products for render`);
      const response = await apiClient.get<{
        data: Product[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>('/api/v1/products', {
        params: {
          limit: '1000',
          lang: languagePreference,
        },
      });

      const positionById = new Map(idsToLoad.map((id, index) => [id, index] as const));
      const wishlistProducts = response.data.filter((product) =>
        idsToLoad.includes(product.id)
      ).sort((a, b) => {
        const aPos = positionById.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bPos = positionById.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return aPos - bPos;
      });
      setProducts(wishlistProducts);
    } catch (error) {
      console.error('[Wishlist] Error fetching wishlist products:', error);
      setProducts([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchWishlistProducts();

    const handleWishlistUpdate = () => {
      void fetchWishlistProducts({ silent: true });
    };

    const handleLanguageUpdate = () => {
      void fetchWishlistProducts();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [fetchWishlistProducts]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('common.wishlist.title')}</h1>

      {products.length > 0 ? (
        <>
          <div className="py-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-600 dark:text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-base font-medium text-gray-700 dark:text-white/80">
                {t('common.wishlist.totalCount')}: <span className="font-bold text-gray-900 dark:text-white">{products.length}</span>
              </span>
            </div>
          </div>

          <div className={WISHLIST_PRODUCT_GRID_CLASS}>
            {products.map((product) => (
              <div key={product.id} className="min-w-0">
                <ProductCard product={product} viewMode="grid-2" wishlistPage />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('common.wishlist.empty')}
            </h2>
            <p className="text-gray-600 my-6 text-center mx-auto">
              {t('common.wishlist.emptyDescription')}
            </p>
            <Link href="/products">
              <Button
                variant="primary"
                size="lg"
                className="!bg-black !text-white !rounded-full !h-12 !px-10 inline-flex items-center justify-center leading-none whitespace-nowrap !hover:bg-black/90 transition-colors"
              >
                {t('common.buttons.browseProducts')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
