'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { t } from '@/lib/i18n';
import { ProductCard } from '@/components/ProductCard';
import { logger } from '@/lib/utils/logger';
import { dedupeCardProductsByTitle } from '@/lib/dedupeCardProductsByTitle';
import type { ProductLabel } from '@/components/ProductLabels';
import { montserratArm } from '@/fonts/montserrat-arm';
import { useTranslation } from '@/lib/i18n-client';
import {
  NEW_ARRIVALS_CARDS_PER_VIEW,
  NEW_ARRIVALS_FETCH_LIMIT,
} from '@/constants/specialOffersSection';
import { SpecialOfferProductCard, type SpecialOfferProduct } from '@/components/home/special-offers/SpecialOfferProductCard';
import { CarouselArrow } from './CarouselArrow';

const LEGACY_GRID_CLASS = 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4';

/** Figma NEWS — 2 rows × 4 columns on md+ (8 cards). */
const NEW_ARRIVALS_GRID_CLASS =
  'grid grid-cols-2 gap-4 justify-items-stretch md:grid-cols-4 md:justify-items-center md:gap-x-[106px] md:gap-y-8';

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

/**
 * Home product strip — «Նորույթներ» matches Figma NEWS (`751:1935`): 2×4 grid per page, optional carousel, CTA.
 * `filter: featured` keeps the legacy grid for compatibility.
 */
export function HomeProductSection({ titleKey, filter }: HomeProductSectionProps) {
  const { t: tr } = useTranslation();
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const isNewArrivalsLayout = filter === 'new';
  const fetchLimit = isNewArrivalsLayout ? NEW_ARRIVALS_FETCH_LIMIT : 8;

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
          limit: String(fetchLimit),
          lang,
          filter,
        },
      });
      const uniqueProducts = dedupeCardProductsByTitle(response.data || []);
      setProducts(uniqueProducts.slice(0, fetchLimit));
      setPageIndex(0);
    } catch (err) {
      logger.error('[HomeProductSection] fetch failed', { err, filter });
      setError(t(getStoredLanguage(), 'home.featured_products.errorLoading'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter, fetchLimit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, language]);

  const title = t(language, titleKey);
  const seeAllHref = `/products?filter=${filter}`;

  const newArrivalsTotalPages = Math.max(1, Math.ceil(products.length / NEW_ARRIVALS_CARDS_PER_VIEW));
  const newArrivalsSafePage = Math.min(pageIndex, newArrivalsTotalPages - 1);
  const newArrivalsStart = newArrivalsSafePage * NEW_ARRIVALS_CARDS_PER_VIEW;
  const pageProducts = isNewArrivalsLayout
    ? products.slice(newArrivalsStart, newArrivalsStart + NEW_ARRIVALS_CARDS_PER_VIEW)
    : products;
  const showNewArrivalsPager = isNewArrivalsLayout && products.length > NEW_ARRIVALS_CARDS_PER_VIEW;

  useEffect(() => {
    if (!isNewArrivalsLayout) return;
    const tp = Math.max(1, Math.ceil(products.length / NEW_ARRIVALS_CARDS_PER_VIEW));
    setPageIndex((p) => Math.min(p, tp - 1));
  }, [isNewArrivalsLayout, products.length]);

  if (isNewArrivalsLayout) {
    return (
      <section className="bg-white py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div className="relative min-w-0">
            <h2
              className={`${montserratArm.className} text-[clamp(1.75rem,4vw,3.375rem)] font-bold uppercase leading-none tracking-[-0.6px] text-[#181111]`}
            >
              {title}
            </h2>
            <div className="relative mt-2 h-1 max-w-[28%] rounded-full bg-[#ffca03] md:mt-3" aria-hidden />
          </div>
          {showNewArrivalsPager ? (
            <div className="flex shrink-0 gap-2 self-end md:gap-3">
              <CarouselArrow
                direction="prev"
                disabled={newArrivalsSafePage <= 0}
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                label={tr('home.special_offers_carousel_prev')}
              />
              <CarouselArrow
                direction="next"
                disabled={newArrivalsSafePage >= newArrivalsTotalPages - 1}
                onClick={() => setPageIndex((p) => Math.min(newArrivalsTotalPages - 1, p + 1))}
                label={tr('home.special_offers_carousel_next')}
              />
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className={NEW_ARRIVALS_GRID_CLASS}>
            {Array.from({ length: NEW_ARRIVALS_CARDS_PER_VIEW }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] w-full max-w-[306px] animate-pulse rounded-[32px] bg-gray-100 md:h-[486px] md:w-[306px]"
              />
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
              {tr('home.featured_products.tryAgain')}
            </button>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className={NEW_ARRIVALS_GRID_CLASS}>
              {pageProducts.map((product, index) => (
                <SpecialOfferProductCard
                  key={`home-new-product-${product.id}-${index}`}
                  product={product as SpecialOfferProduct}
                  sideActionStack="compare-first"
                  contentLayout="news"
                />
              ))}
            </div>
            {showNewArrivalsPager ? (
              <div
                className="mt-8 flex justify-center gap-2 md:mt-10"
                role="tablist"
                aria-label={tr('home.special_offers_carousel_dots')}
              >
                {Array.from({ length: newArrivalsTotalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === newArrivalsSafePage}
                    onClick={() => setPageIndex(i)}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      i === newArrivalsSafePage ? 'bg-[#181111] dark:!bg-[#ffca03]' : 'bg-[#d1d5db]'
                    }`}
                    aria-label={`${tr('home.special_offers_carousel_page')} ${i + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="py-8 text-center text-gray-500">{tr('home.featured_products.noProducts')}</p>
        )}

        <div className="mt-10 flex justify-center md:mt-12">
          <Link
            href={seeAllHref}
            className={`${montserratArm.className} inline-flex min-h-[56px] min-w-[234px] items-center justify-center rounded-[68px] bg-black px-10 py-4 text-base font-bold leading-6 text-white transition-opacity hover:opacity-90`}
          >
            {tr('home.special_offers_see_more')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-10 md:py-14">
      <h2 className="text-center text-xl font-black uppercase tracking-wide text-[#101010] md:text-2xl">
        {title}
      </h2>

      <div className="mt-8 md:mt-10">
        {loading ? (
          <div className={LEGACY_GRID_CLASS}>
            {Array.from({ length: 8 }).map((_, i) => (
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
          <div className={LEGACY_GRID_CLASS}>
            {products.map((product, index) => (
              <ProductCard key={`home-featured-product-${product.id}-${index}`} product={product} />
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
