'use client';

import type { ChangeEvent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { AdminVerticalTabs } from '../../../components/AdminVerticalTabs';
import type {
  Brand,
  Category,
  Attribute,
  Variant,
  ProductLabel,
  GeneratedVariant,
} from '../types';
import type { VariantDiscount } from '../utils/variant-discount';
import type { CurrencyCode } from '@/lib/currency';
import type { ProductClass } from '@/lib/constants/product-class';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';
import type { ProductDescriptionEntry } from '@/lib/products/product-description';
import {
  PRODUCT_EDITOR_TAB_IDS,
  type ProductEditorTabId,
} from '../product-editor-tabs';
import { ProductGeneralTab } from './ProductGeneralTab';
import { ProductDescriptionTab } from './ProductDescriptionTab';
import { ProductImages } from './ProductImages';
import { ProductCatalogTab } from './ProductCatalogTab';
import { PricingInventorySection } from './PricingInventorySection';
import { ProductEditorTabSkeleton } from './ProductEditorTabSkeleton';

interface AddProductFormContentProps {
  formId: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onBodyScroll: () => void;
  activeTab: ProductEditorTabId;
  visitedTabs: Set<ProductEditorTabId>;
  loadingTab: ProductEditorTabId | null;
  onTabChange: (tabId: ProductEditorTabId) => void;
  formData: {
    title: string;
    slug: string;
    subtitleHtml: string;
    description: ProductDescriptionEntry[];
    productClass: ProductClass;
    brandIds: string[];
    categoryIds: string[];
    primaryCategoryId: string;
    imageUrls: string[];
    featuredImageIndex: number;
    labels: ProductLabel[];
    warrantyYears: number | null;
    featured: boolean;
    variants: Variant[];
  };
  productType: 'simple' | 'variable';
  simpleProductData: {
    price: string;
    discount: VariantDiscount;
    sku: string;
    quantity: string;
  };
  categories: Category[];
  brands: Brand[];
  attributes: Attribute[];
  defaultCurrency: CurrencyCode;
  isEditMode: boolean;
  imageUploadLoading: boolean;
  imageUploadError: string | null;
  selectedAttributesForVariants: Set<string>;
  selectedAttributeValueIds: Record<string, string[]>;
  attributesDropdownOpen: boolean;
  generatedVariants: GeneratedVariant[];
  hasVariantsToLoad: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  attributesDropdownRef: React.RefObject<HTMLDivElement | null>;
  variantImageInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onSubtitleChange: (html: string) => void;
  onDescriptionChange: (entries: ProductDescriptionEntry[]) => void;
  onProductTypeChange: (type: 'simple' | 'variable') => void;
  onUploadImages: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveImage: (index: number) => void;
  onSetFeaturedImage: (index: number) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onBrandIdsChange: (ids: string[]) => void;
  onPrimaryCategoryIdChange: (id: string) => void;
  onPriceChange: (value: string) => void;
  onDiscountChange: (value: VariantDiscount) => void;
  onSkuChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onAttributesDropdownToggle: () => void;
  onAttributeToggle: (attributeId: string, checked: boolean) => void;
  onAttributeRemove: (attributeId: string) => void;
  onAttributeValuesOpen: (attributeId: string) => void;
  onVariantUpdate: (variants: GeneratedVariant[] | ((prev: GeneratedVariant[]) => GeneratedVariant[])) => void;
  onVariantDelete: (variantId: string) => void;
  onVariantAdd: () => void;
  onVariantImageUpload: (variantId: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onOpenValueModal: (modal: { variantId: string; attributeId: string } | null) => void;
  onAddLabel: () => void;
  onRemoveLabel: (index: number) => void;
  onUpdateLabel: (index: number, field: keyof ProductLabel, value: ProductLabel[keyof ProductLabel]) => void;
  onWarrantyYearsChange: (years: ProductWarrantyYears | null) => void;
  onProductClassChange: (productClass: ProductClass) => void;
  onVariantsUpdate: (updater: (prev: Variant[]) => Variant[]) => void;
  onApplyToAllVariants: (field: 'price' | 'stock' | 'sku', value: string) => void;
  isClothingCategory: () => boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

function TabPanel({
  tabId,
  activeTab,
  visited,
  fillHeight = false,
  isLoading = false,
  children,
}: {
  tabId: ProductEditorTabId;
  activeTab: ProductEditorTabId;
  visited: boolean;
  fillHeight?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}) {
  if (!visited) {
    return null;
  }

  const isActive = activeTab === tabId;

  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      className={`w-full min-w-0 ${fillHeight ? 'flex min-h-0 flex-1 flex-col' : ''} ${isActive ? '' : 'hidden'}`}
    >
      {isLoading && isActive ? <ProductEditorTabSkeleton tabId={tabId} /> : children}
    </div>
  );
}

const FULL_HEIGHT_TABS: ProductEditorTabId[] = ['general', 'description', 'catalog'];

function isFullHeightTab(tab: ProductEditorTabId): boolean {
  return FULL_HEIGHT_TABS.includes(tab);
}

export function AddProductFormContent({
  formId,
  scrollRef,
  onBodyScroll,
  activeTab,
  visitedTabs,
  loadingTab,
  onTabChange,
  formData,
  productType,
  simpleProductData,
  categories,
  brands,
  attributes,
  defaultCurrency,
  isEditMode,
  imageUploadLoading,
  imageUploadError,
  selectedAttributesForVariants,
  selectedAttributeValueIds,
  attributesDropdownOpen,
  generatedVariants,
  hasVariantsToLoad,
  fileInputRef,
  attributesDropdownRef,
  variantImageInputRefs,
  onSubtitleChange,
  onDescriptionChange,
  onProductTypeChange,
  onUploadImages,
  onRemoveImage,
  onSetFeaturedImage,
  onCategoryIdsChange,
  onBrandIdsChange,
  onPrimaryCategoryIdChange,
  onPriceChange,
  onDiscountChange,
  onSkuChange,
  onQuantityChange,
  onAttributesDropdownToggle,
  onAttributeToggle,
  onAttributeRemove,
  onAttributeValuesOpen,
  onVariantUpdate,
  onVariantDelete,
  onVariantAdd,
  onVariantImageUpload,
  onOpenValueModal,
  onAddLabel,
  onRemoveLabel,
  onUpdateLabel,
  onWarrantyYearsChange,
  onProductClassChange,
  onVariantsUpdate,
  onApplyToAllVariants,
  isClothingCategory,
  handleSubmit,
}: AddProductFormContentProps) {
  const { t } = useTranslation();

  const tabs = useMemo(
    () =>
      PRODUCT_EDITOR_TAB_IDS.map((id) => ({
        id,
        label: t(`admin.products.add.tabs.${id}`),
      })),
    [t],
  );

  const warrantyYears =
    formData.warrantyYears === 1 ||
    formData.warrantyYears === 2 ||
    formData.warrantyYears === 3
      ? formData.warrantyYears
      : null;

  const fullHeightActive = isFullHeightTab(activeTab);

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <AdminVerticalTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        ariaLabel={t('admin.products.add.tabsLabel')}
      />

      <div
        ref={scrollRef}
        onScroll={fullHeightActive ? undefined : onBodyScroll}
        className={`min-h-0 flex-1 px-5 py-4 ${
          fullHeightActive ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        <form
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          className={`w-full min-w-0 ${fullHeightActive ? 'flex min-h-0 flex-1 flex-col' : ''}`}
        >
          <TabPanel
            tabId="general"
            activeTab={activeTab}
            visited={visitedTabs.has('general')}
            fillHeight
            isLoading={loadingTab === 'general'}
          >
            <ProductGeneralTab
              productClass={formData.productClass}
              warrantyYears={warrantyYears}
              labels={formData.labels}
              onProductClassChange={onProductClassChange}
              onWarrantyYearsChange={onWarrantyYearsChange}
              onAddLabel={onAddLabel}
              onRemoveLabel={onRemoveLabel}
              onUpdateLabel={onUpdateLabel}
            />
          </TabPanel>

          <TabPanel
            tabId="description"
            activeTab={activeTab}
            visited={visitedTabs.has('description')}
            fillHeight
            isLoading={loadingTab === 'description'}
          >
            <ProductDescriptionTab
              subtitleHtml={formData.subtitleHtml}
              description={formData.description}
              onSubtitleChange={onSubtitleChange}
              onDescriptionChange={onDescriptionChange}
            />
          </TabPanel>

          <TabPanel
            tabId="media"
            activeTab={activeTab}
            visited={visitedTabs.has('media')}
            isLoading={loadingTab === 'media'}
          >
            <ProductImages
              imageUrls={formData.imageUrls}
              featuredImageIndex={formData.featuredImageIndex}
              imageUploadLoading={imageUploadLoading}
              imageUploadError={imageUploadError}
              fileInputRef={fileInputRef}
              onUploadImages={onUploadImages}
              onRemoveImage={onRemoveImage}
              onSetFeaturedImage={onSetFeaturedImage}
            />
          </TabPanel>

          <TabPanel
            tabId="catalog"
            activeTab={activeTab}
            visited={visitedTabs.has('catalog')}
            fillHeight
            isLoading={loadingTab === 'catalog'}
          >
            <ProductCatalogTab
              categories={categories}
              brands={brands}
              categoryIds={formData.categoryIds}
              primaryCategoryId={formData.primaryCategoryId}
              brandIds={formData.brandIds}
              onCategoryIdsChange={onCategoryIdsChange}
              onBrandIdsChange={onBrandIdsChange}
              onPrimaryCategoryIdChange={onPrimaryCategoryIdChange}
              isClothingCategory={isClothingCategory}
              onVariantsUpdate={onVariantsUpdate}
            />
          </TabPanel>

          <TabPanel
            tabId="pricing"
            activeTab={activeTab}
            visited={visitedTabs.has('pricing')}
            isLoading={loadingTab === 'pricing'}
          >
            <PricingInventorySection
              productType={productType}
              onProductTypeChange={onProductTypeChange}
              simpleProductData={simpleProductData}
              defaultCurrency={defaultCurrency}
              onPriceChange={onPriceChange}
              onDiscountChange={onDiscountChange}
              onSkuChange={onSkuChange}
              onQuantityChange={onQuantityChange}
              attributes={attributes}
              selectedAttributesForVariants={selectedAttributesForVariants}
              selectedAttributeValueIds={selectedAttributeValueIds}
              attributesDropdownOpen={attributesDropdownOpen}
              attributesDropdownRef={attributesDropdownRef}
              onAttributesDropdownToggle={onAttributesDropdownToggle}
              onAttributeToggle={onAttributeToggle}
              onAttributeRemove={onAttributeRemove}
              onAttributeValuesOpen={onAttributeValuesOpen}
              generatedVariants={generatedVariants}
              isEditMode={isEditMode}
              hasVariantsToLoad={hasVariantsToLoad}
              imageUploadLoading={imageUploadLoading}
              variantImageInputRefs={variantImageInputRefs}
              onVariantUpdate={onVariantUpdate}
              onVariantDelete={onVariantDelete}
              onVariantAdd={onVariantAdd}
              onApplyToAllVariants={onApplyToAllVariants}
              onVariantImageUpload={onVariantImageUpload}
              onOpenValueModal={onOpenValueModal}
            />
          </TabPanel>
        </form>
      </div>
    </div>
  );
}
