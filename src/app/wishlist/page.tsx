'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@shop/ui';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '@/lib/types/errors';
import { formatPrice, getStoredCurrency } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { logger } from "@/lib/utils/logger";
import { SPECIAL_OFFERS_UNIFIED_NATURE_IMAGE_SRC } from '../../components/home/home-special-offers.constants';
import {
  ensureLegacyWishlistMigratedForGuest,
  fetchWishlistPayload,
  removeWishlistItemClient,
} from '@/lib/wishlist/wishlist-client';

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

/**
 * Wishlist page that shows saved products and supports lightweight CRUD actions.
 */
export default function WishlistPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const displayImageSrc = SPECIAL_OFFERS_UNIFIED_NATURE_IMAGE_SRC;
  // Track if we updated locally to prevent unnecessary re-fetch
  const isLocalUpdateRef = useRef(false);

  /**
   * Fetches wishlist products for provided ids and updates component state.
   */
  const fetchWishlistProducts = useCallback(async () => {
    try {
      setLoading(true);
      const languagePreference = getStoredLanguage();
      await ensureLegacyWishlistMigratedForGuest(languagePreference);
      const payload = await fetchWishlistPayload(languagePreference);
      const idsToLoad = payload.wishlist.items.map((item) => item.productId);
      setWishlistIds(idsToLoad);
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
      setWishlistIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWishlistProducts();

    // Listen for wishlist updates from other components (header, etc.)
    // But don't re-fetch if we already updated locally
    const handleWishlistUpdate = () => {
      // If we just updated locally, skip re-fetch to avoid page reload
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }
      
      // Only re-fetch if update came from external source (another component)
      void fetchWishlistProducts();
    };

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };
    const handleLanguageUpdate = () => {
      void fetchWishlistProducts();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [fetchWishlistProducts]);

  const handleRemove = (productId: string) => {
    logger.devInfo(`[Wishlist] Removing product ${productId} from wishlist UI`);
    
    // Mark as local update to prevent re-fetch in event handler
    isLocalUpdateRef.current = true;
    
    // Optimistic update: remove from UI immediately (no loading state, no page reload)
    const updatedIds = wishlistIds.filter((id) => id !== productId);
    const updatedProducts = products.filter((p) => p.id !== productId);
    
    // Update state immediately (no page reload, no loading spinner)
    setWishlistIds(updatedIds);
    setProducts(updatedProducts);

    void removeWishlistItemClient(productId, getStoredLanguage()).catch((error) => {
      logger.devWarn('[Wishlist] Failed to remove wishlist item on server, restoring state', { error });
      isLocalUpdateRef.current = false;
      void fetchWishlistProducts();
    });
  };

  const handleAddToCart = async (product: Product) => {
    if (!product.inStock) {
      return;
    }

    if (!isLoggedIn) {
      router.push(`/login?redirect=/wishlist`);
      return;
    }

    setAddingToCart(prev => new Set(prev).add(product.id));

    try {
      // Get product details to get variant ID
      interface ProductDetails {
        id: string;
        variants?: Array<{
          id: string;
          sku: string;
          price: number;
          stock: number;
          available: boolean;
        }>;
      }

      const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${product.slug}`);

      if (!productDetails.variants || productDetails.variants.length === 0) {
        alert(t('common.alerts.noVariantsAvailable'));
        return;
      }

      const variantId = productDetails.variants[0].id;
      
      await apiClient.post(
        '/api/v1/cart/items',
        {
          productId: product.id,
          variantId: variantId,
          quantity: 1,
        }
      );

      // Trigger cart update event
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: unknown) {
      console.error('Error adding to cart:', error);
      const msg = getErrorMessage(error);
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        router.push(`/login?redirect=/wishlist`);
      }
    } finally {
      setAddingToCart(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

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
          {/* Total Count Section */}
          <div className="py-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-base font-medium text-gray-700">
                  {t('common.wishlist.totalCount')}: <span className="font-bold text-gray-900">{products.length}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Products Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-white border-b border-gray-200">
            <div className="md:col-span-5">
              <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t('common.wishlist.tableHeaders.productName')}</span>
            </div>
            <div className="md:col-span-2 text-center md:-ml-[83px]">
              <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t('common.wishlist.tableHeaders.unitPrice')}</span>
            </div>
            <div className="md:col-span-2 text-center md:-ml-[32px]">
              <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t('common.wishlist.tableHeaders.stockStatus')}</span>
            </div>
            <div className="md:col-span-3 text-center">
              <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t('common.wishlist.tableHeaders.action')}</span>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {products.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-6 hover:bg-gray-50 transition-colors"
              >
                {/* Product Name */}
                <div className="md:col-span-5 flex items-center gap-4">
                  <Link
                    href={`/products/${product.slug}`}
                    className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden"
                  >
                    <Image
                      src={displayImageSrc}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-base font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                    >
                      {product.title}
                    </Link>
                  </div>
                </div>

                {/* Unit Price */}
                <div className="md:col-span-2 flex items-center justify-start">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-base font-bold text-marco-black">
                      {formatPrice(product.price, currency)}
                    </span>
                    {(product.originalPrice && product.originalPrice > product.price) && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice, currency)}
                      </span>
                    )}
                    {!product.originalPrice && product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.compareAtPrice, currency)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock Status */}
                <div className="md:col-span-2 flex items-center justify-center md:-ml-[32px]">
                  {product.inStock ? (
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('common.stock.inStock')}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-red-600">
                      {t('common.stock.outOfStock')}
                    </span>
                  )}
                </div>

                {/* Action */}
                <div className="md:col-span-3 flex items-center justify-end gap-3 md:-mr-[10px]">
                  <Button
                    variant="primary"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock || addingToCart.has(product.id)}
                    className="!bg-marco-yellow !text-marco-black rounded-xl px-4 py-2 font-semibold uppercase text-sm !hover:bg-marco-yellow hover:brightness-95 transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToCart.has(product.id) ? t('common.messages.adding') : t('common.buttons.addToCart')}
                  </Button>
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-marco-yellow hover:text-marco-black transition-colors"
                    aria-label={t('common.ariaLabels.removeFromWishlist')}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
