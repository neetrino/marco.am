'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { useTranslation } from '../lib/i18n-client';
import { useProductsFilters, type BrandOption } from './ProductsFiltersProvider';
import { productsFiltersSectionFont } from '../lib/products-filters-typography';
import { ProductsFilterCheckboxVisual } from './ProductsFilterCheckbox';

interface BrandFilterProps {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  selectedBrands?: string[];
}

const FILTER_LIST_SCROLL =
  'max-h-[200px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#e2e8f0_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#e2e8f0]';

export function BrandFilter({ category, search, minPrice, maxPrice, selectedBrands = [] }: BrandFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersContext = useProductsFilters();
  const { t } = useTranslation();
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (filtersContext?.data?.brands) {
      setBrands(filtersContext.data.brands);
      setLoading(false);
      return;
    }
    if (filtersContext === null) {
      fetchBrands();
    } else {
      setLoading(filtersContext.loading);
    }
  }, [category, search, minPrice, maxPrice, filtersContext?.data?.brands, filtersContext?.loading, filtersContext === null]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const language = getStoredLanguage();
      const params: Record<string, string> = { lang: language };
      if (category) params.category = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const response = await apiClient.get<{ brands: BrandOption[] }>('/api/v1/products/filters', { params });
      const list = response.brands ?? [];
      setBrands(list);
    } catch (_err) {
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (brandId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentBrands = selectedBrands || [];
    const newBrands = currentBrands.includes(brandId)
      ? currentBrands.filter((id) => id !== brandId)
      : [...currentBrands, brandId];
    if (newBrands.length > 0) {
      params.set('brand', newBrands.join(','));
    } else {
      params.delete('brand');
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  if (loading) {
    return (
      <section className="mb-4 border-b border-solid border-[#e2e8f0] pb-4">
        <h3
          className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-black`}
        >
          {t('products.filters.brand.title')}
        </h3>
        <div className="text-sm text-[#62748e]">{t('products.filters.brand.loading')}</div>
      </section>
    );
  }

  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="mb-4 border-b border-solid border-[#e2e8f0] pb-4">
      <h3
        className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-black`}
      >
        {t('products.filters.brand.title')}
      </h3>

      <div className={`flex flex-col gap-3 ${FILTER_LIST_SCROLL}`}>
        {brands.map((brand) => {
          const isSelected = selectedBrands.includes(brand.id);

          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => handleBrandSelect(brand.id)}
              className="flex w-full min-w-0 items-center gap-3 text-left transition-opacity hover:opacity-90"
            >
              <ProductsFilterCheckboxVisual checked={isSelected} />
              <span
                className={`min-w-0 flex-1 truncate text-base leading-6 tracking-[0.16px] ${
                  isSelected ? 'text-[#314158]' : 'text-[#5d7285]'
                }`}
              >
                {brand.name}
              </span>
              <span className="shrink-0 text-base leading-6 tracking-[-0.31px] text-[#90a1b9]">
                ({brand.count})
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
