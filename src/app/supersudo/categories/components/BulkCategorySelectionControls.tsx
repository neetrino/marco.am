'use client';

import { Card, Button } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';

interface BulkCategorySelectionControlsProps {
  selectedCount: number;
  deletingBulk: boolean;
  onBulkDelete: () => void;
}

export function BulkCategorySelectionControls({
  selectedCount,
  deletingBulk,
  onBulkDelete,
}: BulkCategorySelectionControlsProps) {
  const { t } = useTranslation();
  const hasSelection = selectedCount > 0;

  return (
    <div className="mb-4 min-h-[72px]">
      <Card
        className={`h-full p-4 transition-all duration-200 ${
          hasSelection
            ? 'border border-amber-200/80 bg-amber-50/80 shadow-sm'
            : 'border border-slate-200 bg-slate-50/70 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`text-sm font-medium ${hasSelection ? 'text-amber-900' : 'text-slate-600'}`}>
            {`Selected categories: ${selectedCount}`}
          </div>
          <Button
            variant="outline"
            onClick={onBulkDelete}
            disabled={deletingBulk || !hasSelection}
            className={`${
              hasSelection
                ? 'border-amber-300 bg-white text-amber-900 hover:bg-amber-100'
                : 'border-slate-200 bg-white text-slate-400'
            }`}
          >
            {deletingBulk ? t('admin.common.loading') : `${t('admin.common.delete')} Selected`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
