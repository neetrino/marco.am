'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { montserratFeatured } from '../fonts/montserrat-home';
import { apiClient, getErrorHttpStatus } from '../lib/api-client';
import { getStoredLanguage, type LanguageCode } from '../lib/language';
import { t } from '../lib/i18n';
import { logger } from '../lib/utils/logger';
import { queryKeys } from '../lib/query-keys';
import { dedupeCardProductsByTitle } from '../lib/dedupeCardProductsByTitle';
import { FeaturedProductsStrip } from './FeaturedProductsStrip';
import { HomeAppBanner } from './home/HomeAppBanner';
import { HomeGradientBanner } from './home/HomeGradientBanner';
import { HomeMobileBannerProductShowcase } from './home/HomeMobileBannerProductShowcase';
import {
  FEATURED_PRODUCTS_TITLE_BAR_THICKNESS_PX,
  FEATURED_PRODUCTS_TITLE_BAR_WIDTH_PERCENT,
  FEATURED_PRODUCTS_TITLE_FONT_SIZE_CLAMP,
  FEATURED_PRODUCTS_TITLE_LETTER_SPACING_PX,
  FEATURED_PRODUCTS_TITLE_LINE_HEIGHT,
  FEATURED_PRODUCTS_TITLE_TEXT_TO_BAR_GAP_PX,
  FEATURED_PRODUCTS_TITLE_TO_GRID_GAP_PX,
  FEATURED_PRODUCTS_TITLE_INSET_LEFT_PX,
  FEATURED_PRODUCTS_VISIBLE_COUNT,
  FEATURED_HOME_BANNERS_BLOCK_PADDING_Y_CLASS,
  FEATURED_SECTION_PADDING_BOTTOM_CLASS,
  FEATURED_SECTION_PADDING_TOP_CLASS,
} from './featured-products-tabs.constants';
import {
  SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_INSET_RIGHT_PX,
} from './home/home-special-offers.constants';
import { HOME_PAGE_SECTION_SHELL_CLASS } from './home/home-page-section-shell.constants';
import {
  REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX,
  REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX,
  REELS_CAROUSEL_NAV_INSET_RIGHT_MOBILE_PX,
} from './home/home-reels.constants';
import type { SpecialOfferProduct } from './home/special-offer-product.types';
import { useIsMaxMd } from './home/use-is-max-md';

interface ProductsResponse {
  data: SpecialOfferProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type FilterType = 'new' | 'featured' | 'bestseller';

const TAB_ORDER: FilterType[] = ['new', 'bestseller', 'featured'];

/** Section heading is always «Նորույթներ»; chevrons only change the product filter below. */
const FEATURED_SECTION_TITLE_KEY = 'home.featured_products.tab_new';

const FILTER_BY_TAB: Record<FilterType, string> = {
  new: 'new',
  bestseller: 'bestseller',
  featured: 'featured',
};

const FEATURED_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 transition-colors hover:!border-marco-yellow hover:!bg-marco-yellow dark:border-white/25 dark:bg-transparent dark:text-white dark:hover:!border-marco-yellow dark:hover:!bg-marco-yellow dark:hover:text-[#181111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';

const FEATURED_NAV_ICON_CLASS =
  'h-3 w-3 shrink-0 text-current max-md:h-5 max-md:w-5';

const featuredTitleCssVars = {
  ['--fp-title-fs' as string]: FEATURED_PRODUCTS_TITLE_FONT_SIZE_CLAMP,
  ['--fp-title-lh' as string]: FEATURED_PRODUCTS_TITLE_LINE_HEIGHT,
  ['--fp-nav-btn-w-mobile' as string]: `${REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX}px`,
  ['--fp-nav-btn-h-mobile' as string]: `${REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX}px`,
  ['--fp-nav-btn-w' as string]: `${SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_WIDTH_PX}px`,
  ['--fp-nav-btn-h' as string]: `${SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_HEIGHT_PX}px`,
  ['--fp-nav-inset-mobile' as string]: `${REELS_CAROUSEL_NAV_INSET_RIGHT_MOBILE_PX}px`,
  ['--fp-nav-inset-desktop' as string]: `${SPECIAL_OFFERS_CAROUSEL_NAV_INSET_RIGHT_PX}px`,
} as const;

const featuredTitleLetterSpacingStyle = {
  letterSpacing: `${FEATURED_PRODUCTS_TITLE_LETTER_SPACING_PX}px`,
} as const;

const featuredTitleBarPaddingStyle = {
  paddingBottom: `${FEATURED_PRODUCTS_TITLE_TEXT_TO_BAR_GAP_PX + FEATURED_PRODUCTS_TITLE_BAR_THICKNESS_PX}px`,
} as const;

const featuredTitleBarStyle = {
  left: 0,
  width: `${FEATURED_PRODUCTS_TITLE_BAR_WIDTH_PERCENT}%`,
  height: `${FEATURED_PRODUCTS_TITLE_BAR_THICKNESS_PX}px`,
} as const;

export type FeaturedProductsTabsProps = {
  /** Cookie / SSR language used to fetch `initialNewProducts` — keeps hydration aligned. */
  readonly serverLanguage?: LanguageCode;
  /** Server-rendered «new» strip so first paint is not an empty client waterfall. */
  readonly initialNewProducts?: readonly SpecialOfferProduct[];
};

async function fetchFeaturedStrip(
  filter: string,
  language: LanguageCode,
): Promise<SpecialOfferProduct[]> {
  const params: Record<string, string> = {
    page: '1',
    limit: String(FEATURED_PRODUCTS_VISIBLE_COUNT),
    lang: language,
    filter,
  };
  const response = await apiClient.get<ProductsResponse>('/api/v1/products', {
    params,
    suppressHttpErrorLogging: true,
  });
  const rows = dedupeCardProductsByTitle(response.data ?? []);
  return rows.slice(0, FEATURED_PRODUCTS_VISIBLE_COUNT);
}

/**
 * «Նորույթներ» — static 2×4 grid (md+), decorative dots + «Տեսնել ավելին» CTA.
 */
export function FeaturedProductsTabs({
  serverLanguage,
  initialNewProducts,
}: FeaturedProductsTabsProps = {}) {
  const isMaxMd = useIsMaxMd();
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<LanguageCode>(() => serverLanguage ?? 'en');
  const [activeTab, setActiveTab] = useState<FilterType>('new');

  useEffect(() => {
    const updateLanguage = () => {
      setLanguage(getStoredLanguage());
    };

    const stored = getStoredLanguage();
    if (serverLanguage === undefined) {
      setLanguage(stored);
    } else if (stored !== serverLanguage) {
      setLanguage(stored);
    }

    const handleLanguageUpdate = () => {
      updateLanguage();
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [serverLanguage]);

  const filter = FILTER_BY_TAB[activeTab];
  const initialForNewTab =
    activeTab === 'new' &&
    initialNewProducts &&
    initialNewProducts.length > 0 &&
    (serverLanguage === undefined || language === serverLanguage)
      ? [...initialNewProducts]
      : undefined;

  const featuredQuery = useQuery({
    queryKey: queryKeys.featuredHomeStrip(filter, language, FEATURED_PRODUCTS_VISIBLE_COUNT),
    queryFn: () => fetchFeaturedStrip(filter, language),
    staleTime: 300_000,
    initialData: initialForNewTab,
    /** Skip duplicate `/api/v1/products` right after SSR (react-hooks/purity disallows `Date.now()` in render). */
    refetchOnMount: initialForNewTab === undefined,
  });

  const products = featuredQuery.data ?? [];
  const loading = featuredQuery.isPending;
  const error = featuredQuery.isError ? t(language, 'home.featured_products.errorLoading') : null;

  useEffect(() => {
    if (!featuredQuery.isError || featuredQuery.error == null) {
      return;
    }
    const status = getErrorHttpStatus(featuredQuery.error);
    if (status && status >= 500) {
      logger.warn('[FeaturedProductsTabs] products backend unavailable', { status });
    } else {
      logger.error('[FeaturedProductsTabs] fetch failed', { error: featuredQuery.error });
    }
  }, [featuredQuery.isError, featuredQuery.error]);

  useEffect(() => {
    if (!featuredQuery.isSuccess) {
      return;
    }
    const others = TAB_ORDER.filter((tab) => tab !== activeTab).map((tab) => FILTER_BY_TAB[tab]);
    for (const f of others) {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.featuredHomeStrip(f, language, FEATURED_PRODUCTS_VISIBLE_COUNT),
        queryFn: () => fetchFeaturedStrip(f, language),
        staleTime: 300_000,
      });
    }
  }, [featuredQuery.isSuccess, activeTab, language, queryClient]);

  const handleTabChange = useCallback((tabId: FilterType) => {
    setActiveTab(tabId);
  }, []);

  const shiftTab = useCallback(
    (direction: -1 | 1) => {
      const index = TAB_ORDER.indexOf(activeTab);
      const nextId = TAB_ORDER[(index + direction + TAB_ORDER.length) % TAB_ORDER.length];
      handleTabChange(nextId);
    },
    [activeTab, handleTabChange],
  );

  const sectionHeading = t(language, FEATURED_SECTION_TITLE_KEY);

  return (
    <section
      className={`bg-white ${FEATURED_SECTION_PADDING_BOTTOM_CLASS} ${FEATURED_SECTION_PADDING_TOP_CLASS} ${montserratFeatured.className}`}
      style={featuredTitleCssVars}
      aria-labelledby="home-featured-products-heading"
    >
      <div className={HOME_PAGE_SECTION_SHELL_CLASS}>
        <div
          className="flex flex-row flex-wrap items-end justify-between gap-4"
          style={{ marginBottom: `${FEATURED_PRODUCTS_TITLE_TO_GRID_GAP_PX}px` }}
        >
          <div
            className="min-w-0"
            style={{ paddingLeft: `${FEATURED_PRODUCTS_TITLE_INSET_LEFT_PX}px` }}
          >
            <h2
              id="home-featured-products-heading"
              className="font-bold uppercase text-marco-black [font-size:var(--fp-title-fs)] [line-height:var(--fp-title-lh)]"
              style={featuredTitleLetterSpacingStyle}
            >
              <span className="relative inline-block whitespace-nowrap" style={featuredTitleBarPaddingStyle}>
                {sectionHeading}
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 bg-marco-yellow"
                  style={featuredTitleBarStyle}
                />
              </span>
            </h2>
          </div>
          <div className="flex shrink-0 flex-row gap-2 max-md:[margin-right:var(--fp-nav-inset-mobile)] md:[margin-right:var(--fp-nav-inset-desktop)]">
            <button
              type="button"
              onClick={() => shiftTab(-1)}
              className={`${FEATURED_NAV_BUTTON_CLASS} h-[var(--fp-nav-btn-h-mobile)] w-[var(--fp-nav-btn-w-mobile)] md:h-[var(--fp-nav-btn-h)] md:w-[var(--fp-nav-btn-w)]`}
              aria-label={t(language, 'home.featured_products.carousel_prev_aria')}
            >
              <ChevronLeft className={FEATURED_NAV_ICON_CLASS} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => shiftTab(1)}
              className={`${FEATURED_NAV_BUTTON_CLASS} h-[var(--fp-nav-btn-h-mobile)] w-[var(--fp-nav-btn-w-mobile)] md:h-[var(--fp-nav-btn-h)] md:w-[var(--fp-nav-btn-w)]`}
              aria-label={t(language, 'home.featured_products.carousel_next_aria')}
            >
              <ChevronRight className={FEATURED_NAV_ICON_CLASS} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <FeaturedProductsStrip
          language={language}
          activeTab={activeTab}
          loading={loading}
          error={error}
          products={products}
          isMaxMd={isMaxMd}
          onRetryFetch={() => {
            void featuredQuery.refetch();
          }}
          homeBrandPartners={null}
          homeBrandPartnersSectionTitle={null}
        />
      </div>

      <div className={`w-full ${FEATURED_HOME_BANNERS_BLOCK_PADDING_Y_CLASS}`}>
        <div className="hidden md:block">
          <HomeAppBanner language={language} />
        </div>
        <div className="md:hidden">
          <HomeMobileBannerProductShowcase language={language} />
        </div>
        <div className="hidden md:block">
          <HomeGradientBanner language={language} />
        </div>
      </div>
    </section>
  );
}
