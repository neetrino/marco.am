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
  onCategoryIdsChange: (ids: string[]) => void;
  onBrandIdsChange: (ids: string[]) => void;
  onPrimaryCategoryIdChange: (id: string) => void;
  isClothingCategory: () => boolean;
  onVariantsUpdate: (updater: (prev: Variant[]) => Variant[]) => void;
}

export function ProductCatalogTab(props: ProductCatalogTabProps) {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
      <CatalogCategorySection
        categories={props.categories}
        categoryIds={props.categoryIds}
        primaryCategoryId={props.primaryCategoryId}
        onCategoryIdsChange={props.onCategoryIdsChange}
        onPrimaryCategoryIdChange={props.onPrimaryCategoryIdChange}
        isClothingCategory={props.isClothingCategory}
        onVariantsUpdate={props.onVariantsUpdate}
      />
      <CatalogBrandSection
        brands={props.brands}
        brandIds={props.brandIds}
        onBrandIdsChange={props.onBrandIdsChange}
      />
    </div>
  );
}
