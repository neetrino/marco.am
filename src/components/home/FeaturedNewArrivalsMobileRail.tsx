'use client';

import Link from 'next/link';
import type { Ref } from 'react';

import { padChunkToSize } from '../../lib/chunk-array';
import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import { SpecialOfferCard } from './SpecialOfferCard';
import {
  SPECIAL_OFFERS_CARD_GAP_PX,
  SPECIAL_OFFERS_CARD_HEIGHT_PX,
  SPECIAL_OFFERS_CTA_LINK_CLASS,
  SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
  SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE,
  SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
  SPECIAL_OFFERS_MOBILE_GRID_SCROLLER_PADDING_BOTTOM_PX,
  SPECIAL_OFFERS_MOBILE_SCROLLER_CLASS,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_MOBILE_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  SPECIAL_OFFERS_SECTION_PAGINATION_TO_CTA_GAP_MOBILE_PX,
  SPECIAL_OFFERS_SECTION_RAIL_TO_PAGINATION_GAP_MOBILE_PX,
} from './home-special-offers.constants';
import type { SpecialOfferProduct } from './special-offer-product.types';

const FEATURED_PAGE_ARIA_KEYS = [
  'page_first_aria',
  'page_second_aria',
  'page_third_aria',
] as const;

const featuredFooterDotStyle = {
  width: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  height: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
} as const;

function featuredPageAriaPath(index: number): string {
  return index < FEATURED_PAGE_ARIA_KEYS.length
    ? `home.featured_products.${FEATURED_PAGE_ARIA_KEYS[index]}`
    : 'home.featured_products.pagination_aria';
}

type FeaturedNewArrivalsMobileRailProps = {
  productChunks: SpecialOfferProduct[][];
  scrollerRef: Ref<HTMLDivElement>;
  activePage: number;
  onGoToPage: (pageIndex: number) => void;
  cardLayout: 'mobileGrid';
  language: LanguageCode;
  ctaHref: string;
};

/**
 * Mirrors `HomeSpecialOffersSection` mobile: scroller (cards only) → dots → CTA, same vertical gaps.
 */
export function FeaturedNewArrivalsMobileRail({
  productChunks,
  scrollerRef,
  activePage,
  onGoToPage,
  cardLayout,
  language,
  ctaHref,
}: FeaturedNewArrivalsMobileRailProps) {
  return (
    <>
      <div
        ref={scrollerRef}
        className={SPECIAL_OFFERS_MOBILE_SCROLLER_CLASS}
        style={{
          gap: `${SPECIAL_OFFERS_CARD_GAP_PX}px`,
          scrollSnapType: 'x mandatory',
          paddingBottom: SPECIAL_OFFERS_MOBILE_GRID_SCROLLER_PADDING_BOTTOM_PX,
        }}
      >
        {productChunks.map((chunk, pageIndex) => (
          <div
            key={`featured-mobile-page-${pageIndex}`}
            className="grid min-h-0 min-w-full shrink-0 snap-start grid-cols-2"
            style={{
              columnGap: SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
              rowGap: SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
            }}
          >
            {padChunkToSize(chunk, SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE).map(
              (product, slotIndex) => (
                <div
                  key={`featured-slot-${pageIndex}-${slotIndex}-${product?.id ?? 'empty'}`}
                  className="min-w-0"
                >
                  {product ? (
                    <SpecialOfferCard product={product} layout={cardLayout} />
                  ) : (
                    <div
                      className="min-w-0"
                      style={{ minHeight: SPECIAL_OFFERS_CARD_HEIGHT_PX }}
                      aria-hidden
                    />
                  )}
                </div>
              ),
            )}
          </div>
        ))}
      </div>

      <div
        className="flex flex-row items-center justify-center"
        style={{
          marginTop: `${SPECIAL_OFFERS_SECTION_RAIL_TO_PAGINATION_GAP_MOBILE_PX}px`,
          gap: `${SPECIAL_OFFERS_PAGINATION_DOT_GAP_MOBILE_PX}px`,
        }}
        role="tablist"
        aria-label={t(language, 'home.featured_products.pagination_aria')}
      >
        {productChunks.map((_, dotIndex) => (
          <button
            key={`featured-pagination-${dotIndex}`}
            type="button"
            role="tab"
            aria-selected={activePage === dotIndex}
            onClick={() => {
              onGoToPage(dotIndex);
            }}
            className={`rounded-full transition-colors ${
              activePage === dotIndex ? 'bg-[#181111] dark:!bg-[#ffca03]' : 'bg-gray-300'
            }`}
            style={featuredFooterDotStyle}
            aria-label={t(language, featuredPageAriaPath(dotIndex))}
          />
        ))}
      </div>

      <div
        className="flex justify-center"
        style={{ marginTop: SPECIAL_OFFERS_SECTION_PAGINATION_TO_CTA_GAP_MOBILE_PX }}
      >
        <Link href={ctaHref} className={SPECIAL_OFFERS_CTA_LINK_CLASS}>
          {t(language, 'home.special_offers.cta')}
        </Link>
      </div>
    </>
  );
}
