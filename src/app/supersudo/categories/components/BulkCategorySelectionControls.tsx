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

  if (!hasSelection) {
    return null;
  }

  return (
    <div className="mb-4">
      <Card className="h-full border border-amber-200/80 bg-amber-50/80 p-4 shadow-sm transition-all duration-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium text-amber-900">
            {t('admin.categories.selectedCategoriesCount').replace('{count}', String(selectedCount))}
          </div>
          <Button
            variant="outline"
            onClick={onBulkDelete}
            disabled={deletingBulk}
            className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
          >
            {deletingBulk ? t('admin.common.loading') : t('admin.categories.bulkDeleteSelected')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
