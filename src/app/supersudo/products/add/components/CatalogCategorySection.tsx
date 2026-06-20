'use client';

import { useCallback, useMemo, useState } from 'react';
import { Search, Star, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-client';
import { getStoredLanguage } from '@/lib/language';
import type { Category, Variant } from '../types';
import { applyProductCategorySelectionChange } from '../utils/productCategorySelection';
import { buildFlatCategoryTree } from '../utils/category-tree';

type CategoryLocale = 'hy' | 'en' | 'ru';

const FIELD_CLASS =
  'admin-field w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-marco-yellow focus:outline-none focus:ring-2 focus:ring-marco-yellow/30';

function normalizeCategoryLocale(locale: string): CategoryLocale {
  if (locale === 'hy' || locale === 'en' || locale === 'ru') {
    return locale;
  }
  return 'en';
}

interface CatalogCategorySectionProps {
  categories: Category[];
  categoryIds: string[];
  primaryCategoryId: string;
  onCategoryIdsChange: (ids: string[]) => void;
  onPrimaryCategoryIdChange: (id: string) => void;
  isClothingCategory: () => boolean;
  onVariantsUpdate?: (updater: (prev: Variant[]) => Variant[]) => void;
}

export function CatalogCategorySection({
  categories,
  categoryIds,
  primaryCategoryId,
  onCategoryIdsChange,
  onPrimaryCategoryIdChange,
  isClothingCategory,
  onVariantsUpdate,
}: CatalogCategorySectionProps) {
  const { t, lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedLocale = normalizeCategoryLocale(lang ?? getStoredLanguage());

  const getCategoryLabel = useCallback((category: Category): string => {
    const localizedTitle = category.translations?.[normalizedLocale];
    if (typeof localizedTitle === 'string' && localizedTitle.trim().length > 0) {
      return localizedTitle.trim();
    }
    return category.title;
  }, [normalizedLocale]);

  const displayCategories = useMemo(() => buildFlatCategoryTree(categories), [categories]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return displayCategories;
    }
    return displayCategories.filter((category) =>
      getCategoryLabel(category).toLowerCase().includes(query),
    );
  }, [displayCategories, searchQuery, getCategoryLabel]);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategoryIds = applyProductCategorySelectionChange(
      categoryIds,
      categoryId,
      checked,
      categories,
    );

    let newPrimaryCategoryId = primaryCategoryId;
    if (checked) {
      if (!primaryCategoryId || !newCategoryIds.includes(primaryCategoryId)) {
        newPrimaryCategoryId = categoryId;
      }
    } else if (primaryCategoryId === categoryId) {
      newPrimaryCategoryId = newCategoryIds[0] ?? '';
    }

    const selectedCategory = categories.find((cat) => cat.id === categoryId);
    const newIsSizeRequired = selectedCategory?.requiresSizes ?? false;

    onCategoryIdsChange(newCategoryIds);
    onPrimaryCategoryIdChange(newPrimaryCategoryId);

    if (onVariantsUpdate) {
      const wasSizeRequired = isClothingCategory();
      if (wasSizeRequired && !newIsSizeRequired && newCategoryIds.length === 0) {
        onVariantsUpdate((prev) =>
          prev.map((v) => ({
            ...v,
            sizes: [],
            sizeStocks: {},
            size: '',
          })),
        );
      }
    }
  };

  const selectedCategories = categoryIds
    .map((id) => categories.find((cat) => cat.id === id))
    .filter((cat): cat is Category => Boolean(cat));

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200/70 px-4 py-4 sm:px-5 sm:py-5">
        <h3 className="text-sm font-semibold text-marco-black">{t('admin.products.add.categories')}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {t('admin.products.add.catalogCategoriesHint')}
        </p>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('admin.products.add.catalogSearchCategories')}
            className={`${FIELD_CLASS} !pl-10`}
          />
        </div>

        {selectedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => {
              const isPrimary = primaryCategoryId === category.id;
              return (
                <span
                  key={category.id}
                  className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    isPrimary
                      ? 'border-marco-yellow/70 bg-marco-yellow/15 text-marco-black'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {isPrimary ? (
                    <Star className="h-3 w-3 shrink-0 fill-marco-yellow text-marco-yellow" aria-hidden />
                  ) : null}
                  <span className="truncate">{getCategoryLabel(category)}</span>
                  {!isPrimary ? (
                    <button
                      type="button"
                      onClick={() => onPrimaryCategoryIdChange(category.id)}
                      className="shrink-0 text-slate-400 transition-colors hover:text-marco-black"
                      title={t('admin.products.add.setPrimaryCategory')}
                    >
                      <Star className="h-3 w-3" aria-hidden />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleCategoryChange(category.id, false)}
                    className="shrink-0 text-slate-400 transition-colors hover:text-red-600"
                    aria-label={t('admin.products.add.removeCategoryChip')}
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2">
          {filteredCategories.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">
              {t('admin.products.add.catalogNoCategoriesFound')}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredCategories.map((category) => {
                const isPrimary = primaryCategoryId === category.id;
                return (
                  <li key={category.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white ${category.depthClass}`}
                    >
                      <input
                        type="checkbox"
                        checked={categoryIds.includes(category.id)}
                        onChange={(event) =>
                          handleCategoryChange(category.id, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-marco-black focus:ring-marco-yellow/40"
                      />
                      <span
                        className={`min-w-0 flex-1 ${
                          category.isSubcategory
                            ? 'text-xs text-slate-600'
                            : 'text-sm font-medium text-marco-black'
                        }`}
                      >
                        {getCategoryLabel(category)}
                      </span>
                      {isPrimary ? (
                        <span className="shrink-0 rounded-full bg-marco-yellow/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-marco-black">
                          {t('admin.products.add.primaryCategory')}
                        </span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
