'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { productsFiltersSectionFont } from '../lib/products-filters-typography';
import { getStoredLanguage } from '../lib/language';
import { getStoredCurrency, formatPrice as formatCurrencyPrice, type CurrencyCode } from '../lib/currency';
import { useTranslation } from '../lib/i18n-client';
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

export function PriceFilter({ currentMinPrice, currentMaxPrice, category }: PriceFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersContext = useProductsFilters();
  const { t } = useTranslation();
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: 0,
    max: 100000,
    stepSize: null,
    stepSizePerCurrency: null,
  });
  const [minPrice, setMinPrice] = useState(currentMinPrice ? parseFloat(currentMinPrice) : 0);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice ? parseFloat(currentMaxPrice) : 100000);
  const [isDragging, setIsDragging] = useState<'max' | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('USD'); // Default для SSR
  const sliderRef = useRef<HTMLDivElement>(null);

  // Helper function to round value to step size
  const roundToStep = (value: number, step: number | null | undefined): number => {
    if (!step || step <= 0) return Math.round(value);
    return Math.round(value / step) * step;
  };

  // Загружаем валюту только на клиенте, чтобы избежать проблем с гидратацией
  useEffect(() => {
    const updateCurrency = () => {
      setCurrency(getStoredCurrency());
    };
    
    // Загружаем валюту при монтировании
    updateCurrency();
    
    // Слушаем изменения валюты
    if (typeof window !== 'undefined') {
      window.addEventListener('currency-updated', updateCurrency);
      return () => {
        window.removeEventListener('currency-updated', updateCurrency);
      };
    }
  }, []);

  useEffect(() => {
    if (filtersContext?.data?.priceRange) {
      const pr = filtersContext.data.priceRange;
      setPriceRange(pr as PriceRange);
      setMinPrice(pr.min);
      if (!currentMaxPrice) setMaxPrice(pr.max);
      return;
    }
    if (filtersContext === null) {
      fetchPriceRange();
    }
  }, [category, filtersContext?.data?.priceRange, filtersContext === null]);

  useEffect(() => {
    // Single thumb: min is always catalog floor (left edge), not draggable
    setMinPrice(priceRange.min);
    if (currentMaxPrice) {
      setMaxPrice(parseFloat(currentMaxPrice));
    } else {
      setMaxPrice(priceRange.max);
    }
  }, [currentMaxPrice, priceRange]);

  const fetchPriceRange = async () => {
    try {
      const language = getStoredLanguage();
      const params: Record<string, string> = { lang: language };
      if (category) params.category = category;

      const response = await apiClient.get<PriceRange>('/api/v1/products/price-range', { params });
      setPriceRange(response);
      setMinPrice(response.min);
      if (!currentMaxPrice) setMaxPrice(response.max);
    } catch (error) {
      console.error('Error fetching price range:', error);
    }
  };

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
    return ((value - priceRange.min) / (priceRange.max - priceRange.min)) * 100;
  };

  const handleMouseDown = () => {
    setIsDragging('max');
  };

  const updatePrice = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const value = priceRange.min + (percentage / 100) * (priceRange.max - priceRange.min);
    const step = resolveStepSize();
    const roundedValue = roundToStep(value, step);

    if (isDragging === 'max') {
      const currentMin = typeof minPrice === 'number' && !isNaN(minPrice) ? minPrice : priceRange.min;
      const newMax = Math.min(priceRange.max, Math.max(roundedValue, currentMin + step));
      setMaxPrice(newMax);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    updatePrice(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    updatePrice(e.touches[0].clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const handleTouchEnd = () => {
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

  // Auto-apply filter when dragging ends
  useEffect(() => {
    if (!isDragging) {
      // Only apply if values have changed from initial/default
      const shouldApplyMax = maxPrice !== priceRange.max;

      if (shouldApplyMax || searchParams.get('minPrice')) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('minPrice');

        if (shouldApplyMax) {
          params.set('maxPrice', maxPrice.toString());
        } else {
          params.delete('maxPrice');
        }
        
        // Reset page to 1 when filters change
        params.delete('page');
        
        // Use a small delay to debounce rapid changes
        const timeoutId = setTimeout(() => {
          router.push(`/products?${params.toString()}`);
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isDragging, maxPrice, priceRange, searchParams, router]);

  // Используем функцию форматирования из currency.ts для консистентности
  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
      return formatCurrencyPrice(0, currency);
    }
    return formatCurrencyPrice(price, currency);
  };

  const safeMinPrice: number = typeof minPrice === 'number' && !isNaN(minPrice) && isFinite(minPrice) ? minPrice : 0;
  const safeMaxPrice: number = typeof maxPrice === 'number' && !isNaN(maxPrice) && isFinite(maxPrice) ? maxPrice : 100000;
  
  const maxPercentage = getPercentage(safeMaxPrice);

  const rangeLabel = `${formatPrice(Number(safeMinPrice) || 0)} - ${formatPrice(Number(safeMaxPrice) || 100000)}`;

  return (
    <section className="mb-4 border-b border-solid border-[#e2e8f0] pb-4">
      <div className="mb-4 flex h-6 w-full items-center justify-between gap-2">
        <span
          className={`${productsFiltersSectionFont.className} shrink-0 text-base font-semibold leading-6 tracking-[-0.31px] text-[#314158]`}
        >
          {t('products.filters.price.title')}
        </span>
        <span className="truncate text-right text-base font-bold leading-6 tracking-[-0.31px] text-black">
          {rangeLabel}
        </span>
      </div>

      <div
        ref={sliderRef}
        className="relative h-2 w-full cursor-pointer rounded-full bg-[#e2e8f0]"
        onMouseDown={(e) => {
          const rect = sliderRef.current?.getBoundingClientRect();
          if (!rect) return;
          const percentage = ((e.clientX - rect.left) / rect.width) * 100;
          const value = priceRange.min + (percentage / 100) * (priceRange.max - priceRange.min);
          const step = resolveStepSize();
          const roundedValue = roundToStep(value, step);
          const currentMin = typeof minPrice === 'number' && !isNaN(minPrice) ? minPrice : priceRange.min;
          const newMax = Math.min(priceRange.max, Math.max(roundedValue, currentMin + step));
          setMaxPrice(newMax);
          handleMouseDown();
        }}
      >
        <div
          className="absolute top-0 h-full rounded-full bg-marco-yellow"
          style={{
            left: 0,
            width: `${maxPercentage}%`,
          }}
        />

        <div
          className="absolute z-10 h-4 w-4 cursor-grab rounded-full border border-solid border-[#e2e8f0] bg-white shadow-sm active:cursor-grabbing"
          style={{ left: `${maxPercentage}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleMouseDown();
          }}
        />
      </div>
    </section>
  );
}

