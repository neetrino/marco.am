'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import {
  PRODUCTS_FILTER_SECTION_SHELL_CLASS,
  productsFiltersSectionFont,
} from '../lib/products-filters-typography';
import { getStoredLanguage } from '../lib/language';
import { getStoredCurrency, formatPrice as formatCurrencyPrice, type CurrencyCode } from '../lib/currency';
import { useTranslation } from '../lib/i18n-client';
import { pushShopProductsListingUrl } from '../lib/push-shop-products-listing-url';
import { useProductsFilters } from './ProductsFiltersProvider';

interface PriceFilterProps {
  currentMinPrice?: string;
  currentMaxPrice?: string;
  category?: string;
  search?: string;
}

interface PriceRange {
  min: number;
  max: number;
  stepSize?: number | null;
  stepSizePerCurrency?: Partial<Record<CurrencyCode, number>> | null;
}

/** Clamp numeric filter values to catalog bounds (same units as variant.price in DB — USD base; UI converts via formatPrice). */
function clampToRange(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

export function PriceFilter({ currentMinPrice, currentMaxPrice, category }: PriceFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersContext = useProductsFilters();
  const { t } = useTranslation();
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: 0,
    max: 0,
    stepSize: null,
    stepSizePerCurrency: null,
  });
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [standaloneLoading, setStandaloneLoading] = useState(() => filtersContext === null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<'min' | 'max' | null>(null);

  const rangeLoading = filtersContext ? filtersContext.loading : standaloneLoading;
  const rangeReady = !rangeLoading && priceRange.max > 0;

  const roundToStep = (value: number, step: number | null | undefined): number => {
    if (!step || step <= 0) return Math.round(value);
    return Math.round(value / step) * step;
  };

  useEffect(() => {
    const updateCurrency = () => {
      setCurrency(getStoredCurrency());
    };
    updateCurrency();
    if (typeof window !== 'undefined') {
      window.addEventListener('currency-updated', updateCurrency);
      return () => {
        window.removeEventListener('currency-updated', updateCurrency);
      };
    }
  }, []);

  useEffect(() => {
    if (filtersContext?.data?.priceRange) {
      setPriceRange(filtersContext.data.priceRange as PriceRange);
      return;
    }
    if (filtersContext === null) {
      const run = async () => {
        setStandaloneLoading(true);
        try {
          const language = getStoredLanguage();
          const params: Record<string, string> = { lang: language };
          if (category) params.category = category;
          const response = await apiClient.get<PriceRange>('/api/v1/products/price-range', { params });
          setPriceRange(response);
        } catch (error) {
          console.error('Error fetching price range:', error);
        } finally {
          setStandaloneLoading(false);
        }
      };
      void run();
    }
  }, [category, filtersContext?.data?.priceRange, filtersContext === null]);

  useEffect(() => {
    const lo = priceRange.min;
    const hi = priceRange.max;
    if (hi <= 0) return;

    let nextMin = currentMinPrice ? parseFloat(currentMinPrice) : lo;
    let nextMax = currentMaxPrice ? parseFloat(currentMaxPrice) : hi;
    if (Number.isNaN(nextMin)) nextMin = lo;
    if (Number.isNaN(nextMax)) nextMax = hi;
    nextMin = clampToRange(nextMin, lo, hi);
    nextMax = clampToRange(nextMax, lo, hi);
    if (nextMin > nextMax) {
      nextMin = lo;
      nextMax = hi;
    }
    setMinPrice(nextMin);
    setMaxPrice(nextMax);
  }, [currentMinPrice, currentMaxPrice, priceRange.min, priceRange.max]);

  const resolveStepSize = (): number => {
    const perCurrency = priceRange.stepSizePerCurrency || {};
    const currencyStep = perCurrency[currency];
    if (currencyStep && currencyStep > 0) {
      return currencyStep;
    }
    if (priceRange.stepSize && priceRange.stepSize > 0) {
      return priceRange.stepSize;
    }
    return 1;
  };

  const getPercentage = (value: number) => {
    const span = priceRange.max - priceRange.min;
    if (span <= 0) return priceRange.max > 0 ? 50 : 0;
    return ((value - priceRange.min) / span) * 100;
  };

  const handleMouseDown = (which: 'min' | 'max') => {
    dragRef.current = which;
    setIsDragging(which);
  };

  const updatePrice = (clientX: number) => {
    const which = dragRef.current;
    if (!sliderRef.current || !which) return;

    const span = priceRange.max - priceRange.min;
    if (span <= 0) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const value = priceRange.min + (percentage / 100) * span;
    const step = resolveStepSize();
    const roundedValue = roundToStep(value, step);

    const currentMin = typeof minPrice === 'number' && !isNaN(minPrice) ? minPrice : priceRange.min;
    const currentMax = typeof maxPrice === 'number' && !isNaN(maxPrice) ? maxPrice : priceRange.max;

    if (which === 'min') {
      const newMin = Math.max(priceRange.min, Math.min(roundedValue, currentMax - step));
      setMinPrice(newMin);
    } else {
      const newMax = Math.min(priceRange.max, Math.max(roundedValue, currentMin + step));
      setMaxPrice(newMax);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    updatePrice(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragRef.current || e.touches.length === 0) return;
    updatePrice(e.touches[0].clientX);
  };

  const handleMouseUp = () => {
    dragRef.current = null;
    setIsDragging(null);
  };

  const handleTouchEnd = () => {
    dragRef.current = null;
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, minPrice, maxPrice, priceRange]);

  useEffect(() => {
    if (isDragging || priceRange.max <= 0) return;

    const shouldApplyMin = minPrice !== priceRange.min;
    const shouldApplyMax = maxPrice !== priceRange.max;

    if (
      shouldApplyMin ||
      shouldApplyMax ||
      searchParams.get('minPrice') ||
      searchParams.get('maxPrice')
    ) {
      const params = new URLSearchParams(searchParams.toString());

      if (shouldApplyMin) {
        params.set('minPrice', minPrice.toString());
      } else {
        params.delete('minPrice');
      }

      if (shouldApplyMax) {
        params.set('maxPrice', maxPrice.toString());
      } else {
        params.delete('maxPrice');
      }

      params.delete('page');

      const timeoutId = setTimeout(() => {
        pushShopProductsListingUrl(router, `/products?${params.toString()}`);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [isDragging, minPrice, maxPrice, priceRange, searchParams, router]);

  /** Slider + API use DB units (USD); formatPrice converts to the selected display currency (e.g. AMD). */
  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
      return formatCurrencyPrice(0, currency);
    }
    return formatCurrencyPrice(price, currency);
  };

  const safeMinPrice: number =
    typeof minPrice === 'number' && !isNaN(minPrice) && isFinite(minPrice) ? minPrice : priceRange.min;
  const safeMaxPrice: number =
    typeof maxPrice === 'number' && !isNaN(maxPrice) && isFinite(maxPrice) ? maxPrice : priceRange.max;

  const span = priceRange.max - priceRange.min;
  const singlePricePoint = span <= 0 && priceRange.max > 0;
  const minPercentage = singlePricePoint ? 50 : getPercentage(safeMinPrice);
  const maxPercentage = singlePricePoint ? 50 : getPercentage(safeMaxPrice);

  let rangeLabel: string;
  if (rangeLoading) {
    rangeLabel = t('products.filters.price.loading');
  } else if (!rangeReady) {
    rangeLabel = t('products.filters.price.noRange');
  } else {
    rangeLabel = `${formatPrice(safeMinPrice)} - ${formatPrice(safeMaxPrice)}`;
  }

  return (
    <section className={PRODUCTS_FILTER_SECTION_SHELL_CLASS}>
      <div className="mb-3 flex min-h-6 w-full min-w-0 flex-row items-center justify-between gap-2 lg:mb-4">
        <span
          className={`${productsFiltersSectionFont.className} shrink-0 text-sm font-semibold leading-6 tracking-[-0.31px] text-[#314158] dark:text-white lg:text-base`}
        >
          {t('products.filters.price.title')}
        </span>
        <span className="min-w-0 flex-1 truncate text-right text-xs font-bold leading-6 tracking-[-0.31px] text-black dark:text-white lg:text-base">
          {rangeLabel}
        </span>
      </div>

      <div
        ref={sliderRef}
        className={`relative h-2 w-full rounded-full bg-[#e2e8f0] dark:bg-white/15 ${rangeReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
        onMouseDown={(e) => {
          if (!rangeReady || span <= 0) return;
          const rect = sliderRef.current?.getBoundingClientRect();
          if (!rect) return;
          const clickPct = ((e.clientX - rect.left) / rect.width) * 100;
          const value = priceRange.min + (clickPct / 100) * span;
          const step = resolveStepSize();
          const roundedValue = roundToStep(value, step);
          const distMin = Math.abs(clickPct - minPercentage);
          const distMax = Math.abs(clickPct - maxPercentage);
          if (distMin <= distMax) {
            const newMin = Math.max(priceRange.min, Math.min(roundedValue, safeMaxPrice - step));
            setMinPrice(newMin);
            handleMouseDown('min');
          } else {
            const newMax = Math.min(priceRange.max, Math.max(roundedValue, safeMinPrice + step));
            setMaxPrice(newMax);
            handleMouseDown('max');
          }
        }}
      >
        {rangeReady ? (
          <>
            <div
              className="absolute top-0 h-full rounded-full bg-marco-yellow"
              style={
                singlePricePoint
                  ? { left: 0, width: '100%' }
                  : {
                      left: `${minPercentage}%`,
                      width: `${Math.max(0, maxPercentage - minPercentage)}%`,
                    }
              }
            />

            <div
              className="absolute z-10 h-4 w-4 cursor-grab rounded-full border border-solid border-[#e2e8f0] bg-white shadow-sm dark:border-white dark:bg-[var(--app-bg)] active:cursor-grabbing"
              style={{ left: `${minPercentage}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown('min');
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                handleMouseDown('min');
              }}
            />
            <div
              className="absolute z-10 h-4 w-4 cursor-grab rounded-full border border-solid border-[#e2e8f0] bg-white shadow-sm dark:border-white dark:bg-[var(--app-bg)] active:cursor-grabbing"
              style={{ left: `${maxPercentage}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown('max');
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                handleMouseDown('max');
              }}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
