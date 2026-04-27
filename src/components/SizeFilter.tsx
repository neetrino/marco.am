'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { pushShopProductsListingUrl } from '../lib/push-shop-products-listing-url';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { useTranslation } from '../lib/i18n-client';
import { useProductsFilters } from './ProductsFiltersProvider';
import {
  PRODUCTS_FILTER_SECTION_SHELL_CLASS,
  PRODUCTS_FILTER_SECTION_SHELL_LAST_CLASS,
  productsFiltersSectionFont,
} from '../lib/products-filters-typography';
import { PRODUCTS_FILTER_LIST_SCROLL_CLASS } from '../lib/products-filter-list-scroll';
import { ProductsFilterCheckboxVisual } from './ProductsFilterCheckbox';

interface SizeFilterProps {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  selectedSizes?: string[];
}

interface SizeOption {
  value: string;
  count: number;
}


export function SizeFilter({ category, search, minPrice, maxPrice, selectedSizes = [] }: SizeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersContext = useProductsFilters();
  const { t } = useTranslation();
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>(selectedSizes);

  useEffect(() => {
    if (filtersContext?.data?.sizes) {
      setSizes(filtersContext.data.sizes);
      setLoading(false);
      return;
    }
    if (filtersContext === null) {
      fetchSizes();
    } else {
      setLoading(filtersContext.loading);
    }
  }, [category, search, minPrice, maxPrice, filtersContext?.data?.sizes, filtersContext?.loading, filtersContext === null]);

  useEffect(() => {
    setSelected(selectedSizes);
  }, [selectedSizes]);

  const fetchSizes = async () => {
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

      const response = await apiClient.get<{ colors: unknown[]; sizes: SizeOption[] }>('/api/v1/products/filters', { params });

      setSizes(response.sizes || []);
    } catch (_error) {
      setSizes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSizeToggle = (sizeValue: string) => {
    const newSelected = selected.includes(sizeValue)
      ? selected.filter((s) => s !== sizeValue)
      : [...selected, sizeValue];

    setSelected(newSelected);
    applyFilters(newSelected);
  };

  const applyFilters = (sizesToApply: string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (sizesToApply.length > 0) {
      params.set('sizes', sizesToApply.join(','));
    } else {
      params.delete('sizes');
    }

    params.delete('page');

    pushShopProductsListingUrl(router, `/products?${params.toString()}`);
  };

  if (loading) {
    return (
      <section className={PRODUCTS_FILTER_SECTION_SHELL_CLASS}>
        <h3
          className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-[#1d293d]`}
        >
          {t('products.filters.size.title')}
        </h3>
        <div className="text-sm text-[#62748e]">{t('products.filters.size.loading')}</div>
      </section>
    );
  }

  if (sizes.length === 0) {
    return (
      <section className="mb-0 border-b border-solid border-[#e2e8f0] pb-4 max-lg:pb-5 last:border-b-0">
        <h3
          className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-[#1d293d]`}
        >
          {t('products.filters.size.title')}
        </h3>
        <p className="text-sm text-[#62748e]">{t('products.filters.size.noSizes')}</p>
      </section>
    );
  }

  return (
    <section className={PRODUCTS_FILTER_SECTION_SHELL_LAST_CLASS}>
      <h3
        className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-[#1d293d]`}
      >
        {t('products.filters.size.title')}
      </h3>

      <div className={`flex flex-col gap-3 ${PRODUCTS_FILTER_LIST_SCROLL_CLASS}`}>
        {sizes.map((size) => {
          const isSelected = selected.includes(size.value);

          return (
            <button
              key={size.value}
              type="button"
              onClick={() => handleSizeToggle(size.value)}
              className="flex w-full min-w-0 items-center gap-3 text-left transition-opacity hover:opacity-90"
            >
              <ProductsFilterCheckboxVisual checked={isSelected} />
              <span
                className={`min-w-0 flex-1 truncate text-base leading-6 tracking-[0.16px] ${
                  isSelected ? 'text-[#314158]' : 'text-[#5d7285]'
                }`}
              >
                {size.value}
              </span>
              <span className="shrink-0 text-base leading-6 tracking-[-0.31px] text-[#90a1b9]">
                ({size.count})
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
