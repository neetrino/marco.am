'use client';

import { Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import { FormSection } from './FormSection';
import type { ProductLabel } from '../types';

interface ProductLabelsProps {
  labels: ProductLabel[];
  onAddLabel: () => void;
  onRemoveLabel: (index: number) => void;
  onUpdateLabel: (index: number, field: keyof ProductLabel, value: ProductLabel[keyof ProductLabel]) => void;
}

export function ProductLabels({ labels, onAddLabel, onRemoveLabel, onUpdateLabel }: ProductLabelsProps) {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t('admin.products.add.productLabels')}
      description={t('admin.products.add.addLabelsHint')}
      headerRight={
        <Button type="button" variant="outline" onClick={onAddLabel} className="w-full sm:w-auto">
          {t('admin.products.add.addLabel')}
        </Button>
      }
    >
      {labels.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-marco-border/60 py-6 text-center">
          <p className="text-marco-text/80 mb-1">{t('admin.products.add.noLabelsAdded')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {labels.map((label, index) => (
            <div key={index} className="rounded-xl border border-marco-border/50 bg-white/60 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('admin.products.add.label').replace('{index}', (index + 1).toString())}
                </h3>
                <Button type="button" variant="ghost" onClick={() => onRemoveLabel(index)} className="text-red-600 hover:text-red-700">
                  {t('admin.products.add.remove')}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Label Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.products.add.type')} *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={label.type}
                    onChange={(e) => onUpdateLabel(index, 'type', e.target.value as 'text' | 'percentage')}
                    required
                  >
                    <option value="text">{t('admin.products.add.textType')}</option>
                    <option value="percentage">{t('admin.products.add.percentageType')}</option>
                  </select>
                </div>

                {/* Label Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.products.add.value')} *
                  </label>
                  <Input
                    type="text"
                    value={label.value}
                    onChange={(e) => onUpdateLabel(index, 'value', e.target.value)}
                    placeholder={
                      label.type === 'percentage' ? t('admin.products.add.percentagePlaceholder') : t('admin.products.add.newProductLabel')
                    }
                    required
                    className="w-full"
                  />
                  {label.type === 'percentage' && (
                    <p className="mt-1 text-xs font-medium text-gray-600">{t('admin.products.add.percentageAutoUpdateHint')}</p>
                  )}
                </div>

                {/* Label Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.products.add.position')} *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={label.position}
                    onChange={(e) => onUpdateLabel(index, 'position', e.target.value)}
                    required
                  >
                    <option value="top-left">{t('admin.products.add.topLeft')}</option>
                    <option value="top-right">{t('admin.products.add.topRight')}</option>
                    <option value="bottom-left">{t('admin.products.add.bottomLeft')}</option>
                    <option value="bottom-right">{t('admin.products.add.bottomRight')}</option>
                  </select>
                </div>

                {/* Label Color (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.products.add.colorOptional')}
                  </label>
                  <Input
                    type="text"
                    value={label.color || ''}
                    onChange={(e) => onUpdateLabel(index, 'color', e.target.value || null)}
                    placeholder={t('admin.products.add.colorHexPlaceholder')}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('admin.products.add.hexColorHint')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}


