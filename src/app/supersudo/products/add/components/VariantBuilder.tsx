'use client';

import type { ChangeEvent, RefObject } from 'react';
import { ADMIN_IMAGE_ACCEPT } from '@/lib/constants/admin-image-upload';
import { Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import { FormSection } from './FormSection';
import { getColorHex } from '../../../../../lib/colorMap';
import { CURRENCIES, type CurrencyCode } from '../../../../../lib/currency';
import { showPopupPrompt } from '@/components/popup-service';
import { DiscountControl } from '@/components/admin/DiscountControl';
import type { Attribute, GeneratedVariant } from '../types';
import type { VariantDiscount } from '../utils/variant-discount';
import { logger } from "@/lib/utils/logger";

const VARIANT_FIELD_LABEL =
  'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500';
const VARIANT_ROW_GAP = 'gap-x-4 gap-y-2';
const VARIANT_PRICE_WIDTH = 'w-[148px] sm:w-[168px]';
const VARIANT_STOCK_WIDTH = 'w-[96px]';
const VARIANT_SKU_WIDTH = 'w-[112px] sm:w-[128px]';
const VARIANT_ROW_DIVIDER =
  'flex h-9 shrink-0 items-center px-1 text-base font-light leading-none text-slate-300';
const VARIANT_ICON_BTN =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50';

interface VariantBuilderProps {
  generatedVariants: GeneratedVariant[];
  attributes: Attribute[];
  selectedAttributesForVariants: Set<string>;
  isEditMode: boolean;
  hasVariantsToLoad: boolean;
  defaultCurrency: CurrencyCode;
  imageUploadLoading: boolean;
  variantImageInputRefs: RefObject<Record<string, HTMLInputElement | null>>;
  onVariantUpdate: (updater: (prev: GeneratedVariant[]) => GeneratedVariant[]) => void;
  onVariantDelete: (variantId: string) => void;
  onVariantAdd: () => void;
  onApplyToAll: (field: 'price' | 'stock' | 'sku', value: string) => void;
  onVariantImageUpload: (variantId: string, event: ChangeEvent<HTMLInputElement>) => void;
  onOpenValueModal: (modal: { variantId: string; attributeId: string } | null) => void;
}

export function VariantBuilder({
  generatedVariants,
  attributes,
  selectedAttributesForVariants,
  isEditMode,
  hasVariantsToLoad: _hasVariantsToLoad,
  defaultCurrency,
  imageUploadLoading,
  variantImageInputRefs,
  onVariantUpdate,
  onVariantDelete,
  onVariantAdd,
  onApplyToAll,
  onVariantImageUpload,
  onOpenValueModal,
}: VariantBuilderProps) {
  const { t } = useTranslation();

  // Get attributes to show in table header
  const getAttributesToShow = (variant?: GeneratedVariant) => {
    if (selectedAttributesForVariants.size > 0) {
      return Array.from(selectedAttributesForVariants);
    }
    if (isEditMode && variant) {
      // Extract unique attribute IDs from this variant's values
      const attrIds = new Set<string>();
      variant.selectedValueIds.forEach((valueId) => {
        const attr = attributes.find((a) => a.values.some((v) => v.id === valueId));
        if (attr) attrIds.add(attr.id);
      });
      return Array.from(attrIds);
    }
    return [];
  };

  return (
    <FormSection title={t('admin.products.add.variantBuilder')}>
      <div className="space-y-6">
        {/* Generated Variants Table */}
        {generatedVariants.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('admin.products.add.generatedVariants')} ({generatedVariants.length.toString()})
              </h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const price = await showPopupPrompt(t('admin.products.add.enterDefaultPrice'));
                    if (price !== null) {
                      onApplyToAll('price', price);
                    }
                  }}
                >
                  {t('admin.products.add.applyPriceToAll')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const stock = await showPopupPrompt(t('admin.products.add.enterDefaultStock'));
                    if (stock !== null) {
                      onApplyToAll('stock', stock);
                    }
                  }}
                >
                  {t('admin.products.add.applyStockToAll')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const skuValue = await showPopupPrompt(t('admin.products.add.enterSkuForAll'));
                    if (skuValue !== null && skuValue.trim() !== '') {
                      onApplyToAll('sku', skuValue.trim());
                    }
                  }}
                >
                  {t('admin.products.add.applySkuToAll')}
                </Button>
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white divide-y divide-gray-200">
              {generatedVariants.map((variant) => {
                const variantAttributesToShow = getAttributesToShow(variant);

                return (
                  <div key={variant.id} className="p-4 hover:bg-gray-50">
                    {/* Row 1: variant attributes */}
                    {variantAttributesToShow.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
                        {variantAttributesToShow.map((attributeId) => {
                          const attribute = attributes.find((a) => a.id === attributeId);
                          if (!attribute) return null;

                          const isColor = attribute.key === 'color';
                          const selectedValueIds = variant.selectedValueIds.filter((id) => {
                            return attribute.values.some((v) => v.id === id);
                          });
                          const selectedValues = selectedValueIds
                            .map((valueId) => {
                              const value = attribute.values.find((v) => v.id === valueId);
                              return value
                                ? {
                                    id: value.id,
                                    label: value.label,
                                    value: value.value,
                                    colorHex: isColor ? (value.colors?.[0] || getColorHex(value.label)) : null,
                                    imageUrl: value.imageUrl || null,
                                  }
                                : null;
                            })
                            .filter((v): v is NonNullable<typeof v> => v !== null);

                          return (
                            <div key={attributeId}>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                {attribute.name}
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenValueModal({ variantId: variant.id, attributeId });
                                }}
                                className="w-full text-left flex items-center gap-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                              >
                                <div className="flex-1 flex flex-wrap items-center gap-1 min-w-0">
                                  {selectedValues.length > 0 ? (
                                    selectedValues.map((val) => (
                                      <span
                                        key={val.id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                                      >
                                        {val.imageUrl ? (
                                          <img
                                            src={val.imageUrl}
                                            alt={val.label}
                                            className="w-3.5 h-3.5 object-cover rounded border border-gray-300"
                                          />
                                        ) : isColor && val.colorHex ? (
                                          <span
                                            className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300"
                                            style={{ backgroundColor: val.colorHex }}
                                          />
                                        ) : null}
                                        {val.label}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-sm text-gray-500">{t('admin.products.add.valuesPlaceholder')}</span>
                                  )}
                                </div>
                                <svg
                                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Price + discount + date | stock, SKU, image, delete */}
                    <div className={`flex w-full flex-wrap items-end ${VARIANT_ROW_GAP}`}>
                      <div className={`flex flex-wrap items-end ${VARIANT_ROW_GAP}`}>
                        <div className={VARIANT_PRICE_WIDTH}>
                          <label className={VARIANT_FIELD_LABEL}>
                            {t('admin.products.add.price')}
                          </label>
                          <div className="flex h-9 items-center gap-1.5">
                            <Input
                              type="number"
                              value={variant.price}
                              onChange={(e) => {
                                onVariantUpdate((prev) =>
                                  prev.map((v) => (v.id === variant.id ? { ...v, price: e.target.value } : v))
                                );
                              }}
                              placeholder={t('admin.products.add.pricePlaceholder')}
                              className="h-9 w-full text-sm"
                              min="0"
                              step="0.01"
                            />
                            <span className="shrink-0 text-sm text-gray-500">{CURRENCIES[defaultCurrency].symbol}</span>
                          </div>
                        </div>
                        <div>
                          <label className={VARIANT_FIELD_LABEL}>
                            {t('admin.products.add.discount')}
                          </label>
                          <DiscountControl
                            compact
                            value={variant.discount}
                            onChange={(next: VariantDiscount) => {
                              onVariantUpdate((prev) =>
                                prev.map((v) => (v.id === variant.id ? { ...v, discount: next } : v))
                              );
                            }}
                            currencySymbol={CURRENCIES[defaultCurrency].symbol}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
                        <div aria-hidden="true">
                          <span className={`${VARIANT_FIELD_LABEL} invisible select-none`}>·</span>
                          <div className={VARIANT_ROW_DIVIDER}>|</div>
                        </div>
                        <div className={VARIANT_SKU_WIDTH}>
                          <label className={VARIANT_FIELD_LABEL}>
                            {t('admin.products.add.sku')}
                          </label>
                          <Input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => {
                              onVariantUpdate((prev) =>
                                prev.map((v) => (v.id === variant.id ? { ...v, sku: e.target.value } : v))
                              );
                            }}
                            placeholder={t('admin.products.add.skuPlaceholder')}
                            className="h-9 w-full text-sm"
                          />
                        </div>
                        <div className={VARIANT_STOCK_WIDTH}>
                          <label className={VARIANT_FIELD_LABEL}>
                            {t('admin.products.add.stock')}
                          </label>
                          <Input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => {
                              onVariantUpdate((prev) =>
                                prev.map((v) => (v.id === variant.id ? { ...v, stock: e.target.value } : v))
                              );
                            }}
                            placeholder={t('admin.products.add.quantityPlaceholder')}
                            className="h-9 w-full text-sm"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className={`ml-auto flex flex-wrap items-end ${VARIANT_ROW_GAP}`}>
                        <div>
                          <label className={VARIANT_FIELD_LABEL}>
                            {t('admin.products.add.image')}
                          </label>
                          <div className="flex h-9 items-center">
                            {variant.image ? (
                              <div className="relative h-9 w-9 shrink-0">
                                <img
                                  src={variant.image}
                                  alt="Variant image"
                                  className="h-9 w-9 rounded-md border border-gray-300 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    onVariantUpdate((prev) =>
                                      prev.map((v) => (v.id === variant.id ? { ...v, image: null } : v))
                                    );
                                    if (variantImageInputRefs.current?.[variant.id]) {
                                      variantImageInputRefs.current[variant.id]!.value = '';
                                    }
                                  }}
                                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white transition-colors hover:bg-red-600"
                                  title={t('admin.products.add.removeImage')}
                                >
                                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => variantImageInputRefs.current?.[variant.id]?.click()}
                                disabled={imageUploadLoading}
                                className={VARIANT_ICON_BTN}
                                title={
                                  imageUploadLoading
                                    ? t('admin.products.add.uploading')
                                    : t('admin.products.add.uploadImage')
                                }
                                aria-label={t('admin.products.add.uploadImage')}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            )}
                            <input
                              ref={(el) => {
                                if (variantImageInputRefs.current) {
                                  variantImageInputRefs.current[variant.id] = el;
                                }
                              }}
                              type="file"
                              accept={ADMIN_IMAGE_ACCEPT}
                              onChange={(e) => onVariantImageUpload(variant.id, e)}
                              className="hidden"
                            />
                          </div>
                        </div>
                        <div>
                          <span className={`${VARIANT_FIELD_LABEL} invisible select-none`} aria-hidden="true">
                            ·
                          </span>
                          <button
                            type="button"
                            onClick={() => onVariantDelete(variant.id)}
                            className={`${VARIANT_ICON_BTN} border-red-300 bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500`}
                            title={t('admin.products.add.deleteVariant')}
                            aria-label={t('admin.products.add.deleteVariant')}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onVariantAdd}>
                {t('admin.products.add.addVariant')}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  logger.devLog('✅ [VARIANT BUILDER] Variants ready for submission:', generatedVariants);
                }}
              >
                {t('admin.products.add.variantsReady')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}


