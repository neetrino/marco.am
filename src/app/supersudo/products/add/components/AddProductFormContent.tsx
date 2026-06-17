'use client';

import type { ChangeEvent } from 'react';
import type {
  Brand,
  Category,
  Attribute,
  Variant,
  ProductLabel,
  GeneratedVariant,
} from '../types';
import type { CurrencyCode } from '@/lib/currency';
import type { ProductClass } from '@/lib/constants/product-class';
import { BasicInformation } from './BasicInformation';
import { ProductImages } from './ProductImages';
import { CategoriesBrands } from './CategoriesBrands';
import { PricingInventorySection } from './PricingInventorySection';
import { ProductLabels } from './ProductLabels';
import type { ProductWarrantyYears } from '@/lib/constants/product-warranty';
import type { ProductDescriptionEntry } from '@/lib/products/product-description';

interface AddProductFormContentProps {
  formId: string;
  formData: {
    title: string;
    slug: string;
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
    compareAtPrice: string;
    sku: string;
    quantity: string;
  };
  categories: Category[];
  brands: Brand[];
  attributes: Attribute[];
  defaultCurrency: CurrencyCode;
  isEditMode: boolean;
  loading: boolean;
  imageUploadLoading: boolean;
  imageUploadError: string | null;
  categoriesExpanded: boolean;
  brandsExpanded: boolean;
  useNewCategory: boolean;
  useNewBrand: boolean;
  newCategoryName: string;
  newBrandName: string;
  selectedAttributesForVariants: Set<string>;
  selectedAttributeValueIds: Record<string, string[]>;
  attributesDropdownOpen: boolean;
  generatedVariants: GeneratedVariant[];
  hasVariantsToLoad: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  attributesDropdownRef: React.RefObject<HTMLDivElement>;
  variantImageInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onDescriptionChange: (entries: ProductDescriptionEntry[]) => void;
  onProductTypeChange: (type: 'simple' | 'variable') => void;
  onUploadImages: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveImage: (index: number) => void;
  onSetFeaturedImage: (index: number) => void;
  onCategoriesExpandedChange: (expanded: boolean) => void;
  onBrandsExpandedChange: (expanded: boolean) => void;
  onUseNewCategoryChange: (use: boolean) => void;
  onUseNewBrandChange: (use: boolean) => void;
  onNewCategoryNameChange: (name: string) => void;
  onNewBrandNameChange: (name: string) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onBrandIdsChange: (ids: string[]) => void;
  onPrimaryCategoryIdChange: (id: string) => void;
  onPriceChange: (value: string) => void;
  onCompareAtPriceChange: (value: string) => void;
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
  onApplyToAllVariants: (field: 'price' | 'compareAtPrice' | 'stock' | 'sku', value: string) => void;
  isClothingCategory: () => boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export function AddProductFormContent({
  formId,
  formData,
  productType,
  simpleProductData,
  categories,
  brands,
  attributes,
  defaultCurrency,
  isEditMode,
  loading,
  imageUploadLoading,
  imageUploadError,
  categoriesExpanded,
  brandsExpanded,
  useNewCategory,
  useNewBrand,
  newCategoryName,
  newBrandName,
  selectedAttributesForVariants,
  selectedAttributeValueIds,
  attributesDropdownOpen,
  generatedVariants,
  hasVariantsToLoad,
  fileInputRef,
  attributesDropdownRef,
  variantImageInputRefs,
  onDescriptionChange,
  onProductTypeChange,
  onUploadImages,
  onRemoveImage,
  onSetFeaturedImage,
  onCategoriesExpandedChange,
  onBrandsExpandedChange,
  onUseNewCategoryChange,
  onUseNewBrandChange,
  onNewCategoryNameChange,
  onNewBrandNameChange,
  onCategoryIdsChange,
  onBrandIdsChange,
  onPrimaryCategoryIdChange,
  onPriceChange,
  onCompareAtPriceChange,
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
  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        <BasicInformation
          description={formData.description}
          productClass={formData.productClass}
          warrantyYears={
            formData.warrantyYears === 1 ||
            formData.warrantyYears === 2 ||
            formData.warrantyYears === 3
              ? formData.warrantyYears
              : null
          }
          onDescriptionChange={onDescriptionChange}
          onProductClassChange={onProductClassChange}
          onWarrantyYearsChange={onWarrantyYearsChange}
        />

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

        <CategoriesBrands
          categories={categories}
          brands={brands}
          categoryIds={formData.categoryIds}
          primaryCategoryId={formData.primaryCategoryId}
          brandIds={formData.brandIds}
          categoriesExpanded={categoriesExpanded}
          brandsExpanded={brandsExpanded}
          useNewCategory={useNewCategory}
          useNewBrand={useNewBrand}
          newCategoryName={newCategoryName}
          newBrandName={newBrandName}
          onCategoriesExpandedChange={onCategoriesExpandedChange}
          onBrandsExpandedChange={onBrandsExpandedChange}
          onUseNewCategoryChange={onUseNewCategoryChange}
          onUseNewBrandChange={onUseNewBrandChange}
          onNewCategoryNameChange={onNewCategoryNameChange}
          onNewBrandNameChange={onNewBrandNameChange}
          onCategoryIdsChange={onCategoryIdsChange}
          onBrandIdsChange={onBrandIdsChange}
          onPrimaryCategoryIdChange={onPrimaryCategoryIdChange}
          isClothingCategory={isClothingCategory}
          onVariantsUpdate={onVariantsUpdate}
        />

        <PricingInventorySection
          productType={productType}
          onProductTypeChange={onProductTypeChange}
          simpleProductData={simpleProductData}
          defaultCurrency={defaultCurrency}
          onPriceChange={onPriceChange}
          onCompareAtPriceChange={onCompareAtPriceChange}
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

        <ProductLabels
          labels={formData.labels}
          onAddLabel={onAddLabel}
          onRemoveLabel={onRemoveLabel}
          onUpdateLabel={onUpdateLabel}
        />

    </form>
  );
}

