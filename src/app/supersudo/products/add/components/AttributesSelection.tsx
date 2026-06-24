'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '../../../../../lib/i18n-client';
import { FormSection } from './FormSection';
import { getColorHex } from '../../../../../lib/colorMap';
import { filterAttributesBySearch } from '../../../attributes/filterAttributesBySearch';
import { SelectedAttributeRow } from './SelectedAttributeRow';
import type { Attribute } from '../types';
import type { RefObject } from 'react';

interface AttributesSelectionProps {
  attributes: Attribute[];
  selectedAttributesForVariants: Set<string>;
  selectedAttributeValueIds: Record<string, string[]>;
  attributesDropdownOpen: boolean;
  attributesDropdownRef: RefObject<HTMLDivElement | null>;
  onAttributesDropdownOpenChange: (open: boolean) => void;
  onAttributeToggle: (attributeId: string, checked: boolean) => void;
  onAttributeRemove: (attributeId: string) => void;
  onAttributeValuesOpen: (attributeId: string) => void;
  embedded?: boolean;
  title?: string;
  /** When true, show selected value labels (for simple products). */
  detailedValueDisplay?: boolean;
}

export function AttributesSelection({
  attributes,
  selectedAttributesForVariants,
  selectedAttributeValueIds,
  attributesDropdownOpen,
  attributesDropdownRef,
  onAttributesDropdownOpenChange,
  onAttributeToggle,
  onAttributeRemove,
  onAttributeValuesOpen,
  embedded,
  title,
  detailedValueDisplay = false,
}: AttributesSelectionProps) {
  const { t } = useTranslation();
  const [attributeSearch, setAttributeSearch] = useState('');

  useEffect(() => {
    if (!attributesDropdownOpen) {
      setAttributeSearch('');
    }
  }, [attributesDropdownOpen]);

  const filteredAttributes = useMemo(
    () => filterAttributesBySearch(attributes, attributeSearch),
    [attributes, attributeSearch],
  );

  const handleSearchChange = (value: string) => {
    setAttributeSearch(value);
    if (!attributesDropdownOpen) {
      onAttributesDropdownOpenChange(true);
    }
  };

  const content = (
      <div className={embedded ? 'space-y-4' : 'rounded-xl border border-marco-border/50 bg-white/60 p-4 sm:p-5'}>
        <div className="relative" ref={attributesDropdownRef}>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" aria-hidden />
            <input
              id="product-attribute-search"
              type="search"
              value={attributeSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => onAttributesDropdownOpenChange(true)}
              placeholder={t('admin.attributes.searchPlaceholder')}
              autoComplete="off"
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label={t('admin.attributes.searchLabel')}
            />
            {attributeSearch.length > 0 ? (
              <button
                type="button"
                className="absolute right-8 rounded p-0.5 text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                onClick={() => setAttributeSearch('')}
                aria-label={t('admin.attributes.clearSearch')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onAttributesDropdownOpenChange(!attributesDropdownOpen)}
              className="absolute right-2 rounded p-0.5 text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              aria-label={t('admin.products.add.selectAttributes')}
              aria-expanded={attributesDropdownOpen}
              aria-controls="product-attribute-dropdown"
            >
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${
                  attributesDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {attributesDropdownOpen && (
            <div
              id="product-attribute-dropdown"
              className="absolute z-10 mt-1 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg max-h-96"
            >
              <div className="p-4">
                {attributeSearch.trim() !== '' && (
                  <p className="mb-3 text-xs text-gray-500">
                    {t('admin.attributes.searchMatchCount')
                      .replace('{matched}', String(filteredAttributes.length))
                      .replace('{total}', String(attributes.length))}
                  </p>
                )}
                {attributes.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    {t('admin.products.add.noAttributesAvailable')}
                  </p>
                ) : filteredAttributes.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    {t('admin.attributes.searchNoMatches')}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {filteredAttributes.map((attribute) => (
                      <label
                        key={attribute.id}
                        className={`flex cursor-pointer items-center space-x-2 rounded-lg border p-3 transition-colors hover:bg-gray-50 ${
                          selectedAttributesForVariants.has(attribute.id)
                            ? 'border-gray-400 bg-gray-100'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAttributesForVariants.has(attribute.id)}
                          onChange={(e) => onAttributeToggle(attribute.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{attribute.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {selectedAttributesForVariants.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {detailedValueDisplay ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from(selectedAttributesForVariants).map((attributeId) => {
                  const attribute = attributes.find((candidate) => candidate.id === attributeId);
                  if (!attribute) return null;

                  return (
                    <SelectedAttributeRow
                      key={attributeId}
                      attribute={attribute}
                      selectedValueIds={selectedAttributeValueIds[attributeId] || []}
                      onOpenValues={() => onAttributeValuesOpen(attributeId)}
                      onRemove={() => onAttributeRemove(attributeId)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedAttributesForVariants).map((attributeId) => {
                  const attribute = attributes.find(a => a.id === attributeId);
                  if (!attribute) return null;
                  
                  const selectedValueIds = selectedAttributeValueIds[attributeId] || [];
                  const selectedValues = selectedValueIds
                    .map(id => attribute.values.find(v => v.id === id))
                    .filter((v): v is NonNullable<typeof v> => v != null);
                  
                  const previewImage = selectedValues.find(v => v.imageUrl)?.imageUrl;
                  const isColor = attribute.key === 'color';
                  const previewColor = isColor && selectedValues.length > 0 
                    ? (selectedValues[0].colors?.[0] || getColorHex(selectedValues[0].label))
                    : null;
                  
                  return (
                    <div
                      key={attributeId}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-300"
                    >
                      <button
                        type="button"
                        onClick={() => onAttributeValuesOpen(attributeId)}
                        title={t('admin.products.add.selectValues')}
                        className="inline-flex items-center gap-2 rounded-md hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt={attribute.name}
                            className="w-4 h-4 object-cover rounded border border-gray-300"
                          />
                        ) : previewColor ? (
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: previewColor }}
                          />
                        ) : null}
                        <span>{attribute.name}</span>
                        {selectedValues.length > 0 && (
                          <span className="text-xs text-gray-600">
                            ({selectedValues.length})
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onAttributeRemove(attributeId)}
                        className="ml-1 text-gray-600 hover:text-gray-900 focus:outline-none"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
  );

  if (embedded) {
    return (
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">
          {title ?? t('admin.products.add.selectAttributesForVariants')}
          <span className="font-normal text-gray-500"> {t('admin.products.add.selectMultiple')}</span>
        </p>
        {content}
      </div>
    );
  }

  return (
    <FormSection
      header={
        <p className="text-sm font-medium text-gray-700">
          {t('admin.products.add.selectAttributesForVariants')}
          <span className="font-normal text-gray-500"> {t('admin.products.add.selectMultiple')}</span>
        </p>
      }
    >
      {content}
    </FormSection>
  );
}
