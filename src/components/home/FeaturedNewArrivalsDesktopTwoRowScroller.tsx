'use client';

import Link from 'next/link';
import type { Ref } from 'react';

import { padChunkToSize } from '../../lib/chunk-array';
import {
  FEATURED_PRODUCTS_DESKTOP_PAGE_SIZE,
  FEATURED_PRODUCTS_GRID_GAP_Y_CLASS,
} from '../featured-products-tabs.constants';
import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import { SpecialOfferCard } from './SpecialOfferCard';
import {
  SPECIAL_OFFERS_CARD_GAP_PX,
  SPECIAL_OFFERS_CARD_HEIGHT_PX,
  SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
  SPECIAL_OFFERS_CTA_LINK_CLASS,
  SPECIAL_OFFERS_MOBILE_SCROLLER_CLASS,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_DESKTOP_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_DESKTOP_PX,
  SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX,
  SPECIAL_OFFERS_SCROLLER_PADDING_BOTTOM_DESKTOP_PX,
} from './home-special-offers.constants';
import { HOME_PRODUCT_CHUNK_SIZE } from '../../constants/homeProductChunks';
import type { SpecialOfferProduct } from './special-offer-product.types';

const DESKTOP_PAGE_GRID_CLASS = `grid min-h-0 min-w-full shrink-0 snap-start grid-cols-4 gap-x-3 md:gap-x-6 ${FEATURED_PRODUCTS_GRID_GAP_Y_CLASS}`;

const featuredFooterDotStyle = {
  width: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  height: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
} as const;

const DESKTOP_PAGE_ARIA_KEYS = ['page_first_aria', 'page_second_aria'] as const;

function desktopPageAriaPath(index: number): string {
  return index < DESKTOP_PAGE_ARIA_KEYS.length
    ? `home.featured_products.${DESKTOP_PAGE_ARIA_KEYS[index]}`
    : 'home.featured_products.pagination_aria';
}

const skeletonCellStyle = {
  height: SPECIAL_OFFERS_CARD_HEIGHT_PX,
  borderRadius: SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
} as const;

export type FeaturedNewArrivalsDesktopTwoRowScrollerProps = {
  scrollerRef: Ref<HTMLDivElement>;
  loading: boolean;
  /** One entry per horizontal page (each up to {@link FEATURED_PRODUCTS_DESKTOP_PAGE_SIZE} items). */
  pages: SpecialOfferProduct[][];
  paginationPageCount: number;
  activePage: number;
  onGoToPage: (pageIndex: number) => void;
  language: LanguageCode;
  ctaHref: string;
};

/**
 * `md+` «Նորույթներ» — 2 rows × 4 columns per page, horizontal scroll (same drag hook as special offers).
 */
export function FeaturedNewArrivalsDesktopTwoRowScroller({
  scrollerRef,
  loading,
  pages,
  paginationPageCount,
  activePage,
  onGoToPage,
  language,
  ctaHref,
}: FeaturedNewArrivalsDesktopTwoRowScrollerProps) {
  const showFooter = !loading && pages.flat().length > 0;
  const showDots = paginationPageCount > 1;

  const skeletonPageCount = loading ? paginationPageCount : 0;

  return (
    <>
      <div
        ref={scrollerRef}
        className={SPECIAL_OFFERS_MOBILE_SCROLLER_CLASS}
        style={{
          gap: `${SPECIAL_OFFERS_CARD_GAP_PX}px`,
          scrollSnapType: 'x mandatory',
          paddingBottom: SPECIAL_OFFERS_SCROLLER_PADDING_BOTTOM_DESKTOP_PX,
        }}
      >
        {loading
          ? Array.from({ length: skeletonPageCount }, (_, pageIndex) => (
              <div key={`featured-desktop-sk-page-${pageIndex}`} className={DESKTOP_PAGE_GRID_CLASS}>
                {Array.from({ length: FEATURED_PRODUCTS_DESKTOP_PAGE_SIZE }).map((__, i) => (
                  <div key={`featured-desktop-sk-${pageIndex}-${i}`} className="min-w-0">
                    <div className="w-full animate-pulse bg-gray-200" style={skeletonCellStyle} />
                  </div>
                ))}
              </div>
            ))
          : pages.map((pageProducts, pageIndex) => (
              <div key={`featured-desktop-page-${pageIndex}`} className={DESKTOP_PAGE_GRID_CLASS}>
                {padChunkToSize(pageProducts, FEATURED_PRODUCTS_DESKTOP_PAGE_SIZE).map((product, slotIndex) => (
                  <div
                    key={`featured-desktop-slot-${pageIndex}-${slotIndex}-${product?.id ?? 'empty'}`}
                    className="min-w-0"
                  >
                    {product ? (
                      <SpecialOfferCard
                        product={product}
                        layout="default"
                        imagePriority={
                          pageIndex === 0 &&
                          slotIndex < HOME_PRODUCT_CHUNK_SIZE &&
                          !product.shellPlaceholder &&
                          Boolean(
                            (product.images && product.images.length > 0) || product.image,
                          )
                        }
                      />
                    ) : (
                      <div className="min-w-0" style={{ minHeight: SPECIAL_OFFERS_CARD_HEIGHT_PX }} aria-hidden />
                    )}
                  </div>
                ))}
              </div>
            ))}
      </div>

      {showFooter ? (
        <>
          {showDots ? (
            <div
              className="flex flex-row items-center justify-center"
              style={{
                marginTop: `${SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX}px`,
                gap: `${SPECIAL_OFFERS_PAGINATION_DOT_GAP_DESKTOP_PX}px`,
              }}
              role="tablist"
              aria-label={t(language, 'home.featured_products.pagination_aria')}
            >
              {Array.from({ length: paginationPageCount }, (_, dotIndex) => (
                <button
                  key={`featured-desktop-pagination-${dotIndex}`}
                  type="button"
                  role="tab"
                  aria-selected={activePage === dotIndex}
                  onClick={() => {
                    onGoToPage(dotIndex);
                  }}
                  className={`rounded-full transition-colors duration-200 ${
                    activePage === dotIndex ? 'bg-[#181111] dark:!bg-[#ffca03]' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  style={featuredFooterDotStyle}
                  aria-label={t(language, desktopPageAriaPath(dotIndex))}
                />
              ))}
            </div>
          ) : null}

          <div
            className="flex justify-center"
            style={{
              marginTop: showDots
                ? SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_DESKTOP_PX
                : SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX,
            }}
          >
            <Link href={ctaHref} className={SPECIAL_OFFERS_CTA_LINK_CLASS}>
              {t(language, 'home.special_offers.cta')}
            </Link>
          </div>
        </>
      ) : null}
    </>
  );
}
