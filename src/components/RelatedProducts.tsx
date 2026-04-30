'use client';

import { t } from '../lib/i18n';
import type { LanguageCode } from '../lib/language';
import { useRelatedProducts } from './hooks/useRelatedProducts';
import { useCarousel } from './hooks/useCarousel';
import { useVisibleCards } from './hooks/useVisibleCards';
import { CarouselDots } from './RelatedProducts/CarouselDots';
import { SpecialOfferCard } from './home/SpecialOfferCard';
import type { SpecialOfferProduct } from './home/special-offer-product.types';
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
}

const HOME_STYLE_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 text-[#181111] transition-colors hover:!border-marco-yellow hover:!bg-marco-yellow dark:border-white/25 dark:bg-transparent dark:text-white dark:hover:!border-marco-yellow dark:hover:!bg-marco-yellow dark:hover:text-[#181111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';
const REELS_STYLE_NAV_ICON_CLASS = 'h-3 w-3 shrink-0 text-current max-md:h-5 max-md:w-5';

/**
 * RelatedProducts component - displays products from the same category in a carousel
 * Shown at the bottom of the single product page
 */
export function RelatedProducts({ currentProductSlug, language }: RelatedProductsProps) {
  const isMaxMd = useIsMaxMd();

  const visibleCards = useVisibleCards();
  const { products, loading } = useRelatedProducts({ productSlug: currentProductSlug, language });
  
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
  } = useCarousel({ itemCount: products.length, visibleItems: visibleCards });

  function toSpecialOfferProduct(product: (typeof products)[number]): SpecialOfferProduct {
    const compareAt = product.compareAtPrice ?? product.originalPrice ?? null;
    let discountPercent = product.discountPercent ?? null;
    if (discountPercent == null && compareAt != null && compareAt > product.price) {
      discountPercent = Math.round(((compareAt - product.price) / compareAt) * 100);
    }
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      compareAtPrice: compareAt ?? undefined,
      originalPrice: compareAt ?? undefined,
      discountPercent,
      image: product.image,
      images: product.image ? [product.image] : undefined,
      inStock: product.inStock,
      brand: product.brand ?? null,
      labels: undefined,
      reviewCount: undefined,
      defaultVariantId: undefined,
      colors:
        product.variants?.map((variant, idx) => ({
          value: variant.options?.[0]?.value ?? String(idx),
          imageUrl: null,
          colors: null,
        })) ?? undefined,
    };
  }

  // Always show the section, even if no products (will show loading or empty state)
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
          // Loading state
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t(language, 'product.noRelatedProducts')}</p>
          </div>
        ) : (
          // Products Carousel
          <div className="relative -mx-4 sm:mx-0">
            {/* Carousel Container */}
            <div 
              ref={carouselRef}
              className="relative overflow-hidden pb-10 select-none"
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
                  transition: isDragging ? 'none' : 'transform 0.5s ease-in-out',
                }}
              >
                {products.map((product, index) => (
                  <div
                    key={`related-product-${product.id}-${index}`}
                    className="h-full flex-shrink-0 px-2 md:px-3"
                    style={{ width: `${100 / visibleCards}%` }}
                    onClickCapture={(event) => {
                      if (hasMoved) {
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    }}
                  >
                    <SpecialOfferCard
                      product={toSpecialOfferProduct(product)}
                      layout={visibleCards <= 2 ? 'mobileGrid' : 'default'}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator - Only show if there are more products than visible */}
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

