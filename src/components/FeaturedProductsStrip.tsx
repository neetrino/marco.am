'use client';

import Link from 'next/link';
import { useCallback, useRef } from 'react';

import { t } from '../lib/i18n';
import type { LanguageCode } from '../lib/language';
import {
  FEATURED_PRODUCTS_FOOTER_DOT_COUNT,
  FEATURED_PRODUCTS_GRID_GAP_Y_CLASS,
  FEATURED_PRODUCTS_VISIBLE_COUNT,
} from './featured-products-tabs.constants';
import { SpecialOfferCard } from './home/SpecialOfferCard';
import {
  SPECIAL_OFFERS_CARD_HEIGHT_PX,
  SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_PX,
  SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_MOBILE_PX,
  SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX,
} from './home/home-special-offers.constants';
import {
  HOME_BRANDS_AFTER_CTA_MARGIN_TOP_PX,
  HOME_BRANDS_BLOCK_PADDING_BOTTOM_PX,
  HOME_BRANDS_GRID_TO_DOTS_GAP_MOBILE_PX,
  HOME_BRANDS_GRID_TO_DOTS_GAP_PX,
  HOME_BRANDS_RAIL_SCROLL_PX,
  HOME_BRANDS_TITLE_TO_RAIL_GAP_PX,
} from './home/home-brands.constants';
import { HomeBrandsHeading } from './home/HomeBrandsHeading';
import { HomeBrandsSlide } from './home/HomeBrandsSlide';
import type { SpecialOfferProduct } from './home/special-offer-product.types';

const FEATURED_OFFERS_GRID_CLASS = `grid grid-cols-2 gap-x-3 md:grid-cols-4 md:gap-x-6 ${FEATURED_PRODUCTS_GRID_GAP_Y_CLASS}`;

const featuredCardSkeletonStyle = {
  height: SPECIAL_OFFERS_CARD_HEIGHT_PX,
  borderRadius: SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
} as const;

const featuredFooterDotStyle = {
  width: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  height: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
} as const;

const SPECIAL_OFFERS_CTA_LINK_CLASS =
  'inline-flex min-w-[200px] items-center justify-center rounded-full bg-marco-black px-10 py-4 text-base font-bold text-white transition-transform hover:-translate-y-0.5';

type FilterType = 'new' | 'featured' | 'bestseller';

const FILTER_BY_TAB: Record<FilterType, string> = {
  new: 'new',
  bestseller: 'bestseller',
  featured: 'featured',
};

type FeaturedProductsStripProps = {
  language: LanguageCode;
  activeTab: FilterType;
  loading: boolean;
  error: string | null;
  products: SpecialOfferProduct[];
  cardLayout: 'default' | 'mobileGrid';
  isMaxMd: boolean;
  onRetryFetch: () => void;
};

/**
 * Static 8-card grid (2 rows on md+), decorative dot row, then CTA — matches «Հատուկ առաջարկներ» rhythm.
 */
export function FeaturedProductsStrip({
  language,
  activeTab,
  loading,
  error,
  products,
  cardLayout,
  isMaxMd,
  onRetryFetch,
}: FeaturedProductsStripProps) {
  const ctaHref = `/products?filter=${encodeURIComponent(FILTER_BY_TAB[activeTab])}`;
  const brandsRailRef = useRef<HTMLDivElement | null>(null);

  const scrollBrandsRail = useCallback((direction: -1 | 1) => {
    const el = brandsRailRef.current;
    if (!el) {
      return;
    }
    el.scrollBy({ left: direction * HOME_BRANDS_RAIL_SCROLL_PX, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <div className={FEATURED_OFFERS_GRID_CLASS}>
        {Array.from({ length: FEATURED_PRODUCTS_VISIBLE_COUNT }).map((__, i) => (
          <div key={`sk-${i}`} className="min-w-0">
            <div className="w-full animate-pulse bg-gray-200" style={featuredCardSkeletonStyle} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={onRetryFetch}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
        >
          {t(language, 'home.featured_products.tryAgain')}
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t(language, 'home.featured_products.noProducts')}</p>
      </div>
    );
  }

  return (
    <>
      <div className={FEATURED_OFFERS_GRID_CLASS}>
        {products.map((product) => (
          <div key={product.id} className="min-w-0">
            <SpecialOfferCard product={product} layout={cardLayout} />
          </div>
        ))}
      </div>

      <div
        className="flex flex-row items-center justify-center"
        style={{
          marginTop: `${isMaxMd ? SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_MOBILE_PX : SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX}px`,
          gap: `${SPECIAL_OFFERS_PAGINATION_DOT_GAP_PX}px`,
        }}
        aria-hidden
      >
        {Array.from({ length: FEATURED_PRODUCTS_FOOTER_DOT_COUNT }, (_, i) => (
          <span
            key={`featured-footer-dot-${i}`}
            className={i === 0 ? 'rounded-full bg-marco-black' : 'rounded-full bg-gray-300'}
            style={featuredFooterDotStyle}
          />
        ))}
      </div>

      <div
        className="flex justify-center"
        style={{ marginTop: SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_PX }}
      >
        <Link href={ctaHref} className={SPECIAL_OFFERS_CTA_LINK_CLASS}>
          {t(language, 'home.special_offers.cta')}
        </Link>
      </div>

      <div
        className="w-full"
        style={{
          marginTop: `${HOME_BRANDS_AFTER_CTA_MARGIN_TOP_PX}px`,
          paddingBottom: `${HOME_BRANDS_BLOCK_PADDING_BOTTOM_PX}px`,
        }}
      >
        <HomeBrandsHeading
          language={language}
          onPrev={() => scrollBrandsRail(-1)}
          onNext={() => scrollBrandsRail(1)}
        />
        <div
          ref={brandsRailRef}
          id="home-brands-rail"
          className="w-full"
          style={{ marginTop: `${HOME_BRANDS_TITLE_TO_RAIL_GAP_PX}px` }}
          aria-label={t(language, 'home.brands.rail_aria')}
        >
          <HomeBrandsSlide />
        </div>

        <div
          className="flex flex-row items-center justify-center"
          style={{
            marginTop: `${isMaxMd ? HOME_BRANDS_GRID_TO_DOTS_GAP_MOBILE_PX : HOME_BRANDS_GRID_TO_DOTS_GAP_PX}px`,
            gap: `${SPECIAL_OFFERS_PAGINATION_DOT_GAP_PX}px`,
          }}
          aria-hidden
        >
          {Array.from({ length: FEATURED_PRODUCTS_FOOTER_DOT_COUNT }, (_, i) => (
            <span
              key={`brands-footer-dot-${i}`}
              className={i === 0 ? 'rounded-full bg-marco-black' : 'rounded-full bg-gray-300'}
              style={featuredFooterDotStyle}
            />
          ))}
        </div>

        <div
          className="flex justify-center"
          style={{ marginTop: SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_PX }}
        >
          <Link href="/products" className={SPECIAL_OFFERS_CTA_LINK_CLASS}>
            {t(language, 'home.special_offers.cta')}
          </Link>
        </div>
      </div>
    </>
  );
}
