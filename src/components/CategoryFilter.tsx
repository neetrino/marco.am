'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { useTranslation } from '../lib/i18n-client';
import { useProductsFilters } from './ProductsFiltersProvider';
import { productsFiltersSectionFont } from '../lib/products-filters-typography';
import { PRODUCTS_FILTER_LIST_SCROLL_CLASS } from '../lib/products-filter-list-scroll';
import { ProductsFilterCheckboxVisual } from './ProductsFilterCheckbox';

interface CategoryFilterProps {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
}

interface CategoryOption {
  slug: string;
  title: string;
  count: number;
}

export function CategoryFilter({
  category,
  search,
  minPrice,
  maxPrice,
}: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersContext = useProductsFilters();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  /** Instant UI while URL / RSC catch up after `router.push` */
  const [optimisticSlugs, setOptimisticSlugs] = useState<string[] | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (filtersContext?.data?.categories) {
      setCategories(filtersContext.data.categories);
      setLoading(false);
      return;
    }
    if (filtersContext === null) {
      fetchCategories();
    } else {
      setLoading(filtersContext.loading);
    }
  }, [category, search, minPrice, maxPrice, filtersContext?.data?.categories, filtersContext?.loading, filtersContext === null]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const language = getStoredLanguage();
      const params: Record<string, string> = { lang: language };
      if (category) params.category = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const response = await apiClient.get<{ categories: CategoryOption[] }>('/api/v1/products/filters', { params });
      setCategories(response.categories ?? []);
    } catch (_err) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  /** URL is source of truth (avoids stale server props); slugs compared case-insensitively */
  const categoryQs = searchParams.get('category');
  const selectedFromUrl = useMemo(
    () => (categoryQs ? categoryQs.split(',').map((s) => s.trim()).filter(Boolean) : []),
    [categoryQs]
  );

  const selectedSlugs = optimisticSlugs ?? selectedFromUrl;

  useEffect(() => {
    setOptimisticSlugs(null);
  }, [categoryQs]);

  const handleToggle = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const fromUrl =
      optimisticSlugs ??
      params.get('category')?.split(',').map((s) => s.trim()).filter(Boolean) ??
      [];
    const idx = fromUrl.findIndex((s) => s.toLowerCase() === slug.toLowerCase());
    const next = idx >= 0 ? fromUrl.filter((_, i) => i !== idx) : [...fromUrl, slug];
    setOptimisticSlugs(next);
    if (next.length > 0) {
      params.set('category', next.join(','));
    } else {
      params.delete('category');
    }
    params.delete('page');
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/products?${qs}` : '/products');
    });
  };

  if (loading) {
    return (
      <section className="mb-4 border-b border-solid border-[#e2e8f0] pb-4">
        <h3
          className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-black`}
        >
          {t('products.filters.category.title')}
        </h3>
        <div className="text-sm text-[#62748e]">{t('products.filters.category.loading')}</div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="mb-4 border-b border-solid border-[#e2e8f0] pb-4">
      <h3
        className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-black`}
      >
        {t('products.filters.category.title')}
      </h3>

      <div className={`flex flex-col gap-3 ${PRODUCTS_FILTER_LIST_SCROLL_CLASS}`}>
        {categories.map((item) => {
          const isSelected = selectedSlugs.some(
            (s) => s.toLowerCase() === item.slug.toLowerCase()
          );

          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => handleToggle(item.slug)}
              className="flex w-full min-w-0 items-center gap-3 text-left transition-[opacity,color] duration-200 ease-out hover:opacity-90"
            >
              <ProductsFilterCheckboxVisual checked={isSelected} variant="checkmark" />
              <span
                className={`min-w-0 flex-1 truncate text-base leading-6 tracking-[0.16px] transition-colors duration-200 ease-out ${
                  isSelected ? 'text-[#314158]' : 'text-[#5d7285]'
                }`}
              >
                {item.title}
              </span>
              <span className="shrink-0 text-base leading-6 tracking-[-0.31px] text-[#90a1b9]">
                ({item.count})
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
