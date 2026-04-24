'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { useTranslation } from '../lib/i18n-client';
import { useProductsFilters, type BrandOption } from './ProductsFiltersProvider';
import {
  PRODUCTS_FILTER_SECTION_SHELL_CLASS,
  productsFiltersSectionFont,
} from '../lib/products-filters-typography';
import { ProductsFilterCheckboxVisual } from './ProductsFilterCheckbox';
import { ProductsFilterScrollArea } from './ProductsFilterScrollArea';

interface BrandFilterProps {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
}

export function BrandFilter({ category, search, minPrice, maxPrice }: BrandFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersContext = useProductsFilters();
  const { t } = useTranslation();
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimisticBrandSlugs, setOptimisticBrandSlugs] = useState<string[] | null>(null);
  const [, startTransition] = useTransition();

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

  const brandQs = searchParams.get('brand');
  const selectedBrandSlugsFromUrl = useMemo(
    () => (brandQs ? brandQs.split(',').map((s) => s.trim()).filter(Boolean) : []),
    [brandQs]
  );

  const selectedBrandSlugs = optimisticBrandSlugs ?? selectedBrandSlugsFromUrl;

  useEffect(() => {
    setOptimisticBrandSlugs(null);
  }, [brandQs]);

  const handleBrandSelect = (brandSlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const fromUrl =
      optimisticBrandSlugs ??
      params.get('brand')?.split(',').map((s) => s.trim()).filter(Boolean) ??
      [];
    const idx = fromUrl.indexOf(brandSlug);
    const newBrands = idx >= 0 ? fromUrl.filter((_, i) => i !== idx) : [...fromUrl, brandSlug];
    setOptimisticBrandSlugs(newBrands);
    if (newBrands.length > 0) {
      params.set('brand', newBrands.join(','));
    } else {
      params.delete('brand');
    }
    params.delete('page');
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/products?${qs}` : '/products');
    });
  };

  const handleClearBrands = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('brand');
    params.delete('page');
    setOptimisticBrandSlugs([]);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/products?${qs}` : '/products');
    });
  };

  const hasBrandSelection = selectedBrandSlugs.length > 0;

  if (loading) {
    return (
      <section className={PRODUCTS_FILTER_SECTION_SHELL_CLASS}>
        <h3
          className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-black dark:text-white`}
        >
          {t('products.filters.brand.title')}
        </h3>
        <div className="text-sm text-[#62748e] dark:text-white/72">{t('products.filters.brand.loading')}</div>
      </section>
    );
  }

  if (brands.length === 0) {
    return null;
  }

  return (
    <section className={PRODUCTS_FILTER_SECTION_SHELL_CLASS}>
      <div className="mb-4 flex min-h-6 items-center justify-between gap-2">
        <h3
          className={`${productsFiltersSectionFont.className} min-w-0 text-base font-semibold leading-6 tracking-[-0.31px] text-black dark:text-white`}
        >
          {t('products.filters.brand.title')}
        </h3>
        {hasBrandSelection ? (
          <button
            type="button"
            onClick={handleClearBrands}
            className="shrink-0 whitespace-nowrap rounded-sm text-sm font-semibold leading-5 tracking-[-0.15px] text-marco-yellow transition-[filter,opacity] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/25"
            aria-label={t('products.filters.brand.clearAria')}
          >
            {t('products.filters.brand.clear')}
          </button>
        ) : null}
      </div>

      <ProductsFilterScrollArea className="max-h-[18rem] pr-[10px]">
        <div className="flex flex-col gap-3">
        {brands.map((brand) => {
          const isSelected = selectedBrandSlugs.includes(brand.slug) || selectedBrandSlugs.includes(brand.id);

          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => handleBrandSelect(brand.slug)}
              className="flex w-full min-w-0 items-center gap-3 pr-3 text-left transition-[opacity,color] duration-200 ease-out hover:opacity-90"
            >
              <ProductsFilterCheckboxVisual checked={isSelected} />
              <span
                className={`min-w-0 flex-1 truncate text-base leading-6 tracking-[0.16px] transition-colors duration-200 ease-out ${
                  isSelected ? 'text-[#314158] dark:text-white' : 'text-[#5d7285] dark:text-white/78'
                }`}
              >
                {brand.name}
              </span>
              <span className="shrink-0 text-base leading-6 tracking-[-0.31px] text-[#90a1b9] dark:text-white/68">
                ({brand.count})
              </span>
            </button>
          );
        })}
        </div>
      </ProductsFilterScrollArea>
    </section>
  );
}
