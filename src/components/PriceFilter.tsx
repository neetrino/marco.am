'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useShopProductsListingSearchParams } from '@/lib/use-shop-products-listing-search-params';
import {
  PRODUCTS_FILTER_SECTION_SHELL_CLASS,
  productsFiltersSectionFont,
} from '../lib/products-filters-typography';
import {
  getStoredCurrency,
  formatCatalogPrice,
  convertPrice,
  CATALOG_PRICE_CURRENCY,
  type CurrencyCode,
} from '../lib/currency';
import { pushShopProductsListingUrl } from '../lib/push-shop-products-listing-url';
import { useMobileFiltersDraft } from './mobile-filters-draft-context';
import { useProductsFilters, useShopFiltersTranslation } from './ProductsFiltersProvider';

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
  stepSizePerCurrency?: Record<string, number> | null;
}

function clampToRange(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) {
    return lo;
  }
  return Math.max(lo, Math.min(hi, n));
}

function parseUrlPrice(raw: string | null, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = parseFloat(raw);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
}

function resolveHandlesFromUrl(
  urlMin: string | null,
  urlMax: string | null,
  lo: number,
  hi: number,
): { min: number; max: number } {
  const hasUrlFilter = Boolean(urlMin || urlMax);
  let nextMin = hasUrlFilter ? parseUrlPrice(urlMin, lo) : lo;
  let nextMax = hasUrlFilter ? parseUrlPrice(urlMax, hi) : hi;
  nextMin = clampToRange(nextMin, lo, hi);
  nextMax = clampToRange(nextMax, lo, hi);
  if (nextMin > nextMax) {
    return { min: lo, max: hi };
  }
  return { min: nextMin, max: nextMax };
}

export function PriceFilter({
  currentMinPrice: _currentMinPrice,
  currentMaxPrice: _currentMaxPrice,
  category,
  search,
}: PriceFilterProps) {
  void _currentMinPrice;
  void _currentMaxPrice;

  const router = useRouter();
  const searchParams = useShopProductsListingSearchParams();
  const mobileDraft = useMobileFiltersDraft();
  const filtersContext = useProductsFilters();
  const { t } = useShopFiltersTranslation();
  const activeSearchParams = mobileDraft?.enabled ? mobileDraft.searchParams : searchParams;

  const urlMinPrice = activeSearchParams.get('minPrice');
  const urlMaxPrice = activeSearchParams.get('maxPrice');

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

  const sliderRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<'min' | 'max' | null>(null);
  const catalogBoundsRef = useRef<{ min: number; max: number } | null>(null);
  const catalogScopeRef = useRef('');
  const pendingUrlCommitRef = useRef(false);
  const minPriceRef = useRef(minPrice);
  const maxPriceRef = useRef(maxPrice);
  const priceRangeRef = useRef(priceRange);

  useEffect(() => {
    minPriceRef.current = minPrice;
    maxPriceRef.current = maxPrice;
    priceRangeRef.current = priceRange;
  }, [maxPrice, minPrice, priceRange]);

  const rangeLoading = filtersContext?.loading ?? false;
  const rangeReady = !rangeLoading && priceRange.max > 0;

  const roundToStep = (value: number, step: number | null | undefined): number => {
    if (!step || step <= 0) {
      return Math.round(value);
    }
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
    const scopeKey = `${category ?? ''}|${search ?? ''}`;
    if (catalogScopeRef.current !== scopeKey) {
      catalogScopeRef.current = scopeKey;
      catalogBoundsRef.current = null;
    }

    const incomingRange = filtersContext?.data?.priceRange;
    if (!incomingRange || incomingRange.max <= 0) {
      return;
    }

    const incomingMin = incomingRange.min ?? 0;
    const incomingMax = incomingRange.max ?? 0;
    const prevBounds = catalogBoundsRef.current;

    if (!prevBounds) {
      catalogBoundsRef.current = { min: incomingMin, max: incomingMax };
    } else {
      catalogBoundsRef.current = {
        min: Math.min(prevBounds.min, incomingMin),
        max: Math.max(prevBounds.max, incomingMax),
      };
    }

    const bounds = catalogBoundsRef.current;
    setPriceRange({
      min: bounds.min,
      max: bounds.max,
      stepSize: incomingRange.stepSize ?? null,
      stepSizePerCurrency: incomingRange.stepSizePerCurrency ?? null,
    });
  }, [filtersContext?.data?.priceRange, category, search]);

  useEffect(() => {
    if (isDragging || priceRange.max <= 0) {
      return;
    }

    const { min: nextMin, max: nextMax } = resolveHandlesFromUrl(
      urlMinPrice,
      urlMaxPrice,
      priceRange.min,
      priceRange.max,
    );

    if (pendingUrlCommitRef.current) {
      if (nextMin === minPriceRef.current && nextMax === maxPriceRef.current) {
        pendingUrlCommitRef.current = false;
      }
      return;
    }

    setMinPrice(nextMin);
    setMaxPrice(nextMax);
  }, [urlMinPrice, urlMaxPrice, priceRange.min, priceRange.max, isDragging]);

  const resolveStepSize = useCallback((): number => {
    const range = priceRangeRef.current;
    const perCurrency = range.stepSizePerCurrency || {};
    const currencyStep = perCurrency[currency];
    if (currencyStep && currencyStep > 0) {
      if (currency === CATALOG_PRICE_CURRENCY) {
        return currencyStep;
      }
      return Math.max(1, Math.round(convertPrice(currencyStep, currency, CATALOG_PRICE_CURRENCY)));
    }
    if (range.stepSize && range.stepSize > 0) {
      return range.stepSize;
    }
    return 1;
  }, [currency]);

  const commitPriceToUrl = useCallback(() => {
    const range = priceRangeRef.current;
    if (range.max <= 0) {
      return;
    }

    const lo = range.min;
    const hi = range.max;
    const currentMin = minPriceRef.current;
    const currentMax = maxPriceRef.current;
    const shouldApplyMin = currentMin > lo;
    const shouldApplyMax = currentMax < hi;
    const nextMin = shouldApplyMin ? currentMin.toString() : null;
    const nextMax = shouldApplyMax ? currentMax.toString() : null;

    if (urlMinPrice === nextMin && urlMaxPrice === nextMax) {
      pendingUrlCommitRef.current = false;
      return;
    }

    if (mobileDraft?.enabled) {
      mobileDraft.updateSearchParams((draftParams) => {
        if (shouldApplyMin) {
          draftParams.set('minPrice', currentMin.toString());
        } else {
          draftParams.delete('minPrice');
        }
        if (shouldApplyMax) {
          draftParams.set('maxPrice', currentMax.toString());
        } else {
          draftParams.delete('maxPrice');
        }
        draftParams.delete('page');
      });
      return;
    }

    const params = new URLSearchParams(activeSearchParams.toString());
    if (shouldApplyMin) {
      params.set('minPrice', currentMin.toString());
    } else {
      params.delete('minPrice');
    }
    if (shouldApplyMax) {
      params.set('maxPrice', currentMax.toString());
    } else {
      params.delete('maxPrice');
    }
    params.delete('page');
    pushShopProductsListingUrl(router, `/products?${params.toString()}`);
  }, [activeSearchParams, mobileDraft, router, urlMaxPrice, urlMinPrice]);

  const getPercentage = (value: number) => {
    const span = priceRange.max - priceRange.min;
    if (span <= 0) {
      return priceRange.max > 0 ? 50 : 0;
    }
    return ((value - priceRange.min) / span) * 100;
  };

  const updatePrice = useCallback(
    (clientX: number) => {
      const which = dragRef.current;
      const range = priceRangeRef.current;
      if (!sliderRef.current || !which || range.max <= 0) {
        return;
      }

      const span = range.max - range.min;
      if (span <= 0) {
        return;
      }

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const value = range.min + (percentage / 100) * span;
      const step = resolveStepSize();
      const roundedValue = roundToStep(value, step);

      const currentMin = minPriceRef.current;
      const currentMax = maxPriceRef.current;

      if (which === 'min') {
        const newMin = Math.max(range.min, Math.min(roundedValue, currentMax - step));
        minPriceRef.current = newMin;
        setMinPrice(newMin);
      } else {
        const newMax = Math.min(range.max, Math.max(roundedValue, currentMin + step));
        maxPriceRef.current = newMax;
        setMaxPrice(newMax);
      }
    },
    [resolveStepSize],
  );

  const endDrag = useCallback(() => {
    if (!dragRef.current) {
      return;
    }
    dragRef.current = null;
    pendingUrlCommitRef.current = true;
    commitPriceToUrl();
    setIsDragging(null);
  }, [commitPriceToUrl]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      updatePrice(event.clientX);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) {
        return;
      }
      updatePrice(event.touches[0].clientX);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', endDrag);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', endDrag);
    };
  }, [endDrag, isDragging, updatePrice]);

  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || Number.isNaN(price) || !Number.isFinite(price)) {
      return formatCatalogPrice(0, currency);
    }
    return formatCatalogPrice(price, currency);
  };

  const safeMinPrice =
    typeof minPrice === 'number' && !Number.isNaN(minPrice) && Number.isFinite(minPrice)
      ? minPrice
      : priceRange.min;
  const safeMaxPrice =
    typeof maxPrice === 'number' && !Number.isNaN(maxPrice) && Number.isFinite(maxPrice)
      ? maxPrice
      : priceRange.max;

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
        onMouseDown={(event) => {
          if (!rangeReady || span <= 0) {
            return;
          }
          const rect = sliderRef.current?.getBoundingClientRect();
          if (!rect) {
            return;
          }
          const clickPct = ((event.clientX - rect.left) / rect.width) * 100;
          const value = priceRange.min + (clickPct / 100) * span;
          const step = resolveStepSize();
          const roundedValue = roundToStep(value, step);
          const distMin = Math.abs(clickPct - minPercentage);
          const distMax = Math.abs(clickPct - maxPercentage);
          if (distMin <= distMax) {
            const newMin = Math.max(priceRange.min, Math.min(roundedValue, safeMaxPrice - step));
            minPriceRef.current = newMin;
            setMinPrice(newMin);
            dragRef.current = 'min';
            setIsDragging('min');
          } else {
            const newMax = Math.min(priceRange.max, Math.max(roundedValue, safeMinPrice + step));
            maxPriceRef.current = newMax;
            setMaxPrice(newMax);
            dragRef.current = 'max';
            setIsDragging('max');
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
              onMouseDown={(event) => {
                event.stopPropagation();
                dragRef.current = 'min';
                setIsDragging('min');
              }}
              onTouchStart={(event) => {
                event.stopPropagation();
                dragRef.current = 'min';
                setIsDragging('min');
              }}
            />
            <div
              className="absolute z-10 h-4 w-4 cursor-grab rounded-full border border-solid border-[#e2e8f0] bg-white shadow-sm dark:border-white dark:bg-[var(--app-bg)] active:cursor-grabbing"
              style={{ left: `${maxPercentage}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
              onMouseDown={(event) => {
                event.stopPropagation();
                dragRef.current = 'max';
                setIsDragging('max');
              }}
              onTouchStart={(event) => {
                event.stopPropagation();
                dragRef.current = 'max';
                setIsDragging('max');
              }}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
