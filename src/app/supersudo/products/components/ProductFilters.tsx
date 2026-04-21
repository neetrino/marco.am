'use client';

import type { SyntheticEvent } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import type { Category } from '../types';

interface ProductFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  skuSearch: string;
  setSkuSearch: (sku: string) => void;
  selectedCategories: Set<string>;
  setSelectedCategories: (categories: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesExpanded: boolean;
  setCategoriesExpanded: (expanded: boolean) => void;
  stockFilter: 'all' | 'inStock' | 'outOfStock';
  setStockFilter: (filter: 'all' | 'inStock' | 'outOfStock') => void;
  minPrice: string;
  setMinPrice: (price: string) => void;
  maxPrice: string;
  setMaxPrice: (price: string) => void;
  handleSearch: (e: SyntheticEvent) => void;
  handleClearFilters: () => void;
  setPage: (page: number | ((prev: number) => number)) => void;
}

export function ProductFilters({
  search,
  setSearch,
  skuSearch,
  setSkuSearch,
  selectedCategories,
  setSelectedCategories,
  categories,
  categoriesLoading,
  categoriesExpanded,
  setCategoriesExpanded,
  stockFilter,
  setStockFilter,
  minPrice: _minPrice,
  setMinPrice: _setMinPrice,
  maxPrice: _maxPrice,
  setMaxPrice: _setMaxPrice,
  handleSearch,
  handleClearFilters: _handleClearFilters,
  setPage,
}: ProductFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-200/60 sm:p-5">
      {/* Search Fields */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.products.searchByTitleOrSlug')}
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
            placeholder={t('admin.products.searchPlaceholder')}
            className="admin-field border-slate-300/90 bg-slate-50/70 transition-all focus:border-slate-800"
          />
        </div>
        
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.products.searchBySku')}
          </label>
          <input
            type="text"
            value={skuSearch}
            onChange={(e) => {
              setSkuSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('admin.products.skuPlaceholder')}
            className="admin-field border-slate-300/90 bg-slate-50/70 transition-all focus:border-slate-800"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Category Filter */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.products.filterByCategory')}
          </label>
          <div className="relative" data-category-dropdown>
            <button
              type="button"
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className="admin-field flex items-center justify-between border-slate-300/90 bg-slate-50/70 text-left transition-all hover:bg-white focus:border-slate-800"
            >
              <span className="text-sm font-medium text-slate-700">
                {selectedCategories.size === 0
                  ? t('admin.products.allCategories')
                  : selectedCategories.size === 1
                  ? categories.find(c => selectedCategories.has(c.id))?.title || '1 category'
                  : `${selectedCategories.size} categories`}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  categoriesExpanded ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {categoriesExpanded && (
              <div className="absolute z-10 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-1 shadow-lg shadow-slate-300/30 backdrop-blur">
                {categoriesLoading ? (
                  <div className="p-3 text-center text-sm text-slate-500">{t('admin.products.loadingCategories')}</div>
                ) : categories.length === 0 ? (
                  <div className="p-3 text-center text-sm text-slate-500">{t('admin.products.noCategoriesAvailable')}</div>
                ) : (
                  <div className="p-2">
                    <div className="space-y-1">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-100/80"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.has(category.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedCategories);
                              if (e.target.checked) {
                                newSelected.add(category.id);
                              } else {
                                newSelected.delete(category.id);
                              }
                              setSelectedCategories(newSelected);
                              setPage(1);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                          />
                          <span className="text-sm text-slate-700">{category.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Stock Filter */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.products.filterByStock')}
          </label>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as 'all' | 'inStock' | 'outOfStock');
              setPage(1);
            }}
            className="admin-field border-slate-300/90 bg-slate-50/70 transition-all focus:border-slate-800"
          >
            <option value="all">{t('admin.products.allProducts')}</option>
            <option value="inStock">{t('admin.products.inStock')}</option>
            <option value="outOfStock">{t('admin.products.outOfStock')}</option>
          </select>
        </div>
      </div>

    </div>
  );
}






