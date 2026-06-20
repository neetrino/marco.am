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

function CatalogColumnDivider() {
  return (
    <>
      <div
        className="mx-5 h-px shrink-0 bg-gradient-to-r from-transparent via-slate-200/90 to-transparent lg:hidden"
        aria-hidden
      />
      <div
        className="hidden w-8 shrink-0 items-stretch justify-center py-4 lg:flex"
        aria-hidden
      >
        <div className="w-px bg-gradient-to-b from-transparent via-slate-300/70 to-transparent" />
      </div>
    </>
  );
}

export function ProductCatalogTab(props: ProductCatalogTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white lg:flex-row">
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

      <CatalogColumnDivider />

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
