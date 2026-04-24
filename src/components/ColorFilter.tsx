'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { pushShopProductsListingUrl } from '../lib/push-shop-products-listing-url';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { getColorHex } from '../lib/colorMap';
import { useTranslation } from '../lib/i18n-client';
import { useProductsFilters } from './ProductsFiltersProvider';
import {
  PRODUCTS_FILTER_SECTION_SHELL_CLASS,
  productsFiltersSectionFont,
} from '../lib/products-filters-typography';

interface ColorFilterProps {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
}

interface ColorOption {
  value: string;
  label: string;
  count: number;
  imageUrl?: string | null;
  colors?: string[] | null;
}

function isLightHex(hex: string): boolean {
  const raw = hex.replace('#', '').trim();
  const full =
    raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  if (full.length !== 6) return false;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return false;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62;
}

export function ColorFilter({ category, search, minPrice, maxPrice }: ColorFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersContext = useProductsFilters();
  const { t } = useTranslation();
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimisticValues, setOptimisticValues] = useState<string[] | null>(null);
  useEffect(() => {
    if (filtersContext?.data?.colors) {
      setColors(filtersContext.data.colors);
      setLoading(false);
      return;
    }
    if (filtersContext === null) {
      fetchColors();
    } else {
      setLoading(filtersContext.loading);
    }
  }, [category, search, minPrice, maxPrice, filtersContext?.data?.colors, filtersContext?.loading, filtersContext === null]);

  const colorsQs = searchParams.get('colors');
  const selectedFromUrl = useMemo(
    () =>
      colorsQs
        ? colorsQs.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
        : [],
    [colorsQs]
  );

  const selectedValues = optimisticValues ?? selectedFromUrl;

  useEffect(() => {
    setOptimisticValues(null);
  }, [colorsQs]);

  const fetchColors = async () => {
    try {
      setLoading(true);
      const language = getStoredLanguage();
      const params: Record<string, string> = { lang: language };
      if (category) params.category = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const response = await apiClient.get<{ colors: ColorOption[] }>('/api/v1/products/filters', { params });
      setColors(response.colors ?? []);
    } catch (_error) {
      setColors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleColorToggle = (colorValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const key = colorValue.toLowerCase();
    const fromUrl =
      optimisticValues ??
      params.get('colors')?.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) ??
      [];
    const idx = fromUrl.indexOf(key);
    const next = idx >= 0 ? fromUrl.filter((_, i) => i !== idx) : [...fromUrl, key];
    setOptimisticValues(next);
    if (next.length > 0) {
      params.set('colors', next.join(','));
    } else {
      params.delete('colors');
    }
    params.delete('page');
    const qs = params.toString();
    pushShopProductsListingUrl(router, qs ? `/products?${qs}` : '/products');
  };

  const handleClearColors = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('colors');
    params.delete('page');
    setOptimisticValues([]);
    const qs = params.toString();
    pushShopProductsListingUrl(router, qs ? `/products?${qs}` : '/products');
  };

  const hasColorSelection = selectedValues.length > 0;

  if (loading) {
    return (
      <section className={PRODUCTS_FILTER_SECTION_SHELL_CLASS}>
        <div className="flex flex-col gap-4">
          <h3
            className={`${productsFiltersSectionFont.className} text-base font-semibold leading-6 tracking-[-0.31px] text-black dark:text-white`}
          >
            {t('products.filters.color.title')}
          </h3>
          <div className="text-sm text-[#62748e] dark:text-white/72">{t('products.filters.color.loading')}</div>
        </div>
      </section>
    );
  }

  if (colors.length === 0) {
    return null;
  }

  return (
    <section className={PRODUCTS_FILTER_SECTION_SHELL_CLASS}>
      <div className="flex flex-col gap-4">
        <div className="flex min-h-6 items-center justify-between gap-2">
          <h3
            className={`${productsFiltersSectionFont.className} min-w-0 text-base font-semibold leading-6 tracking-[-0.31px] text-black dark:text-white`}
          >
            {t('products.filters.color.title')}
          </h3>
          {hasColorSelection ? (
            <button
              type="button"
              onClick={handleClearColors}
              className="shrink-0 whitespace-nowrap rounded-sm text-sm font-semibold leading-5 tracking-[-0.15px] text-marco-yellow transition-[filter,opacity] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/25"
              aria-label={t('products.filters.color.clearAria')}
            >
              {t('products.filters.color.clear')}
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-center gap-x-[22px] gap-y-3">
          {colors.map((color) => {
            const isSelected = selectedValues.includes(color.value.toLowerCase());
            const fromValue = getColorHex(color.value);
            const colorHex =
              color.colors && Array.isArray(color.colors) && color.colors.length > 0
                ? color.colors[0]
                : fromValue !== '#CCCCCC'
                  ? fromValue
                  : getColorHex(color.label);
            const hasImage = Boolean(color.imageUrl?.trim());
            const light = isLightHex(colorHex);
            const checkIconClass = hasImage
              ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
              : light
                ? 'text-marco-black'
                : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]';

            return (
              <button
                key={color.value}
                type="button"
                onClick={() => handleColorToggle(color.value)}
                aria-pressed={isSelected}
                aria-label={color.label}
                title={color.label}
                className={`relative size-8 shrink-0 overflow-hidden rounded-full transition-[box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/30 ${
                  isSelected
                    ? 'ring-2 ring-marco-black ring-offset-2'
                    : 'ring-1 ring-[#e2e8f0] hover:ring-[#cad5e2]'
                }`}
                style={hasImage ? undefined : { backgroundColor: colorHex }}
              >
                {hasImage ? (
                  <img
                    src={color.imageUrl!}
                    alt=""
                    className="size-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      const parent = el.parentElement;
                      if (parent) parent.style.backgroundColor = colorHex;
                    }}
                  />
                ) : null}
                {isSelected ? (
                  <span
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    aria-hidden
                  >
                    <svg
                      width="14"
                      height="12"
                      viewBox="0 0 12 10"
                      fill="none"
                      className={checkIconClass}
                    >
                      <path
                        d="M1 5l3.5 3.5L11 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
