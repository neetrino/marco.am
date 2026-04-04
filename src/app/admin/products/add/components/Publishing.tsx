'use client';

import { useTranslation } from '../../../../../lib/i18n-client';

interface PublishingProps {
  featured: boolean;
  onFeaturedChange: (featured: boolean) => void;
  productClass?: 'retail' | 'wholesale';
  onProductClassChange?: (value: 'retail' | 'wholesale') => void;
}

export function Publishing({ featured, onFeaturedChange, productClass = 'retail', onProductClassChange }: PublishingProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => onFeaturedChange(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <span aria-hidden="true">⭐</span>
            {t('admin.products.add.markAsFeatured')}
          </span>
        </label>
      </div>
      {onProductClassChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.products.add.productClass')}
          </label>
          <select
            value={productClass}
            onChange={(e) => onProductClassChange(e.target.value as 'retail' | 'wholesale')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs"
          >
            <option value="retail">{t('admin.products.add.productClassRetail')}</option>
            <option value="wholesale">{t('admin.products.add.productClassWholesale')}</option>
          </select>
        </div>
      )}
    </div>
  );
}


