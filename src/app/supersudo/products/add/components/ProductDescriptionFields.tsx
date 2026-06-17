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
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">{t('admin.products.add.descriptionFieldsEmpty')}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-slate-200 bg-white">
              <colgroup>
                <col className="w-[30%]" />
                <col />
                <col className="w-14" />
              </colgroup>
              <thead className="bg-slate-50/90">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t('admin.products.add.descriptionFieldTitle')}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t('admin.products.add.descriptionFieldValue')}
                  </th>
                  <th scope="col" className="px-2 py-2.5">
                    <span className="sr-only">{t('admin.products.add.removeDescriptionRow')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry, index) => (
                  <tr key={`description-entry-${index}`} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3 align-top">
                      <label className="sr-only" htmlFor={`description-title-${index}`}>
                        {t('admin.products.add.descriptionFieldTitle')}
                      </label>
                      <Input
                        id={`description-title-${index}`}
                        type="text"
                        value={entry.title}
                        onChange={(event) => updateEntry(index, 'title', event.target.value)}
                        placeholder={t('admin.products.add.descriptionFieldTitlePlaceholder')}
                        className="border-slate-200 bg-white shadow-sm"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <label className="sr-only" htmlFor={`description-value-${index}`}>
                        {t('admin.products.add.descriptionFieldValue')}
                      </label>
                      <textarea
                        id={`description-value-${index}`}
                        className="admin-field min-h-[2.75rem] w-full resize-y border-slate-200 bg-white shadow-sm"
                        rows={2}
                        value={entry.value}
                        onChange={(event) => updateEntry(index, 'value', event.target.value)}
                        placeholder={t('admin.products.add.descriptionFieldValuePlaceholder')}
                      />
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <button
                        type="button"
                        onClick={() => removeEntry(index)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:border-red-300 hover:bg-red-50"
                        aria-label={t('admin.products.add.removeDescriptionRow')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
