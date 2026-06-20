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
    <div
      className="flex min-h-0 flex-1 flex-col divide-y divide-slate-200/80 overflow-hidden rounded-xl border border-slate-200/80 bg-white lg:flex-row lg:divide-x lg:divide-y-0"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-5 py-4">
        <CatalogCategorySection
          categories={props.categories}
          categoryIds={props.categoryIds}
          primaryCategoryId={props.primaryCategoryId}
          onCategoryIdsChange={props.onCategoryIdsChange}
          onPrimaryCategoryIdChange={props.onPrimaryCategoryIdChange}
          isClothingCategory={props.isClothingCategory}
          onVariantsUpdate={props.onVariantsUpdate}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-5 py-4">
        <CatalogBrandSection
          brands={props.brands}
          brandIds={props.brandIds}
          onBrandIdsChange={props.onBrandIdsChange}
        />
      </div>
    </div>
  );
}
