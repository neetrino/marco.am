'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card, Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { DiscountExpiresPicker } from '@/components/admin/DiscountExpiresPicker';
import type { DiscountMap } from '@/lib/discount/discount-expiry';
import type { Category } from '../../categories/types';
import {
  buildCategoryTreeNodes,
  categorySubtreeHasMatch,
  collectCategorySearchExpandedIds,
  INDENT_PER_LEVEL_PX,
  type CategoryTreeNode,
} from '../../products/add/utils/category-tree';

interface AdminCategory {
  id: string;
  title: string;
  parentId: string | null;
}

interface CategoryDiscountsCardProps {
  fillHeight?: boolean;
  categories: AdminCategory[];
  categoriesLoading: boolean;
  categoryDiscounts: DiscountMap;
  updateCategoryDiscountValue: (categoryId: string, value: string) => void;
  updateCategoryDiscountExpires: (categoryId: string, value: string | null) => void;
  clearCategoryDiscount: (categoryId: string) => void;
  handleCategoryDiscountSave: () => void;
  categorySaving: boolean;
}

function toAdminCategory(category: AdminCategory): Category {
  return {
    id: category.id,
    slug: category.id,
    title: category.title,
    parentId: category.parentId,
  };
}

export function CategoryDiscountsCard({
  fillHeight = false,
  categories,
  categoriesLoading,
  categoryDiscounts,
  updateCategoryDiscountValue,
  updateCategoryDiscountExpires,
  clearCategoryDiscount,
  handleCategoryDiscountSave,
  categorySaving,
}: CategoryDiscountsCardProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const treeRoots = useMemo(
    () => buildCategoryTreeNodes(categories.map(toAdminCategory)),
    [categories],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;

  const searchExpandedIds = useMemo(() => {
    if (!isSearching) {
      return new Set<string>();
    }
    return collectCategorySearchExpandedIds(treeRoots, normalizedSearch);
  }, [isSearching, normalizedSearch, treeRoots]);

  const hasVisibleNodes = useMemo(() => {
    if (!isSearching) {
      return treeRoots.length > 0;
    }
    return treeRoots.some((node) => categorySubtreeHasMatch(node, normalizedSearch));
  }, [isSearching, normalizedSearch, treeRoots]);

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

  const listClassName = fillHeight
    ? 'min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2'
    : 'max-h-[440px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2';

  const renderCategoryNode = (node: CategoryTreeNode, depth: number): ReactNode => {
    if (isSearching && !categorySubtreeHasMatch(node, normalizedSearch)) {
      return null;
    }

    const hasChildren = node.children.length > 0;
    const expanded = hasChildren && isExpanded(node.id);
    const canToggle = hasChildren && !isSearching;
    const currentValue = categoryDiscounts[node.id];
    const isRoot = depth === 0;

    return (
      <div key={node.id}>
        <div
          onClick={canToggle ? () => toggleExpanded(node.id) : undefined}
          className={`mb-2 flex items-center gap-2 rounded-lg border border-transparent bg-white px-3 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 last:mb-0 hover:-translate-y-0.5 hover:border-amber-200 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 hover:shadow-[0_10px_24px_rgba(120,53,15,0.16)] ${
            canToggle ? 'cursor-pointer' : ''
          }`}
          style={{ marginLeft: `${depth * INDENT_PER_LEVEL_PX}px` }}
        >
          {canToggle ? (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-500"
              aria-hidden
            >
              <svg
                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.22 4.47a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 11-1.06-1.06L10.94 9.5 7.22 5.78a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          ) : (
            <span className="h-8 w-8 shrink-0" aria-hidden />
          )}

          <div className="min-w-0 flex-1">
            <p
              className={`truncate ${
                isRoot
                  ? 'text-sm font-semibold text-slate-900'
                  : 'text-xs font-medium text-slate-700'
              }`}
            >
              {node.title || t('admin.discounts.untitledCategory')}
            </p>
          </div>

          <div
            className="flex items-center gap-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={currentValue === undefined ? '' : currentValue.percent}
              onChange={(e) => updateCategoryDiscountValue(node.id, e.target.value)}
              className="w-24 border-slate-300 bg-white"
              placeholder="0"
            />
            <span className="text-sm font-semibold text-slate-700">%</span>
            <DiscountExpiresPicker
              value={currentValue?.expiresAt ?? null}
              onChange={(expiresAt) => updateCategoryDiscountExpires(node.id, expiresAt)}
              disabled={currentValue === undefined}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearCategoryDiscount(node.id)}
              disabled={currentValue === undefined}
              className="text-slate-600 hover:bg-amber-100 hover:text-amber-900"
            >
              {t('admin.discounts.clear')}
            </Button>
          </div>
        </div>

        {hasChildren && expanded
          ? node.children.map((child) => renderCategoryNode(child, depth + 1))
          : null}
      </div>
    );
  };

  const categoryList = (
    <div className={listClassName}>
      {treeRoots.map((node) => renderCategoryNode(node, 0))}
    </div>
  );

  return (
    <Card
      className={`admin-card border-slate-200/80 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.07)] ${
        fillHeight ? 'mb-0 flex min-h-0 flex-1 flex-col' : 'mb-6'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t('admin.discounts.categoryDiscounts')}</h2>
          <p className="text-sm text-slate-600">{t('admin.discounts.categoryDiscountsSubtitle')}</p>
        </div>
        <Button
          variant="primary"
          onClick={handleCategoryDiscountSave}
          disabled={categorySaving || categories.length === 0}
          className="shadow-sm"
        >
          {categorySaving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('admin.discounts.saving')}</span>
            </div>
          ) : (
            t('admin.discounts.save')
          )}
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('admin.categories.searchPlaceholder')}
          className="border-slate-300 bg-white"
        />
        <Button
          variant="ghost"
          onClick={() => setSearchQuery('')}
          disabled={searchQuery.length === 0}
          className="shrink-0 text-slate-700 hover:bg-slate-100"
        >
          {t('admin.discounts.clear')}
        </Button>
      </div>

      {categoriesLoading ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-slate-900"></div>
          <p className="text-slate-600">{t('admin.discounts.loadingCategories')}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-slate-600">
          {t('admin.discounts.noCategories')}
        </div>
      ) : !hasVisibleNodes ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-slate-600">
          {t('admin.categories.noSearchResults')}
        </div>
      ) : fillHeight ? (
        <div className="flex min-h-0 flex-1 flex-col">{categoryList}</div>
      ) : (
        categoryList
      )}
    </Card>
  );
}
