'use client';

import { useEffect, useState } from 'react';
import { Button } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';

interface CategoriesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function buildPaginationItems(current: number, total: number): readonly (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', total];
  }
  if (current >= total - 3) {
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

export function CategoriesPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: CategoriesPaginationProps) {
  const { t } = useTranslation();
  const [goInput, setGoInput] = useState(String(currentPage));

  useEffect(() => {
    setGoInput(String(currentPage));
  }, [currentPage]);

  if (totalPages <= 1) {
    return null;
  }

  const pageItems = buildPaginationItems(currentPage, totalPages);

  const applyGo = () => {
    const parsed = Number.parseInt(goInput.trim(), 10);
    if (!Number.isFinite(parsed)) {
      setGoInput(String(currentPage));
      return;
    }
    const clamped = Math.min(totalPages, Math.max(1, parsed));
    onPageChange(clamped);
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm sm:p-5">
      <p className="mb-4 text-center text-sm font-medium text-slate-700 sm:mb-3 sm:text-left">
        {t('admin.categories.showingPage')
          .replace('{page}', currentPage.toString())
          .replace('{totalPages}', totalPages.toString())
          .replace('{total}', totalItems.toString())}
      </p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div
          className="flex flex-wrap items-center justify-center gap-2 sm:justify-start"
          role="navigation"
          aria-label={t('admin.categories.paginationRegionAria')}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="min-h-10 min-w-[5.5rem] shrink-0 border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
          >
            {t('admin.categories.previous')}
          </Button>

          {pageItems.map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`e-${index}`}
                className="select-none px-1 text-base font-semibold text-slate-400"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={t('admin.categories.pageNumberAria').replace('{n}', String(item))}
                aria-current={item === currentPage ? 'page' : undefined}
                className={`min-h-10 min-w-10 rounded-lg border text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 ${
                  item === currentPage
                    ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {item}
              </button>
            ),
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="min-h-10 min-w-[5.5rem] shrink-0 border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
          >
            {t('admin.categories.next')}
          </Button>
        </div>

        <form
          className="flex flex-wrap items-end justify-center gap-2 sm:justify-end"
          onSubmit={(e) => {
            e.preventDefault();
            applyGo();
          }}
        >
          <div className="flex min-w-[8rem] flex-col gap-1">
            <label htmlFor="categories-pagination-go" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('admin.categories.goToPageLabel')}
            </label>
            <input
              id="categories-pagination-go"
              type="number"
              inputMode="numeric"
              min={1}
              max={totalPages}
              value={goInput}
              onChange={(e) => setGoInput(e.target.value)}
              placeholder={t('admin.categories.goToPagePlaceholder')}
              aria-label={t('admin.categories.goToPageAria')}
              className="admin-field h-10 w-24 rounded-lg border-2 border-slate-200 bg-white text-center text-sm font-medium tabular-nums shadow-sm focus:border-amber-500 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.2)]"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="min-h-10 shrink-0 px-4 shadow-sm"
            aria-label={t('admin.categories.goToPageAria')}
          >
            {t('admin.categories.goToPageButton')}
          </Button>
        </form>
      </div>
    </div>
  );
}
