'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { translateAdminCategoryLabel } from '../admin-category-labels';
import type { AdminCategoryView } from '../utils';

type CategoriesViewTabsProps = {
  activeView: AdminCategoryView;
  rootCount: number;
  subcategoryCount: number;
  onViewChange: (view: AdminCategoryView) => void;
};

function tabClass(isActive: boolean): string {
  return isActive
    ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm ring-1 ring-amber-200/80'
    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/60 hover:text-slate-900';
}

export function CategoriesViewTabs({
  activeView,
  rootCount,
  subcategoryCount,
  onViewChange,
}: CategoriesViewTabsProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      role="tablist"
      aria-label={translateAdminCategoryLabel(t, 'admin.categories.viewTabsLabel', 'Category type')}
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'roots'}
          id="admin-categories-tab-roots"
          aria-controls="admin-categories-panel-roots"
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${tabClass(activeView === 'roots')}`}
          onClick={() => onViewChange('roots')}
        >
          {translateAdminCategoryLabel(t, 'admin.categories.tabRootCategories', t('admin.categories.title'))}
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700 ring-1 ring-slate-200/80">
            {rootCount}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'subcategories'}
          id="admin-categories-tab-subcategories"
          aria-controls="admin-categories-panel-subcategories"
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${tabClass(activeView === 'subcategories')}`}
          onClick={() => onViewChange('subcategories')}
        >
          {translateAdminCategoryLabel(t, 'admin.categories.tabSubcategories', t('admin.categories.subcategories'))}
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700 ring-1 ring-slate-200/80">
            {subcategoryCount}
          </span>
        </button>
      </div>
      <p className="text-sm text-slate-500">
        {translateAdminCategoryLabel(
          t,
          'admin.categories.viewTabsHint',
          'Main and subcategories are shown in separate lists',
        )}
      </p>
    </div>
  );
}
