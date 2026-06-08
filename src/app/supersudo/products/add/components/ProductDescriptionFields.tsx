'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductDescriptionEntry } from '../../../../../lib/products/product-description';

interface ProductDescriptionFieldsProps {
  entries: ProductDescriptionEntry[];
  onChange: (entries: ProductDescriptionEntry[]) => void;
}

const EMPTY_ENTRY: ProductDescriptionEntry = { title: '', value: '' };

export function ProductDescriptionFields({ entries, onChange }: ProductDescriptionFieldsProps) {
  const { t } = useTranslation();

  const updateEntry = (index: number, field: keyof ProductDescriptionEntry, value: string): void => {
    onChange(
      entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const addEntry = (): void => {
    onChange([...entries, { ...EMPTY_ENTRY }]);
  };

  const removeEntry = (index: number): void => {
    onChange(entries.filter((_, entryIndex) => entryIndex !== index));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{t('admin.products.add.descriptionFieldsHint')}</p>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">{t('admin.products.add.descriptionFieldsEmpty')}</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={`description-entry-${index}`}
              className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-start"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('admin.products.add.descriptionFieldTitle')}
                </label>
                <Input
                  type="text"
                  value={entry.title}
                  onChange={(event) => updateEntry(index, 'title', event.target.value)}
                  placeholder={t('admin.products.add.descriptionFieldTitlePlaceholder')}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('admin.products.add.descriptionFieldValue')}
                </label>
                <textarea
                  className="admin-field min-h-[4.5rem] w-full resize-y"
                  rows={2}
                  value={entry.value}
                  onChange={(event) => updateEntry(index, 'value', event.target.value)}
                  placeholder={t('admin.products.add.descriptionFieldValuePlaceholder')}
                />
              </div>
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-red-200 px-3 text-sm text-red-600 transition hover:bg-red-50 sm:mt-6"
                aria-label={t('admin.products.add.removeDescriptionRow')}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sm:hidden">{t('admin.products.add.remove')}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addEntry}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <Plus className="h-4 w-4" />
        {t('admin.products.add.addDescriptionRow')}
      </button>
    </div>
  );
}
