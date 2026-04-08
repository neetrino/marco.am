'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { t } from '@/lib/i18n';
import { ProductCard } from '@/components/ProductCard';
import { logger } from '@/lib/utils/logger';
import type { ProductLabel } from '@/components/ProductLabels';

const PRODUCTS_LIMIT = 8;

const GRID_CLASS =
  'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  image: string | null;
  inStock: boolean;
  brand: { id: string; name: string } | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  sizes?: Array<{ value: string; imageUrl?: string | null }>;
  attributes?: Record<
    string,
    Array<{ valueId?: string; value: string; label: string; imageUrl?: string | null; colors?: string[] | null }>
  >;
  originalPrice?: number | null;
  discountPercent?: number | null;
  labels?: ProductLabel[];
  defaultVariantId?: string | null;
}

interface ProductsResponse {
  data: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type HomeProductFilter = 'featured' | 'new';

interface HomeProductSectionProps {
  titleKey: 'home.special_offers_title' | 'home.new_arrivals_title';
  filter: HomeProductFilter;
}

export function HomeProductSection({ titleKey, filter }: HomeProductSectionProps) {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguage());
    sync();
    window.addEventListener('language-updated', sync);
    return () => window.removeEventListener('language-updated', sync);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const lang = getStoredLanguage();
      const response = await apiClient.get<ProductsResponse>('/api/v1/products', {
        params: {
          page: '1',
          limit: String(PRODUCTS_LIMIT),
          lang,
          filter,
        },
      });
      setProducts((response.data || []).slice(0, PRODUCTS_LIMIT));
    } catch (err) {
      logger.error('[HomeProductSection] fetch failed', { err, filter });
      setError(t(getStoredLanguage(), 'home.featured_products.errorLoading'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, language]);

  const title = t(language, titleKey);
  const seeAllHref = `/products?filter=${filter}`;

  return (
    <section className="bg-white py-10 md:py-14">
      <h2 className="text-center text-xl font-black uppercase tracking-wide text-[#101010] md:text-2xl">
        {title}
      </h2>

      <div className="mt-8 md:mt-10">
          {loading ? (
            <div className={GRID_CLASS}>
              {Array.from({ length: PRODUCTS_LIMIT }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-gray-50 animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 rounded bg-gray-200" />
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                    <div className="h-5 w-1/3 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => fetchProducts()}
                className="rounded-full bg-[#101010] px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t(language, 'home.featured_products.tryAgain')}
              </button>
            </div>
          ) : products.length > 0 ? (
            <div className={GRID_CLASS}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-gray-500">
              {t(language, 'home.featured_products.noProducts')}
            </p>
          )}
        </div>

      <div className="mt-10 flex justify-center">
        <Link
          href={seeAllHref}
          className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#101010] px-10 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t(language, 'common.search.seeAll')}
        </Link>
      </div>
    </section>
  );
}
