'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ListFilter, Search, X } from 'lucide-react';
import { useTranslation } from '../../../../lib/i18n-client';
import { ProductCategoryFilterTree } from './ProductCategoryFilterTree';
import type { Category } from '../types';

export type ProductStockFilter = 'all' | 'inStock' | 'outOfStock';
export type ProductPublishedFilter = 'all' | 'published' | 'unpublished';

interface ProductFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  selectedCategories: Set<string>;
  setSelectedCategories: (categories: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  categories: Category[];
  categoriesLoading: boolean;
  stockFilter: ProductStockFilter;
  setStockFilter: (filter: ProductStockFilter) => void;
  publishedFilter: ProductPublishedFilter;
  setPublishedFilter: (filter: ProductPublishedFilter) => void;
  onClearFilters: () => void;
  setPage: (page: number | ((prev: number) => number)) => void;
}

const FILTER_PANEL_ID = 'product-filters-panel';

export function ProductFilters({
  search,
  setSearch,
  selectedCategories,
  setSelectedCategories,
  categories,
  categoriesLoading,
  stockFilter,
  setStockFilter,
  publishedFilter,
  setPublishedFilter,
  onClearFilters,
  setPage,
}: ProductFiltersProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.size > 0) count += 1;
    if (stockFilter !== 'all') count += 1;
    if (publishedFilter !== 'all') count += 1;
    return count;
  }, [selectedCategories.size, stockFilter, publishedFilter]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!rootRef.current?.contains(target)) {
        setPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [panelOpen]);

  const openPanel = () => setPanelOpen(true);

  const togglePanel = () => setPanelOpen((open) => !open);

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const next = new Set(selectedCategories);
    if (checked) {
      next.add(categoryId);
    } else {
      next.delete(categoryId);
    }
    setSelectedCategories(next);
    setPage(1);
  };

  const fieldClass =
    'admin-field border-slate-300/90 bg-white text-sm transition-all focus:border-slate-800';

  return (
    <div ref={rootRef} className="mb-6">
      <div className="relative">
        <div
          className={`flex items-center gap-2 rounded-xl border bg-white/95 shadow-sm shadow-slate-200/60 transition-colors ${
            panelOpen ? 'border-slate-800 ring-2 ring-slate-800/10' : 'border-slate-200/80'
          }`}
        >
          <Search
            className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-slate-400 sm:ml-4"
            aria-hidden
          />

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onFocus={openPanel}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                setPage(1);
              }
            }}
            placeholder={t('admin.products.searchPlaceholder')}
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-1 pr-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            aria-label={t('admin.products.searchLabel')}
            aria-expanded={panelOpen}
            aria-controls={FILTER_PANEL_ID}
          />

          {search.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label={t('admin.products.clearSearch')}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}

          <button
            type="button"
            onClick={togglePanel}
            className={`relative mr-2 flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors sm:mr-3 ${
              panelOpen || activeFilterCount > 0
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
            aria-label={t('admin.products.openFilters')}
            aria-expanded={panelOpen}
            aria-controls={FILTER_PANEL_ID}
          >
            <ListFilter className="h-4 w-4" aria-hidden />
            {activeFilterCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-marco-yellow px-1 text-[10px] font-bold text-marco-black">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        {panelOpen ? (
          <div
            id={FILTER_PANEL_ID}
            className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-300/30"
          >
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">{t('admin.products.filtersTitle')}</p>
                {activeFilterCount > 0 || search.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClearFilters();
                      setCategorySearch('');
                    }}
                    className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                  >
                    {t('admin.products.clearAll')}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.products.filterByCategory')}
                </label>
                <input
                  type="search"
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.target.value)}
                  placeholder={t('admin.products.categorySearchPlaceholder')}
                  className={`${fieldClass} mb-2`}
                  aria-label={t('admin.products.categorySearchPlaceholder')}
                />
                <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2">
                  <ProductCategoryFilterTree
                    categories={categories}
                    categoriesLoading={categoriesLoading}
                    categorySearch={categorySearch}
                    selectedCategories={selectedCategories}
                    onCategoryToggle={handleCategoryToggle}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.products.filterByStock')}
                </label>
                <select
                  value={stockFilter}
                  onChange={(event) => {
                    setStockFilter(event.target.value as ProductStockFilter);
                    setPage(1);
                  }}
                  className={fieldClass}
                >
                  <option value="all">{t('admin.products.allProducts')}</option>
                  <option value="inStock">{t('admin.products.inStock')}</option>
                  <option value="outOfStock">{t('admin.products.outOfStock')}</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.products.filterByStatus')}
                </label>
                <select
                  value={publishedFilter}
                  onChange={(event) => {
                    setPublishedFilter(event.target.value as ProductPublishedFilter);
                    setPage(1);
                  }}
                  className={fieldClass}
                >
                  <option value="all">{t('admin.products.allStatuses')}</option>
                  <option value="published">{t('admin.products.published')}</option>
                  <option value="unpublished">{t('admin.products.draft')}</option>
                </select>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
