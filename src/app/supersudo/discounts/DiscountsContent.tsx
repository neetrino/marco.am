'use client';

import { Card } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import type { DiscountMap } from '@/lib/discount/discount-expiry';
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
  productDiscounts: Record<string, number>;
  setProductDiscounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  productDiscountExpires: Record<string, string | null>;
  setProductDiscountExpiresAt: (productId: string, value: string | null) => void;
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
  setProductDiscounts,
  productDiscountExpires,
  setProductDiscountExpiresAt,
  handleProductDiscountSave,
  savingProductId,
}: DiscountsContentProps) {
  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.quickSettings.title')}
      subtitle={t('admin.quickSettings.subtitle')}
    >
      <Card className="admin-card mb-6 overflow-hidden border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{t('admin.quickSettings.quickSettingsTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('admin.quickSettings.quickSettingsSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
      </Card>

      <CategoryDiscountsCard
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoryDiscounts={categoryDiscounts}
        updateCategoryDiscountValue={updateCategoryDiscountValue}
        updateCategoryDiscountExpires={updateCategoryDiscountExpires}
        clearCategoryDiscount={clearCategoryDiscount}
        handleCategoryDiscountSave={handleCategoryDiscountSave}
        categorySaving={categorySaving}
      />

      <BrandDiscountsCard
        brands={brands}
        brandsLoading={brandsLoading}
        brandDiscounts={brandDiscounts}
        updateBrandDiscountValue={updateBrandDiscountValue}
        updateBrandDiscountExpires={updateBrandDiscountExpires}
        clearBrandDiscount={clearBrandDiscount}
        handleBrandDiscountSave={handleBrandDiscountSave}
        brandSaving={brandSaving}
      />

      <ProductDiscountsCard
        products={products}
        productsLoading={productsLoading}
        productDiscounts={productDiscounts}
        setProductDiscounts={setProductDiscounts}
        productDiscountExpires={productDiscountExpires}
        setProductDiscountExpiresAt={setProductDiscountExpiresAt}
        handleProductDiscountSave={handleProductDiscountSave}
        savingProductId={savingProductId}
      />
    </AdminPageLayout>
  );
}
