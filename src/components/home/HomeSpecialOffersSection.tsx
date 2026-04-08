'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/utils/logger';
import { useTranslation } from '@/lib/i18n-client';
import { montserratArm } from '@/fonts/montserrat-arm';
import {
  SPECIAL_OFFERS_CARDS_PER_PAGE,
  SPECIAL_OFFERS_PRODUCTS_LIMIT,
} from '@/constants/specialOffersSection';
import { SpecialOfferProductCard, type SpecialOfferProduct } from './special-offers/SpecialOfferProductCard';

interface ProductsResponse {
  data: SpecialOfferProduct[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const isPrev = direction === 'prev';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#374151] transition-colors hover:border-[#ffca03] hover:text-[#181111] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        {isPrev ? (
          <path d="M6 1L1 6l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M2 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

/**
 * «Հատուկ առաջարկներ» — Figma SPECIAL (214:1058): heading, carousel row, dots, see-more CTA.
 */
export function HomeSpecialOffersSection() {
  const { t: tr } = useTranslation();
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [products, setProducts] = useState<SpecialOfferProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

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
          limit: String(SPECIAL_OFFERS_PRODUCTS_LIMIT),
          lang,
          filter: 'featured',
        },
      });
      setProducts((response.data || []).slice(0, SPECIAL_OFFERS_PRODUCTS_LIMIT));
      setPageIndex(0);
    } catch (err) {
      logger.error('[HomeSpecialOffersSection] fetch failed', { err });
      setError(t(getStoredLanguage(), 'home.featured_products.errorLoading'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, language]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(products.length / SPECIAL_OFFERS_CARDS_PER_PAGE));
    setPageIndex((p) => Math.min(p, tp - 1));
  }, [products.length]);

  const totalPages = Math.max(1, Math.ceil(products.length / SPECIAL_OFFERS_CARDS_PER_PAGE));
  const safePage = Math.min(pageIndex, totalPages - 1);
  const start = safePage * SPECIAL_OFFERS_CARDS_PER_PAGE;
  const pageProducts = products.slice(start, start + SPECIAL_OFFERS_CARDS_PER_PAGE);
  const showCarousel = products.length > SPECIAL_OFFERS_CARDS_PER_PAGE;
  const seeAllHref = '/products?filter=featured';

  const goPrev = () => {
    setPageIndex((p) => Math.max(0, p - 1));
  };

  const goNext = () => {
    setPageIndex((p) => Math.min(totalPages - 1, p + 1));
  };

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="relative min-w-0">
          <h2
            className={`${montserratArm.className} text-[clamp(1.75rem,4vw,3.375rem)] font-bold uppercase leading-none tracking-[-0.6px] text-[#181111]`}
          >
            <span className="text-[#ffca03]">{tr('home.special_offers_title_accent')}</span>
            <span>{tr('home.special_offers_title_rest')}</span>
          </h2>
          <div className="mt-2 h-1 w-20 rounded-full bg-[#ffca03] md:mt-3" aria-hidden />
        </div>
        {showCarousel ? (
          <div className="flex shrink-0 gap-2 self-end md:gap-3">
            <CarouselArrow
              direction="prev"
              disabled={safePage <= 0}
              onClick={goPrev}
              label={tr('home.special_offers_carousel_prev')}
            />
            <CarouselArrow
              direction="next"
              disabled={safePage >= totalPages - 1}
              onClick={goNext}
              label={tr('home.special_offers_carousel_next')}
            />
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: SPECIAL_OFFERS_CARDS_PER_PAGE }).map((_, i) => (
            <div key={i} className="h-[420px] animate-pulse rounded-[32px] bg-gray-100 md:h-[486px]" />
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-7">
            {pageProducts.map((product) => (
              <SpecialOfferProductCard key={product.id} product={product} />
            ))}
          </div>
          {showCarousel ? (
            <div className="mt-8 flex justify-center gap-2 md:mt-10" role="tablist" aria-label={tr('home.special_offers_carousel_dots')}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === safePage}
                  onClick={() => setPageIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i === safePage ? 'bg-[#181111]' : 'bg-[#d1d5db]'
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
