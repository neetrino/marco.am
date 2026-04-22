'use client';

import { Button } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';

interface CategoriesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function CategoriesPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: CategoriesPaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="text-sm font-medium text-slate-700">
        {t('admin.categories.showingPage')
          .replace('{page}', currentPage.toString())
          .replace('{totalPages}', totalPages.toString())
          .replace('{total}', totalItems.toString())}
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:border-slate-100 disabled:bg-slate-50"
        >
          {t('admin.categories.previous')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:border-slate-100 disabled:bg-slate-50"
        >
          {t('admin.categories.next')}
        </Button>
      </div>
    </div>
  );
}




