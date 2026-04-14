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
  SPECIAL_OFFERS_CARD_HEIGHT_PX,
  SPECIAL_OFFERS_CARD_MAX_WIDTH_PX,
  SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_INSET_RIGHT_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX,
  SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP,
  SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP_MOBILE,
  SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_GAP_PX,
  SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_HEIGHT_PX,
  SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_WIDTH_PERCENT,
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

/** Pill: default white + gray border; hover marco-yellow — same as REELS. */
const SPECIAL_OFFERS_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 transition-colors hover:border-marco-yellow hover:bg-marco-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';

const SPECIAL_OFFERS_NAV_ICON_CLASS = 'h-3 w-3 shrink-0 text-marco-black';

const SPECIAL_OFFERS_CARD_SLOT_MOBILE_CLASS = 'shrink-0 snap-start min-w-0';

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

  const isRailVisible = !error && (loading || products.length > 0);

  const { scrollerRef, railSlotWidthPx, activePage, scrollPrev, scrollNext, scrollToPage } =
    useSpecialOffersCarousel({ isRailVisible });

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
  const titleHighlightTrimmed = titleHighlight.trim();
  const titleRestTrimmed = titleRest.trim();

  const specialOffersNavButtonStyle = {
    width: SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
    height: SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
  } as const;

  const paginationDotStyle = {
    width: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
    height: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  } as const;

  const railSlotClassName =
    railSlotWidthPx != null
      ? 'shrink-0 snap-start min-w-0'
      : SPECIAL_OFFERS_CARD_SLOT_MOBILE_CLASS;
  const railSlotStyle =
    railSlotWidthPx != null
      ? { width: railSlotWidthPx, flexShrink: 0 as const }
      : {
          width: `min(100%, ${SPECIAL_OFFERS_CARD_MAX_WIDTH_PX}px)`,
          flexShrink: 0 as const,
        };

  return (
    <section
      className={`bg-white pb-10 pt-0 max-md:-mt-3 sm:py-12 ${montserratSpecial.className}`}
      style={{
        ['--special-offers-title-fs' as string]: SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP,
        ['--special-offers-title-fs-mobile' as string]:
          SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP_MOBILE,
      }}
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
              className="font-bold uppercase text-marco-black max-md:[font-size:var(--special-offers-title-fs-mobile)] md:[font-size:var(--special-offers-title-fs)]"
              style={{
                letterSpacing: `${SPECIAL_OFFERS_TITLE_LETTER_SPACING_PX}px`,
                lineHeight: 1.05,
              }}
            >
              <span className="max-md:hidden">
                <span className="relative inline-block text-marco-yellow">
                  {titleHighlight}
                  <span
                    aria-hidden
                    className="absolute left-0 bg-marco-yellow"
                    style={{
                      top: '100%',
                      marginTop: SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_GAP_PX,
                      width: `${SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_WIDTH_PERCENT}%`,
                      height: SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_HEIGHT_PX,
                    }}
                  />
                </span>
                <span>{titleRest}</span>
              </span>
              <span className="flex flex-col items-start md:hidden">
                <span className="text-marco-yellow">{titleHighlightTrimmed}</span>
                <span
                  className="relative mt-0.5 inline-block text-marco-black"
                  style={{
                    paddingBottom:
                      SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_GAP_PX +
                      SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_HEIGHT_PX,
                  }}
                >
                  {titleRestTrimmed}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 left-0 bg-marco-yellow"
                    style={{
                      width: `${SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_WIDTH_PERCENT}%`,
                      height: SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_HEIGHT_PX,
                    }}
                  />
                </span>
              </span>
            </h2>
          </div>
          <div
            className="flex shrink-0 flex-row gap-2"
            style={{ marginRight: `${SPECIAL_OFFERS_CAROUSEL_NAV_INSET_RIGHT_PX}px` }}
          >
            <button
              type="button"
              onClick={scrollPrev}
              className={SPECIAL_OFFERS_NAV_BUTTON_CLASS}
              style={specialOffersNavButtonStyle}
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
              style={specialOffersNavButtonStyle}
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

        {error ? (
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
        ) : products.length === 0 && !loading ? (
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
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={railSlotClassName} style={railSlotStyle}>
                      <div
                        className="mx-auto w-full max-w-full animate-pulse bg-gray-200"
                        style={{
                          height: SPECIAL_OFFERS_CARD_HEIGHT_PX,
                          maxWidth: SPECIAL_OFFERS_CARD_MAX_WIDTH_PX,
                          borderRadius: SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
                        }}
                      />
                    </div>
                  ))
                : products.map((product) => (
                    <div key={product.id} className={railSlotClassName} style={railSlotStyle}>
                      <SpecialOfferCard product={product} />
                    </div>
                  ))}
            </div>

            {!loading && products.length > 0 ? (
              <>
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
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
