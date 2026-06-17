'use client';

import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductDescriptionEntry } from '../../../../../lib/products/product-description';
import { ProductDescriptionFields } from './ProductDescriptionFields';

interface ProductDescriptionTabProps {
  description: ProductDescriptionEntry[];
  onDescriptionChange: (entries: ProductDescriptionEntry[]) => void;
}

export function ProductDescriptionTab({
  description,
  onDescriptionChange,
}: ProductDescriptionTabProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full min-w-0">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {t('admin.products.add.description')}
      </label>
      <ProductDescriptionFields entries={description} onChange={onDescriptionChange} />
    </div>
  );
}
