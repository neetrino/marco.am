'use client';

import { Card } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { GlobalDiscountCard } from './components/GlobalDiscountCard';
import { QuickInfoCard } from './components/QuickInfoCard';
import { CategoryDiscountsCard } from './components/CategoryDiscountsCard';
import { BrandDiscountsCard } from './components/BrandDiscountsCard';
import { ProductDiscountsCard } from './components/ProductDiscountsCard';

interface AdminCategory {
  id: string;
  title: string;
  parentId: string | null;
}

interface AdminBrand {
  id: string;
  name: string;
  logoUrl?: string;
}

/** Matches admin product list rows used for per-product discounts. */
interface QuickSettingsProductRow {
  id: string;
  title: string;
  image?: string;
  price?: number;
  discountPercent?: number;
}

interface QuickSettingsContentProps {
  currentPath: string;
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof useTranslation>['t'];
  globalDiscount: number;
  setGlobalDiscount: (value: number) => void;
  discountLoading: boolean;
  discountSaving: boolean;
  handleDiscountSave: () => void;
  categories: AdminCategory[];
  categoriesLoading: boolean;
  categoryDiscounts: Record<string, number>;
  updateCategoryDiscountValue: (categoryId: string, value: string) => void;
  clearCategoryDiscount: (categoryId: string) => void;
  handleCategoryDiscountSave: () => void;
  categorySaving: boolean;
  brands: AdminBrand[];
  brandsLoading: boolean;
  brandDiscounts: Record<string, number>;
  updateBrandDiscountValue: (brandId: string, value: string) => void;
  clearBrandDiscount: (brandId: string) => void;
  handleBrandDiscountSave: () => void;
  brandSaving: boolean;
  products: QuickSettingsProductRow[];
  productsLoading: boolean;
  productDiscounts: Record<string, number>;
  setProductDiscounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleProductDiscountSave: (productId: string) => void;
  savingProductId: string | null;
}

export function QuickSettingsContent({
  currentPath,
  router,
  t,
  globalDiscount,
  setGlobalDiscount,
  discountLoading,
  discountSaving,
  handleDiscountSave,
  categories,
  categoriesLoading,
  categoryDiscounts,
  updateCategoryDiscountValue,
  clearCategoryDiscount,
  handleCategoryDiscountSave,
  categorySaving,
  brands,
  brandsLoading,
  brandDiscounts,
  updateBrandDiscountValue,
  clearBrandDiscount,
  handleBrandDiscountSave,
  brandSaving,
  products,
  productsLoading,
  productDiscounts,
  setProductDiscounts,
  handleProductDiscountSave,
  savingProductId,
}: QuickSettingsContentProps) {
  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.quickSettings.title')}
      subtitle={t('admin.quickSettings.subtitle')}
      backLabel={t('admin.common.backToAdmin')}
      onBack={() => router.push('/supersudo')}
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
        clearCategoryDiscount={clearCategoryDiscount}
        handleCategoryDiscountSave={handleCategoryDiscountSave}
        categorySaving={categorySaving}
      />

      <BrandDiscountsCard
        brands={brands}
        brandsLoading={brandsLoading}
        brandDiscounts={brandDiscounts}
        updateBrandDiscountValue={updateBrandDiscountValue}
        clearBrandDiscount={clearBrandDiscount}
        handleBrandDiscountSave={handleBrandDiscountSave}
        brandSaving={brandSaving}
      />

      <ProductDiscountsCard
        products={products}
        productsLoading={productsLoading}
        productDiscounts={productDiscounts}
        setProductDiscounts={setProductDiscounts}
        handleProductDiscountSave={handleProductDiscountSave}
        savingProductId={savingProductId}
      />
    </AdminPageLayout>
  );
}
