'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';

import { chunkArray, padChunksToMinimumCount } from '../lib/chunk-array';
import { t } from '../lib/i18n';
import type { LanguageCode } from '../lib/language';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';
import {
  FEATURED_PRODUCTS_FOOTER_DOT_COUNT_DESKTOP,
  FEATURED_PRODUCTS_GRID_GAP_Y_CLASS,
  FEATURED_PRODUCTS_VISIBLE_COUNT,
} from './featured-products-tabs.constants';
import { FeaturedNewArrivalsMobileRail } from './home/FeaturedNewArrivalsMobileRail';
import { SpecialOfferCard } from './home/SpecialOfferCard';
import {
  SPECIAL_OFFERS_CARD_HEIGHT_PX,
  SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
  SPECIAL_OFFERS_CTA_LINK_CLASS,
  SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
  SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE,
  SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
  SPECIAL_OFFERS_MOBILE_PAGINATION_PAGE_COUNT,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_DESKTOP_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_MOBILE_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_DESKTOP_PX,
  SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX,
} from './home/home-special-offers.constants';
import {
  HOME_BRANDS_AFTER_CTA_MARGIN_TOP_PX,
  HOME_BRANDS_AFTER_CTA_MARGIN_TOP_MOBILE_PX,
  HOME_BRANDS_BLOCK_PADDING_BOTTOM_DESKTOP_PX,
  HOME_BRANDS_BLOCK_PADDING_BOTTOM_MOBILE_PX,
  HOME_BRANDS_DOTS_TO_CTA_GAP_MOBILE_PX,
  HOME_BRANDS_GRID_TO_DOTS_GAP_MOBILE_PX,
  HOME_BRANDS_GRID_TO_DOTS_GAP_PX,
  HOME_BRANDS_TITLE_TO_RAIL_GAP_PX,
} from './home/home-brands.constants';
import { HOME_BRAND_SLIDE_ENTRIES } from './home/home-brands-slide.constants';
import { HomeBrandsHeading } from './home/HomeBrandsHeading';
import { HomeBrandsSlide } from './home/HomeBrandsSlide';
import type { SpecialOfferProduct } from './home/special-offer-product.types';
import { useSpecialOffersCarousel } from './home/useSpecialOffersCarousel';

const FEATURED_OFFERS_GRID_CLASS = `grid grid-cols-2 gap-x-3 md:grid-cols-4 md:gap-x-6 ${FEATURED_PRODUCTS_GRID_GAP_Y_CLASS}`;

const featuredOffersGridStyle = (isMaxMd: boolean): CSSProperties =>
  isMaxMd ? { rowGap: SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX } : {};

const featuredCardSkeletonStyle = {
  height: SPECIAL_OFFERS_CARD_HEIGHT_PX,
  borderRadius: SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
} as const;

const featuredFooterDotStyle = {
  width: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  height: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
} as const;

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
  /** Home brand partners rail; null = use static placeholders in `HomeBrandsSlide`. */
  homeBrandPartners: HomeBrandPartnerPublicItem[] | null;
  /** When API returns a section title, show it on the brands heading. */
  homeBrandPartnersSectionTitle?: string | null;
};

/**
 * `md+`: 8-card grid. `max-md`: 2×2 per slide, horizontal paging (aligned with «Հատուկ առաջարկներ»).
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
  homeBrandPartners,
  homeBrandPartnersSectionTitle,
}: FeaturedProductsStripProps) {
  const ctaHref = `/products?filter=${encodeURIComponent(FILTER_BY_TAB[activeTab])}`;
  const brandsFallbackTotal = HOME_BRAND_SLIDE_ENTRIES.length;
  const brandsTotalItems = homeBrandPartners && homeBrandPartners.length > 0
    ? homeBrandPartners.length
    : brandsFallbackTotal;
  const brandsPaginationPageCount = Math.max(
    1,
    Math.ceil(brandsTotalItems / SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE)
  );

  const mobileProductChunks = useMemo(() => {
    const chunks = chunkArray(products, SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE);
    return padChunksToMinimumCount(chunks, SPECIAL_OFFERS_MOBILE_PAGINATION_PAGE_COUNT);
  }, [products]);

  const isFeaturedRailVisible = isMaxMd && !loading && !error && products.length > 0;

  const {
    scrollerRef: featuredScrollerRef,
    activePage: featuredActivePage,
    scrollToPage: scrollFeaturedToPage,
  } = useSpecialOffersCarousel({
    isRailVisible: isFeaturedRailVisible,
    paginationPageCount: isMaxMd ? SPECIAL_OFFERS_MOBILE_PAGINATION_PAGE_COUNT : 1,
  });

  /** `md+` decorative dots — same rail→dots / dots→CTA rhythm as desktop special-offers footer. */
  const desktopFeaturedRailToDotsGapPx = SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX;
  const desktopFeaturedDotsToCtaGapPx = SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_DESKTOP_PX;
  const brandsDotsToCtaGapPx = isMaxMd
    ? HOME_BRANDS_DOTS_TO_CTA_GAP_MOBILE_PX
    : SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_DESKTOP_PX;
  const paginationDotGapPx = isMaxMd
    ? SPECIAL_OFFERS_PAGINATION_DOT_GAP_MOBILE_PX
    : SPECIAL_OFFERS_PAGINATION_DOT_GAP_DESKTOP_PX;

  const {
    scrollerRef: brandsRailRef,
    activePage: brandsActivePage,
    scrollToPage: scrollBrandsToPage,
  } = useSpecialOffersCarousel({
    isRailVisible: true,
    paginationPageCount: brandsPaginationPageCount,
  });

  let featuredContent: JSX.Element;
  if (loading) {
    featuredContent = isMaxMd ? (
      <div
        className="grid w-full grid-cols-2"
        style={{
          columnGap: SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
          rowGap: SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
        }}
      >
        {Array.from({ length: SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE }).map((_, i) => (
          <div key={`sk-m-${i}`} className="min-w-0">
            <div className="w-full animate-pulse bg-gray-200" style={featuredCardSkeletonStyle} />
          </div>
        ))}
      </div>
    ) : (
      <div className={FEATURED_OFFERS_GRID_CLASS} style={featuredOffersGridStyle(isMaxMd)}>
        {Array.from({ length: FEATURED_PRODUCTS_VISIBLE_COUNT }).map((__, i) => (
          <div key={`sk-${i}`} className="min-w-0">
            <div className="w-full animate-pulse bg-gray-200" style={featuredCardSkeletonStyle} />
          </div>
        ))}
      </div>
    );
  } else if (error) {
    featuredContent = (
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
  } else if (products.length === 0) {
    featuredContent = (
      <div className="text-center py-12">
        <p className="text-gray-500">{t(language, 'home.featured_products.noProducts')}</p>
      </div>
    );
  } else {
    featuredContent = isMaxMd ? (
      <FeaturedNewArrivalsMobileRail
        productChunks={mobileProductChunks}
        scrollerRef={featuredScrollerRef}
        activePage={featuredActivePage}
        onGoToPage={scrollFeaturedToPage}
        cardLayout="mobileGrid"
        language={language}
        ctaHref={ctaHref}
      />
    ) : (
      <>
        <div className={FEATURED_OFFERS_GRID_CLASS} style={featuredOffersGridStyle(isMaxMd)}>
          {products.map((product, index) => (
            <div key={`featured-strip-product-${product.id}-${index}`} className="min-w-0">
              <SpecialOfferCard product={product} layout={cardLayout} />
            </div>
          ))}
        </div>

        <div
          className="flex flex-row items-center justify-center"
          style={{
            marginTop: `${desktopFeaturedRailToDotsGapPx}px`,
            gap: `${paginationDotGapPx}px`,
          }}
          aria-hidden
        >
          {Array.from({ length: FEATURED_PRODUCTS_FOOTER_DOT_COUNT_DESKTOP }, (_, i) => (
            <span
              key={`featured-footer-dot-${i}`}
              className={i === 0 ? 'rounded-full bg-marco-black' : 'rounded-full bg-gray-300'}
              style={featuredFooterDotStyle}
            />
          ))}
        </div>

        <div
          className="flex justify-center"
          style={{ marginTop: desktopFeaturedDotsToCtaGapPx }}
        >
          <Link href={ctaHref} className={SPECIAL_OFFERS_CTA_LINK_CLASS}>
            {t(language, 'home.special_offers.cta')}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {featuredContent}

      <div
        className="w-full"
        style={{
          marginTop: `${
            isMaxMd
              ? HOME_BRANDS_AFTER_CTA_MARGIN_TOP_MOBILE_PX
              : HOME_BRANDS_AFTER_CTA_MARGIN_TOP_PX
          }px`,
          paddingBottom: `${isMaxMd ? HOME_BRANDS_BLOCK_PADDING_BOTTOM_MOBILE_PX : HOME_BRANDS_BLOCK_PADDING_BOTTOM_DESKTOP_PX}px`,
        }}
      >
        <HomeBrandsHeading
          language={language}
          onPrev={() => scrollBrandsToPage(brandsActivePage - 1)}
          onNext={() => scrollBrandsToPage(brandsActivePage + 1)}
          sectionTitle={homeBrandPartnersSectionTitle ?? undefined}
        />
        <div
          ref={brandsRailRef}
          id="home-brands-rail"
          className="w-full overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ marginTop: `${HOME_BRANDS_TITLE_TO_RAIL_GAP_PX}px` }}
          aria-label={t(language, 'home.brands.rail_aria')}
        >
          <HomeBrandsSlide partners={homeBrandPartners} />
        </div>

        <div
          className="flex flex-row items-center justify-center"
          style={{
            marginTop: `${isMaxMd ? HOME_BRANDS_GRID_TO_DOTS_GAP_MOBILE_PX : HOME_BRANDS_GRID_TO_DOTS_GAP_PX}px`,
            gap: `${paginationDotGapPx}px`,
          }}
          role="tablist"
          aria-label={t(language, 'home.brands.rail_aria')}
        >
          {Array.from({ length: brandsPaginationPageCount }, (_, i) => (
            <button
              key={`brands-footer-dot-${i}`}
              type="button"
              role="tab"
              aria-selected={i === brandsActivePage}
              aria-label={`${t(language, 'home.special_offers_carousel_page')} ${i + 1}`}
              onClick={() => scrollBrandsToPage(i)}
              className={`rounded-full transition-colors duration-200 ${
                i === brandsActivePage ? 'bg-marco-black' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              style={featuredFooterDotStyle}
            />
          ))}
        </div>

        <div
          className="flex justify-center"
          style={{ marginTop: brandsDotsToCtaGapPx }}
        >
          <Link href="/brands" className={SPECIAL_OFFERS_CTA_LINK_CLASS}>
            {t(language, 'home.special_offers.cta')}
          </Link>
        </div>
      </div>
    </>
  );
}
