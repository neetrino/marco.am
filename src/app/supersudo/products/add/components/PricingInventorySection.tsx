'use client';

import type { RefObject } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import type { CurrencyCode } from '@/lib/currency';
import type { Attribute, GeneratedVariant } from '../types';
import { ProductTypeTabs } from './ProductTypeTabs';
import { SimpleProductFields } from './SimpleProductFields';
import { AttributesSelection } from './AttributesSelection';
import { VariantBuilder } from './VariantBuilder';

interface PricingInventorySectionProps {
  productType: 'simple' | 'variable';
  onProductTypeChange: (type: 'simple' | 'variable') => void;
  simpleProductData: {
    price: string;
    compareAtPrice: string;
    sku: string;
    quantity: string;
  };
  defaultCurrency: CurrencyCode;
  onPriceChange: (value: string) => void;
  onCompareAtPriceChange: (value: string) => void;
  onSkuChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  attributes: Attribute[];
  selectedAttributesForVariants: Set<string>;
  selectedAttributeValueIds: Record<string, string[]>;
  attributesDropdownOpen: boolean;
  attributesDropdownRef: RefObject<HTMLDivElement>;
  onAttributesDropdownToggle: () => void;
  onAttributeToggle: (attributeId: string, checked: boolean) => void;
  onAttributeRemove: (attributeId: string) => void;
  onAttributeValuesOpen: (attributeId: string) => void;
  generatedVariants: GeneratedVariant[];
  isEditMode: boolean;
  hasVariantsToLoad: boolean;
  imageUploadLoading: boolean;
  variantImageInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onVariantUpdate: (variants: GeneratedVariant[] | ((prev: GeneratedVariant[]) => GeneratedVariant[])) => void;
  onVariantDelete: (variantId: string) => void;
  onVariantAdd: () => void;
  onApplyToAllVariants: (field: 'price' | 'compareAtPrice' | 'stock' | 'sku', value: string) => void;
  onVariantImageUpload: (variantId: string, event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onOpenValueModal: (modal: { variantId: string; attributeId: string } | null) => void;
}

export function PricingInventorySection({
  productType,
  onProductTypeChange,
  simpleProductData,
  defaultCurrency,
  onPriceChange,
  onCompareAtPriceChange,
  onSkuChange,
  onQuantityChange,
  attributes,
  selectedAttributesForVariants,
  selectedAttributeValueIds,
  attributesDropdownOpen,
  attributesDropdownRef,
  onAttributesDropdownToggle,
  onAttributeToggle,
  onAttributeRemove,
  onAttributeValuesOpen,
  generatedVariants,
  isEditMode,
  hasVariantsToLoad,
  imageUploadLoading,
  variantImageInputRefs,
  onVariantUpdate,
  onVariantDelete,
  onVariantAdd,
  onApplyToAllVariants,
  onVariantImageUpload,
  onOpenValueModal,
}: PricingInventorySectionProps) {
  const { t } = useTranslation();

  return (
    <section className="w-full min-w-0 border-b border-slate-200/70 pb-6 last:border-b-0">
      <ProductTypeTabs productType={productType} onChange={onProductTypeChange} />

      <h2 className="mt-5 mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t('admin.products.add.pricingAndInventory')}
      </h2>

      {productType === 'simple' ? (
        <SimpleProductFields
          embedded
          price={simpleProductData.price}
          compareAtPrice={simpleProductData.compareAtPrice}
          sku={simpleProductData.sku}
          quantity={simpleProductData.quantity}
          defaultCurrency={defaultCurrency}
          onPriceChange={onPriceChange}
          onCompareAtPriceChange={onCompareAtPriceChange}
          onSkuChange={onSkuChange}
          onQuantityChange={onQuantityChange}
        />
      ) : (
        <div className="space-y-6">
          <AttributesSelection
            embedded
            attributes={attributes}
            selectedAttributesForVariants={selectedAttributesForVariants}
            selectedAttributeValueIds={selectedAttributeValueIds}
            attributesDropdownOpen={attributesDropdownOpen}
            attributesDropdownRef={attributesDropdownRef}
            onAttributesDropdownToggle={onAttributesDropdownToggle}
            onAttributeToggle={onAttributeToggle}
            onAttributeRemove={onAttributeRemove}
            onAttributeValuesOpen={onAttributeValuesOpen}
          />
          {(isEditMode && (generatedVariants.length > 0 || hasVariantsToLoad)) ||
          selectedAttributesForVariants.size > 0 ? (
            <VariantBuilder
              generatedVariants={generatedVariants}
              attributes={attributes}
              selectedAttributesForVariants={selectedAttributesForVariants}
              isEditMode={isEditMode}
              hasVariantsToLoad={hasVariantsToLoad}
              defaultCurrency={defaultCurrency}
              imageUploadLoading={imageUploadLoading}
              variantImageInputRefs={variantImageInputRefs}
              onVariantUpdate={onVariantUpdate}
              onVariantDelete={onVariantDelete}
              onVariantAdd={onVariantAdd}
              onApplyToAll={onApplyToAllVariants}
              onVariantImageUpload={onVariantImageUpload}
              onOpenValueModal={onOpenValueModal}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
