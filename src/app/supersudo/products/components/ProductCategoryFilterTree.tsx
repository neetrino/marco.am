'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import {
  buildCategoryTreeNodes,
  type CategoryTreeNode,
} from '../add/utils/category-tree';
import type { Category } from '../types';

const INDENT_PER_LEVEL_PX = 16;

function nodeTitleMatches(node: CategoryTreeNode, query: string): boolean {
  return node.title.toLowerCase().includes(query);
}

function subtreeHasMatch(node: CategoryTreeNode, query: string): boolean {
  if (nodeTitleMatches(node, query)) {
    return true;
  }
  return node.children.some((child) => subtreeHasMatch(child, query));
}

/** Collect category IDs that must be expanded so search matches stay visible. */
function collectSearchExpandedIds(nodes: CategoryTreeNode[], query: string): Set<string> {
  const expanded = new Set<string>();

  const walk = (node: CategoryTreeNode): boolean => {
    const childMatches = node.children.map((child) => walk(child));
    const hasMatchingChild = childMatches.some(Boolean);
    const selfMatches = nodeTitleMatches(node, query);

    if (hasMatchingChild && node.children.length > 0) {
      expanded.add(node.id);
    }

    return selfMatches || hasMatchingChild;
  };

  nodes.forEach((node) => walk(node));
  return expanded;
}

interface ProductCategoryFilterTreeProps {
  categories: Category[];
  categoriesLoading: boolean;
  categorySearch: string;
  selectedCategories: Set<string>;
  onCategoryToggle: (categoryId: string, checked: boolean) => void;
}

export function ProductCategoryFilterTree({
  categories,
  categoriesLoading,
  categorySearch,
  selectedCategories,
  onCategoryToggle,
}: ProductCategoryFilterTreeProps) {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const treeRoots = useMemo(() => buildCategoryTreeNodes(categories), [categories]);

  const searchQuery = categorySearch.trim().toLowerCase();
  const isSearching = searchQuery.length > 0;

  const searchExpandedIds = useMemo(() => {
    if (!isSearching) {
      return new Set<string>();
    }
    return collectSearchExpandedIds(treeRoots, searchQuery);
  }, [isSearching, searchQuery, treeRoots]);

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

  const renderNode = (node: CategoryTreeNode, depth = 0): ReactNode => {
    if (isSearching && !subtreeHasMatch(node, searchQuery)) {
      return null;
    }

    const hasChildren = node.children.length > 0;
    const expanded = hasChildren && (isSearching ? searchExpandedIds.has(node.id) : isExpanded(node.id));
    const isRoot = depth === 0;

    return (
      <li key={node.id}>
        <div
          className="flex items-center gap-1 rounded-lg py-1.5 transition-colors hover:bg-white"
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
              checked={selectedCategories.has(node.id)}
              onChange={(event) => onCategoryToggle(node.id, event.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            <span
              className={`min-w-0 truncate ${
                isRoot ? 'text-sm font-medium text-slate-800' : 'text-xs text-slate-600'
              }`}
            >
              {node.title}
            </span>
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

  if (categoriesLoading) {
    return (
      <p className="px-2 py-4 text-center text-sm text-slate-500">
        {t('admin.products.loadingCategories')}
      </p>
    );
  }

  if (treeRoots.length === 0) {
    return (
      <p className="px-2 py-4 text-center text-sm text-slate-500">
        {t('admin.products.noCategoriesAvailable')}
      </p>
    );
  }

  const visibleRoots = isSearching
    ? treeRoots.filter((node) => subtreeHasMatch(node, searchQuery))
    : treeRoots;

  if (visibleRoots.length === 0) {
    return (
      <p className="px-2 py-4 text-center text-sm text-slate-500">
        {t('admin.products.noCategoriesFound')}
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {visibleRoots.map((node) => renderNode(node))}
    </ul>
  );
}
