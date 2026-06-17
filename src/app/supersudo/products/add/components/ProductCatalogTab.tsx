'use client';

import type { Brand, Category, Variant } from '../types';
import { CatalogBrandSection } from './CatalogBrandSection';
import { CatalogCategorySection } from './CatalogCategorySection';

interface ProductCatalogTabProps {
  categories: Category[];
  brands: Brand[];
  categoryIds: string[];
  primaryCategoryId: string;
  brandIds: string[];
  useNewCategory: boolean;
  useNewBrand: boolean;
  newCategoryName: string;
  newBrandName: string;
  onUseNewCategoryChange: (use: boolean) => void;
  onUseNewBrandChange: (use: boolean) => void;
  onNewCategoryNameChange: (name: string) => void;
  onNewBrandNameChange: (name: string) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onBrandIdsChange: (ids: string[]) => void;
  onPrimaryCategoryIdChange: (id: string) => void;
  isClothingCategory: () => boolean;
  onVariantsUpdate: (updater: (prev: Variant[]) => Variant[]) => void;
}

export function ProductCatalogTab(props: ProductCatalogTabProps) {
  return (
    <div className="w-full min-w-0 space-y-6">
      <CatalogCategorySection
        categories={props.categories}
        categoryIds={props.categoryIds}
        primaryCategoryId={props.primaryCategoryId}
        useNewCategory={props.useNewCategory}
        newCategoryName={props.newCategoryName}
        onUseNewCategoryChange={props.onUseNewCategoryChange}
        onNewCategoryNameChange={props.onNewCategoryNameChange}
        onCategoryIdsChange={props.onCategoryIdsChange}
        onPrimaryCategoryIdChange={props.onPrimaryCategoryIdChange}
        isClothingCategory={props.isClothingCategory}
        onVariantsUpdate={props.onVariantsUpdate}
      />
      <CatalogBrandSection
        brands={props.brands}
        brandIds={props.brandIds}
        useNewBrand={props.useNewBrand}
        newBrandName={props.newBrandName}
        onUseNewBrandChange={props.onUseNewBrandChange}
        onNewBrandNameChange={props.onNewBrandNameChange}
        onBrandIdsChange={props.onBrandIdsChange}
      />
    </div>
  );
}
