'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { apiClient } from '../lib/api-client';
import { getStoredLanguage, type LanguageCode } from '../lib/language';
import { ProductCard } from './ProductCard';
import { t } from '../lib/i18n';
import { logger } from '../lib/utils/logger';
import type { ProductLabel } from './ProductLabels';
import {
  FEATURED_PRODUCTS_TITLE_BAR_THICKNESS_PX,
  FEATURED_PRODUCTS_TITLE_BAR_WIDTH_PERCENT,
  FEATURED_PRODUCTS_TITLE_FONT_SIZE_CLAMP,
  FEATURED_PRODUCTS_TITLE_LETTER_SPACING_PX,
  FEATURED_PRODUCTS_TITLE_LINE_HEIGHT,
  FEATURED_PRODUCTS_TITLE_TEXT_TO_BAR_GAP_PX,
  FEATURED_PRODUCTS_TITLE_TO_GRID_GAP_PX,
} from './featured-products-tabs.constants';
import {
  REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX,
  REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX,
  REELS_CAROUSEL_NAV_INSET_RIGHT_MOBILE_PX,
} from './home/home-reels.constants';
import {
  SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
  SPECIAL_OFFERS_CAROUSEL_NAV_INSET_RIGHT_PX,
} from './home/home-special-offers.constants';

const montserratFeatured = Montserrat({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
});

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  image: string | null;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
  } | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  sizes?: Array<{ value: string; imageUrl?: string | null }>;
  attributes?: Record<
    string,
    Array<{ valueId?: string; value: string; label: string; imageUrl?: string | null; colors?: string[] | null }>
  >;
  originalPrice?: number | null;
  discountPercent?: number | null;
  labels?: ProductLabel[];
}

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type FilterType = 'new' | 'featured' | 'bestseller';

const PRODUCTS_PER_PAGE = 10;

const MOBILE_GRID_LAYOUT =
  'grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

const TAB_ORDER: FilterType[] = ['new', 'bestseller', 'featured'];

const TAB_LABEL_KEY: Record<FilterType, string> = {
  new: 'home.featured_products.tab_new',
  bestseller: 'home.featured_products.tab_bestseller',
  featured: 'home.featured_products.tab_featured',
};

const FILTER_BY_TAB: Record<FilterType, string> = {
  new: 'new',
  bestseller: 'bestseller',
  featured: 'featured',
};

/** Same pill + chevrons as `HomeSpecialOffersSection` / `HomeReelsSection`. */
const FEATURED_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 transition-colors hover:border-marco-yellow hover:bg-marco-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';

const FEATURED_NAV_ICON_CLASS =
  'h-3 w-3 shrink-0 text-marco-black max-md:h-5 max-md:w-5';

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

/**
 * Featured products — Figma header (large title, yellow bar, round prev/next cycling tabs).
 */
export function FeaturedProductsTabs() {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [activeTab, setActiveTab] = useState<FilterType>('new');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateLanguage = () => {
      const storedLang = getStoredLanguage();
      setLanguage(storedLang);
    };

    updateLanguage();

    const handleLanguageUpdate = () => {
      updateLanguage();
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, []);

  const fetchProducts = useCallback(
    async (filter: string | null) => {
      try {
        setLoading(true);
        setError(null);

        const currentLang = language;
        const params: Record<string, string> = {
          page: '1',
          limit: PRODUCTS_PER_PAGE.toString(),
          lang: currentLang,
        };

        if (filter) {
          params.filter = filter;
        }

        const response = await apiClient.get<ProductsResponse>('/api/v1/products', {
          params,
        });

        setProducts((response.data || []).slice(0, PRODUCTS_PER_PAGE));
      } catch (err) {
        logger.error('[FeaturedProductsTabs] fetch failed', { error: err });
        setError(t(language, 'home.featured_products.errorLoading'));
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [language],
  );

  const handleTabChange = useCallback(
    (tabId: FilterType) => {
      setActiveTab(tabId);
      fetchProducts(FILTER_BY_TAB[tabId]);
    },
    [fetchProducts],
  );

  const shiftTab = useCallback(
    (direction: -1 | 1) => {
      const index = TAB_ORDER.indexOf(activeTab);
      const nextId = TAB_ORDER[(index + direction + TAB_ORDER.length) % TAB_ORDER.length];
      handleTabChange(nextId);
    },
    [activeTab, handleTabChange],
  );

  useEffect(() => {
    fetchProducts('new');
  }, [fetchProducts]);

  const activeHeading = t(language, TAB_LABEL_KEY[activeTab]);

  return (
    <section
      className={`bg-white pb-16 pt-4 sm:pt-6 ${montserratFeatured.className}`}
      style={featuredTitleCssVars}
      aria-labelledby="home-featured-products-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex flex-row flex-wrap items-end justify-between gap-4"
          style={{ marginBottom: `${FEATURED_PRODUCTS_TITLE_TO_GRID_GAP_PX}px` }}
        >
          <div className="min-w-0">
            <h2
              id="home-featured-products-heading"
              className="font-bold uppercase text-marco-black [font-size:var(--fp-title-fs)] [line-height:var(--fp-title-lh)]"
              style={featuredTitleLetterSpacingStyle}
            >
              <span className="relative inline-block whitespace-nowrap" style={featuredTitleBarPaddingStyle}>
                {activeHeading}
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

        {loading ? (
          <div className={MOBILE_GRID_LAYOUT}>
            {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchProducts(FILTER_BY_TAB[activeTab])}
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
            >
              {t(language, 'home.featured_products.tryAgain')}
            </button>
          </div>
        ) : products.length > 0 ? (
          <div className={MOBILE_GRID_LAYOUT}>
            {products.slice(0, PRODUCTS_PER_PAGE).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">{t(language, 'home.featured_products.noProducts')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
