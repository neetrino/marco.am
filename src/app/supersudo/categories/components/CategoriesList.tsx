'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import { buildCategoryTree } from '../utils';
import { CategoryItem } from './CategoryItem';
import { CategoriesPagination } from './CategoriesPagination';
import type { Category, CategoryWithLevel } from '../types';

interface CategoriesListProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleSelect: (categoryId: string, checked: boolean) => void;
  onTogglePageSelection: (categoryIds: string[], checked: boolean) => void;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string, categoryTitle: string) => void;
}

const ITEMS_PER_PAGE = 20;

export function CategoriesList({
  categories,
  selectedCategoryIds,
  onToggleSelect,
  onTogglePageSelection,
  onEdit,
  onDelete,
}: CategoriesListProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  const categoryTree = buildCategoryTree(categories);

  // Pagination calculations
  const totalPages = Math.ceil(categoryTree.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = categoryTree.slice(startIndex, endIndex);
  const selectedOnPage = paginatedCategories.filter((category) =>
    selectedCategoryIds.includes(category.id)
  ).length;
  const allOnPageSelected = paginatedCategories.length > 0 && selectedOnPage === paginatedCategories.length;

  // Reset to page 1 when categories change
  useEffect(() => {
    setCurrentPage(1);
  }, [categories.length]);

  if (categoryTree.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center">
        <p className="text-sm font-medium text-slate-600">{t('admin.categories.noCategories')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed divide-y divide-slate-200 bg-white">
            <colgroup>
              <col className="w-12" />
              <col className="w-[36%]" />
              <col className="w-[24%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="bg-slate-50/90">
              <tr>
                <th className="px-3 py-2 text-left">
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
                    aria-label="Select page categories"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Slug
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Parent
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCategories.map((category: CategoryWithLevel) => {
                const parentCategory = category.parentId
                  ? categories.find((item) => item.id === category.parentId)
                  : null;

                return (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    parentCategory={parentCategory || null}
                    selected={selectedCategoryIds.includes(category.id)}
                    onToggleSelect={onToggleSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CategoriesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={categoryTree.length}
        onPageChange={setCurrentPage}
      />
    </>
  );
}




