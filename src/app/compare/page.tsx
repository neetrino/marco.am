'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MouseEvent } from 'react';
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
  ensureLegacyCompareMigratedForGuest,
  fetchComparePayload,
  removeCompareItemClient,
} from '@/lib/compare/compare-client';

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
  description?: string;
}


/**
 * Compare page renders up to four products side-by-side with quick actions.
 */
export default function ComparePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const displayImageSrc = SPECIAL_OFFERS_UNIFIED_NATURE_IMAGE_SRC;
  // Track if we updated locally to prevent unnecessary re-fetch
  const isLocalUpdateRef = useRef(false);

  /**
   * Fetch compare products for provided ids and update UI state.
   */
  const fetchCompareProducts = useCallback(async () => {
    try {
      setLoading(true);
      const languagePreference = getStoredLanguage();
      await ensureLegacyCompareMigratedForGuest(languagePreference);
      const payload = await fetchComparePayload(languagePreference);
      const compareProducts: Product[] = payload.compare.items.map((item) => ({
        id: item.productId,
        slug: item.slug,
        title: item.title,
        price: item.price,
        originalPrice: item.originalPrice,
        compareAtPrice: item.compareAtPrice,
        discountPercent: item.discountPercent,
        image: item.image,
        inStock: item.inStock,
        brand: item.brand,
      }));
      logger.devInfo(`[Compare] Loaded ${compareProducts.length} compare products`);
      setCompareIds(compareProducts.map((product) => product.id));
      setProducts(compareProducts);
    } catch (error) {
      console.error('[Compare] Error fetching compare products:', error);
      setProducts([]);
      setCompareIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCompareProducts();

    // Listen for compare updates from other components (header, etc.)
    // But don't re-fetch if we already updated locally
    const handleCompareUpdate = () => {
      // If we just updated locally, skip re-fetch to avoid page reload
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }

      // Only re-fetch if update came from external source (another component)
      void fetchCompareProducts();
    };

    window.addEventListener('compare-updated', handleCompareUpdate);
    return () => {
      window.removeEventListener('compare-updated', handleCompareUpdate);
    };
  }, [fetchCompareProducts]);

  // Listen for currency and language updates
  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    const handleLanguageUpdate = () => {
      // Reload products with new language preference
      void fetchCompareProducts();
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [fetchCompareProducts]);

  const handleRemove = (e: MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    logger.devInfo(`[Compare] Removing product ${productId} from compare UI`);
    
    // Mark as local update to prevent re-fetch in event handler
    isLocalUpdateRef.current = true;
    
    // Optimistic update: remove from UI immediately (no loading state, no page reload)
    const updatedIds = compareIds.filter((id) => id !== productId);
    const updatedProducts = products.filter((p) => p.id !== productId);
    
    // Update state immediately (no page reload, no loading spinner)
    setCompareIds(updatedIds);
    setProducts(updatedProducts);

    void removeCompareItemClient(productId, getStoredLanguage()).catch((error) => {
      logger.devWarn('[Compare] Failed to remove compare item on server, restoring state', { error });
      isLocalUpdateRef.current = false;
      void fetchCompareProducts();
    });
  };

  const handleAddToCart = async (e: MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.inStock) {
      return;
    }

    if (!isLoggedIn) {
      router.push(`/login?redirect=/compare`);
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
        router.push(`/login?redirect=/compare`);
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
        <div className="text-center py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="mt-4 bg-gray-200 rounded-lg h-48"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('common.compare.title')}</h1>
        {products.length > 0 && (
          <p className="text-sm text-gray-600">
            {products.length}/4
          </p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[150px] sticky left-0 bg-gray-50 z-10">
                    {t('common.compare.characteristic')}
                  </th>
                  {products.map((product) => (
                    <th
                      key={product.id}
                      className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[220px] relative"
                    >
                      <button
                        onClick={(e) => handleRemove(e, product.id)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-marco-black hover:bg-marco-yellow rounded-full transition-all"
                        title={t('common.buttons.remove')}
                        aria-label={t('common.buttons.remove')}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Изображение */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                    {t('common.compare.image')}
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-4 text-center">
                      <Link href={`/products/${product.slug}`} className="inline-block">
                        <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg overflow-hidden relative">
                          <Image
                            src={displayImageSrc}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="128px"
                            unoptimized
                          />
                        </div>
                      </Link>
                    </td>
                  ))}
                </tr>

                {/* Название */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                    {t('common.compare.name')}
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-4">
                      <Link
                        href={`/products/${product.slug}`}
                        className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors block text-center"
                      >
                        {product.title}
                      </Link>
                    </td>
                  ))}
                </tr>

                {/* Бренд */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                    {t('common.compare.brand')}
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-4 text-center text-sm text-gray-600">
                      {product.brand ? product.brand.name : '-'}
                    </td>
                  ))}
                </tr>

                {/* Цена */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                    {t('common.compare.price')}
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-lg font-bold text-gray-900 select-none">
                          {formatPrice(product.price, currency)}
                        </p>
                        {(product.originalPrice && product.originalPrice > product.price) && (
                          <p className="text-sm text-gray-500 line-through select-none">
                            {formatPrice(product.originalPrice, currency)}
                          </p>
                        )}
                        {!product.originalPrice && product.compareAtPrice && product.compareAtPrice > product.price && (
                          <p className="text-sm text-gray-500 line-through select-none">
                            {formatPrice(product.compareAtPrice, currency)}
                          </p>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Наличие */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                    {t('common.compare.availability')}
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          product.inStock
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.inStock
                          ? t('common.stock.inStock')
                          : t('common.stock.outOfStock')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Действия */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                    {t('common.compare.actions')}
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-4 text-center">
                      <div className="flex flex-col gap-3 items-center">
                        <Link
                          href={`/products/${product.slug}`}
                          className="text-sm text-marco-black hover:opacity-80 font-medium transition-opacity"
                        >
                          {t('common.compare.viewDetails')}
                        </Link>
                        {product.inStock && (
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={addingToCart.has(product.id)}
                            className="px-4 py-2 bg-marco-yellow text-marco-black text-sm font-bold rounded-2xl hover:brightness-95 transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingToCart.has(product.id)
                              ? t('common.messages.adding')
                              : t('common.buttons.addToCart')}
                          </button>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('common.compare.empty')}
            </h2>
            <p className="text-gray-600 my-6 text-center mx-auto">
              {t('common.compare.emptyDescription')}
            </p>
            <Link href="/products">
              <Button
                variant="primary"
                size="lg"
                className="!bg-black !text-white !rounded-full !h-12 !px-10 inline-flex items-center justify-center leading-none whitespace-nowrap !hover:bg-black/90 transition-colors"
              >
                {t('common.compare.browseProducts')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}  