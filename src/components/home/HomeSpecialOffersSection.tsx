'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { chunkArray } from '../../lib/chunk-array';
import { apiClient } from '../../lib/api-client';
import { getStoredLanguage, type LanguageCode } from '../../lib/language';
import { t } from '../../lib/i18n';
import { useTranslation } from '../../lib/i18n-client';
import { SpecialOfferCard } from './SpecialOfferCard';
import type { SpecialOfferProduct } from './special-offer-product.types';
import {
  REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX,
  REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX,
  REELS_CAROUSEL_NAV_INSET_RIGHT_MOBILE_PX,
} from './home-reels.constants';
import {
  SPECIAL_OFFERS_CARD_GAP_PX,
  SPECIAL_OFFERS_CARD_HEIGHT_PX,
  SPECIAL_OFFERS_CARD_MAX_WIDTH_PX,
  SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_INSET_RIGHT_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_DESKTOP_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_MOBILE_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP,
  SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP_MOBILE,
  SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_GAP_PX,
  SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_HEIGHT_PX,
  SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_WIDTH_PERCENT,
  SPECIAL_OFFERS_TITLE_LETTER_SPACING_PX,
  SPECIAL_OFFERS_TITLE_TO_RAIL_GAP_PX,
  SPECIAL_OFFERS_TITLE_INSET_LEFT_PX,
  SPECIAL_OFFERS_SECTION_PAGINATION_TO_CTA_GAP_DESKTOP_PX,
  SPECIAL_OFFERS_SECTION_PAGINATION_TO_CTA_GAP_MOBILE_PX,
  SPECIAL_OFFERS_SECTION_RAIL_TO_PAGINATION_GAP_DESKTOP_PX,
  SPECIAL_OFFERS_SECTION_RAIL_TO_PAGINATION_GAP_MOBILE_PX,
  SPECIAL_OFFERS_CTA_LINK_CLASS,
  SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
  SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE,
  SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
  SPECIAL_OFFERS_MOBILE_GRID_SCROLLER_PADDING_BOTTOM_PX,
  SPECIAL_OFFERS_MOBILE_PAGINATION_PAGE_COUNT,
  SPECIAL_OFFERS_SCROLLER_PADDING_BOTTOM_DESKTOP_PX,
} from './home-special-offers.constants';
import { HOME_PAGE_SECTION_SHELL_TIGHT_MOBILE_CLASS } from './home-page-section-shell.constants';
import { useIsMaxMd } from './use-is-max-md';
import { useSpecialOffersCarousel } from './useSpecialOffersCarousel';
import { SPECIAL_OFFERS_PRODUCTS_LIMIT } from '@/constants/specialOffersSection';

const montserratSpecial = Montserrat({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

const SECTION_CONTAINER_CLASS = HOME_PAGE_SECTION_SHELL_TIGHT_MOBILE_CLASS;

/** Pill: default white + gray border; hover marco-yellow — same as REELS. */
const SPECIAL_OFFERS_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 transition-colors hover:border-marco-yellow hover:bg-marco-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';

/** Match `HomeReelsSection` chevrons — larger on `max-md`. */
const SPECIAL_OFFERS_NAV_ICON_CLASS =
  'h-3 w-3 shrink-0 text-marco-black max-md:h-5 max-md:w-5';

/** Sub-lg (`railSlotWidthPx === null`), non-mobile-grid: one tile width per slide (`md`–`lg`). */
const SPECIAL_OFFERS_RAIL_SUB_LG_LINEAR_CLASS = `shrink-0 snap-start min-w-0 flex-[0_0_min(100%,${SPECIAL_OFFERS_CARD_MAX_WIDTH_PX}px)] max-w-[min(100%,${SPECIAL_OFFERS_CARD_MAX_WIDTH_PX}px)]`;

const PAGINATION_ARIA_KEYS = [
  'page_first_aria',
  'page_second_aria',
  'page_third_aria',
] as const;

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

  const isMaxMd = useIsMaxMd();
  const paginationPageCount = isMaxMd
    ? SPECIAL_OFFERS_MOBILE_PAGINATION_PAGE_COUNT
    : 2;

  const { scrollerRef, railSlotWidthPx, activePage, scrollPrev, scrollNext, scrollToPage } =
    useSpecialOffersCarousel({ isRailVisible, paginationPageCount });

  const productChunks = useMemo(
    () => chunkArray(products, SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE),
    [products],
  );

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
          limit: String(SPECIAL_OFFERS_PRODUCTS_LIMIT),
          lang: language,
          filter: 'promotion',
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

  const paginationDotStyle = {
    width: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
    height: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  } as const;

  const paginationDotGapPx = isMaxMd
    ? SPECIAL_OFFERS_PAGINATION_DOT_GAP_MOBILE_PX
    : SPECIAL_OFFERS_PAGINATION_DOT_GAP_DESKTOP_PX;

  const sectionRailToPaginationGapPx = isMaxMd
    ? SPECIAL_OFFERS_SECTION_RAIL_TO_PAGINATION_GAP_MOBILE_PX
    : SPECIAL_OFFERS_SECTION_RAIL_TO_PAGINATION_GAP_DESKTOP_PX;
  const sectionPaginationToCtaGapPx = isMaxMd
    ? SPECIAL_OFFERS_SECTION_PAGINATION_TO_CTA_GAP_MOBILE_PX
    : SPECIAL_OFFERS_SECTION_PAGINATION_TO_CTA_GAP_DESKTOP_PX;

  const railSlotClassName =
    railSlotWidthPx != null
      ? 'shrink-0 snap-start min-w-0'
      : SPECIAL_OFFERS_RAIL_SUB_LG_LINEAR_CLASS;
  const railSlotStyle =
    railSlotWidthPx != null
      ? { width: railSlotWidthPx, flexShrink: 0 as const }
      : undefined;

  return (
    <section
      className={`relative z-10 bg-white pb-4 pt-0 max-md:-mt-6 sm:pt-12 sm:pb-6 ${montserratSpecial.className}`}
      style={{
        ['--special-offers-title-fs' as string]: SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP,
        ['--special-offers-title-fs-mobile' as string]:
          SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP_MOBILE,
        ['--so-nav-btn-w-mobile' as string]: `${REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX}px`,
        ['--so-nav-btn-h-mobile' as string]: `${REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX}px`,
        ['--so-nav-btn-w' as string]: `${SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_WIDTH_PX}px`,
        ['--so-nav-btn-h' as string]: `${SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_HEIGHT_PX}px`,
        ['--so-nav-inset-mobile' as string]: `${REELS_CAROUSEL_NAV_INSET_RIGHT_MOBILE_PX}px`,
        ['--so-nav-inset-desktop' as string]: `${SPECIAL_OFFERS_CAROUSEL_NAV_INSET_RIGHT_PX}px`,
      }}
      aria-labelledby="home-special-offers-heading"
    >
      <div className={SECTION_CONTAINER_CLASS}>
        <div
          className="flex flex-row flex-wrap items-end justify-between gap-4"
          style={{ marginBottom: `${SPECIAL_OFFERS_TITLE_TO_RAIL_GAP_PX}px` }}
        >
          <div
            className="min-w-0 max-w-full"
            style={{ paddingLeft: `${SPECIAL_OFFERS_TITLE_INSET_LEFT_PX}px` }}
          >
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
          <div className="flex shrink-0 flex-row gap-2 max-md:[margin-right:var(--so-nav-inset-mobile)] md:[margin-right:var(--so-nav-inset-desktop)]">
            <button
              type="button"
              onClick={scrollPrev}
              className={`${SPECIAL_OFFERS_NAV_BUTTON_CLASS} h-[var(--so-nav-btn-h-mobile)] w-[var(--so-nav-btn-w-mobile)] md:h-[var(--so-nav-btn-h)] md:w-[var(--so-nav-btn-w)]`}
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
              className={`${SPECIAL_OFFERS_NAV_BUTTON_CLASS} h-[var(--so-nav-btn-h-mobile)] w-[var(--so-nav-btn-w-mobile)] md:h-[var(--so-nav-btn-h)] md:w-[var(--so-nav-btn-w)]`}
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
              className="flex min-w-0 flex-row flex-nowrap gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                gap: `${SPECIAL_OFFERS_CARD_GAP_PX}px`,
                scrollSnapType: 'x mandatory',
                paddingBottom: isMaxMd
                  ? SPECIAL_OFFERS_MOBILE_GRID_SCROLLER_PADDING_BOTTOM_PX
                  : SPECIAL_OFFERS_SCROLLER_PADDING_BOTTOM_DESKTOP_PX,
              }}
            >
              {loading ? (
                isMaxMd ? (
                  <div
                    className="grid min-h-0 min-w-full shrink-0 snap-start grid-cols-2"
                    style={{
                      columnGap: SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
                      rowGap: SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
                    }}
                  >
                    {Array.from({ length: SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE }).map((_, i) => (
                      <div key={i} className="flex min-w-0">
                        <div
                          className="h-full w-full min-w-0 animate-pulse bg-gray-200"
                          style={{
                            height: SPECIAL_OFFERS_CARD_HEIGHT_PX,
                            borderRadius: SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  Array.from({ length: 4 }).map((_, i) => (
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
                )
              ) : isMaxMd ? (
                productChunks.map((chunk, pageIndex) => (
                  <div
                    key={`page-${pageIndex}`}
                    className="grid min-h-0 min-w-full shrink-0 snap-start grid-cols-2"
                    style={{
                      columnGap: SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
                      rowGap: SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
                    }}
                  >
                    {chunk.map((product) => (
                      <div key={product.id} className="min-w-0">
                        <SpecialOfferCard layout="mobileGrid" product={product} />
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                products.map((product) => (
                  <div key={product.id} className={railSlotClassName} style={railSlotStyle}>
                    <SpecialOfferCard product={product} />
                  </div>
                ))
              )}
            </div>

            {!loading && products.length > 0 ? (
              <>
                <div
                  className="flex flex-row items-center justify-center"
                  style={{
                    marginTop: `${sectionRailToPaginationGapPx}px`,
                    gap: `${paginationDotGapPx}px`,
                  }}
                  role="tablist"
                  aria-label={tr('home.special_offers.pagination_aria')}
                >
                  {Array.from({ length: paginationPageCount }, (_, dotIndex) => (
                    <button
                      key={`special-offers-pagination-${dotIndex}`}
                      type="button"
                      role="tab"
                      aria-selected={activePage === dotIndex}
                      onClick={() => {
                        scrollToPage(dotIndex);
                      }}
                      className={`rounded-full transition-colors ${
                        activePage === dotIndex ? 'bg-marco-black' : 'bg-gray-300'
                      }`}
                      style={paginationDotStyle}
                      aria-label={tr(
                        `home.special_offers.${PAGINATION_ARIA_KEYS[dotIndex]}`,
                      )}
                    />
                  ))}
                </div>

                <div
                  className="flex justify-center"
                  style={{ marginTop: sectionPaginationToCtaGapPx }}
                >
                  <Link
                    href="/products?filter=promotion"
                    className={SPECIAL_OFFERS_CTA_LINK_CLASS}
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
