'use client';

import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductClass } from '@/lib/constants/product-class';
import { FormSection } from './FormSection';

interface PublishingProps {
  featured: boolean;
  productClass: ProductClass;
  onFeaturedChange: (featured: boolean) => void;
  onProductClassChange: (productClass: ProductClass) => void;
}

export function Publishing({
  featured,
  productClass,
  onFeaturedChange,
  onProductClassChange,
}: PublishingProps) {
  const { t } = useTranslation();

  return (
    <FormSection title={t('admin.products.add.publishing')}>
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="productClass" className="block text-sm font-medium text-gray-700">
            {t('admin.products.add.productClassLabel')}
          </label>
          <select
            id="productClass"
            value={productClass}
            onChange={(event) => onProductClassChange(event.target.value as ProductClass)}
            className="admin-field w-full text-sm"
          >
            <option value="retail">{t('admin.products.add.productClassRetail')}</option>
            <option value="wholesale">{t('admin.products.add.productClassWholesale')}</option>
          </select>
        </div>

        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-marco-border/50 bg-white/50 p-3 sm:items-center">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => onFeaturedChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-marco-black focus:ring-marco-yellow/50 sm:mt-0"
          />
          <span className="text-sm font-medium text-gray-800">
            <span aria-hidden="true" className="mr-1.5">
              ⭐
            </span>
            {t('admin.products.add.markAsFeatured')}
          </span>
        </label>
      </div>
    </FormSection>
  );
}


