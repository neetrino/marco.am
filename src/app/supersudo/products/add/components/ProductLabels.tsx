'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductLabel } from '../types';
import { LabelColorField } from './LabelColorField';

interface ProductLabelsProps {
  labels: ProductLabel[];
  onAddLabel: () => void;
  onRemoveLabel: (index: number) => void;
  onUpdateLabel: (index: number, field: keyof ProductLabel, value: ProductLabel[keyof ProductLabel]) => void;
}

const FIELD_CLASS =
  'admin-field w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-marco-yellow focus:outline-none focus:ring-2 focus:ring-marco-yellow/30';

export function ProductLabels({ labels, onAddLabel, onRemoveLabel, onUpdateLabel }: ProductLabelsProps) {
  const { t } = useTranslation();

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 py-3 lg:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-marco-black">{t('admin.products.add.productLabels')}</h3>
          <p className="mt-0.5 text-xs leading-snug text-slate-500">{t('admin.products.add.addLabelsHint')}</p>
        </div>
        <button
          type="button"
          onClick={onAddLabel}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-marco-black transition-colors hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t('admin.products.add.addLabel')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-5 lg:pb-5">
        {labels.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-5 text-center">
            <p className="text-xs text-slate-500">{t('admin.products.add.noLabelsAdded')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {labels.map((label, index) => (
              <article
                key={`product-label-${index}`}
                className="rounded-lg border border-slate-200/80 bg-slate-50/40 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('admin.products.add.label').replace('{index}', String(index + 1))}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onRemoveLabel(index)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                    aria-label={t('admin.products.add.remove')}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      {t('admin.products.add.type')}
                    </label>
                    <select
                      className={FIELD_CLASS}
                      value={label.type}
                      onChange={(event) =>
                        onUpdateLabel(index, 'type', event.target.value as 'text' | 'percentage')
                      }
                      required
                    >
                      <option value="text">{t('admin.products.add.textType')}</option>
                      <option value="percentage">{t('admin.products.add.percentageType')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      {t('admin.products.add.value')}
                    </label>
                    <Input
                      type="text"
                      value={label.value}
                      onChange={(event) => onUpdateLabel(index, 'value', event.target.value)}
                      placeholder={
                        label.type === 'percentage'
                          ? t('admin.products.add.percentagePlaceholder')
                          : t('admin.products.add.newProductLabel')
                      }
                      required
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      {t('admin.products.add.position')}
                    </label>
                    <select
                      className={FIELD_CLASS}
                      value={label.position}
                      onChange={(event) => onUpdateLabel(index, 'position', event.target.value)}
                      required
                    >
                      <option value="top-left">{t('admin.products.add.topLeft')}</option>
                      <option value="top-right">{t('admin.products.add.topRight')}</option>
                      <option value="bottom-left">{t('admin.products.add.bottomLeft')}</option>
                      <option value="bottom-right">{t('admin.products.add.bottomRight')}</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`product-label-color-${index}`}
                      className="mb-1 block text-[11px] font-medium text-slate-600"
                    >
                      {t('admin.products.add.colorOptional')}
                    </label>
                    <LabelColorField
                      id={`product-label-color-${index}`}
                      value={label.color ?? null}
                      onChange={(color) => onUpdateLabel(index, 'color', color)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
