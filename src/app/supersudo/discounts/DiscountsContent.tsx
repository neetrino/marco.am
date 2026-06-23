'use client';

import { useState } from 'react';
import { Card } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import type { DiscountMap } from '@/lib/discount/discount-expiry';
import type { DiscountControlValue } from '@/components/admin/DiscountControl';
import type {
  DiscountsBrand,
  DiscountsCategory,
  DiscountsProductRow,
} from './types';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { GlobalDiscountCard } from './components/GlobalDiscountCard';
import { QuickInfoCard } from './components/QuickInfoCard';
import { CategoryDiscountsCard } from './components/CategoryDiscountsCard';
import { BrandDiscountsCard } from './components/BrandDiscountsCard';
import { ProductDiscountsCard } from './components/ProductDiscountsCard';
import {
  DiscountSettingsTabs,
  type DiscountSettingsTabId,
} from './components/DiscountSettingsTabs';

interface DiscountsContentProps {
  currentPath: string;
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof useTranslation>['t'];
  globalDiscount: number;
  setGlobalDiscount: (value: number) => void;
  globalDiscountExpiresAt: string | null;
  setGlobalDiscountExpiresAt: (value: string | null) => void;
  discountLoading: boolean;
  discountSaving: boolean;
  handleDiscountSave: () => void;
  categories: DiscountsCategory[];
  categoriesLoading: boolean;
  categoryDiscounts: DiscountMap;
  updateCategoryDiscountValue: (categoryId: string, value: string) => void;
  updateCategoryDiscountExpires: (categoryId: string, value: string | null) => void;
  clearCategoryDiscount: (categoryId: string) => void;
  handleCategoryDiscountSave: () => void;
  categorySaving: boolean;
  brands: DiscountsBrand[];
  brandsLoading: boolean;
  brandDiscounts: DiscountMap;
  updateBrandDiscountValue: (brandId: string, value: string) => void;
  updateBrandDiscountExpires: (brandId: string, value: string | null) => void;
  clearBrandDiscount: (brandId: string) => void;
  handleBrandDiscountSave: () => void;
  brandSaving: boolean;
  products: DiscountsProductRow[];
  productsLoading: boolean;
  productDiscounts: Record<string, DiscountControlValue>;
  setProductDiscount: (productId: string, value: DiscountControlValue) => void;
  handleProductDiscountSave: (productId: string) => void;
  savingProductId: string | null;
}

export function DiscountsContent({
  currentPath,
  router,
  t,
  globalDiscount,
  setGlobalDiscount,
  globalDiscountExpiresAt,
  setGlobalDiscountExpiresAt,
  discountLoading,
  discountSaving,
  handleDiscountSave,
  categories,
  categoriesLoading,
  categoryDiscounts,
  updateCategoryDiscountValue,
  updateCategoryDiscountExpires,
  clearCategoryDiscount,
  handleCategoryDiscountSave,
  categorySaving,
  brands,
  brandsLoading,
  brandDiscounts,
  updateBrandDiscountValue,
  updateBrandDiscountExpires,
  clearBrandDiscount,
  handleBrandDiscountSave,
  brandSaving,
  products,
  productsLoading,
  productDiscounts,
  setProductDiscount,
  handleProductDiscountSave,
  savingProductId,
}: DiscountsContentProps) {
  const [activeTab, setActiveTab] = useState<DiscountSettingsTabId>('global');

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.quickSettings.title')}
      subtitle={t('admin.quickSettings.subtitle')}
    >
      <div className="flex min-h-[calc(100dvh-11rem)] flex-col">
        <Card className="admin-card flex min-h-0 flex-1 flex-col overflow-hidden border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
          <DiscountSettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="mt-5 flex min-h-0 flex-1 flex-col">
            {activeTab === 'global' ? (
              <div
                role="tabpanel"
                id="discount-settings-panel-global"
                aria-labelledby="discount-settings-tab-global"
                className="grid grid-cols-1 gap-5 md:grid-cols-2"
              >
                <GlobalDiscountCard
                  globalDiscount={globalDiscount}
                  setGlobalDiscount={setGlobalDiscount}
                  globalDiscountExpiresAt={globalDiscountExpiresAt}
                  setGlobalDiscountExpiresAt={setGlobalDiscountExpiresAt}
                  discountLoading={discountLoading}
                  discountSaving={discountSaving}
                  handleDiscountSave={handleDiscountSave}
                />
                <QuickInfoCard />
              </div>
            ) : null}

            {activeTab === 'category' ? (
              <div
                role="tabpanel"
                id="discount-settings-panel-category"
                aria-labelledby="discount-settings-tab-category"
                className="flex min-h-0 flex-1 flex-col"
              >
                <CategoryDiscountsCard
                  fillHeight
                  categories={categories}
                  categoriesLoading={categoriesLoading}
                  categoryDiscounts={categoryDiscounts}
                  updateCategoryDiscountValue={updateCategoryDiscountValue}
                  updateCategoryDiscountExpires={updateCategoryDiscountExpires}
                  clearCategoryDiscount={clearCategoryDiscount}
                  handleCategoryDiscountSave={handleCategoryDiscountSave}
                  categorySaving={categorySaving}
                />
              </div>
            ) : null}

            {activeTab === 'brand' ? (
              <div
                role="tabpanel"
                id="discount-settings-panel-brand"
                aria-labelledby="discount-settings-tab-brand"
                className="flex min-h-0 flex-1 flex-col"
              >
                <BrandDiscountsCard
                  fillHeight
                  brands={brands}
                  brandsLoading={brandsLoading}
                  brandDiscounts={brandDiscounts}
                  updateBrandDiscountValue={updateBrandDiscountValue}
                  updateBrandDiscountExpires={updateBrandDiscountExpires}
                  clearBrandDiscount={clearBrandDiscount}
                  handleBrandDiscountSave={handleBrandDiscountSave}
                  brandSaving={brandSaving}
                />
              </div>
            ) : null}

            {activeTab === 'product' ? (
              <div
                role="tabpanel"
                id="discount-settings-panel-product"
                aria-labelledby="discount-settings-tab-product"
                className="flex min-h-0 flex-1 flex-col"
              >
                <ProductDiscountsCard
                  fillHeight
                  products={products}
                  productsLoading={productsLoading}
                  productDiscounts={productDiscounts}
                  setProductDiscount={setProductDiscount}
                  handleProductDiscountSave={handleProductDiscountSave}
                  savingProductId={savingProductId}
                />
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
