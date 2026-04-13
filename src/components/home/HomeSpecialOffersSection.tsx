'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { apiClient } from '../../lib/api-client';
import { getStoredLanguage, type LanguageCode } from '../../lib/language';
import { t } from '../../lib/i18n';
import { useTranslation } from '../../lib/i18n-client';
import { SpecialOfferCard } from './SpecialOfferCard';
import type { SpecialOfferProduct } from './special-offer-product.types';
import {
  SPECIAL_OFFERS_CARD_GAP_PX,
  SPECIAL_OFFERS_CARD_MIN_WIDTH_PX,
  SPECIAL_OFFERS_NAV_BUTTON_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX,
  SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP,
  SPECIAL_OFFERS_TITLE_LETTER_SPACING_PX,
  SPECIAL_OFFERS_TITLE_TO_RAIL_GAP_PX,
} from './home-special-offers.constants';
import { useSpecialOffersCarousel } from './useSpecialOffersCarousel';

const montserratSpecial = Montserrat({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

const SECTION_CONTAINER_CLASS =
  'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

const SPECIAL_OFFERS_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white p-0 transition-colors hover:border-marco-yellow hover:bg-marco-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';

const SPECIAL_OFFERS_NAV_ICON_CLASS = 'h-3 w-3 shrink-0 text-marco-black';

const PRODUCTS_LIMIT = 8;

interface ProductsResponse {
  data: SpecialOfferProduct[];
}

/**
 * Figma «Հատուկ առաջարկներ» — featured products carousel, CTA, pagination.
 */
export function HomeSpecialOffersSection() {
  const { t: tr } = useTranslation();
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [products, setProducts] = useState<SpecialOfferProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { scrollerRef, activePage, scrollPrev, scrollNext, scrollToPage } =
    useSpecialOffersCarousel();

  useEffect(() => {
    const updateLanguage = () => {
      setLanguage(getStoredLanguage());
    };
    updateLanguage();
    window.addEventListener('language-updated', updateLanguage);
    return () => {
      window.removeEventListener('language-updated', updateLanguage);
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<ProductsResponse>('/api/v1/products', {
        params: {
          page: '1',
          limit: String(PRODUCTS_LIMIT),
          lang: language,
          filter: 'featured',
        },
      });
      setProducts(response.data ?? []);
    } catch {
      setError(t(language, 'home.special_offers.error_loading'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const titleHighlight = tr('home.special_offers.title_highlight');
  const titleRest = tr('home.special_offers.title_rest');

  const navBtnStyle = {
    width: SPECIAL_OFFERS_NAV_BUTTON_PX,
    height: SPECIAL_OFFERS_NAV_BUTTON_PX,
  } as const;

  const paginationDotStyle = {
    width: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
    height: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  } as const;

  return (
    <section
      className={`bg-white py-10 sm:py-12 ${montserratSpecial.className}`}
      aria-labelledby="home-special-offers-heading"
    >
      <div className={SECTION_CONTAINER_CLASS}>
        <div
          className="flex flex-row flex-wrap items-end justify-between gap-4"
          style={{ marginBottom: `${SPECIAL_OFFERS_TITLE_TO_RAIL_GAP_PX}px` }}
        >
          <div className="min-w-0 max-w-full pl-2 sm:pl-6 lg:pl-10">
            <h2
              id="home-special-offers-heading"
              className="font-bold uppercase text-marco-black"
              style={{
                fontSize: SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP,
                letterSpacing: `${SPECIAL_OFFERS_TITLE_LETTER_SPACING_PX}px`,
                lineHeight: 1.05,
              }}
            >
              <span className="border-b-4 border-marco-yellow text-marco-yellow">
                {titleHighlight}
              </span>
              <span>{titleRest}</span>
            </h2>
          </div>
          <div className="flex shrink-0 flex-row gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              className={SPECIAL_OFFERS_NAV_BUTTON_CLASS}
              style={navBtnStyle}
              aria-label={tr('home.special_offers.prev_aria')}
            >
              <ChevronLeft
                className={SPECIAL_OFFERS_NAV_ICON_CLASS}
                strokeWidth={2}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              className={SPECIAL_OFFERS_NAV_BUTTON_CLASS}
              style={navBtnStyle}
              aria-label={tr('home.special_offers.next_aria')}
            >
              <ChevronRight
                className={SPECIAL_OFFERS_NAV_ICON_CLASS}
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div
            className="flex flex-row gap-4 overflow-hidden"
            style={{ gap: `${SPECIAL_OFFERS_CARD_GAP_PX}px` }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[420px] flex-1 animate-pulse rounded-[32px] bg-gray-200"
                style={{ minWidth: SPECIAL_OFFERS_CARD_MIN_WIDTH_PX }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchProducts}
              className="mt-4 rounded-lg bg-marco-black px-4 py-2 text-sm text-white hover:opacity-90"
            >
              {tr('home.special_offers.try_again')}
            </button>
          </div>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-gray-500">
            {tr('home.special_offers.empty')}
          </p>
        ) : (
          <>
            <div
              ref={scrollerRef}
              className="flex min-w-0 flex-row flex-nowrap gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                gap: `${SPECIAL_OFFERS_CARD_GAP_PX}px`,
                scrollSnapType: 'x mandatory',
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="shrink-0 snap-start"
                  style={{
                    minWidth: `min(100%, ${SPECIAL_OFFERS_CARD_MIN_WIDTH_PX}px)`,
                    maxWidth: `min(100%, ${SPECIAL_OFFERS_CARD_MIN_WIDTH_PX + 60}px)`,
                  }}
                >
                  <SpecialOfferCard product={product} />
                </div>
              ))}
            </div>

            <div
              className="flex flex-row items-center justify-center gap-2.5"
              style={{
                marginTop: `${SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX}px`,
                gap: `${SPECIAL_OFFERS_PAGINATION_DOT_GAP_PX}px`,
              }}
              role="tablist"
              aria-label={tr('home.special_offers.pagination_aria')}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activePage === 0}
                onClick={() => {
                  scrollToPage(0);
                }}
                className={`rounded-full transition-colors ${
                  activePage === 0 ? 'bg-marco-black' : 'bg-gray-300'
                }`}
                style={paginationDotStyle}
                aria-label={tr('home.special_offers.page_first_aria')}
              />
              <button
                type="button"
                role="tab"
                aria-selected={activePage === 1}
                onClick={() => {
                  scrollToPage(1);
                }}
                className={`rounded-full transition-colors ${
                  activePage === 1 ? 'bg-marco-black' : 'bg-gray-300'
                }`}
                style={paginationDotStyle}
                aria-label={tr('home.special_offers.page_second_aria')}
              />
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/products?filter=featured"
                className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-marco-black px-10 py-4 text-base font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                {tr('home.special_offers.cta')}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
