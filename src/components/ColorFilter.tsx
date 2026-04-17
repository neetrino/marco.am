'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { getColorHex } from '../lib/colorMap';
import { useTranslation } from '../lib/i18n-client';
import { useProductsFilters } from './ProductsFiltersProvider';
import { productsFiltersSectionFont } from '../lib/products-filters-typography';

interface ColorFilterProps {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  selectedColors?: string[];
}

interface ColorOption {
  value: string;
  label: string;
  count: number;
  imageUrl?: string | null;
  colors?: string[] | null;
}

export function ColorFilter({ category, search, minPrice, maxPrice, selectedColors = [] }: ColorFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersContext = useProductsFilters();
  const { t } = useTranslation();
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>(selectedColors);

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

  useEffect(() => {
    setSelected(selectedColors);
  }, [selectedColors]);

  const fetchColors = async () => {
    try {
      setLoading(true);
      const language = getStoredLanguage();
      const params: Record<string, string> = {
        lang: language,
      };

      if (category) params.category = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const response = await apiClient.get<{ colors: ColorOption[]; sizes: unknown[] }>('/api/v1/products/filters', { params });

      setColors(response.colors || []);
    } catch (_error) {
      setColors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleColorToggle = (colorValue: string) => {
    const newSelected = selected.includes(colorValue)
      ? selected.filter((c) => c !== colorValue)
      : [...selected, colorValue];

    setSelected(newSelected);
    applyFilters(newSelected);
  };

  const applyFilters = (colorsToApply: string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (colorsToApply.length > 0) {
      params.set('colors', colorsToApply.join(','));
    } else {
      params.delete('colors');
    }

    params.delete('page');

    router.push(`/products?${params.toString()}`);
  };

  if (loading) {
    return (
      <section className="mb-4 border-b border-solid border-[#e2e8f0] pb-4">
        <h3
          className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-[#1d293d]`}
        >
          {t('products.filters.color.title')}
        </h3>
        <div className="text-sm text-[#62748e]">{t('products.filters.color.loading')}</div>
      </section>
    );
  }

  if (colors.length === 0) {
    return (
      <section className="mb-4 border-b border-solid border-[#e2e8f0] pb-4">
        <h3
          className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-[#1d293d]`}
        >
          {t('products.filters.color.title')}
        </h3>
        <p className="text-sm text-[#62748e]">{t('products.filters.color.noColors')}</p>
      </section>
    );
  }

  return (
    <section className="mb-4 border-b border-solid border-[#e2e8f0] pb-4">
      <h3
        className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-[#1d293d]`}
      >
        {t('products.filters.color.title')}
      </h3>

      <div className="flex flex-wrap justify-start gap-x-[22px] gap-y-3">
        {colors.map((color) => {
          const isSelected = selected.includes(color.value);
          const colorHex =
            color.colors && Array.isArray(color.colors) && color.colors.length > 0
              ? color.colors[0]
              : getColorHex(color.label);
          const hasImage = color.imageUrl && color.imageUrl.trim() !== '';

          return (
            <button
              key={color.value}
              type="button"
              onClick={() => handleColorToggle(color.value)}
              aria-pressed={isSelected}
              aria-label={color.label}
              title={color.label}
              className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full transition-[box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/30 ${
                isSelected ? 'ring-2 ring-marco-black ring-offset-2' : 'ring-1 ring-[#e2e8f0] hover:ring-[#cad5e2]'
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
            </button>
          );
        })}
      </div>
    </section>
  );
}
