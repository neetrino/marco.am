'use client';

import { Button } from '@shop/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { AdminSideSheet } from '../../../components/AdminSideSheet';
import {
  ADMIN_PRODUCT_EDITOR_FORM_ID,
} from '../../../components/admin-side-sheet.constants';
import { ValueSelectionModal } from './ValueSelectionModal';
import { AddProductFormContent } from './AddProductFormContent';
import { InlineSheetField } from './InlineSheetField';
import { useProductFormState } from '../hooks/useProductFormState';
import { useProductDataLoading } from '../hooks/useProductDataLoading';
import { useProductEditMode } from '../hooks/useProductEditMode';
import { useProductVariantConversion } from '../hooks/useProductVariantConversion';
import { useVariantGeneration } from '../hooks/useVariantGeneration';
import { useImageHandling } from '../hooks/useImageHandling';
import { useLabelManagement } from '../hooks/useLabelManagement';
import { useProductAttributeHelpers } from '../hooks/useProductAttributeHelpers';
import { useProductAttributeHandlers } from '../hooks/useProductAttributeHandlers';
import { useProductFormHandlers } from '../hooks/useProductFormHandlers';
import { useProductFormCallbacks } from '../hooks/useProductFormCallbacks';
import { isClothingCategory as checkIsClothingCategory } from '../utils/productUtils';

interface ProductEditorPanelProps {
  open: boolean;
  productId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function ProductEditorPanel({ open, productId, onCancel, onSaved }: ProductEditorPanelProps) {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin } = useAuth();
  const isEditMode = Boolean(productId);

  const formState = useProductFormState();

  useProductDataLoading({
    setBrands: formState.setBrands,
    setCategories: formState.setCategories,
    setAttributes: formState.setAttributes,
    setDefaultCurrency: formState.setDefaultCurrency,
    attributesDropdownOpen: formState.attributesDropdownOpen,
    setAttributesDropdownOpen: formState.setAttributesDropdownOpen,
    attributesDropdownRef: formState.attributesDropdownRef,
    categoriesExpanded: formState.categoriesExpanded,
    setCategoriesExpanded: formState.setCategoriesExpanded,
    brandsExpanded: formState.brandsExpanded,
    setBrandsExpanded: formState.setBrandsExpanded,
  });

  useProductEditMode({
    productId,
    isLoggedIn,
    isAdmin,
    attributes: formState.attributes,
    defaultCurrency: formState.defaultCurrency,
    setLoadingProduct: formState.setLoadingProduct,
    setFormData: formState.setFormData,
    setUseNewBrand: formState.setUseNewBrand,
    setUseNewCategory: formState.setUseNewCategory,
    setNewBrandName: formState.setNewBrandName,
    setNewCategoryName: formState.setNewCategoryName,
    setHasVariantsToLoad: formState.setHasVariantsToLoad,
    setProductType: formState.setProductType,
    setSimpleProductData: formState.setSimpleProductData,
    onLoadError: onCancel,
  });

  useProductVariantConversion({
    productId,
    attributes: formState.attributes,
    defaultCurrency: formState.defaultCurrency,
    setSelectedAttributesForVariants: formState.setSelectedAttributesForVariants,
    setSelectedAttributeValueIds: formState.setSelectedAttributeValueIds,
    setGeneratedVariants: formState.setGeneratedVariants,
    setHasVariantsToLoad: formState.setHasVariantsToLoad,
  });

  const { applyToAllVariants } = useVariantGeneration({
    selectedAttributesForVariants: formState.selectedAttributesForVariants,
    selectedAttributeValueIds: formState.selectedAttributeValueIds,
    attributes: formState.attributes,
    formDataSlug: formState.formData.slug,
    formDataTitle: formState.formData.title,
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
    addImageUrl: _addImageUrl,
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

  const { addLabel, removeLabel, updateLabel } = useLabelManagement(
    formState.formData.labels,
    (updater) => formState.setFormData((prev) => ({ ...prev, labels: updater(prev.labels) })),
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
    setBrands: formState.setBrands,
    setCategories: formState.setCategories,
    productType: formState.productType,
    simpleProductData: formState.simpleProductData,
    selectedAttributesForVariants: formState.selectedAttributesForVariants,
    generatedVariants: formState.generatedVariants,
    attributes: formState.attributes,
    defaultCurrency: formState.defaultCurrency,
    useNewBrand: formState.useNewBrand,
    newBrandName: formState.newBrandName,
    useNewCategory: formState.useNewCategory,
    newCategoryName: formState.newCategoryName,
    isEditMode,
    productId,
    isClothingCategory,
    onSuccess: onSaved,
  });

  const sheetHeader = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 pr-4">
        <InlineSheetField
          form={ADMIN_PRODUCT_EDITOR_FORM_ID}
          value={formState.formData.title}
          onChange={handleTitleChange}
          placeholder={t('admin.products.add.productTitlePlaceholder')}
          variant="title"
          required
        />
        <InlineSheetField
          form={ADMIN_PRODUCT_EDITOR_FORM_ID}
          value={formState.formData.slug}
          onChange={(e) => formState.setFormData((prev) => ({ ...prev, slug: e.target.value }))}
          placeholder={t('admin.products.add.productSlugPlaceholder')}
          variant="slug"
          required
        />
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
          disabled={formState.loading || formState.loadingProduct}
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

  const sheetBody = formState.loadingProduct ? (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
        <p className="text-sm text-gray-600">{t('admin.products.add.loadingProduct')}</p>
      </div>
    </div>
  ) : (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <AddProductFormContent
        formId={ADMIN_PRODUCT_EDITOR_FORM_ID}
        formData={formState.formData}
        productType={formState.productType}
        simpleProductData={formState.simpleProductData}
        categories={formState.categories}
        brands={formState.brands}
        attributes={formState.attributes}
        defaultCurrency={formState.defaultCurrency}
        isEditMode={isEditMode}
        loading={formState.loading}
        imageUploadLoading={formState.imageUploadLoading}
        imageUploadError={formState.imageUploadError}
        categoriesExpanded={formState.categoriesExpanded}
        brandsExpanded={formState.brandsExpanded}
        useNewCategory={formState.useNewCategory}
        useNewBrand={formState.useNewBrand}
        newCategoryName={formState.newCategoryName}
        newBrandName={formState.newBrandName}
        selectedAttributesForVariants={formState.selectedAttributesForVariants}
        selectedAttributeValueIds={formState.selectedAttributeValueIds}
        attributesDropdownOpen={formState.attributesDropdownOpen}
        generatedVariants={formState.generatedVariants}
        hasVariantsToLoad={formState.hasVariantsToLoad}
        fileInputRef={formState.fileInputRef}
        attributesDropdownRef={formState.attributesDropdownRef}
        variantImageInputRefs={formState.variantImageInputRefs}
        onDescriptionChange={(description) => formState.setFormData((prev) => ({ ...prev, description }))}
        onProductTypeChange={formState.setProductType}
        onUploadImages={handleUploadImages}
        onRemoveImage={removeImageUrl}
        onSetFeaturedImage={setFeaturedImage}
        onCategoriesExpandedChange={formState.setCategoriesExpanded}
        onBrandsExpandedChange={formState.setBrandsExpanded}
        onUseNewCategoryChange={formState.setUseNewCategory}
        onUseNewBrandChange={formState.setUseNewBrand}
        onNewCategoryNameChange={formState.setNewCategoryName}
        onNewBrandNameChange={formState.setNewBrandName}
        onCategoryIdsChange={(ids) => formState.setFormData((prev) => ({ ...prev, categoryIds: ids }))}
        onBrandIdsChange={(ids) => formState.setFormData((prev) => ({ ...prev, brandIds: ids }))}
        onPrimaryCategoryIdChange={(id) => formState.setFormData((prev) => ({ ...prev, primaryCategoryId: id }))}
        onPriceChange={(value) => formState.setSimpleProductData((prev) => ({ ...prev, price: value }))}
        onCompareAtPriceChange={(value) => formState.setSimpleProductData((prev) => ({ ...prev, compareAtPrice: value }))}
        onSkuChange={(value) => formState.setSimpleProductData((prev) => ({ ...prev, sku: value }))}
        onQuantityChange={(value) => formState.setSimpleProductData((prev) => ({ ...prev, quantity: value }))}
        onAttributesDropdownToggle={() => formState.setAttributesDropdownOpen(!formState.attributesDropdownOpen)}
        onAttributeToggle={handleAttributeToggle}
        onAttributeRemove={handleAttributeRemove}
        onAttributeValuesOpen={(attributeId) =>
          formState.setOpenValueModal({
            variantId: 'variant-all',
            attributeId,
          })
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
        onFeaturedChange={(featured) => formState.setFormData((prev) => ({ ...prev, featured }))}
        onProductClassChange={(productClass) => formState.setFormData((prev) => ({ ...prev, productClass }))}
        onVariantsUpdate={(updater) => formState.setFormData((prev) => ({ ...prev, variants: updater(prev.variants) }))}
        onApplyToAllVariants={(field, value) => applyToAllVariants(field, value)}
        isClothingCategory={isClothingCategory}
        handleSubmit={handleSubmit}
      />
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
        header={sheetHeader}
      >
        {sheetBody}
      </AdminSideSheet>

      {formState.openValueModal ? (
        <ValueSelectionModal
          openValueModal={formState.openValueModal}
          variant={
            formState.generatedVariants.find((v) => v.id === formState.openValueModal!.variantId) ||
            (formState.openValueModal.variantId === 'variant-all'
              ? {
                  id: 'variant-all',
                  selectedValueIds: Object.values(formState.selectedAttributeValueIds).flat(),
                  price: '',
                  compareAtPrice: '',
                  stock: '',
                  sku: '',
                  image: null,
                }
              : undefined)
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
