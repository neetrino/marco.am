'use client';

import { useTranslation } from '@/lib/i18n-client';
import { getColorHex } from '@/lib/colorMap';
import type { Attribute } from '../types';

interface SelectedAttributeRowProps {
  attribute: Attribute;
  selectedValueIds: string[];
  onOpenValues: () => void;
  onRemove: () => void;
}

export function SelectedAttributeRow({
  attribute,
  selectedValueIds,
  onOpenValues,
  onRemove,
}: SelectedAttributeRowProps) {
  const { t } = useTranslation();
  const isColor = attribute.key === 'color';

  const selectedValues = selectedValueIds
    .map((valueId) => attribute.values.find((value) => value.id === valueId))
    .filter((value): value is NonNullable<typeof value> => value != null);

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
          {attribute.name}
        </label>
        <button
          type="button"
          onClick={onOpenValues}
          title={t('admin.products.add.selectValues')}
          className="flex w-full items-center gap-2 rounded-md border border-gray-300 p-2 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {selectedValues.length > 0 ? (
              selectedValues.map((value) => {
                const colorHex =
                  isColor && value.colors && value.colors.length > 0
                    ? value.colors[0]
                    : isColor
                      ? getColorHex(value.label)
                      : null;

                return (
                  <span
                    key={value.id}
                    className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                  >
                    {value.imageUrl ? (
                      <img
                        src={value.imageUrl}
                        alt={value.label}
                        className="h-3.5 w-3.5 rounded border border-gray-300 object-cover"
                      />
                    ) : colorHex ? (
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full border border-gray-300"
                        style={{ backgroundColor: colorHex }}
                      />
                    ) : null}
                    {value.label}
                  </span>
                );
              })
            ) : (
              <span className="text-sm text-gray-500">{t('admin.products.add.valuesPlaceholder')}</span>
            )}
          </div>
          <svg
            className="h-4 w-4 flex-shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-6 rounded-md p-1 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
        aria-label={t('admin.common.delete')}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
