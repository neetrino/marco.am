'use client';

import { Plus } from 'lucide-react';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductDescriptionEntry } from '../../../../../lib/products/product-description';
import { ProductDescriptionFields } from './ProductDescriptionFields';

interface ProductDescriptionTabProps {
  description: ProductDescriptionEntry[];
  onDescriptionChange: (entries: ProductDescriptionEntry[]) => void;
}

const EMPTY_ENTRY: ProductDescriptionEntry = { title: '', value: '' };

export function ProductDescriptionTab({
  description,
  onDescriptionChange,
}: ProductDescriptionTabProps) {
  const { t } = useTranslation();

  const addEntry = (): void => {
    onDescriptionChange([...description, { ...EMPTY_ENTRY }]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 py-3 lg:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-marco-black">{t('admin.products.add.description')}</h3>
          <p className="mt-0.5 text-xs leading-snug text-slate-500">
            {t('admin.products.add.descriptionFieldsHint')}
          </p>
        </div>
        <button
          type="button"
          onClick={addEntry}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-marco-black transition-colors hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t('admin.products.add.addDescriptionRow')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-5 lg:pb-5">
        <ProductDescriptionFields entries={description} onChange={onDescriptionChange} />
      </div>
    </div>
  );
}
