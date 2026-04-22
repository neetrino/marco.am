'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Button } from '@shop/ui';

interface OrdersPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function OrdersPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: OrdersPaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="text-sm font-medium text-slate-700">
        {t('admin.orders.showingPage')
          .replace('{page}', page.toString())
          .replace('{totalPages}', totalPages.toString())
          .replace('{total}', total.toString())}
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:border-slate-100 disabled:bg-slate-50"
        >
          {t('admin.orders.previous')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:border-slate-100 disabled:bg-slate-50"
        >
          {t('admin.orders.next')}
        </Button>
      </div>
    </div>
  );
}

