'use client';

import { useMemo } from 'react';

import { t } from '../lib/i18n';
import type { LanguageCode } from '../lib/language';
import type { RelatedProductsApiResponse } from '@/lib/product-pdp/fetch-related-products';
import { useRelatedProducts } from './hooks/useRelatedProducts';
import { useCarousel } from './hooks/useCarousel';
import { useVisibleCards } from './hooks/useVisibleCards';
import { useCurrency } from './hooks/useCurrency';
import { CarouselDots } from './RelatedProducts/CarouselDots';
import { RelatedProductsCardItem } from './RelatedProducts/RelatedProductsCardItem';
import { useIsMaxMd } from './home/use-is-max-md';
import {
  REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX,
  REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
  REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX,
  REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
} from './home/home-reels.constants';

interface RelatedProductsProps {
  currentProductSlug: string;
  /** Same language as PDP (avoids a wrong-lang fetch before hydration). */
  language: LanguageCode;
  /** SSR related rows — avoids client round-trip on first paint. */
  initialRelatedProducts?: RelatedProductsApiResponse | null;
}

const HOME_STYLE_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 text-[#181111] transition-colors hover:!border-marco-yellow hover:!bg-marco-yellow dark:border-white/25 dark:bg-transparent dark:text-white dark:hover:!border-marco-yellow dark:hover:!bg-marco-yellow dark:hover:text-[#181111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';
const REELS_STYLE_NAV_ICON_CLASS = 'h-3 w-3 shrink-0 text-current max-md:h-5 max-md:w-5';

const RELATED_SKELETON_COUNT = 4;

function RelatedProductsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: count }, (_, index) => (
        <div key={`related-skeleton-${index}`} className="animate-pulse">
          <div className="mb-4 aspect-square rounded-lg bg-gray-200" />
          <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

/**
 * RelatedProducts component - displays products from the same category in a carousel
 * Shown at the bottom of the single product page
 */
export function RelatedProducts({
  currentProductSlug,
  language,
  initialRelatedProducts = null,
}: RelatedProductsProps) {
  const isMaxMd = useIsMaxMd();
  const currency = useCurrency();
  const visibleCards = useVisibleCards();
  const { products, loading } = useRelatedProducts({
    productSlug: currentProductSlug,
    language,
    initialRelatedProducts,
  });

  const cardWidth = useMemo(() => `${100 / visibleCards}%`, [visibleCards]);
  const skeletonCount = Math.min(RELATED_SKELETON_COUNT, visibleCards);

  const {
    currentIndex,
    isDragging,
    hasMoved,
    carouselRef,
    goToPrevious,
    goToNext,
    goToIndex,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCarousel({
    itemCount: products.length,
    visibleItems: visibleCards,
    autoRotateInterval: 0,
  });

  return (
    <section className="mt-20 border-t border-gray-200 pt-12 pb-1 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-gray-900">
            {t(language, 'product.related_products_title')}
          </h2>
          {products.length > visibleCards && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={goToPrevious}
                className={HOME_STYLE_NAV_BUTTON_CLASS}
                style={{
                  width: isMaxMd
                    ? REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX
                    : REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
                  height: isMaxMd
                    ? REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX
                    : REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
                }}
                aria-label={t(language, 'home.featured_products.carousel_prev_aria')}
              >
                <svg className={REELS_STYLE_NAV_ICON_CLASS} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 19l-7-7 7-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goToNext}
                className={HOME_STYLE_NAV_BUTTON_CLASS}
                style={{
                  width: isMaxMd
                    ? REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX
                    : REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
                  height: isMaxMd
                    ? REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX
                    : REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
                }}
                aria-label={t(language, 'home.featured_products.carousel_next_aria')}
              >
                <svg className={REELS_STYLE_NAV_ICON_CLASS} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M9 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <RelatedProductsSkeleton count={skeletonCount} />
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-500">{t(language, 'product.noRelatedProducts')}</p>
          </div>
        ) : (
          <div className="relative -mx-4 sm:mx-0">
            <div
              ref={carouselRef}
              className="relative select-none overflow-hidden pb-10"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex items-stretch -mx-2 md:mx-0"
                style={{
                  transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="h-full flex-shrink-0 px-2 md:px-3"
                    style={{ width: cardWidth }}
                    onClickCapture={(event) => {
                      if (hasMoved) {
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    }}
                  >
                    <RelatedProductsCardItem
                      product={product}
                      currency={currency}
                      language={language}
                      hasMoved={hasMoved}
                      width="100%"
                    />
                  </div>
                ))}
              </div>
            </div>

            {products.length > visibleCards && (
              <CarouselDots
                totalItems={products.length}
                visibleItems={visibleCards}
                currentIndex={currentIndex}
                onDotClick={goToIndex}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
