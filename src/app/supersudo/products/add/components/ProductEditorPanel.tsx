'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@shop/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { invalidateProductEditorSectionCaches } from '@/lib/admin/product-editor-section-cache';
import { AdminSideSheet } from '../../../components/AdminSideSheet';
import { ADMIN_PRODUCT_EDITOR_FORM_ID } from '../../../components/admin-side-sheet.constants';
import { ValueSelectionModal } from './ValueSelectionModal';
import { AddProductFormContent } from './AddProductFormContent';
import { InlineSheetField } from './InlineSheetField';
import { FeaturedStarToggle } from './FeaturedStarToggle';
import { useProductFormState } from '../hooks/useProductFormState';
import { useProductDataLoading } from '../hooks/useProductDataLoading';
import { useProductEditorTabLoader } from '../hooks/useProductEditorTabLoader';
import { useProductVariantConversion } from '../hooks/useProductVariantConversion';
import { useVariantGeneration } from '../hooks/useVariantGeneration';
import { useImageHandling } from '../hooks/useImageHandling';
import { useLabelManagement } from '../hooks/useLabelManagement';
import { useProductAttributeHelpers } from '../hooks/useProductAttributeHelpers';
import { useProductAttributeHandlers } from '../hooks/useProductAttributeHandlers';
import { useProductFormHandlers } from '../hooks/useProductFormHandlers';
import { useProductFormCallbacks } from '../hooks/useProductFormCallbacks';
import { isClothingCategory as checkIsClothingCategory } from '../utils/productUtils';
import { type ProductEditorTabId } from '../product-editor-tabs';
import type { OptimisticSaveRequest } from '../hooks/useProductPayloadCreation';
import { AUTO_STOCK_LEVEL } from '@/lib/constants/auto-stock';
import {
  GATED_SECTIONS,
  computeGatedFingerprints,
  type SectionFingerprints,
} from '../utils/product-editor-dirty';
import type { Product } from '../../types';
import { EMPTY_VARIANT_DISCOUNT } from '../utils/variant-discount';

interface ProductEditorPanelProps {
  open: boolean;
  productId: string | null;
  listProduct?: Product | null;
  onCancel: () => void;
  onSubmit: (request: OptimisticSaveRequest) => void;
  onFeaturedChange?: (productId: string, featured: boolean) => void;
}

export function ProductEditorPanel({
  open,
  productId,
  listProduct = null,
  onCancel,
  onSubmit,
  onFeaturedChange,
}: ProductEditorPanelProps) {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin } = useAuth();
  const isEditMode = Boolean(productId);
  const [featuredUpdating, setFeaturedUpdating] = useState(false);

  const formState = useProductFormState(listProduct);
  const [activeTab, setActiveTab] = useState<ProductEditorTabId>('general');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [slugCollapsed, setSlugCollapsed] = useState(false);
  /** Keeps star toggles from being overwritten by an in-flight general section fetch. */
  const featuredOverrideRef = useRef<boolean | null>(null);

  const handleBodyScroll = useCallback(() => {
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    setSlugCollapsed(scrollTop > 12);
  }, []);

  const baselineRef = useRef<SectionFingerprints>({});

  useEffect(() => {
    featuredOverrideRef.current = null;
  }, [open, productId]);

  const setFormDataPreservingFeatured = useCallback(
    (updater: (prev: typeof formState.formData) => typeof formState.formData) => {
      formState.setFormData((prev) => {
        const next = updater(prev);
        if (featuredOverrideRef.current === null) {
          return next;
        }
        return { ...next, featured: featuredOverrideRef.current };
      });
    },
    [formState.setFormData],
  );

  const { loadedTabs, visitedTabs, loadingTab, visitTab } = useProductEditorTabLoader({
    open,
    productId,
    listProduct,
    isLoggedIn,
    isAdmin,
    activeTab,
    defaultCurrency: formState.defaultCurrency,
    attributes: formState.attributes,
    setFormData: setFormDataPreservingFeatured,
    setHasVariantsToLoad: formState.setHasVariantsToLoad,
    setProductType: formState.setProductType,
    setSelectedAttributesForVariants: formState.setSelectedAttributesForVariants,
    setSelectedAttributeValueIds: formState.setSelectedAttributeValueIds,
    setSimpleProductData: formState.setSimpleProductData,
    onLoadError: onCancel,
  });

  useProductDataLoading({
    eagerLoad: open,
    setBrands: formState.setBrands,
    setCategories: formState.setCategories,
    setAttributes: formState.setAttributes,
    setDefaultCurrency: formState.setDefaultCurrency,
    attributesDropdownOpen: formState.attributesDropdownOpen,
    setAttributesDropdownOpen: formState.setAttributesDropdownOpen,
    attributesDropdownRef: formState.attributesDropdownRef,
  });

  useProductVariantConversion({
    productId,
    attributes: formState.attributes,
    defaultCurrency: formState.defaultCurrency,
    setSelectedAttributesForVariants: formState.setSelectedAttributesForVariants,
    setSelectedAttributeValueIds: formState.setSelectedAttributeValueIds,
    setGeneratedVariants: formState.setGeneratedVariants,
    setHasVariantsToLoad: formState.setHasVariantsToLoad,
    enabled: open && Boolean(productId),
  });

  const { applyToAllVariants } = useVariantGeneration({
    selectedAttributesForVariants: formState.selectedAttributesForVariants,
    selectedAttributeValueIds: formState.selectedAttributeValueIds,
    productType: formState.productType,
    isEditMode,
    productId,
    setGeneratedVariants: formState.setGeneratedVariants,
  });

  const {
    handleTitleChange,
    isClothingCategory,
    handleAttributeToggle,
    handleAttributeRemove,
    handleVariantDelete,
    handleVariantAdd,
  } = useProductFormCallbacks({
    formData: formState.formData,
    categories: formState.categories,
    selectedAttributesForVariants: formState.selectedAttributesForVariants,
    selectedAttributeValueIds: formState.selectedAttributeValueIds,
    generatedVariants: formState.generatedVariants,
    setFormData: formState.setFormData,
    setSelectedAttributesForVariants: formState.setSelectedAttributesForVariants,
    setSelectedAttributeValueIds: formState.setSelectedAttributeValueIds,
    setGeneratedVariants: formState.setGeneratedVariants,
    setSimpleProductData: formState.setSimpleProductData,
    checkIsClothingCategory,
  });

  const {
    removeImageUrl,
    setFeaturedImage,
    handleUploadImages,
    handleUploadVariantImage,
  } = useImageHandling({
    imageUrls: formState.formData.imageUrls,
    featuredImageIndex: formState.formData.featuredImageIndex,
    variants: formState.formData.variants,
    generatedVariants: formState.generatedVariants,
    colorImageTarget: formState.colorImageTarget,
    setImageUrls: (updater) => formState.setFormData((prev) => ({ ...prev, imageUrls: updater(prev.imageUrls) })),
    setFeaturedImageIndex: (index) => formState.setFormData((prev) => ({ ...prev, featuredImageIndex: index })),
    setMainProductImage: (image) => formState.setFormData((prev) => ({ ...prev, mainProductImage: image })),
    setVariants: (updater) => formState.setFormData((prev) => ({ ...prev, variants: updater(prev.variants) })),
    setGeneratedVariants: formState.setGeneratedVariants,
    setImageUploadLoading: formState.setImageUploadLoading,
    setImageUploadError: formState.setImageUploadError,
    setColorImageTarget: formState.setColorImageTarget,
    t,
  });

  const { addLabel, removeLabel, updateLabel } = useLabelManagement((updater) =>
    formState.setFormData((prev) => ({ ...prev, labels: updater(prev.labels) })),
  );

  const { getColorAttribute, getSizeAttribute } = useProductAttributeHelpers({
    attributes: formState.attributes,
  });

  useProductAttributeHandlers({
    attributes: formState.attributes,
    setAttributes: formState.setAttributes,
    getColorAttribute,
    getSizeAttribute,
  });

  const { handleSubmit } = useProductFormHandlers({
    formData: formState.formData,
    setFormData: formState.setFormData,
    setLoading: formState.setLoading,
    productType: formState.productType,
    simpleProductData: formState.simpleProductData,
    selectedAttributesForVariants: formState.selectedAttributesForVariants,
    selectedAttributeValueIds: formState.selectedAttributeValueIds,
    generatedVariants: formState.generatedVariants,
    attributes: formState.attributes,
    defaultCurrency: formState.defaultCurrency,
    isEditMode,
    productId,
    onSubmit,
    baselineRef,
    descriptionSectionReady: !isEditMode || loadedTabs.has('description'),
  });

  useEffect(() => {
    baselineRef.current = {};
  }, [open, productId]);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }
    const current = computeGatedFingerprints({
      imageUrls: formState.formData.imageUrls,
      featuredImageIndex: formState.formData.featuredImageIndex,
      mainProductImage: formState.formData.mainProductImage,
      productType: formState.productType,
      simpleProductData: formState.simpleProductData,
      variants: formState.formData.variants,
      generatedVariants: formState.generatedVariants,
      selectedAttributeIds: Array.from(formState.selectedAttributesForVariants),
      selectedAttributeValueIds: Object.values(formState.selectedAttributeValueIds).flat(),
    });
    for (const section of GATED_SECTIONS) {
      if (loadedTabs.has(section) && baselineRef.current[section] === undefined) {
        baselineRef.current[section] = current[section];
      }
    }
  }, [
    isEditMode,
    loadedTabs,
    formState.formData,
    formState.productType,
    formState.simpleProductData,
    formState.generatedVariants,
    formState.selectedAttributesForVariants,
    formState.selectedAttributeValueIds,
  ]);

  const handleTabChange = useCallback((tabId: ProductEditorTabId) => {
    visitTab(tabId);
    setActiveTab(tabId);
  }, [visitTab]);

  const handleFeaturedToggle = useCallback(async () => {
    if (featuredUpdating) {
      return;
    }

    const previous = formState.formData.featured;
    const next = !previous;
    featuredOverrideRef.current = next;
    formState.setFormData((prev) => ({ ...prev, featured: next }));

    // Create flow: featured is persisted with the full create payload.
    if (!isEditMode || !productId) {
      return;
    }

    setFeaturedUpdating(true);
    try {
      await apiClient.put(`/api/v1/supersudo/products/${productId}`, { featured: next });
      invalidateProductEditorSectionCaches(productId);
      onFeaturedChange?.(productId, next);
    } catch (err: unknown) {
      featuredOverrideRef.current = previous;
      formState.setFormData((prev) => ({ ...prev, featured: previous }));
      alert(
        t('admin.products.errorUpdatingFeatured').replace(
          '{message}',
          getApiOrErrorMessage(err, t('admin.common.unknownErrorFallback')),
        ),
      );
    } finally {
      setFeaturedUpdating(false);
    }
  }, [
    featuredUpdating,
    formState.formData.featured,
    formState.setFormData,
    isEditMode,
    productId,
    onFeaturedChange,
    t,
  ]);

  const sheetHeader = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 pr-4">
        <div className="flex items-start gap-3">
          <FeaturedStarToggle
            featured={formState.formData.featured}
            onToggle={() => {
              void handleFeaturedToggle();
            }}
            markLabel={t('admin.products.clickToMarkFeatured')}
            removeLabel={t('admin.products.clickToRemoveFeatured')}
          />
          <div className="min-w-0 flex-1">
            <InlineSheetField
              form={ADMIN_PRODUCT_EDITOR_FORM_ID}
              value={formState.formData.title}
              onChange={handleTitleChange}
              placeholder={t('admin.products.add.productTitlePlaceholder')}
              variant="title"
              required
            />
          </div>
        </div>
        <div
          className={`overflow-hidden pl-[3.25rem] transition-all duration-200 ease-out ${
            slugCollapsed ? 'max-h-0 opacity-0' : 'max-h-5 opacity-100'
          }`}
        >
          <InlineSheetField
            form={ADMIN_PRODUCT_EDITOR_FORM_ID}
            value={formState.formData.slug}
            onChange={(e) => formState.setFormData((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder={t('admin.products.add.productSlugPlaceholder')}
            variant="slug"
            required
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t('admin.common.cancel')}
        </Button>
        <Button
          type="submit"
          form={ADMIN_PRODUCT_EDITOR_FORM_ID}
          variant="primary"
          size="sm"
          disabled={formState.loading || loadingTab === activeTab}
        >
          {formState.loading
            ? isEditMode
              ? t('admin.products.add.updating')
              : t('admin.products.add.creating')
            : isEditMode
              ? t('admin.products.add.updateProduct')
              : t('admin.products.add.createProduct')}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <AdminSideSheet
        open={open}
        onClose={onCancel}
        ariaLabel={
          isEditMode
            ? t('admin.products.add.editProduct')
            : t('admin.products.add.addNewProduct')
        }
        closeLabel={t('admin.common.close')}
        headerClassName="shrink-0 px-5 py-3"
        header={sheetHeader}
      >
        <AddProductFormContent
          formId={ADMIN_PRODUCT_EDITOR_FORM_ID}
          scrollRef={scrollRef}
          onBodyScroll={handleBodyScroll}
          activeTab={activeTab}
          visitedTabs={visitedTabs}
          loadingTab={loadingTab}
          onTabChange={handleTabChange}
          formData={formState.formData}
          productType={formState.productType}
          simpleProductData={formState.simpleProductData}
          categories={formState.categories}
          brands={formState.brands}
          attributes={formState.attributes}
          defaultCurrency={formState.defaultCurrency}
          isEditMode={isEditMode}
          imageUploadLoading={formState.imageUploadLoading}
          imageUploadError={formState.imageUploadError}
          selectedAttributesForVariants={formState.selectedAttributesForVariants}
          selectedAttributeValueIds={formState.selectedAttributeValueIds}
          attributesDropdownOpen={formState.attributesDropdownOpen}
          generatedVariants={formState.generatedVariants}
          hasVariantsToLoad={formState.hasVariantsToLoad}
          fileInputRef={formState.fileInputRef}
          attributesDropdownRef={formState.attributesDropdownRef}
          variantImageInputRefs={formState.variantImageInputRefs}
          onSubtitleChange={(subtitleHtml) => formState.setFormData((prev) => ({ ...prev, subtitleHtml }))}
          onDescriptionChange={(description) => formState.setFormData((prev) => ({ ...prev, description }))}
          onProductTypeChange={formState.setProductType}
          onUploadImages={handleUploadImages}
          onRemoveImage={removeImageUrl}
          onSetFeaturedImage={setFeaturedImage}
          onCategoryIdsChange={(ids) => formState.setFormData((prev) => ({ ...prev, categoryIds: ids }))}
          onBrandIdsChange={(ids) => formState.setFormData((prev) => ({ ...prev, brandIds: ids }))}
          onPrimaryCategoryIdChange={(id) => formState.setFormData((prev) => ({ ...prev, primaryCategoryId: id }))}
          onPriceChange={(value) => formState.setSimpleProductData((prev) => ({ ...prev, price: value }))}
          onDiscountChange={(value) => formState.setSimpleProductData((prev) => ({ ...prev, discount: value }))}
          onSkuChange={(value) => formState.setSimpleProductData((prev) => ({ ...prev, sku: value }))}
          onQuantityChange={(value) => formState.setSimpleProductData((prev) => ({ ...prev, quantity: value }))}
          onAttributesDropdownOpenChange={(open) => formState.setAttributesDropdownOpen(open)}
          onAttributeToggle={handleAttributeToggle}
          onAttributeRemove={handleAttributeRemove}
          onAttributeValuesOpen={(attributeId) =>
            formState.setOpenValueModal({ variantId: 'variant-all', attributeId })
          }
          onVariantUpdate={formState.setGeneratedVariants}
          onVariantDelete={handleVariantDelete}
          onVariantAdd={handleVariantAdd}
          onVariantImageUpload={(variantId, event) => handleUploadVariantImage(variantId, event)}
          onOpenValueModal={formState.setOpenValueModal}
          onAddLabel={addLabel}
          onRemoveLabel={removeLabel}
          onUpdateLabel={(index, field, value) => updateLabel(index, field, value)}
          onWarrantyYearsChange={(warrantyYears) =>
            formState.setFormData((prev) => ({ ...prev, warrantyYears }))
          }
          onProductClassChange={(productClass) => formState.setFormData((prev) => ({ ...prev, productClass }))}
          onVariantsUpdate={(updater) => formState.setFormData((prev) => ({ ...prev, variants: updater(prev.variants) }))}
          onApplyToAllVariants={(field, value) => applyToAllVariants(field, value)}
          isClothingCategory={isClothingCategory}
          handleSubmit={handleSubmit}
        />
      </AdminSideSheet>

      {formState.openValueModal ? (
        <ValueSelectionModal
          openValueModal={formState.openValueModal}
          variant={
            formState.openValueModal.variantId === 'variant-all'
              ? {
                  id: 'variant-all',
                  selectedValueIds: Object.values(formState.selectedAttributeValueIds).flat(),
                  price: '',
                  discount: EMPTY_VARIANT_DISCOUNT,
                  stock: String(AUTO_STOCK_LEVEL),
                  sku: '',
                  image: null,
                }
              : formState.generatedVariants.find((v) => v.id === formState.openValueModal!.variantId)
          }
          attribute={formState.attributes.find((a) => a.id === formState.openValueModal!.attributeId)}
          selectedAttributeValueIds={formState.selectedAttributeValueIds}
          onClose={() => formState.setOpenValueModal(null)}
          onVariantUpdate={formState.setGeneratedVariants}
          onAttributeValueIdsUpdate={formState.setSelectedAttributeValueIds}
        />
      ) : null}
    </>
  );
}
