'use client';

import type { DragEvent } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../../../lib/utils/image-utils';
import type { AdminCategoryView } from '../utils';
import type { Category, CategoryWithLevel } from '../types';

interface CategoryItemProps {
  category: CategoryWithLevel;
  parentCategory: Category | null;
  categoryTitle: string;
  parentCategoryTitle: string;
  viewMode: AdminCategoryView;
  subcategoryCount?: number;
  productCount?: number;
  selected: boolean;
  moving: boolean;
  converting: boolean;
  dragging: boolean;
  dragOver: boolean;
  onToggleSelect: (categoryId: string, checked: boolean) => void;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string, categoryTitle: string) => void;
  onToggleHeaderVisibility: (category: Category, nextVisible: boolean) => void;
  onToggleCategoryKind: (category: Category) => Promise<void>;
  onReorder: (categoryId: string, targetCategoryId: string, scope: AdminCategoryView) => Promise<void>;
  onDragStart: (categoryId: string) => void;
  onDragEnter: (categoryId: string | null) => void;
  onDragEnd: () => void;
  hasExpandableChildren?: boolean;
  expanded?: boolean;
  onToggleExpand?: (categoryId: string) => void;
}

export function CategoryItem({
  category,
  parentCategory: _parentCategory,
  categoryTitle,
  parentCategoryTitle,
  viewMode,
  subcategoryCount = 0,
  productCount = 0,
  selected,
  moving,
  converting,
  dragging,
  dragOver,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleHeaderVisibility,
  onToggleCategoryKind,
  onReorder,
  onDragStart,
  onDragEnter,
  onDragEnd,
  hasExpandableChildren = false,
  expanded = false,
  onToggleExpand,
}: CategoryItemProps) {
  const { t } = useTranslation();
  const safeCategoryImage = toSafeImgAttributeSrc(category.media?.[0] ?? null);
  const isRootView = viewMode === 'roots';

  const handleDragStart = (event: DragEvent<HTMLTableRowElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', category.id);
    onDragStart(category.id);
  };

  const handleDrop = async (event: DragEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === category.id) {
      onDragEnd();
      return;
    }
    await onReorder(sourceId, category.id, viewMode);
  };

  return (
    <tr
      draggable
      onDragStart={handleDragStart}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={() => onDragEnter(category.id)}
      onDragLeave={() => {
        if (dragOver) {
          onDragEnter(null);
        }
      }}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      className={`group border-b border-slate-100 transition-colors hover:bg-amber-50/50 ${
        dragOver ? 'bg-amber-100/70' : ''
      } ${dragging ? 'opacity-60' : ''}`}
    >
      <td className="px-2 py-3">
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
      </td>
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onToggleSelect(category.id, event.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-amber-500 focus:ring-amber-400"
          aria-label={t('admin.categories.selectItem').replace('{name}', categoryTitle)}
        />
      </td>
      <td className="px-2 py-2 align-middle">
        {safeCategoryImage ? (
          <img
            src={toDomSafeImgSrcString(safeCategoryImage)}
            alt=""
            className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-cover"
          />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-400"
            aria-hidden
          >
            —
          </div>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="min-w-0">
          {hasExpandableChildren && onToggleExpand ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-colors hover:text-amber-900"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleExpand(category.id);
              }}
              aria-expanded={expanded}
              aria-controls={`category-subtree-${category.id}`}
            >
              <svg
                className={`h-4 w-4 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
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
              {categoryTitle}
            </button>
          ) : (
            <span className="block text-sm font-semibold text-slate-900 group-hover:text-amber-900">
              {categoryTitle}
            </span>
          )}
          <p className="mt-1 truncate text-xs text-slate-500">{category.slug}</p>
        </div>
      </td>
      {isRootView ? (
        <td className="px-3 py-3">
          <span
            className="inline-flex min-w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-900"
            title={t('admin.categories.tableSubcategoryCount')}
          >
            {subcategoryCount > 0
              ? subcategoryCount
              : t('admin.categories.noSubcategoriesShort')}
          </span>
        </td>
      ) : (
        <td className="px-3 py-3 text-sm text-slate-600">
          {parentCategoryTitle || t('admin.categories.noParent')}
        </td>
      )}
      <td className="px-3 py-3">
        <span
          className="inline-flex min-w-10 items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700"
          title={t('admin.categories.tableProductCount')}
        >
          {productCount}
        </span>
      </td>
      <td className="px-2 py-3">
        <div className="grid grid-cols-5 justify-items-center gap-1">
          <button
            type="button"
            onClick={() => void onToggleCategoryKind(category)}
            disabled={moving}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
              category.parentId
                ? 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100'
                : 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100'
            }`}
            aria-label={
              category.parentId
                ? t('admin.categories.convertToMainCategory')
                : t('admin.categories.convertToSubcategory')
            }
            title={
              category.parentId
                ? t('admin.categories.convertToMainCategory')
                : t('admin.categories.convertToSubcategory')
            }
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              {category.parentId ? (
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
          </button>
          <button
            type="button"
            onClick={() => onToggleHeaderVisibility(category, !category.showInHeader)}
            disabled={moving || converting}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
              category.showInHeader
                ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
            }`}
            aria-label={
              category.showInHeader
                ? t('admin.categories.hideFromHeaderSidebar')
                : t('admin.categories.showInHeaderSidebar')
            }
            title={
              category.showInHeader
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
            onClick={() => onEdit(category)}
            disabled={moving || converting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
            aria-label={t('admin.common.edit')}
            title={t('admin.common.edit')}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.9 8.9a1 1 0 01-.42.26l-3 1a1 1 0 01-1.265-1.265l1-3a1 1 0 01.26-.42l8.9-8.9zM12.172 5 5 12.172V14h1.828L14 6.828 12.172 5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(category.id, categoryTitle)}
            disabled={moving || converting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600 transition-colors hover:border-red-200 hover:bg-red-100 hover:text-red-700"
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
      </td>
    </tr>
  );
}
