'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@shop/ui';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '@/lib/types/errors';
import { getStoredCurrency } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { logger } from '@/lib/utils/logger';
import {
  CompareCategoryTable,
  mapCompareItemToProduct,
  type CompareTableProduct,
} from '@/components/compare/CompareCategoryTable';
import {
  ensureLegacyCompareMigratedForGuest,
  fetchComparePayload,
  removeCompareItemClient,
} from '@/lib/compare/compare-client';

type CompareSectionState = {
  categoryId: string;
  categoryName: string;
  items: CompareTableProduct[];
};

/**
 * Compare page: products grouped by category, up to four per category.
 */
export default function ComparePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [sections, setSections] = useState<CompareSectionState[]>([]);
  const [maxPerCategory, setMaxPerCategory] = useState(4);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const isLocalUpdateRef = useRef(false);

  const fetchCompareProducts = useCallback(async () => {
    try {
      setLoading(true);
      const languagePreference = getStoredLanguage();
      await ensureLegacyCompareMigratedForGuest(languagePreference);
      const payload = await fetchComparePayload(languagePreference);
      setMaxPerCategory(payload.compare.maxItemsPerCategory);
      setSections(
        payload.compare.sections.map((sec) => ({
          categoryId: sec.categoryId,
          categoryName: sec.categoryName,
          items: sec.items.map(mapCompareItemToProduct),
        }))
      );
      logger.devInfo(
        `[Compare] Loaded ${payload.compare.items.length} products in ${payload.compare.sections.length} categories`
      );
    } catch (error) {
      console.error('[Compare] Error fetching compare products:', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCompareProducts();
    const handleCompareUpdate = () => {
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }
      void fetchCompareProducts();
    };
    window.addEventListener('compare-updated', handleCompareUpdate);
    return () => {
      window.removeEventListener('compare-updated', handleCompareUpdate);
    };
  }, [fetchCompareProducts]);

  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };
    const handleLanguageUpdate = () => {
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
    isLocalUpdateRef.current = true;
    setSections((prev) =>
      prev
        .map((sec) => ({
          ...sec,
          items: sec.items.filter((p) => p.id !== productId),
        }))
        .filter((sec) => sec.items.length > 0)
    );
    void removeCompareItemClient(productId, getStoredLanguage()).catch((error) => {
      logger.devWarn('[Compare] Failed to remove compare item on server, restoring state', {
        error,
      });
      isLocalUpdateRef.current = false;
      void fetchCompareProducts();
    });
  };

  const handleAddToCart = async (e: MouseEvent, product: CompareTableProduct) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) {
      return;
    }
    if (!isLoggedIn) {
      router.push(`/login?redirect=/compare`);
      return;
    }
    setAddingToCart((prev) => new Set(prev).add(product.id));
    try {
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
      const productDetails = await apiClient.get<ProductDetails>(
        `/api/v1/products/${product.slug}`
      );
      if (!productDetails.variants || productDetails.variants.length === 0) {
        alert(t('common.alerts.noVariantsAvailable'));
        return;
      }
      const variantId = productDetails.variants[0].id;
      await apiClient.post('/api/v1/cart/items', {
        productId: product.id,
        variantId,
        quantity: 1,
      });
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: unknown) {
      console.error('Error adding to cart:', error);
      const msg = getErrorMessage(error);
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        router.push(`/login?redirect=/compare`);
      }
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const totalProducts = sections.reduce((n, s) => n + s.items.length, 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="py-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-6 w-1/4 rounded bg-gray-200" />
            <div className="mt-4 h-48 rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('common.compare.title')}
        </h1>
        {totalProducts > 0 ? (
          <p className="text-sm text-gray-600 dark:text-white/70">
            {t('common.compare.summaryLine')
              .replace('{total}', String(totalProducts))
              .replace('{categories}', String(sections.length))
              .replace('{max}', String(maxPerCategory))}
          </p>
        ) : null}
      </div>

      {totalProducts > 0 ? (
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.categoryId} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-gray-200 pb-2 dark:border-white/20">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {section.categoryName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-white/60">
                  {section.items.length}/{maxPerCategory}
                </p>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/40 dark:bg-[var(--app-bg)]">
                <CompareCategoryTable
                  products={section.items}
                  currency={currency}
                  t={t}
                  addingToCart={addingToCart}
                  handleRemove={handleRemove}
                  handleAddToCart={handleAddToCart}
                />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="mx-auto max-w-md">
            <svg
              className="mx-auto mb-4 h-24 w-24 text-gray-400"
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
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {t('common.compare.empty')}
            </h2>
            <p className="mx-auto my-6 text-center text-gray-600 dark:text-white/70">
              {t('common.compare.emptyDescription')}
            </p>
            <Link href="/products">
              <Button
                variant="primary"
                size="lg"
                className="inline-flex !h-12 items-center justify-center whitespace-nowrap rounded-full !bg-black !px-10 !text-white leading-none !hover:bg-black/90"
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
