'use client';

import { Button, Card } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';

interface BulkSelectionControlsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  bulkDeleting: boolean;
  /** Override outer wrapper (e.g. row layout next to summary bar) */
  wrapperClassName?: string;
}

export function BulkSelectionControls({
  selectedCount,
  onBulkDelete,
  bulkDeleting,
  wrapperClassName,
}: BulkSelectionControlsProps) {
  const { t } = useTranslation();
  const hasSelection = selectedCount > 0;

  return (
    <div className={wrapperClassName ?? 'mb-4 min-h-[72px] flex flex-col'}>
      <Card
        className={`flex h-full min-h-[72px] flex-1 flex-col justify-center p-4 transition-all duration-200 ${
          hasSelection
            ? 'border border-amber-200/80 bg-amber-50/80 shadow-sm'
            : 'border border-slate-200 bg-slate-50/70 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`text-sm font-medium ${hasSelection ? 'text-amber-900' : 'text-slate-600'}`}>
            {t('admin.products.selectedProducts').replace('{count}', selectedCount.toString())}
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
            {bulkDeleting ? t('admin.products.deleting') : t('admin.products.deleteSelected')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

