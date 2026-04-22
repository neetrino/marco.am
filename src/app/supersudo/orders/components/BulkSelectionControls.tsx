'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card, Button } from '@shop/ui';

interface BulkSelectionControlsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  bulkDeleting: boolean;
}

export function BulkSelectionControls({
  selectedCount,
  onBulkDelete,
  bulkDeleting,
}: BulkSelectionControlsProps) {
  const { t } = useTranslation();
  const hasSelection = selectedCount > 0;

  return (
    <div className="mb-1 min-h-[72px]">
      <Card
        className={`h-full p-4 transition-all duration-200 ${
          hasSelection
            ? 'border border-amber-200/80 bg-amber-50/80 shadow-sm'
            : 'border border-slate-200 bg-slate-50/70 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`text-sm font-medium ${hasSelection ? 'text-amber-900' : 'text-slate-600'}`}>
            {t('admin.orders.selectedOrders').replace('{count}', selectedCount.toString())}
          </div>
          <Button
            variant="outline"
            onClick={onBulkDelete}
            disabled={bulkDeleting || !hasSelection}
            className={`${
              hasSelection
                ? 'border-amber-300 bg-white text-amber-900 hover:bg-amber-100'
                : 'border-slate-200 bg-white text-slate-400'
            }`}
          >
            {bulkDeleting ? t('admin.orders.deleting') : t('admin.orders.deleteSelected')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

