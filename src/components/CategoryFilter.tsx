'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { pushShopProductsListingUrl } from '../lib/push-shop-products-listing-url';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { useTranslation } from '../lib/i18n-client';
import { useProductsFilters } from './ProductsFiltersProvider';
import {
  PRODUCTS_FILTER_SECTION_SHELL_CLASS,
  productsFiltersSectionFont,
} from '../lib/products-filters-typography';
import { ProductsFilterCheckboxVisual } from './ProductsFilterCheckbox';
import { ProductsFilterScrollArea } from './ProductsFilterScrollArea';

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
  /** Instant UI while URL / RSC catch up after navigation */
  const [optimisticSlugs, setOptimisticSlugs] = useState<string[] | null>(null);

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
    pushShopProductsListingUrl(router, qs ? `/products?${qs}` : '/products');
  };

  const handleClearCategories = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('page');
    setOptimisticSlugs([]);
    const qs = params.toString();
    pushShopProductsListingUrl(router, qs ? `/products?${qs}` : '/products');
  };

  const hasCategorySelection = selectedSlugs.length > 0;

  if (loading) {
    return (
      <section className={PRODUCTS_FILTER_SECTION_SHELL_CLASS}>
        <h3
          className={`${productsFiltersSectionFont.className} mb-4 text-base font-semibold leading-6 tracking-[-0.31px] text-black dark:text-white`}
        >
          {t('products.filters.category.title')}
        </h3>
        <div className="text-sm text-[#62748e] dark:text-white/72">{t('products.filters.category.loading')}</div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className={PRODUCTS_FILTER_SECTION_SHELL_CLASS}>
      <div className="mb-4 flex min-h-6 items-center justify-between gap-2">
        <h3
          className={`${productsFiltersSectionFont.className} min-w-0 text-base font-semibold leading-6 tracking-[-0.31px] text-black dark:text-white`}
        >
          {t('products.filters.category.title')}
        </h3>
        {hasCategorySelection ? (
          <button
            type="button"
            onClick={handleClearCategories}
            className="shrink-0 whitespace-nowrap rounded-sm text-sm font-semibold leading-5 tracking-[-0.15px] text-marco-yellow transition-[filter,opacity] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/25"
            aria-label={t('products.filters.category.clearAria')}
          >
            {t('products.filters.category.clear')}
          </button>
        ) : null}
      </div>

      <ProductsFilterScrollArea className="max-h-[18rem] pr-[10px]">
        <div className="flex flex-col gap-3">
        {categories.map((item) => {
          const isSelected = selectedSlugs.some(
            (s) => s.toLowerCase() === item.slug.toLowerCase()
          );

          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => handleToggle(item.slug)}
              className="flex w-full min-w-0 items-center gap-3 pr-3 text-left transition-[opacity,color] duration-200 ease-out hover:opacity-90"
            >
              <ProductsFilterCheckboxVisual checked={isSelected} variant="checkmark" />
              <span
                className={`min-w-0 flex-1 truncate text-base leading-6 tracking-[0.16px] transition-colors duration-200 ease-out ${
                  isSelected ? 'text-[#314158] dark:text-[#b8c2cf]' : 'text-[#5d7285] dark:text-[#8f9fb2]'
                }`}
              >
                {item.title}
              </span>
              <span className="shrink-0 text-base leading-6 tracking-[-0.31px] text-[#90a1b9] dark:text-white/68">
                ({item.count})
              </span>
            </button>
          );
        })}
        </div>
      </ProductsFilterScrollArea>
    </section>
  );
}
