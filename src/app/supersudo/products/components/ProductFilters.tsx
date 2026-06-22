'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ListFilter, Search, Trash2, X } from 'lucide-react';
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
const SEARCH_DEBOUNCE_MS = 250;

type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

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
  // Instant local input value; the network search is committed on a debounce so
  // typing never triggers a request per keystroke.
  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  useEffect(() => {
    if (inputValue === search) {
      return;
    }
    const handle = window.setTimeout(() => {
      setSearch(inputValue);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [inputValue, search, setSearch, setPage]);

  const commitSearchNow = () => {
    if (inputValue !== search) {
      setSearch(inputValue);
    }
    setPage(1);
    setPanelOpen(false);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.size > 0) count += 1;
    if (stockFilter !== 'all') count += 1;
    if (publishedFilter !== 'all') count += 1;
    return count;
  }, [selectedCategories.size, stockFilter, publishedFilter]);

  const activeFilterChips = useMemo((): ActiveFilterChip[] => {
    const chips: ActiveFilterChip[] = [];

    const selectedIds = Array.from(selectedCategories);
    if (selectedIds.length > 0) {
      if (selectedIds.length <= 3) {
        selectedIds.forEach((categoryId) => {
          const category = categories.find((item) => item.id === categoryId);
          if (category) {
            chips.push({
              key: `category-${categoryId}`,
              label: category.title,
              onRemove: () => {
                const next = new Set(selectedCategories);
                next.delete(categoryId);
                setSelectedCategories(next);
                setPage(1);
              },
            });
          }
        });
      } else {
        chips.push({
          key: 'categories',
          label: t('admin.products.categoriesSelectedChip').replace('{count}', String(selectedIds.length)),
          onRemove: () => {
            setSelectedCategories(new Set());
            setPage(1);
          },
        });
      }
    }

    if (stockFilter === 'inStock') {
      chips.push({
        key: 'stock',
        label: t('admin.products.inStock'),
        onRemove: () => {
          setStockFilter('all');
          setPage(1);
        },
      });
    } else if (stockFilter === 'outOfStock') {
      chips.push({
        key: 'stock',
        label: t('admin.products.outOfStock'),
        onRemove: () => {
          setStockFilter('all');
          setPage(1);
        },
      });
    }

    if (publishedFilter === 'published') {
      chips.push({
        key: 'status',
        label: t('admin.products.published'),
        onRemove: () => {
          setPublishedFilter('all');
          setPage(1);
        },
      });
    } else if (publishedFilter === 'unpublished') {
      chips.push({
        key: 'status',
        label: t('admin.products.draft'),
        onRemove: () => {
          setPublishedFilter('all');
          setPage(1);
        },
      });
    }

    return chips;
  }, [
    categories,
    publishedFilter,
    selectedCategories,
    setPage,
    setPublishedFilter,
    setSelectedCategories,
    setStockFilter,
    stockFilter,
    t,
  ]);

  const hasActiveFilters = activeFilterCount > 0;
  const hasAnythingToClear = inputValue.length > 0 || hasActiveFilters;

  const handleClearAll = () => {
    setInputValue('');
    onClearFilters();
    setCategorySearch('');
    setPage(1);
  };

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

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-2 pl-1 pr-2">
            {activeFilterChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex max-w-[13rem] items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100 py-0.5 pl-2.5 pr-1 text-xs font-medium text-slate-700"
              >
                <span className="truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    chip.onRemove();
                  }}
                  className="shrink-0 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-800"
                  aria-label={t('admin.products.removeFilterChip').replace('{label}', chip.label)}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}

            <input
              type="search"
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
              }}
              onFocus={openPanel}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitSearchNow();
                }
              }}
              placeholder={
                activeFilterChips.length > 0
                  ? t('admin.products.searchWithFiltersPlaceholder')
                  : t('admin.products.searchPlaceholder')
              }
              autoComplete="off"
              className="min-w-[7rem] flex-1 border-0 bg-transparent py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              aria-label={t('admin.products.searchLabel')}
              aria-expanded={panelOpen}
              aria-controls={FILTER_PANEL_ID}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (hasAnythingToClear) {
                handleClearAll();
                return;
              }
              togglePanel();
            }}
            className={`relative mr-2 flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors sm:mr-3 ${
              hasAnythingToClear
                ? 'bg-red-500 text-white hover:bg-red-600'
                : panelOpen
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
            aria-label={
              hasAnythingToClear ? t('admin.products.clearAll') : t('admin.products.openFilters')
            }
            aria-expanded={panelOpen}
            aria-controls={FILTER_PANEL_ID}
          >
            {hasAnythingToClear ? (
              <Trash2 className="h-4 w-4" aria-hidden />
            ) : (
              <ListFilter className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        {panelOpen ? (
          <div
            id={FILTER_PANEL_ID}
            className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 max-h-[min(44rem,85vh)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-300/30"
          >
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">{t('admin.products.filtersTitle')}</p>
                {hasAnythingToClear ? (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                  >
                    {t('admin.products.clearAll')}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-[7fr_3fr] sm:p-5">
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.products.filterByCategory')}
                </label>
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50 shadow-sm shadow-slate-200/40 transition-colors focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-800/10">
                  <div className="border-b border-slate-200/80 bg-white px-3 py-2">
                    <input
                      type="search"
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      placeholder={t('admin.products.categorySearchPlaceholder')}
                      className="w-full border-0 bg-transparent py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      aria-label={t('admin.products.categorySearchPlaceholder')}
                    />
                  </div>
                  <div className="max-h-[min(32rem,55vh)] overflow-y-auto p-2">
                    <ProductCategoryFilterTree
                      categories={categories}
                      categoriesLoading={categoriesLoading}
                      categorySearch={categorySearch}
                      selectedCategories={selectedCategories}
                      onCategoryToggle={handleCategoryToggle}
                    />
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-4">
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
