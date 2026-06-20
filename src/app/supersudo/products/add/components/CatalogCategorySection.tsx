'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search, Star, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-client';
import { getStoredLanguage } from '@/lib/language';
import type { Category, Variant } from '../types';
import { applyProductCategorySelectionChange } from '../utils/productCategorySelection';
import {
  buildCategoryTreeNodes,
  categorySubtreeHasMatch,
  collectCategorySearchExpandedIds,
  INDENT_PER_LEVEL_PX,
  type CategoryTreeNode,
} from '../utils/category-tree';

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const normalizedLocale = normalizeCategoryLocale(lang ?? getStoredLanguage());

  const getCategoryLabel = useCallback((category: Category): string => {
    const localizedTitle = category.translations?.[normalizedLocale];
    if (typeof localizedTitle === 'string' && localizedTitle.trim().length > 0) {
      return localizedTitle.trim();
    }
    return category.title;
  }, [normalizedLocale]);

  const treeRoots = useMemo(() => buildCategoryTreeNodes(categories), [categories]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;

  const searchExpandedIds = useMemo(() => {
    if (!isSearching) {
      return new Set<string>();
    }
    return collectCategorySearchExpandedIds(treeRoots, normalizedSearch, getCategoryLabel);
  }, [isSearching, normalizedSearch, treeRoots, getCategoryLabel]);

  useEffect(() => {
    if (!isSearching) {
      setExpandedIds(new Set());
    }
  }, [isSearching]);

  const toggleExpanded = (categoryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const isExpanded = (categoryId: string): boolean => {
    if (isSearching) {
      return searchExpandedIds.has(categoryId);
    }
    return expandedIds.has(categoryId);
  };

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

  const renderNode = (node: CategoryTreeNode, depth = 0): ReactNode => {
    if (isSearching && !categorySubtreeHasMatch(node, normalizedSearch, getCategoryLabel)) {
      return null;
    }

    const hasChildren = node.children.length > 0;
    const expanded = hasChildren && isExpanded(node.id);
    const isRoot = depth === 0;
    const isPrimary = primaryCategoryId === node.id;

    return (
      <li key={node.id}>
        <div
          className="flex items-center gap-1 rounded-lg py-1.5 transition-colors hover:bg-slate-50"
          style={{ paddingLeft: `${depth * INDENT_PER_LEVEL_PX}px` }}
        >
          {hasChildren && !isSearching ? (
            <button
              type="button"
              onClick={() => toggleExpanded(node.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? t('admin.products.collapseCategory')
                  : t('admin.products.expandCategory')
              }
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M7.22 4.47a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 11-1.06-1.06L10.94 9.5 7.22 5.78a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : (
            <span className="h-7 w-7 shrink-0" aria-hidden />
          )}

          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-1 py-0.5">
            <input
              type="checkbox"
              checked={categoryIds.includes(node.id)}
              onChange={(event) => handleCategoryChange(node.id, event.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-marco-black focus:ring-marco-yellow/40"
            />
            <span
              className={`min-w-0 truncate ${
                isRoot ? 'text-sm font-medium text-marco-black' : 'text-xs text-slate-600'
              }`}
            >
              {getCategoryLabel(node)}
            </span>
            {isPrimary ? (
              <span className="shrink-0 rounded-full bg-marco-yellow/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-marco-black">
                {t('admin.products.add.primaryCategory')}
              </span>
            ) : null}
          </label>
        </div>

        {hasChildren && expanded ? (
          <ul className="space-y-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  const visibleRoots = isSearching
    ? treeRoots.filter((node) => categorySubtreeHasMatch(node, normalizedSearch, getCategoryLabel))
    : treeRoots;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <h3 className="text-sm font-semibold text-marco-black">{t('admin.products.add.categories')}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {t('admin.products.add.catalogCategoriesHint')}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 pt-4">
        <div className="relative shrink-0">
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
          <div className="flex shrink-0 flex-wrap gap-2">
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

        <div className="min-h-0 flex-1 overflow-y-auto">
          {visibleRoots.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">
              {t('admin.products.add.catalogNoCategoriesFound')}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {visibleRoots.map((node) => renderNode(node))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
