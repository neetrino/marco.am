'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import { getStoredLanguage } from '../../../../lib/language';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../../../lib/utils/image-utils';
import {
  countDirectSubcategories,
  filterCategoriesForAdminView,
  sortSubcategoriesForAdmin,
  getLocalizedCategoryTitle,
  type AdminCategoryView,
} from '../utils';
import { CategoryItem } from './CategoryItem';
import { AdminTablePagination } from '../../components/AdminTablePagination';
import type { Category, CategoryWithLevel } from '../types';

interface CategoriesListProps {
  categories: Category[];
  /** Full list for resolving parent titles when `categories` is filtered. Defaults to `categories`. */
  categoryLookupList?: Category[];
  viewMode: AdminCategoryView;
  /** When non-empty and list is empty, show “no search results” instead of “no categories”. */
  searchQuery?: string;
  selectedCategoryIds: string[];
  onToggleSelect: (categoryId: string, checked: boolean) => void;
  onTogglePageSelection: (categoryIds: string[], checked: boolean) => void;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string, categoryTitle: string) => void;
  onToggleHeaderVisibility: (category: Category, nextVisible: boolean) => void;
  onToggleCategoryKind: (category: Category) => Promise<void>;
  onReorder: (categoryId: string, targetCategoryId: string, scope: AdminCategoryView) => Promise<void>;
  movingCategoryId: string | null;
  convertingCategoryId: string | null;
  draggingCategoryId: string | null;
  dragOverCategoryId: string | null;
  onDragStart: (categoryId: string) => void;
  onDragEnter: (categoryId: string | null) => void;
  onDragEnd: () => void;
}

const ITEMS_PER_PAGE = 20;

export function CategoriesList({
  categories,
  categoryLookupList,
  viewMode,
  searchQuery = '',
  selectedCategoryIds,
  onToggleSelect,
  onTogglePageSelection,
  onEdit,
  onDelete,
  onToggleHeaderVisibility,
  onToggleCategoryKind,
  onReorder,
  movingCategoryId,
  convertingCategoryId,
  draggingCategoryId,
  dragOverCategoryId,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: CategoriesListProps) {
  const { t, lang } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const lookup = categoryLookupList ?? categories;
  const activeLocale = lang ?? getStoredLanguage();

  const viewCategories = useMemo((): CategoryWithLevel[] => {
    const scoped = filterCategoriesForAdminView(categories, viewMode);
    const sorted =
      viewMode === 'subcategories' ? sortSubcategoriesForAdmin(scoped, lookup, activeLocale) : scoped;
    return sorted.map((category) => ({ ...category, level: viewMode === 'roots' ? 0 : 1 }));
  }, [activeLocale, categories, lookup, viewMode]);

  const totalPages = Math.ceil(viewCategories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = viewCategories.slice(startIndex, endIndex);
  const selectedOnPage = paginatedCategories.filter((category) =>
    selectedCategoryIds.includes(category.id)
  ).length;
  const allOnPageSelected = paginatedCategories.length > 0 && selectedOnPage === paginatedCategories.length;
  const isRootView = viewMode === 'roots';
  const categoryOrderById = useMemo(() => {
    const order = new Map<string, number>();
    lookup.forEach((category, index) => {
      order.set(category.id, index);
    });
    return order;
  }, [lookup]);
  const childrenByParentId = useMemo(() => {
    const map = new Map<string, Category[]>();
    lookup.forEach((category) => {
      if (!category.parentId) {
        return;
      }
      const existing = map.get(category.parentId) ?? [];
      existing.push(category);
      map.set(category.parentId, existing);
    });

    map.forEach((items, key) => {
      map.set(
        key,
        [...items].sort(
          (a, b) => (categoryOrderById.get(a.id) ?? 0) - (categoryOrderById.get(b.id) ?? 0),
        ),
      );
    });

    return map;
  }, [categoryOrderById, lookup]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categories.length, searchQuery, viewMode]);

  useEffect(() => {
    setExpandedCategoryIds([]);
  }, [searchQuery, viewMode]);

  const toggleExpandedCategory = (categoryId: string) => {
    setExpandedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  };

  const renderSubcategoryImage = (category: Category) => {
    const safeImageSrc = toSafeImgAttributeSrc(category.media?.[0] ?? null);
    if (safeImageSrc) {
      return (
        <img
          src={toDomSafeImgSrcString(safeImageSrc)}
          alt=""
          className="h-10 w-10 rounded-md border border-slate-200 bg-white object-cover"
        />
      );
    }

    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-400"
        aria-hidden
      >
        —
      </div>
    );
  };

  const renderNestedChildren = (
    parentId: string,
    level: number,
    visited: Set<string>,
  ): JSX.Element | null => {
    const childCategories = childrenByParentId.get(parentId) ?? [];
    if (childCategories.length === 0) {
      return null;
    }

    return (
      <div className={level > 0 ? 'mt-2 ml-4 border-l border-amber-200 pl-3' : 'space-y-2'}>
        {childCategories.map((child) => {
          if (visited.has(child.id)) {
            return null;
          }
          const nextVisited = new Set(visited);
          nextVisited.add(child.id);
          const nestedChildren = childrenByParentId.get(child.id) ?? [];
          const nestedSubcategoryCount = nestedChildren.length;
          const childExpanded = expandedCategoryIds.includes(child.id);
          const isNestedDragging = draggingCategoryId === child.id;
          const isNestedDragOver = dragOverCategoryId === child.id;

          return (
            <div
              key={child.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', child.id);
                onDragStart(child.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => onDragEnter(child.id)}
              onDragLeave={() => {
                if (isNestedDragOver) {
                  onDragEnter(null);
                }
              }}
              onDrop={async (event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData('text/plain');
                if (!sourceId || sourceId === child.id) {
                  onDragEnd();
                  return;
                }
                await onReorder(sourceId, child.id, 'subcategories');
              }}
              onDragEnd={onDragEnd}
              className={`rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 transition-colors ${
                isNestedDragOver ? 'bg-amber-100/70' : ''
              } ${isNestedDragging ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-700 active:cursor-grabbing"
                    title={t('admin.categories.dragToReorder')}
                    aria-label={t('admin.categories.dragToReorder')}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <circle cx="6" cy="5" r="1.4" />
                      <circle cx="6" cy="10" r="1.4" />
                      <circle cx="6" cy="15" r="1.4" />
                      <circle cx="12" cy="5" r="1.4" />
                      <circle cx="12" cy="10" r="1.4" />
                      <circle cx="12" cy="15" r="1.4" />
                    </svg>
                  </button>
                  <div className="shrink-0">{renderSubcategoryImage(child)}</div>
                  <div className="min-w-0">
                    {nestedChildren.length > 0 ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-left text-sm font-semibold text-slate-900 transition-colors hover:text-amber-900"
                        onClick={() => toggleExpandedCategory(child.id)}
                        aria-expanded={childExpanded}
                        aria-controls={`nested-category-${child.id}`}
                      >
                        <svg
                          className={`h-3.5 w-3.5 text-slate-500 transition-transform ${childExpanded ? 'rotate-90' : ''}`}
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
                        {getLocalizedCategoryTitle(child, activeLocale)}
                      </button>
                    ) : (
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {getLocalizedCategoryTitle(child, activeLocale)}
                      </p>
                    )}
                    <p className="mt-1 truncate text-xs text-slate-500">{child.slug}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-center px-2">
                  <span
                    className="inline-flex min-w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-900"
                    title={t('admin.categories.tableSubcategoryCount')}
                  >
                    {nestedSubcategoryCount > 0
                      ? nestedSubcategoryCount
                      : t('admin.categories.noSubcategoriesShort')}
                  </span>
                </div>
                <div className="flex shrink-0 items-center justify-center px-2">
                  <span
                    className="inline-flex min-w-10 items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700"
                    title={t('admin.categories.tableProductCount')}
                  >
                    {child.productCount ?? 0}
                  </span>
                </div>
                <div className="grid shrink-0 grid-cols-5 justify-items-center gap-1">
                  <button
                    type="button"
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                      child.parentId
                        ? 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100'
                        : 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100'
                    } ${
                      convertingCategoryId === child.id ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                    onClick={() => void onToggleCategoryKind(child)}
                    disabled={convertingCategoryId === child.id}
                    aria-label={
                      child.parentId
                        ? t('admin.categories.convertToMainCategory')
                        : t('admin.categories.convertToSubcategory')
                    }
                    title={
                      child.parentId
                        ? t('admin.categories.convertToMainCategory')
                        : t('admin.categories.convertToSubcategory')
                    }
                  >
                    {convertingCategoryId === child.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        {child.parentId ? (
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 11.586V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M10 17a1 1 0 01-1-1V8.414L6.707 10.707a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 11-1.414 1.414L11 8.414V16a1 1 0 01-1 1z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                      child.showInHeader
                        ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                    }`}
                    onClick={() => onToggleHeaderVisibility(child, !child.showInHeader)}
                    aria-label={
                      child.showInHeader
                        ? t('admin.categories.hideFromHeaderSidebar')
                        : t('admin.categories.showInHeaderSidebar')
                    }
                    title={
                      child.showInHeader
                        ? t('admin.categories.hideFromHeaderSidebar')
                        : t('admin.categories.showInHeaderSidebar')
                    }
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.044 3.214a1 1 0 00.95.69h3.38c.969 0 1.371 1.24.588 1.81l-2.736 1.988a1 1 0 00-.364 1.118l1.045 3.214c.3.921-.755 1.688-1.539 1.118l-2.737-1.988a1 1 0 00-1.175 0l-2.737 1.988c-.783.57-1.838-.197-1.539-1.118l1.045-3.214a1 1 0 00-.364-1.118L2.087 8.64c-.783-.57-.38-1.81.588-1.81h3.38a1 1 0 00.95-.69l1.044-3.214z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                    onClick={() => onEdit(child)}
                    aria-label={t('admin.common.edit')}
                    title={t('admin.common.edit')}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.9 8.9a1 1 0 01-.42.26l-3 1a1 1 0 01-1.265-1.265l1-3a1 1 0 01.26-.42l8.9-8.9zM12.172 5 5 12.172V14h1.828L14 6.828 12.172 5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600 transition-colors hover:border-red-200 hover:bg-red-100 hover:text-red-700"
                    onClick={() => onDelete(child.id, getLocalizedCategoryTitle(child, activeLocale))}
                    aria-label={t('admin.common.delete')}
                    title={t('admin.common.delete')}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M8.5 2a1 1 0 00-1 1V4H5a1 1 0 000 2h.293l.853 9.386A2 2 0 008.138 17h3.724a2 2 0 001.992-1.614L14.707 6H15a1 1 0 100-2h-2.5V3a1 1 0 00-1-1h-3zm2 2V4h-1V4h1zm-2.36 3a1 1 0 10-1.992.18l.5 5.5a1 1 0 101.992-.18l-.5-5.5zm5.212.18a1 1 0 10-1.992-.18l-.5 5.5a1 1 0 101.992.18l.5-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {childExpanded ? (
                <div id={`nested-category-${child.id}`} className="mt-2">
                  {renderNestedChildren(child.id, level + 1, nextVisited)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  if (viewCategories.length === 0) {
    const emptyMessage =
      searchQuery.trim().length > 0
        ? t('admin.categories.noSearchResults')
        : isRootView
          ? t('admin.categories.noRootCategories')
          : t('admin.categories.noSubcategories');
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center">
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div
        id={isRootView ? 'admin-categories-panel-roots' : 'admin-categories-panel-subcategories'}
        role="tabpanel"
        aria-labelledby={isRootView ? 'admin-categories-tab-roots' : 'admin-categories-tab-subcategories'}
        className="overflow-hidden rounded-xl border border-slate-200"
      >
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-slate-200 bg-white">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[4%]" />
              <col className="w-[6%]" />
              <col className="w-[42%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="bg-slate-50/90">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" />
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={(event) =>
                      onTogglePageSelection(
                        paginatedCategories.map((category) => category.id),
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    aria-label={t('admin.categories.selectPage')}
                  />
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-slate-500">
                  {t('admin.categories.tableImage')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-slate-500">
                  {t('admin.categories.tableTitle')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-slate-500">
                  {isRootView ? t('admin.categories.tableSubcategoryCount') : t('admin.categories.tableParent')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-slate-500">
                  {t('admin.categories.tableProductCount')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-slate-500">
                  {t('admin.categories.tableActions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCategories.flatMap((category) => {
                const parentCategory = category.parentId
                  ? lookup.find((item) => item.id === category.parentId)
                  : null;
                const childCategories = isRootView ? childrenByParentId.get(category.id) ?? [] : [];
                const isExpanded = isRootView && expandedCategoryIds.includes(category.id);

                const rows = [
                  <CategoryItem
                    key={category.id}
                    category={category}
                    parentCategory={parentCategory || null}
                    viewMode={viewMode}
                    subcategoryCount={countDirectSubcategories(lookup, category.id)}
                    selected={selectedCategoryIds.includes(category.id)}
                    onToggleSelect={onToggleSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleHeaderVisibility={onToggleHeaderVisibility}
                    onToggleCategoryKind={onToggleCategoryKind}
                    categoryTitle={getLocalizedCategoryTitle(category, activeLocale)}
                    parentCategoryTitle={getLocalizedCategoryTitle(parentCategory, activeLocale)}
                    productCount={category.productCount ?? 0}
                    onReorder={onReorder}
                    moving={movingCategoryId === category.id}
                    converting={convertingCategoryId === category.id}
                    dragging={draggingCategoryId === category.id}
                    dragOver={dragOverCategoryId === category.id}
                    onDragStart={onDragStart}
                    onDragEnter={onDragEnter}
                    onDragEnd={onDragEnd}
                    hasExpandableChildren={isRootView && childCategories.length > 0}
                    expanded={isExpanded}
                    onToggleExpand={toggleExpandedCategory}
                  />,
                ];

                if (isRootView && isExpanded && childCategories.length > 0) {
                  rows.push(
                    <tr key={`${category.id}-children`} id={`category-subtree-${category.id}`}>
                      <td colSpan={7} className="bg-gradient-to-r from-amber-50/70 to-slate-50 px-4 py-3">
                        <div className="rounded-xl border border-amber-200/70 bg-white/90 p-3 shadow-sm">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                            {t('admin.categories.subcategories')}
                          </div>
                          {renderNestedChildren(category.id, 0, new Set([category.id]))}
                        </div>
                      </td>
                    </tr>,
                  );
                }

                return rows;
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AdminTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={viewCategories.length}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
