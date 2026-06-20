'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductDescriptionEntry } from '../../../../../lib/products/product-description';

interface ProductDescriptionFieldsProps {
  entries: ProductDescriptionEntry[];
  onChange: (entries: ProductDescriptionEntry[]) => void;
}

const FIELD_CLASS =
  'admin-field w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-marco-yellow focus:outline-none focus:ring-2 focus:ring-marco-yellow/30';

export function ProductDescriptionFields({ entries, onChange }: ProductDescriptionFieldsProps) {
  const { t } = useTranslation();

  const updateEntry = (index: number, field: keyof ProductDescriptionEntry, value: string): void => {
    onChange(
      entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const removeEntry = (index: number): void => {
    onChange(entries.filter((_, entryIndex) => entryIndex !== index));
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-5 text-center">
        <p className="text-xs text-slate-500">{t('admin.products.add.descriptionFieldsEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed divide-y divide-slate-100">
        <colgroup>
          <col className="w-[32%]" />
          <col />
          <col className="w-10" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200/80">
            <th
              scope="col"
              className="px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              {t('admin.products.add.descriptionFieldTitle')}
            </th>
            <th
              scope="col"
              className="px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              {t('admin.products.add.descriptionFieldValue')}
            </th>
            <th scope="col" className="px-1 py-1.5">
              <span className="sr-only">{t('admin.products.add.removeDescriptionRow')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry, index) => (
            <tr key={`description-entry-${index}`} className="transition-colors hover:bg-slate-50/60">
              <td className="px-3 py-1.5 align-middle">
                <label className="sr-only" htmlFor={`description-title-${index}`}>
                  {t('admin.products.add.descriptionFieldTitle')}
                </label>
                <Input
                  id={`description-title-${index}`}
                  type="text"
                  value={entry.title}
                  onChange={(event) => updateEntry(index, 'title', event.target.value)}
                  placeholder={t('admin.products.add.descriptionFieldTitlePlaceholder')}
                  className={FIELD_CLASS}
                />
              </td>
              <td className="px-3 py-1.5 align-middle">
                <label className="sr-only" htmlFor={`description-value-${index}`}>
                  {t('admin.products.add.descriptionFieldValue')}
                </label>
                <textarea
                  id={`description-value-${index}`}
                  className={`${FIELD_CLASS} min-h-[2rem] resize-y`}
                  rows={1}
                  value={entry.value}
                  onChange={(event) => updateEntry(index, 'value', event.target.value)}
                  placeholder={t('admin.products.add.descriptionFieldValuePlaceholder')}
                />
              </td>
              <td className="px-1 py-1.5 align-middle">
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                  aria-label={t('admin.products.add.removeDescriptionRow')}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
