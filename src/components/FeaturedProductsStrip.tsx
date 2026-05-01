'use client';

import { useMemo } from 'react';

import { chunkArray, padChunksToMinimumCount } from '../lib/chunk-array';
import { t } from '../lib/i18n';
import type { LanguageCode } from '../lib/language';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';
import {
  FEATURED_PRODUCTS_DESKTOP_PAGE_SIZE,
  FEATURED_PRODUCTS_FOOTER_DOT_COUNT_DESKTOP,
} from './featured-products-tabs.constants';
import { FeaturedNewArrivalsDesktopTwoRowScroller } from './home/FeaturedNewArrivalsDesktopTwoRowScroller';
import { FeaturedNewArrivalsMobileRail } from './home/FeaturedNewArrivalsMobileRail';
import {
  SPECIAL_OFFERS_CARD_HEIGHT_PX,
  SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
  SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX,
  SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE,
  SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX,
  SPECIAL_OFFERS_MOBILE_PAGINATION_PAGE_COUNT,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_DESKTOP_PX,
  SPECIAL_OFFERS_PAGINATION_DOT_GAP_MOBILE_PX,
  SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_DESKTOP_PX,
} from './home/home-special-offers.constants';
import { HOME_BRANDS_DOTS_TO_CTA_GAP_MOBILE_PX } from './home/home-brands.constants';
import { HOME_BRAND_SLIDE_ENTRIES } from './home/home-brands-slide.constants';
import { FeaturedProductsStripBrandsRail } from './FeaturedProductsStripBrandsRail';
import type { SpecialOfferProduct } from './home/special-offer-product.types';
import { useSpecialOffersCarousel } from './home/useSpecialOffersCarousel';

const featuredCardSkeletonStyle = {
  height: SPECIAL_OFFERS_CARD_HEIGHT_PX,
  borderRadius: SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX,
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
  isMaxMd: boolean;
  onRetryFetch: () => void;
  /**
   * Home brand partners rail.
   * `null` = no SSR/API payload — static placeholders in `HomeBrandsSlide`.
   * `[]` = payload loaded but no brands with logos — hide the brands block.
   */
  homeBrandPartners: HomeBrandPartnerPublicItem[] | null;
  /** When API returns a section title, show it on the brands heading. */
  homeBrandPartnersSectionTitle?: string | null;
};

/**
 * `md+`: 2×4 cards per page, horizontal scroll (up to two pages). `max-md`: 2×2 per slide rail.
 */
export function FeaturedProductsStrip({
  language,
  activeTab,
  loading,
  error,
  products,
  isMaxMd,
  onRetryFetch,
  homeBrandPartners,
  homeBrandPartnersSectionTitle,
}: FeaturedProductsStripProps) {
  const ctaHref = `/products?filter=${encodeURIComponent(FILTER_BY_TAB[activeTab])}`;
  const brandsFallbackTotal = HOME_BRAND_SLIDE_ENTRIES.length;
  const showBrandsSection =
    homeBrandPartners === null || homeBrandPartners.length > 0;
  const brandsTotalItems =
    homeBrandPartners !== null && homeBrandPartners.length > 0
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

  const desktopPages = useMemo(
    () => chunkArray(products, FEATURED_PRODUCTS_DESKTOP_PAGE_SIZE),
    [products],
  );

  const desktopPaginationCount = useMemo(() => {
    if (loading) {
      return FEATURED_PRODUCTS_FOOTER_DOT_COUNT_DESKTOP;
    }
    return Math.min(
      FEATURED_PRODUCTS_FOOTER_DOT_COUNT_DESKTOP,
      Math.max(1, desktopPages.length),
    );
  }, [loading, desktopPages.length]);

  const isFeaturedMobileRailVisible = isMaxMd && !loading && !error && products.length > 0;

  const isFeaturedDesktopRailVisible = !isMaxMd && !error && (loading || products.length > 0);

  const {
    scrollerRef: featuredMobileScrollerRef,
    activePage: featuredMobileActivePage,
    scrollToPage: scrollFeaturedMobileToPage,
  } = useSpecialOffersCarousel({
    isRailVisible: isFeaturedMobileRailVisible,
    paginationPageCount: SPECIAL_OFFERS_MOBILE_PAGINATION_PAGE_COUNT,
  });

  const {
    scrollerRef: featuredDesktopScrollerRef,
    activePage: featuredDesktopActivePage,
    scrollToPage: scrollFeaturedDesktopToPage,
  } = useSpecialOffersCarousel({
    isRailVisible: isFeaturedDesktopRailVisible,
    paginationPageCount: desktopPaginationCount,
  });

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
    isRailVisible: showBrandsSection,
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
      <FeaturedNewArrivalsDesktopTwoRowScroller
        scrollerRef={featuredDesktopScrollerRef}
        loading
        pages={[]}
        paginationPageCount={FEATURED_PRODUCTS_FOOTER_DOT_COUNT_DESKTOP}
        activePage={featuredDesktopActivePage}
        onGoToPage={scrollFeaturedDesktopToPage}
        language={language}
        ctaHref={ctaHref}
      />
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
        scrollerRef={featuredMobileScrollerRef}
        activePage={featuredMobileActivePage}
        onGoToPage={scrollFeaturedMobileToPage}
        cardLayout="mobileGrid"
        language={language}
        ctaHref={ctaHref}
      />
    ) : (
      <FeaturedNewArrivalsDesktopTwoRowScroller
        scrollerRef={featuredDesktopScrollerRef}
        loading={false}
        pages={desktopPages}
        paginationPageCount={desktopPaginationCount}
        activePage={featuredDesktopActivePage}
        onGoToPage={scrollFeaturedDesktopToPage}
        language={language}
        ctaHref={ctaHref}
      />
    );
  }

  return (
    <>
      {featuredContent}

      {showBrandsSection ? (
        <FeaturedProductsStripBrandsRail
          language={language}
          isMaxMd={isMaxMd}
          homeBrandPartners={homeBrandPartners}
          homeBrandPartnersSectionTitle={homeBrandPartnersSectionTitle}
          brandsRailRef={brandsRailRef}
          brandsActivePage={brandsActivePage}
          brandsPaginationPageCount={brandsPaginationPageCount}
          paginationDotGapPx={paginationDotGapPx}
          brandsDotsToCtaGapPx={brandsDotsToCtaGapPx}
          scrollBrandsToPage={scrollBrandsToPage}
        />
      ) : null}
    </>
  );
}
